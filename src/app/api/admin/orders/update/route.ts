import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { updateOrder } from '@/services/orderService';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:AdminOrders');

const updateOrderSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['Pending', 'Paid', 'Preparing', 'Shipped', 'Delivered', 'Payout Pending', 'Completed', 'Disputed', 'Cancelled']).optional(),
  paymentStatus: z.enum(['Pending', 'Paid', 'Failed']).optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin({ redirect: false });

    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: 'Validation failed', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { orderId, status, paymentStatus, notes } = parsed.data;

    await updateOrder(orderId, {
      status,
      paymentStatus,
      notes,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.statusCode });
    }
    apiLogger.error('API update order error', error as Error);
    return NextResponse.json({ ok: false, message: 'Failed to update order' }, { status: 500 });
  }
}
