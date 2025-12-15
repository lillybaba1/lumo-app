export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Protected endpoint to mark an order as shipped.
 * Requires authenticated admin session.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // SECURITY: Require admin authentication
    const adminUser = await requireAdmin({ redirect: false });

    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Missing order ID' }, { status: 400 });
    }

    // Check if order exists
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // Update order status with audit trail
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'Shipped',
        shipped_at: new Date().toISOString(),
        shipped_by: adminUser.userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({
        ok: false,
        error: err.message || 'Admin authentication required'
      }, { status: err.statusCode ?? 401 });
    }

    console.error('Failed to ship order:', err);

    const errorMessage = process.env.NODE_ENV === 'development'
      ? err.message || String(err)
      : 'Failed to update order status. Please try again.';

    return NextResponse.json({
      ok: false,
      error: errorMessage
    }, { status: 500 });
  }
}
