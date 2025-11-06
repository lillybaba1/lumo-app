export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';

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

    const db = dbAdmin();
    const ref = db.collection('orders').doc(orderId);

    // Check if order exists
    const orderSnap = await ref.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // Update order status with audit trail
    await ref.update({
      status: 'Shipped',
      shippedAt: new Date().toISOString(),
      shippedBy: adminUser.userId,
      updatedAt: new Date().toISOString()
    });

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
