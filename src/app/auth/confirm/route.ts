import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// This route handles the email confirmation from Supabase
// It's the newer pattern that Supabase uses for email verification
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/auth/verified'

  console.log('[Auth Confirm] Processing confirmation:', {
    hasTokenHash: !!token_hash,
    type,
    next,
    origin
  })

  if (!token_hash || !type) {
    console.error('[Auth Confirm] Missing token_hash or type')
    return NextResponse.redirect(
      `${origin}/auth/error?message=invalid_link&details=${encodeURIComponent('Missing verification parameters')}`
    )
  }

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

  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  })

  if (error) {
    console.error('[Auth Confirm] Verification error:', error)
    return NextResponse.redirect(
      `${origin}/auth/error?message=verification_failed&details=${encodeURIComponent(error.message)}`
    )
  }

  if (!data.session) {
    console.error('[Auth Confirm] No session after verification')
    return NextResponse.redirect(
      `${origin}/auth/error?message=verification_failed&details=${encodeURIComponent('Verification succeeded but no session was created')}`
    )
  }

  console.log('[Auth Confirm] Verification successful for user:', data.session.user.id)

  // Create or update user in the users table (the main user table)
  const user = data.session.user
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      phone_number: user.user_metadata?.phone_number || user.phone || null,
      role: user.user_metadata?.role || 'PERSONAL_ACCOUNT',
      email_verified: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })

  if (profileError) {
    console.error('[Auth Confirm] User profile creation error:', profileError)
  } else {
    console.log('[Auth Confirm] User profile created/updated in users table')
  }

  // Check if user has a business account with PENDING_VERIFICATION status
  const { data: businessAccount } = await supabase
    .from('business_accounts')
    .select('id, status')
    .eq('owner_user_id', user.id)
    .single()

  if (businessAccount && businessAccount.status === 'PENDING_VERIFICATION') {
    console.log('[Auth Confirm] Updating business account to PENDING_APPROVAL:', businessAccount.id)
    const { error: businessError } = await supabase
      .from('business_accounts')
      .update({
        status: 'PENDING_APPROVAL',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessAccount.id)

    if (!businessError) {
      console.log('[Auth Confirm] Business account updated, redirecting to pending page')
      return NextResponse.redirect(`${origin}/business/pending`)
    }
  }

  return response
}
