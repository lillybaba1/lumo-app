import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  calculateAllSellerEarnings,
  getPayoutRecords,
  processSellerPayout,
  getPayoutStats,
} from '@/services/payoutService';

/**
 * Verify that the caller is an admin
 */
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { isAdmin: false, error: 'Authentication required' };
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
    if (!userData?.role || !ADMIN_ROLES.includes(userData.role)) {
      return { isAdmin: false, error: 'Admin access required' };
    }

    return { isAdmin: true, userId: user.id };
  } catch {
    return { isAdmin: false, error: 'Authentication failed' };
  }
}

/**
 * GET /api/admin/payouts
 * Fetch seller earnings, payout history, and stats
 */
export async function GET(request: Request) {
  const { isAdmin, error } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'earnings';

  try {
    if (view === 'history') {
      const records = await getPayoutRecords();
      return NextResponse.json({ records });
    }

    if (view === 'stats') {
      const stats = await getPayoutStats();
      return NextResponse.json({ stats });
    }

    // Default: seller earnings
    const earnings = await calculateAllSellerEarnings();
    const stats = await getPayoutStats();
    return NextResponse.json({ earnings, stats });
  } catch (err) {
    console.error('Error in GET /api/admin/payouts:', err);
    return NextResponse.json({ error: 'Failed to fetch payout data' }, { status: 500 });
  }
}

/**
 * POST /api/admin/payouts
 * Process a payout for a seller (Mark as Paid)
 */
export async function POST(request: Request) {
  const { isAdmin, userId, error } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { sellerId, amount, commission, payoutMethod, notes } = body;

    if (!sellerId || !amount) {
      return NextResponse.json({ error: 'sellerId and amount are required' }, { status: 400 });
    }

    const result = await processSellerPayout(
      sellerId,
      parseFloat(amount),
      parseFloat(commission || 0),
      payoutMethod || 'manual',
      userId || 'admin',
      notes
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payoutId: result.payoutId,
      message: 'Payout processed successfully',
    });
  } catch (err) {
    console.error('Error in POST /api/admin/payouts:', err);
    return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 });
  }
}
