import { NextResponse } from 'next/server';
import { updateOrder } from '@/services/orderService';

export async function POST(req: Request) {
  try {
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
