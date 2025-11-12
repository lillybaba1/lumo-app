'use server';

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
      console.error('Error fetching orders:', error);
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
    console.error('Failed to fetch orders:', error);
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
      console.error('Error fetching order:', error);
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
    console.error('Failed to fetch order:', error);
    return null;
  }
}
