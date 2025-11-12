import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
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

      // Create response with redirect
      const response = NextResponse.redirect(redirectUrl)

      // Ensure cookies are set properly
      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?message=verification_failed`)
}
