'use server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { trackPurchase } from '@/services/intelligenceService';

const orderLogger = logger.child('OrderService');

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order } from '@/lib/types';

/**
 * Get all orders from the database
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      orderLogger.error('Error fetching orders:', error);
      throw error;
    }

    // Transform database rows to Order type
    const orders: Order[] = (data || []).map((row) => ({
      id: row.id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      shippingAddress: row.shipping_address,
      items: row.items || [],
      subtotal: parseFloat(row.subtotal),
      discount: parseFloat(row.discount || 0),
      total: parseFloat(row.total),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      couponCode: row.coupon_code,
      notes: row.notes,
      confirmationToken: row.confirmation_token,
      shippedAt: row.shipped_at,
      deliveredAt: row.delivered_at,
      payoutAt: row.payout_at,
      autoConfirmAt: row.auto_confirm_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return orders;
  } catch (error) {
    orderLogger.error('Failed to fetch orders:', error);
    return [];
  }
}

/**
 * Get a single order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      orderLogger.error('Error fetching order:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      shippingAddress: data.shipping_address,
      items: data.items || [],
      subtotal: parseFloat(data.subtotal),
      discount: parseFloat(data.discount || 0),
      total: parseFloat(data.total),
      status: data.status,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      couponCode: data.coupon_code,
      notes: data.notes,
      confirmationToken: data.confirmation_token,
      shippedAt: data.shipped_at,
      deliveredAt: data.delivered_at,
      payoutAt: data.payout_at,
      autoConfirmAt: data.auto_confirm_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    orderLogger.error('Failed to fetch order:', error);
    return null;
  }
}

/**
 * Get orders by customer email
 */
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      orderLogger.error('Error fetching orders by email:', error);
      throw error;
    }

    return (data || []).map((row) => ({
      id: row.id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      shippingAddress: row.shipping_address,
      items: row.items || [],
      subtotal: parseFloat(row.subtotal),
      discount: parseFloat(row.discount || 0),
      total: parseFloat(row.total),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      couponCode: row.coupon_code,
      notes: row.notes,
      confirmationToken: row.confirmation_token,
      shippedAt: row.shipped_at,
      deliveredAt: row.delivered_at,
      payoutAt: row.payout_at,
      autoConfirmAt: row.auto_confirm_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    orderLogger.error('Failed to fetch orders by email:', error);
    return [];
  }
}

/**
 * Create a new order
 */
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  try {
    // Attempt to link to authenticated user if available
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch (authError) {
      // Ignore auth errors during order creation - allow guest checkout logic to proceed
      orderLogger.debug('Could not retrieve auth user for order linkage', { error: authError });
    }

    const insertPayload = {
      user_id: userId || (orderData.customerId && typeof orderData.customerId === 'string' && orderData.customerId.length > 0 ? orderData.customerId : null),
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      shipping_address: orderData.shippingAddress,
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      total: orderData.total,
      status: orderData.status,
      payment_method: orderData.paymentMethod,
      payment_status: orderData.paymentStatus,
      coupon_code: orderData.couponCode,
      notes: orderData.notes,
    };

    orderLogger.info('Creating order with payload', { customerEmail: orderData.customerEmail, userId });

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      orderLogger.error('Error creating order:', error);
      orderLogger.error('Error details:', JSON.stringify(error));
      throw new Error(`Database error: ${error.message || error.code || 'Unknown error'}`);
    }

    const createdOrder: Order = {
      id: data.id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      shippingAddress: data.shipping_address,
      items: data.items || [],
      subtotal: parseFloat(data.subtotal),
      discount: parseFloat(data.discount || 0),
      total: parseFloat(data.total),
      status: data.status,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      couponCode: data.coupon_code,
      notes: data.notes,
      confirmationToken: data.confirmation_token,
      shippedAt: data.shipped_at,
      deliveredAt: data.delivered_at,
      payoutAt: data.payout_at,
      autoConfirmAt: data.auto_confirm_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Track purchase for intelligence engine (fire-and-forget, never blocks checkout)
    const effectiveUserId = userId || insertPayload.user_id;
    if (effectiveUserId && orderData.items?.length > 0) {
      trackPurchase(
        effectiveUserId,
        orderData.items
          .filter(item => item.product?.id)
          .map(item => ({
            product: { id: item.product.id },
            quantity: item.quantity || 1,
          }))
      ).catch(err => orderLogger.debug('Purchase tracking failed (non-critical)', { error: err }));
    }

    return createdOrder;
  } catch (error) {
    orderLogger.error('Failed to create order:', error);
    throw error;
  }
}

/**
 * Update an existing order
 * Requires authentication: only the order owner (by email) or admin can update
 */
export async function updateOrder(orderId: string, orderData: Partial<Order>): Promise<Order | null> {
  try {
    // SECURITY: Verify caller is authenticated and authorized
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Check admin or order ownership
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('customer_email')
      .eq('id', orderId)
      .single();

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
    const isAdmin = userData?.role && ADMIN_ROLES.includes(userData.role);
    const isOwner = user.email === existingOrder.customer_email;

    if (!isAdmin && !isOwner) {
      throw new Error('Not authorized to update this order');
    }

    const updateData: Partial<Record<string, unknown>> = {
      updated_at: new Date().toISOString(),
    };

    if (orderData.customerName !== undefined) updateData.customer_name = orderData.customerName;
    if (orderData.customerEmail !== undefined) updateData.customer_email = orderData.customerEmail;
    if (orderData.customerPhone !== undefined) updateData.customer_phone = orderData.customerPhone;
    if (orderData.shippingAddress !== undefined) updateData.shipping_address = orderData.shippingAddress;
    if (orderData.items !== undefined) updateData.items = orderData.items;
    if (orderData.subtotal !== undefined) updateData.subtotal = orderData.subtotal;
    if (orderData.discount !== undefined) updateData.discount = orderData.discount;
    if (orderData.total !== undefined) updateData.total = orderData.total;
    if (orderData.status !== undefined) updateData.status = orderData.status;
    if (orderData.paymentMethod !== undefined) updateData.payment_method = orderData.paymentMethod;
    if (orderData.paymentStatus !== undefined) updateData.payment_status = orderData.paymentStatus;
    if (orderData.couponCode !== undefined) updateData.coupon_code = orderData.couponCode;
    if (orderData.notes !== undefined) updateData.notes = orderData.notes;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      orderLogger.error('Error updating order:', error);
      throw error;
    }

    return {
      id: data.id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      shippingAddress: data.shipping_address,
      items: data.items || [],
      subtotal: parseFloat(data.subtotal),
      discount: parseFloat(data.discount || 0),
      total: parseFloat(data.total),
      status: data.status,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      couponCode: data.coupon_code,
      notes: data.notes,
      confirmationToken: data.confirmation_token,
      shippedAt: data.shipped_at,
      deliveredAt: data.delivered_at,
      payoutAt: data.payout_at,
      autoConfirmAt: data.auto_confirm_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    orderLogger.error('Failed to update order:', error);
    return null;
  }
}

/**
 * Update order status
 * Requires authentication: only admin can update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<void> {
  try {
    // SECURITY: Verify caller is authenticated admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
    if (!userData?.role || !ADMIN_ROLES.includes(userData.role)) {
      throw new Error('Admin access required to update order status');
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      orderLogger.error('Error updating order status:', error);
      throw error;
    }
  } catch (error) {
    orderLogger.error('Failed to update order status:', error);
    throw error;
  }
}

