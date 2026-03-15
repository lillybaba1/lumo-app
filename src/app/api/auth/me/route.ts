import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get user profile from user_profiles table AND users table to ensure we get the correct role
    // This handles the migration phase where data might be in either or both
    
    // Try user_profiles first (Supabase migration)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Also try users table (Legacy/Firebase migration)
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Determine effective role - if EITHER table says admin, they are admin
    // Support both 'admin' (legacy) and 'APP_OWNER_ADMIN' (Supabase migration) roles
    const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
    let role = 'customer';
    if (ADMIN_ROLES.includes(userProfile?.role) || ADMIN_ROLES.includes(userData?.role)) {
      role = 'admin';
    } else {
      role = userProfile?.role || userData?.role || 'customer';
    }

    // Use profile data, preferring userProfile for other fields if available
    const profile = userProfile || userData;

    // Check for business account
    let hasBusinessAccount = false;
    let businessStatus = null;
    
    const { data: businessAccount } = await supabase
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
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        hasBusinessAccount,
        businessStatus,
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
