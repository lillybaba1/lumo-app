import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSellerOrders } from '@/services/escrowService';

/**
 * GET /api/orders/seller-orders
 * Fetch orders for the authenticated seller
 */
export async function GET() {
  try {
    // Authenticate
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
      // Check if admin — admins can see all orders
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
      if (userData?.role && ADMIN_ROLES.includes(userData.role)) {
        // Admin: return all non-cancelled orders
        const { data: allOrders } = await supabaseAdmin
          .from('orders')
          .select('*')
          .neq('status', 'Cancelled')
          .order('created_at', { ascending: false })
          .limit(100);

        return NextResponse.json({ orders: allOrders || [] });
      }

      return NextResponse.json({ error: 'Business account required' }, { status: 403 });
    }

    const orders = await getSellerOrders(businessAccount.id);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
