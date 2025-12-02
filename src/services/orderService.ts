"use server";

import { Order } from '@/lib/types';
import { orders as mockOrders } from '@/lib/mock-data';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Get all orders from Supabase
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch orders from Supabase:', error);
      return mockOrders;
    }

    if (!data || data.length === 0) {
      return mockOrders;
    }

    // Map Supabase data to Order type
    return data.map(order => ({
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      items: order.items || [],
      subtotal: parseFloat(order.subtotal),
      discount: parseFloat(order.discount || 0),
      total: parseFloat(order.total),
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      couponCode: order.coupon_code,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return mockOrders;
  }
}

/**
 * Get a single order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error(`Failed to fetch order ${id}:`, error);
      // Fallback to mock data
      return mockOrders.find(o => o.id === id) || null;
    }

    // Map Supabase data to Order type
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
    console.error(`Failed to fetch order ${id}:`, error);
    return mockOrders.find(o => o.id === id) || null;
  }
}

/**
 * Get orders by customer email
 */
export async function getOrdersByCustomer(customerEmail: string): Promise<Order[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_email', customerEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Failed to fetch orders for customer ${customerEmail}:`, error);
      // Fallback to mock data
      return mockOrders.filter(o => o.customerEmail === customerEmail);
    }

    if (!data || data.length === 0) {
      return mockOrders.filter(o => o.customerEmail === customerEmail);
    }

    // Map Supabase data to Order type
    return data.map(order => ({
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      items: order.items || [],
      subtotal: parseFloat(order.subtotal),
      discount: parseFloat(order.discount || 0),
      total: parseFloat(order.total),
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      couponCode: order.coupon_code,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));
  } catch (error) {
    console.error(`Failed to fetch orders for customer ${customerEmail}:`, error);
    return mockOrders.filter(o => o.customerEmail === customerEmail);
  }
}

/**
 * Create a new order
 */
export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        customer_phone: order.customerPhone,
        shipping_address: order.shippingAddress,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        status: order.status,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        coupon_code: order.couponCode,
        notes: order.notes,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create order:', error);
      throw new Error('Could not create order.');
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
    console.error('Failed to create order:', error);
    throw new Error('Could not create order.');
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error(`Failed to update order ${orderId} status:`, error);
      throw new Error('Could not update order status.');
    }
  } catch (error) {
    console.error(`Failed to update order ${orderId} status:`, error);
    throw new Error('Could not update order status.');
  }
}

/**
 * Update order
 */
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
  try {
    // Map Order fields to database column names
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
    if (updates.customerEmail !== undefined) dbUpdates.customer_email = updates.customerEmail;
    if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone;
    if (updates.shippingAddress !== undefined) dbUpdates.shipping_address = updates.shippingAddress;
    if (updates.items !== undefined) dbUpdates.items = updates.items;
    if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
    if (updates.discount !== undefined) dbUpdates.discount = updates.discount;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.couponCode !== undefined) dbUpdates.coupon_code = updates.couponCode;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { error } = await supabaseAdmin
      .from('orders')
      .update(dbUpdates)
      .eq('id', orderId);

    if (error) {
      console.error(`Failed to update order ${orderId}:`, error);
      throw new Error('Could not update order.');
    }
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error);
    throw new Error('Could not update order.');
  }
}
