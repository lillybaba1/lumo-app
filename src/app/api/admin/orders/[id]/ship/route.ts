import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebaseAdmin';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const adminKey = process.env.ADMIN_API_KEY;
  const provided = req.headers.get('x-admin-key');
  if (!adminKey || !provided || provided !== adminKey) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orderId = params.id;
    const db = dbAdmin();
    const ref = db.collection('orders').doc(orderId);
    await ref.update({ status: 'Shipped', shippedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 });
  }
}
