'use server';

import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order, OrderStatus } from '@/lib/types';
import { randomUUID } from 'crypto';

const escrowLogger = logger.child('EscrowService');

/**
 * When payment succeeds (via webhook), transition order to 'Paid' escrow status.
 * Money is held in the platform Modem Pay account.
 */
export async function onPaymentReceived(orderId: string): Promise<boolean> {
  try {
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      escrowLogger.error('Order not found for payment received', { orderId });
      return false;
    }

    // Only transition from Pending
    if (order.status !== 'Pending') {
      escrowLogger.warn('Order not in Pending status, skipping', { orderId, currentStatus: order.status });
      return false;
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'Paid',
        payment_status: 'Paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      escrowLogger.error('Failed to update order to Paid', { orderId, error });
      return false;
    }

    escrowLogger.info('Order marked as Paid (escrow)', { orderId });

    // TODO: Send notification to seller that a new order needs preparation
    // Could be email, push notification, or in-app notification

    return true;
  } catch (error) {
    escrowLogger.error('Error in onPaymentReceived', { orderId, error });
    return false;
  }
}

/**
 * Seller marks order as "Preparing" — they've acknowledged and are getting it ready.
 */
export async function sellerPreparingOrder(orderId: string, sellerId: string): Promise<boolean> {
  try {
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      escrowLogger.error('Order not found', { orderId });
      return false;
    }

    if (order.status !== 'Paid') {
      escrowLogger.warn('Order not in Paid status', { orderId, currentStatus: order.status });
      return false;
    }

    // Verify seller owns items in this order
    const hasSellerItems = await verifySellerOwnsOrderItems(order, sellerId);
    if (!hasSellerItems) {
      escrowLogger.error('Seller does not own items in this order', { orderId, sellerId });
      return false;
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'Preparing',
        seller_id: sellerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      escrowLogger.error('Failed to update order to Preparing', { orderId, error });
      return false;
    }

    escrowLogger.info('Order marked as Preparing', { orderId, sellerId });
    return true;
  } catch (error) {
    escrowLogger.error('Error in sellerPreparingOrder', { orderId, error });
    return false;
  }
}

/**
 * Seller marks order as shipped.
 * Generates a confirmation token and returns the confirmation link.
 * The seller can then send this link to the buyer via WhatsApp.
 */
export async function sellerShippedOrder(
  orderId: string,
  sellerId: string
): Promise<{ success: boolean; confirmationLink?: string; error?: string }> {
  try {
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Allow shipping from Paid or Preparing status
    if (!['Paid', 'Preparing'].includes(order.status)) {
      return { success: false, error: `Cannot ship order in ${order.status} status` };
    }

    // Verify seller
    const hasSellerItems = await verifySellerOwnsOrderItems(order, sellerId);
    if (!hasSellerItems) {
      return { success: false, error: 'You do not have items in this order' };
    }

    // Generate confirmation token
    const confirmationToken = randomUUID();
    const now = new Date();
    const autoConfirmAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Update order
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'Shipped',
        confirmation_token: confirmationToken,
        shipped_at: now.toISOString(),
        auto_confirm_at: autoConfirmAt.toISOString(),
        seller_id: sellerId,
        updated_at: now.toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      escrowLogger.error('Failed to update order to Shipped', { orderId, error: updateError });
      return { success: false, error: 'Failed to update order' };
    }

    // Create delivery confirmation record
    const { error: confirmError } = await supabaseAdmin
      .from('delivery_confirmations')
      .insert({
        order_id: orderId,
        token: confirmationToken,
        buyer_phone: order.customer_phone,
        buyer_email: order.customer_email,
        expires_at: autoConfirmAt.toISOString(),
      });

    if (confirmError) {
      escrowLogger.error('Failed to create delivery confirmation', { orderId, error: confirmError });
      // Don't fail the whole operation — token is already in the order
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julazone.com';
    const confirmationLink = `${appUrl}/confirm/${confirmationToken}`;

    escrowLogger.info('Order marked as Shipped, confirmation link generated', {
      orderId,
      sellerId,
      confirmationLink,
      autoConfirmAt: autoConfirmAt.toISOString(),
    });

    return { success: true, confirmationLink };
  } catch (error) {
    escrowLogger.error('Error in sellerShippedOrder', { orderId, error });
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Buyer confirms delivery via the confirmation token.
 * Transitions order to 'Delivered' then 'Payout Pending'.
 */
export async function confirmDelivery(
  token: string,
  clientIp?: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // Look up the confirmation record
    const { data: confirmation, error: fetchError } = await supabaseAdmin
      .from('delivery_confirmations')
      .select('*, orders!inner(id, status, customer_name)')
      .eq('token', token)
      .single();

    if (fetchError || !confirmation) {
      return { success: false, error: 'Invalid or expired confirmation link' };
    }

    if (confirmation.confirmed) {
      return { success: false, error: 'Delivery has already been confirmed' };
    }

    // Check expiry
    if (new Date(confirmation.expires_at) < new Date()) {
      return { success: false, error: 'Confirmation link has expired' };
    }

    const orderId = confirmation.order_id;

    // Verify order is in Shipped status
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (!order || order.status !== 'Shipped') {
      return { success: false, error: 'Order is not in shipped status' };
    }

    const now = new Date().toISOString();

    // Mark confirmation as confirmed
    await supabaseAdmin
      .from('delivery_confirmations')
      .update({
        confirmed: true,
        confirmed_at: now,
        confirmed_ip: clientIp || null,
      })
      .eq('token', token);

    // Update order to Delivered → Payout Pending
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'Payout Pending',
        delivered_at: now,
        updated_at: now,
      })
      .eq('id', orderId);

    escrowLogger.info('Delivery confirmed by buyer', { orderId, token });

    // TODO: Notify admin that a payout is pending

    return { success: true, orderId };
  } catch (error) {
    escrowLogger.error('Error in confirmDelivery', { token, error });
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Auto-confirm deliveries that are older than 7 days (called by cron/admin).
 * Finds all Shipped orders past their auto_confirm_at date.
 */
export async function autoConfirmExpiredDeliveries(): Promise<number> {
  try {
    const now = new Date().toISOString();

    const { data: expiredOrders, error } = await supabaseAdmin
      .from('orders')
      .select('id, confirmation_token')
      .eq('status', 'Shipped')
      .not('auto_confirm_at', 'is', null)
      .lte('auto_confirm_at', now);

    if (error || !expiredOrders) {
      escrowLogger.error('Failed to fetch expired orders', { error });
      return 0;
    }

    let confirmed = 0;
    for (const order of expiredOrders) {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'Payout Pending',
          delivered_at: now,
          updated_at: now,
        })
        .eq('id', order.id);

      // Also update confirmation record if it exists
      if (order.confirmation_token) {
        await supabaseAdmin
          .from('delivery_confirmations')
          .update({
            confirmed: true,
            confirmed_at: now,
          })
          .eq('token', order.confirmation_token);
      }

      confirmed++;
    }

    if (confirmed > 0) {
      escrowLogger.info(`Auto-confirmed ${confirmed} expired deliveries`);
    }

    return confirmed;
  } catch (error) {
    escrowLogger.error('Error in autoConfirmExpiredDeliveries', { error });
    return 0;
  }
}

/**
 * Admin triggers payout to seller. Transitions order to 'Completed'.
 */
export async function adminReleasePayout(orderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'Payout Pending') {
      return { success: false, error: `Order is in ${order.status} status, must be Payout Pending` };
    }

    // Mark order as completed — the actual payout is done via /api/admin/payouts
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'Completed',
        payout_at: now,
        updated_at: now,
      })
      .eq('id', orderId);

    if (updateError) {
      escrowLogger.error('Failed to mark order as Completed', { orderId, error: updateError });
      return { success: false, error: 'Failed to update order' };
    }

    escrowLogger.info('Order marked as Completed, payout released', { orderId });
    return { success: true };
  } catch (error) {
    escrowLogger.error('Error in adminReleasePayout', { orderId, error });
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Buyer disputes the order. Transitions to 'Disputed' status.
 */
export async function disputeOrder(
  orderId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Can only dispute if Shipped or Delivered
    if (!['Shipped', 'Delivered', 'Payout Pending'].includes(order.status)) {
      return { success: false, error: 'Cannot dispute order in current status' };
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'Disputed',
        notes: `DISPUTE: ${reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      return { success: false, error: 'Failed to dispute order' };
    }

    escrowLogger.info('Order disputed', { orderId, reason });
    return { success: true };
  } catch (error) {
    escrowLogger.error('Error in disputeOrder', { orderId, error });
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Get orders pending payout (for admin dashboard).
 */
export async function getPayoutPendingOrders(): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'Payout Pending')
      .order('delivered_at', { ascending: true });

    if (error) {
      escrowLogger.error('Failed to fetch payout pending orders', { error });
      return [];
    }

    return data || [];
  } catch (error) {
    escrowLogger.error('Error fetching payout pending orders', { error });
    return [];
  }
}

/**
 * Get orders for a specific seller by matching sellerId in order items.
 */
export async function getSellerOrders(sellerId: string): Promise<any[]> {
  try {
    // First try direct seller_id match on orders
    const { data: directOrders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (directOrders && directOrders.length > 0) {
      return directOrders;
    }

    // Fallback: search orders where items contain this seller's products
    // Get the boutique for this seller
    const { data: boutique } = await supabaseAdmin
      .from('boutiques')
      .select('id')
      .eq('business_account_id', sellerId)
      .single();

    if (!boutique) {
      return [];
    }

    // Get all orders and filter by seller items in JSONB
    const { data: allOrders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .neq('status', 'Cancelled')
      .order('created_at', { ascending: false });

    if (error || !allOrders) return [];

    // Filter orders that contain this seller's items
    return allOrders.filter(order => {
      const items = order.items || [];
      return items.some((item: any) =>
        item.sellerId === sellerId ||
        item.sellerId === boutique.id ||
        item.product?.sellerId === sellerId ||
        item.product?.sellerId === boutique.id ||
        item.product?.boutiqueId === boutique.id
      );
    });
  } catch (error) {
    escrowLogger.error('Error fetching seller orders', { sellerId, error });
    return [];
  }
}

/**
 * Generate WhatsApp link for sending confirmation to buyer.
 */
export async function generateWhatsAppLink(
  buyerPhone: string,
  confirmationLink: string,
  customerName: string
): Promise<string> {
  // Clean phone number — ensure it has country code
  let phone = buyerPhone.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = '220' + phone.substring(1); // Gambia country code
  }
  if (!phone.startsWith('220') && phone.length <= 7) {
    phone = '220' + phone;
  }

  const message = encodeURIComponent(
    `Hello ${customerName}! 🎉\n\n` +
    `Your order from JulaZone has been shipped! 📦\n\n` +
    `Please click the link below to confirm you received your delivery:\n\n` +
    `${confirmationLink}\n\n` +
    `If you don't confirm within 7 days, the delivery will be automatically confirmed.\n\n` +
    `Thank you for shopping on JulaZone! 🛍️`
  );

  return `https://wa.me/${phone}?text=${message}`;
}

/**
 * Verify that a seller has items in the order
 */
async function verifySellerOwnsOrderItems(order: any, sellerId: string): Promise<boolean> {
  const items = order.items || [];

  // Direct check on items
  const hasItems = items.some((item: any) =>
    item.sellerId === sellerId ||
    item.product?.sellerId === sellerId
  );

  if (hasItems) return true;

  // Check via boutique
  const { data: boutique } = await supabaseAdmin
    .from('boutiques')
    .select('id')
    .eq('business_account_id', sellerId)
    .single();

  if (!boutique) return false;

  return items.some((item: any) =>
    item.sellerId === boutique.id ||
    item.product?.sellerId === boutique.id ||
    item.product?.boutiqueId === boutique.id
  );
}
