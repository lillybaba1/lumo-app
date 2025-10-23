import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const db = dbAdmin();
    // simple read check - count collections or fetch a small doc
    const col = await db.collection('products').limit(1).get();
    const available = !col.empty;
    return NextResponse.json({ ok: true, available });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 });
  }
}
