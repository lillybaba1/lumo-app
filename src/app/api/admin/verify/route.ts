export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    await requireAdmin({ redirect: false });

    // Simple read check - fetch a small amount of data from products
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    const available = data && data.length > 0;
    return NextResponse.json({ ok: true, available });
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 });
  }
}
