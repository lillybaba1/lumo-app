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

    // Get user profile from public.users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: user.id,
        email: user.email || user.phone || '',
        role: profile?.role || 'customer',
        name: profile?.name || 'User',
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
