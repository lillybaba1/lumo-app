import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sellerPreparingOrder } from '@/services/escrowService';

/**
 * POST /api/orders/mark-preparing
 * Seller acknowledges an order and starts preparing it.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate seller
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get business account
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!businessAccount) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
      if (!userData?.role || !ADMIN_ROLES.includes(userData.role)) {
        return NextResponse.json({ error: 'Business account required' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const sellerId = businessAccount?.id || user.id;
    const success = await sellerPreparingOrder(orderId, sellerId);

    if (!success) {
      return NextResponse.json(
        { error: 'Cannot mark order as preparing. Order may not be in the correct status.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as preparing.',
    });
  } catch (error) {
    console.error('Error in mark-preparing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
