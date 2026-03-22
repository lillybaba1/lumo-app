import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's information
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    // Use service role client to bypass RLS (the is_admin() RLS function is broken)
    // Single source of truth: users table
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Also fetch user_profiles for display fields (name, etc.) but NOT for role
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    // Determine role from users table only
    const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
    let role = userData?.role || 'customer';
    if (ADMIN_ROLES.includes(role)) {
      role = 'admin';
    }

    // Use users table as primary profile
    const profile = userData;

    // Check for business account
    let hasBusinessAccount = false;
    let businessStatus = null;
    
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('id, status')
      .eq('owner_user_id', user.id)
      .single();
    
    if (businessAccount) {
      hasBusinessAccount = true;
      businessStatus = businessAccount.status;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: user.id,
        email: user.email || user.phone || '',
        role: role,
        name: profile?.name || userProfile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        hasBusinessAccount,
        businessStatus,
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
