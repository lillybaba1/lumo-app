import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sellerShippedOrder, generateWhatsAppLink } from '@/services/escrowService';

/**
 * POST /api/orders/mark-shipped
 * Seller marks an order as shipped.
 * Generates a confirmation link for the buyer.
 * Returns the confirmation link and WhatsApp link for the seller to send to the buyer.
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
      // Check if admin
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
    const result = await sellerShippedOrder(orderId, sellerId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Get order details for WhatsApp link
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('customer_phone, customer_name')
      .eq('id', orderId)
      .single();

    let whatsappLink = null;
    if (order?.customer_phone && result.confirmationLink) {
      whatsappLink = generateWhatsAppLink(
        order.customer_phone,
        result.confirmationLink,
        order.customer_name || 'Customer'
      );
    }

    return NextResponse.json({
      success: true,
      confirmationLink: result.confirmationLink,
      whatsappLink,
      message: 'Order marked as shipped. Send the confirmation link to the buyer.',
    });
  } catch (error) {
    console.error('Error in mark-shipped:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
