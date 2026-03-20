import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check-role
 * Returns the current authenticated user's role using service role client
 * This bypasses RLS which has a broken is_admin() function
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ role: null, error: 'Not authenticated' }, { status: 401 });
    }

    // Use service role to bypass RLS
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data: profileData } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Determine effective role
    const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
    let role = 'customer';
    if (ADMIN_ROLES.includes(userData?.role) || ADMIN_ROLES.includes(profileData?.role)) {
      role = 'admin';
    } else {
      role = profileData?.role || userData?.role || 'customer';
    }

    return NextResponse.json({ role, userId: user.id });
  } catch (error) {
    console.error('Error checking role:', error);
    return NextResponse.json({ role: null, error: 'Internal error' }, { status: 500 });
  
  }
}
