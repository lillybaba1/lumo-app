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

    // Get user profile from user_profiles table (or fallback to users table)
    let profile = null;
    
    // Try user_profiles first (Supabase migration)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userProfile) {
      profile = userProfile;
    } else {
      // Fallback to users table
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      profile = userData;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: user.id,
        email: user.email || user.phone || '',
        role: profile?.role || 'user',
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
