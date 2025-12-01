import { NextResponse } from 'next/server';
import { updateOrder } from '@/services/orderService';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    // SECURITY: Require admin authentication to update orders
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { ok: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderId, status, paymentStatus, notes } = body;
    if (!orderId) return NextResponse.json({ ok: false, message: 'Missing orderId' }, { status: 400 });

    await updateOrder(orderId, {
      status,
      paymentStatus,
      notes,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('API update order error', err);
    return NextResponse.json({ ok: false, message: err.message || 'Unknown error' }, { status: 500 });
  }
}
