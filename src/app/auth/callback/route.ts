import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Helper to create redirect response with cookies
function createRedirectWithCookies(
  url: string, 
  cookies: { name: string; value: string; options?: any }[]
): NextResponse {
  const response = NextResponse.redirect(url)
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })
  return response
}

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

  // Collect cookies to set
  const cookiesToSet: { name: string; value: string; options?: any }[] = []

  // Create Supabase client for this request
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Auth Callback] Missing Supabase environment variables')
    return NextResponse.redirect(`${origin}/auth/error?message=config_error`)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options })
          })
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
      await processUserAfterVerification(supabase, user)
      
      // Update business account status if applicable
      await updateBusinessAccountAfterVerification(supabase, user.id)
      
      // Sign out the user - they should manually login after verification
      await supabase.auth.signOut()
      console.log('[Auth Callback] User signed out after verification')
      
      // Redirect to verified page without session cookies
      console.log('[Auth Callback] Redirecting to verified page')
      return NextResponse.redirect(`${origin}/auth/verified`)
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
      await processUserAfterVerification(supabase, user)
      
      // Update business account status if applicable
      await updateBusinessAccountAfterVerification(supabase, user.id)
      
      // Sign out the user - they should manually login after verification
      await supabase.auth.signOut()
      console.log('[Auth Callback] User signed out after verification')
      
      // Redirect to verified page without session
      console.log('[Auth Callback] Redirecting to verified page')
      return NextResponse.redirect(`${origin}/auth/verified`)
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
  user: any
) {
  // First, check if user already exists to preserve their role
  const { data: existingUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Preserve existing role if user already exists (e.g., business account created during signup)
  const existingRole = existingUser?.role
  const metadataRole = user.user_metadata?.role
  const role = existingRole || metadataRole || 'PERSONAL_ACCOUNT'
  
  console.log('[Auth Callback] User role resolution:', { existingRole, metadataRole, finalRole: role })

  // Create or update user in the users table (the main user table)
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      phone_number: user.user_metadata?.phone_number || user.phone || null,
      role: role, // Preserve existing role
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })

  if (profileError) {
    console.error('[Auth Callback] User profile creation error:', profileError)
    // Continue anyway - user is authenticated
  } else {
    console.log('[Auth Callback] User profile created/updated successfully in users table with role:', role)
  }
}

// Helper function to update business account status after email verification
async function updateBusinessAccountAfterVerification(
  supabase: any,
  userId: string
) {
  // Check if user has a business account
  const { data: businessAccount } = await supabase
    .from('business_accounts')
    .select('id, status')
    .eq('owner_user_id', userId)
    .single()

  if (!businessAccount) {
    console.log('[Auth Callback] No business account found for user:', userId)
    return
  }

  console.log('[Auth Callback] Business account found:', { id: businessAccount.id, status: businessAccount.status })

  // If status is PENDING_VERIFICATION, update to PENDING_APPROVAL
  if (businessAccount.status === 'PENDING_VERIFICATION') {
    console.log('[Auth Callback] Updating business account status to PENDING_APPROVAL')
    const { error: updateError } = await supabase
      .from('business_accounts')
      .update({
        status: 'PENDING_APPROVAL',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessAccount.id)

    if (updateError) {
      console.error('[Auth Callback] Error updating business account status:', updateError)
    } else {
      console.log('[Auth Callback] Business account status updated to PENDING_APPROVAL')
    }
  }
}

// Helper function to check if user has business account and needs redirect
async function getBusinessRedirectIfNeeded(
  supabase: any, 
  userId: string, 
  origin: string
): Promise<string | null> {
  // Check if user has a business account
  const { data: businessAccount } = await supabase
    .from('business_accounts')
    .select('id, status, account_approved, boutique_submitted, boutique_approved')
    .eq('owner_user_id', userId)
    .single()

  if (!businessAccount) {
    return null
  }

  console.log('[Auth Callback] Business account state:', {
    id: businessAccount.id,
    status: businessAccount.status,
    accountApproved: businessAccount.account_approved,
    boutiqueSubmitted: businessAccount.boutique_submitted,
    boutiqueApproved: businessAccount.boutique_approved,
  })

  // If status is PENDING_VERIFICATION, this is first email verification
  // Update status to PENDING_APPROVAL (waiting for admin account approval)
  if (businessAccount.status === 'PENDING_VERIFICATION') {
    console.log('[Auth Callback] First verification - updating status to PENDING_APPROVAL')
    const { error: businessError } = await supabase
      .from('business_accounts')
      .update({
        status: 'PENDING_APPROVAL',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessAccount.id)

    if (businessError) {
      console.error('[Auth Callback] Error updating business account status:', businessError)
    }
    
    // Always redirect to pending page for new business accounts
    return `${origin}/business/pending`
  }

  // Multi-phase state machine for returning business users
  // State D: Fully approved - go to dashboard
  if (businessAccount.account_approved && businessAccount.boutique_approved) {
    return `${origin}/business/dashboard`
  }

  // State C: Account approved, boutique submitted but not approved yet
  if (businessAccount.account_approved && businessAccount.boutique_submitted && !businessAccount.boutique_approved) {
    return `${origin}/business/pending-boutique-review`
  }

  // State B: Account approved but boutique not set up yet
  if (businessAccount.account_approved && !businessAccount.boutique_submitted) {
    return `${origin}/business/setup-boutique`
  }

  // State A: Account not approved yet - pending admin approval
  if (!businessAccount.account_approved) {
    return `${origin}/business/pending`
  }

  // Legacy: ACTIVE status means fully approved
  if (businessAccount.status === 'ACTIVE') {
    return `${origin}/business/dashboard`
  }

  // Default to pending page for any other state
  return `${origin}/business/pending`
}
