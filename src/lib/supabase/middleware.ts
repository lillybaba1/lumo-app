import { createServerClient, createClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Business routes that require full approval (boutique_approved = true)
const PROTECTED_BUSINESS_ROUTES = [
  '/business/dashboard',
  '/business/products',
  '/business/orders',
  '/business/analytics',
  '/business/earnings',
  '/business/payout',
  '/business/shipping',
  '/business/settings',
  '/business/subscription',
]

// Routes that are allowed during different states
const PENDING_ACCOUNT_ROUTES = ['/business/pending']
const SETUP_BOUTIQUE_ROUTES = ['/business/setup-boutique', '/business/boutique']
const PENDING_BOUTIQUE_ROUTES = ['/business/pending-boutique-review']
const BUSINESS_PROFILE_ROUTES = ['/business/profile', '/business/verification']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
                      'https://edsuvnlbviosnyxbjptx.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkc3V2bmxidmlvc255eGJqcHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYxMDAsImV4cCI6MjA3ODI1MjEwMH0.DC30J6n1w5zFp1H4fmSaAGbcD2R9g6RdfD_aM3907jM'

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are not set')
    // Continue with fallbacks
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect admin routes
  if (pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Protect ALL business routes - require authentication
  if (pathname.startsWith('/business')) {
    // Allow /business/pending without any redirects to prevent loops
    if (pathname === '/business/pending') {
      return supabaseResponse
    }

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Check business account status and enforce state machine
    const redirectUrl = await enforceBusinessWorkflow(user.id, pathname, request.nextUrl.origin)
    if (redirectUrl && redirectUrl !== pathname) {
      return NextResponse.redirect(new URL(redirectUrl, request.nextUrl.origin))
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}

/**
 * Enforce the multi-phase business approval workflow
 * Returns the URL to redirect to, or null if current route is allowed
 */
async function enforceBusinessWorkflow(
  userId: string,
  currentPath: string,
  origin: string
): Promise<string | null> {
  // Use service role client to bypass RLS for business account check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
                      'https://edsuvnlbviosnyxbjptx.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkc3V2bmxidmlvc255eGJqcHR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY3NjEwMCwiZXhwIjoyMDc4MjUyMTAwfQ.lz5_bbcNNsUmDFdaorlFZi0XPHvnSt3Zqd-Yd_txRHw'
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[Middleware] Missing Supabase service role credentials')
    return null // Allow access rather than break
  }
  
  const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Fetch business account status
  const { data: businessAccount, error } = await supabaseAdmin
    .from('business_accounts')
    .select('id, status, account_approved, boutique_submitted, boutique_approved')
    .eq('owner_user_id', userId)
    .single()

  // No business account - shouldn't be on business routes
  if (error || !businessAccount) {
    console.log('[Middleware] No business account found for user:', userId)
    return '/signup?type=business'
  }

  const { account_approved, boutique_submitted, boutique_approved, status } = businessAccount

  console.log('[Middleware] Business workflow check:', {
    currentPath,
    account_approved,
    boutique_submitted,
    boutique_approved,
    status
  })

  // STATE D: Fully approved (account + boutique both approved)
  // Can access all business routes
  if (account_approved && boutique_approved) {
    // If trying to access pending pages, redirect to dashboard
    if (currentPath === '/business/pending' || 
        currentPath === '/business/pending-boutique-review' ||
        currentPath === '/business/setup-boutique') {
      return '/business/dashboard'
    }
    return null // Allow access
  }

  // STATE C: Account approved, boutique submitted but pending review
  if (account_approved && boutique_submitted && !boutique_approved) {
    // Allowed: pending-boutique-review, profile, verification
    if (currentPath === '/business/pending-boutique-review' ||
        BUSINESS_PROFILE_ROUTES.some(r => currentPath.startsWith(r))) {
      return null
    }
    // Redirect everything else to pending boutique review
    return '/business/pending-boutique-review'
  }

  // STATE B: Account approved, need to set up boutique
  if (account_approved && !boutique_submitted) {
    // Allow dashboard access (Step B: Login Guard - If True: Allow navigation to the dashboard)
    if (currentPath === '/business/dashboard') {
      return null
    }

    // Allowed: setup-boutique, boutique form, profile
    if (SETUP_BOUTIQUE_ROUTES.some(r => currentPath.startsWith(r)) ||
        BUSINESS_PROFILE_ROUTES.some(r => currentPath.startsWith(r))) {
      return null
    }
    // Redirect everything else to setup boutique
    return '/business/setup-boutique'
  }

  // STATE A: Account not yet approved (waiting for admin)
  if (!account_approved) {
    // Only allowed: pending page and profile
    if (currentPath === '/business/pending' ||
        BUSINESS_PROFILE_ROUTES.some(r => currentPath.startsWith(r))) {
      return null
    }
    // Redirect everything else to pending
    return '/business/pending'
  }

  // Legacy check for ACTIVE status (backwards compatibility)
  if (status === 'ACTIVE') {
    return null // Allow access
  }

  // Default: redirect to pending
  return '/business/pending'
}
