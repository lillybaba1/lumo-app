import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/auth/verified'

  console.log('[Auth Callback] Full URL:', request.url)
  console.log('[Auth Callback] Origin:', origin)
  console.log('[Auth Callback] All params:', Object.fromEntries(searchParams.entries()))
  console.log('[Auth Callback] Key params:', { 
    hasCode: !!code, 
    codeLength: code?.length,
    hasTokenHash: !!token_hash,
    tokenHashLength: token_hash?.length,
    type,
    error, 
    error_description 
  })

  // Handle error from Supabase (e.g., expired link)
  if (error) {
    console.error('[Auth Callback] Error from Supabase:', error, error_description)
    const errorMessage = error_description || error
    return NextResponse.redirect(
      `${origin}/auth/error?message=verification_failed&details=${encodeURIComponent(errorMessage)}`
    )
  }

  // Create Supabase client for this request
  const response = NextResponse.redirect(`${origin}${next}`)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Handle token_hash for email verification (magic link style)
  if (token_hash && type) {
    console.log('[Auth Callback] Verifying OTP with token_hash, type:', type)
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (verifyError) {
      console.error('[Auth Callback] OTP verification error:', verifyError)
      return NextResponse.redirect(
        `${origin}/auth/error?message=verification_failed&details=${encodeURIComponent(verifyError.message)}`
      )
    }

    if (data.session) {
      console.log('[Auth Callback] OTP verified, session created for:', data.session.user.id)
      
      // Process user profile and business account
      const user = data.session.user
      await processUserAfterVerification(supabase, user, origin, response)
      
      // Check for business account redirect
      const redirectUrl = await getBusinessRedirectIfNeeded(supabase, user.id, origin)
      if (redirectUrl) {
        return NextResponse.redirect(redirectUrl)
      }
      
      return response
    }
  }

  // Handle code exchange (PKCE flow)
  if (code) {
    console.log('[Auth Callback] Exchanging code for session')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/auth/error?message=verification_failed&details=${encodeURIComponent(exchangeError.message)}`
      )
    }

    if (data.session) {
      console.log('[Auth Callback] Session created successfully for user:', data.session.user.id)

      // Process user profile and business account
      const user = data.session.user
      await processUserAfterVerification(supabase, user, origin, response)
      
      // Check for business account redirect
      const redirectUrl = await getBusinessRedirectIfNeeded(supabase, user.id, origin)
      if (redirectUrl) {
        return NextResponse.redirect(redirectUrl)
      }

      return response
    }
  }

  // No valid auth params - redirect to error
  console.error('[Auth Callback] No valid auth parameters found')
  return NextResponse.redirect(
    `${origin}/auth/error?message=invalid_link&details=${encodeURIComponent('The verification link is invalid or has expired. Please request a new one.')}`
  )
}

// Helper function to process user after verification
async function processUserAfterVerification(
  supabase: any, 
  user: any, 
  origin: string,
  response: NextResponse
) {
  // Create or update user profile in the database
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      phone: user.user_metadata?.phone_number || user.phone || null,
      role: user.user_metadata?.role || 'PERSONAL_ACCOUNT',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })

  if (profileError) {
    console.error('[Auth Callback] Profile creation error:', profileError)
    // Continue anyway - user is authenticated
  } else {
    console.log('[Auth Callback] User profile created/updated successfully')
  }
}

// Helper function to check if user has business account and needs redirect
async function getBusinessRedirectIfNeeded(
  supabase: any, 
  userId: string, 
  origin: string
): Promise<string | null> {
  // Check if user has a business account with PENDING_VERIFICATION status
  const { data: businessAccount } = await supabase
    .from('business_accounts')
    .select('id, status')
    .eq('owner_user_id', userId)
    .single()

  if (businessAccount && businessAccount.status === 'PENDING_VERIFICATION') {
    console.log('[Auth Callback] Business account found, updating to PENDING_APPROVAL:', businessAccount.id)
    const { error: businessError } = await supabase
      .from('business_accounts')
      .update({
        status: 'PENDING_APPROVAL',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessAccount.id)

    if (businessError) {
      console.error('[Auth Callback] Error updating business account status:', businessError)
    } else {
      console.log('[Auth Callback] Business account status updated to PENDING_APPROVAL')
      // Redirect business users to the pending page
      return `${origin}/business/pending`
    }
  }

  return null
}
