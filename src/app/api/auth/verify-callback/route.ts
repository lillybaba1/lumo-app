import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// This API route processes user profile creation/update after email verification
// Called from the client-side callback page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, name, phoneNumber, role } = body

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[Verify Callback API] Processing user:', { userId, email, role })

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookies) {
            try {
              cookies.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (e) {
              // Can't set cookies in some contexts, ignore
            }
          },
        },
      }
    )

    // Check if user already exists to preserve their role
    const { data: existingUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    const existingRole = existingUser?.role
    const finalRole = existingRole || role || 'PERSONAL_ACCOUNT'

    console.log('[Verify Callback API] Role resolution:', { existingRole, requestedRole: role, finalRole })

    // Create or update user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        name: name || email.split('@')[0] || 'User',
        phone_number: phoneNumber || null,
        role: finalRole,
        email_verified: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('[Verify Callback API] Profile error:', profileError)
      return NextResponse.json({ 
        success: false, 
        error: 'Profile creation failed',
        details: profileError.message 
      }, { status: 500 })
    }

    console.log('[Verify Callback API] User profile created/updated with role:', finalRole)

    // Check and update business account status using admin client to bypass RLS
    let businessStatus = null
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('id, status')
      .eq('owner_user_id', userId)
      .single()

    if (businessAccount && businessAccount.status === 'PENDING_VERIFICATION') {
      console.log('[Verify Callback API] Updating business account to PENDING_APPROVAL')
      const { error: businessError } = await supabaseAdmin
        .from('business_accounts')
        .update({
          status: 'PENDING_APPROVAL',
          updated_at: new Date().toISOString()
        })
        .eq('id', businessAccount.id)

      if (businessError) {
        console.error('[Verify Callback API] Business account update error:', businessError)
      } else {
        businessStatus = 'PENDING_APPROVAL'
        console.log('[Verify Callback API] Business account updated to PENDING_APPROVAL')
      }
    }

    return NextResponse.json({
      success: true,
      role: finalRole,
      businessStatus,
    })

  } catch (error: any) {
    console.error('[Verify Callback API] Unexpected error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
