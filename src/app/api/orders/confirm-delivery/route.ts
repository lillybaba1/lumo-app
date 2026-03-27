import { NextRequest, NextResponse } from 'next/server';
import { confirmDelivery, disputeOrder } from '@/services/escrowService';

/**
 * POST /api/orders/confirm-delivery
 * Buyer confirms they received the order via the confirmation token.
 * This is a public endpoint (no auth required) since the token acts as authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, action, reason } = body;

    if (!token) {
      return NextResponse.json({ error: 'Confirmation token is required' }, { status: 400 });
    }

    // Get client IP for logging
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (action === 'dispute') {
      // Buyer is disputing the delivery
      if (!reason) {
        return NextResponse.json({ error: 'Dispute reason is required' }, { status: 400 });
      }

      // Find the order ID from the token
      const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
      const { data: confirmation } = await supabaseAdmin
        .from('delivery_confirmations')
        .select('order_id')
        .eq('token', token)
        .single();

      if (!confirmation) {
        return NextResponse.json({ error: 'Invalid confirmation token' }, { status: 400 });
      }

      const result = await disputeOrder(confirmation.order_id, reason);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Your dispute has been submitted. Our team will review it shortly.',
      });
    }

    // Default: confirm delivery
    const result = await confirmDelivery(token, clientIp);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: 'Delivery confirmed successfully! Thank you for shopping on JulaZone.',
    });
  } catch (error) {
    console.error('Error in confirm-delivery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
