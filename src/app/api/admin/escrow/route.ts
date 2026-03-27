import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { adminReleasePayout, getPayoutPendingOrders, autoConfirmExpiredDeliveries } from '@/services/escrowService';

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
 * GET /api/admin/escrow
 * Get orders pending payout + auto-confirm expired deliveries
 */
export async function GET() {
  const { isAdmin, error } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }

  try {
    // Auto-confirm expired deliveries first
    const autoConfirmed = await autoConfirmExpiredDeliveries();

    // Get payout pending orders
    const pendingOrders = await getPayoutPendingOrders();

    return NextResponse.json({
      pendingOrders,
      autoConfirmed,
      count: pendingOrders.length,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/escrow:', err);
    return NextResponse.json({ error: 'Failed to fetch escrow data' }, { status: 500 });
  }
}

/**
 * POST /api/admin/escrow
 * Admin releases payout for an order (marks as Completed)
 */
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const result = await adminReleasePayout(orderId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payout released. Order marked as completed.',
    });
  } catch (err) {
    console.error('Error in POST /api/admin/escrow:', err);
    return NextResponse.json({ error: 'Failed to release payout' }, { status: 500 });
  }
}
