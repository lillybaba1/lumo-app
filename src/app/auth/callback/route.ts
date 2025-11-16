import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback received:', { code: code ? 'present' : 'missing', origin })

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/auth/error?message=verification_failed&details=${encodeURIComponent(error.message)}`)
      }

      if (!data.session) {
        console.error('No session created after code exchange')
        return NextResponse.redirect(`${origin}/auth/error?message=verification_failed&details=no_session`)
      }

      console.log('Session created successfully:', data.session.user.id)

      // Create user profile if it doesn't exist
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', data.session.user.id)
        .single()

      if (!profile && !profileError) {
        // Create profile
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'User',
            phone: data.session.user.user_metadata?.phone_number || null,
            role: 'user',
          })
        
        if (insertError) {
          console.error('Error creating user profile:', insertError)
        } else {
          console.log('User profile created successfully')
        }
      }

      // Determine the redirect URL
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let redirectUrl = ''
      if (isLocalEnv) {
        redirectUrl = `${origin}/auth/verified`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}/auth/verified`
      } else {
        redirectUrl = `${origin}/auth/verified`
      }

      console.log('Redirecting to:', redirectUrl)

      // Create response with redirect
      const response = NextResponse.redirect(redirectUrl)

      // Ensure cookies are set properly
      return response
    } catch (err: any) {
      console.error('Unexpected error in auth callback:', err)
      return NextResponse.redirect(`${origin}/auth/error?message=verification_failed&details=${encodeURIComponent(err.message || 'unknown')}`)
    }
  }

  console.error('No code parameter provided')
  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?message=verification_failed&details=no_code`)
}
