'use server';

import { logger } from '@/lib/logger';

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
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      orderLogger.error('Error creating order:', error);
      orderLogger.error('Error details:', JSON.stringify(error));
      throw new Error(`Database error: ${error.message || error.code || 'Unknown error'}`);
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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    orderLogger.error('Failed to create order:', error);
    throw error;
  }
}

/**
 * Update an existing order
 */
export async function updateOrder(orderId: string, orderData: Partial<Order>): Promise<Order | null> {
  try {
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
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<void> {
  try {
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

