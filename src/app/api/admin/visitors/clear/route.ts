import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { clearInactiveVisitors } from '@/services/visitorService';

export async function POST(request: Request) {
  try {
    // Check admin auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (from users table)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = userData?.role || 'customer';
    if (role !== 'admin' && role !== 'APP_OWNER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const hoursInactive = body.hoursInactive || 24;

    const result = await clearInactiveVisitors(hoursInactive);

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: result.deleted });
  } catch (error) {
    console.error('Error clearing inactive visitors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
