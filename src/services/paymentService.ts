"use server";

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { updateOrderStatus } from './orderService';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'Wave Money' | 'Cash on Delivery';
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded';
  transactionId?: string;
  customerEmail: string;
  customerName: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

function mapDbToPayment(data: any): Payment {
  return {
    id: data.id,
    orderId: data.order_id,
    amount: data.amount,
    currency: data.currency,
    paymentMethod: data.payment_method,
    status: data.status,
    transactionId: data.transaction_id,
    customerEmail: data.customer_email,
    customerName: data.customer_name,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

function mapPaymentToDb(payment: Omit<Payment, 'id' | 'createdAt'>): any {
  return {
    order_id: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    payment_method: payment.paymentMethod,
    status: payment.status,
    transaction_id: payment.transactionId,
    customer_email: payment.customerEmail,
    customer_name: payment.customerName,
    metadata: payment.metadata,
    updated_at: payment.updatedAt
  };
}

export async function createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([mapPaymentToDb(payment)])
      .select()
      .single();

    if (error) throw error;

    return mapDbToPayment(data);
  } catch (error) {
    console.error('Failed to create payment:', error);
    throw new Error('Could not create payment record.');
  }
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapDbToPayment(data);
  } catch (error) {
    console.error(`Failed to fetch payment ${id}:`, error);
    return null;
  }
}

export async function getPaymentByOrder(orderId: string): Promise<Payment | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapDbToPayment(data);
  } catch (error) {
    console.error(`Failed to fetch payment for order ${orderId}:`, error);
    return null;
  }
}

export async function getPaymentsByCustomer(customerEmail: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('customer_email', customerEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbToPayment);
  } catch (error) {
    console.error(`Failed to fetch payments for customer ${customerEmail}:`, error);
    return [];
  }
}

export async function getAllPayments(): Promise<Payment[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbToPayment);
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return [];
  }
}

export async function updatePaymentStatus(
  id: string,
  status: Payment['status'],
  transactionId?: string
): Promise<void> {
  try {
    const payment = await getPaymentById(id);
    if (!payment) throw new Error('Payment not found');

    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (transactionId) {
      updates.transaction_id = transactionId;
    }

    const { error } = await supabaseAdmin
      .from('payments')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    // Update order payment status
    if (status === 'Completed') {
      await updateOrderStatus(payment.orderId, 'Processing');
    } else if (status === 'Failed') {
      // Map failed payment to cancelled order
      await updateOrderStatus(payment.orderId, 'Cancelled');
    }
  } catch (error) {
    console.error(`Failed to update payment status for ${id}:`, error);
    throw new Error('Could not update payment status.');
  }
}

export async function initiateWaveMoneyPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'status'>): Promise<Payment> {
  try {
    // In a real implementation, this would call Wave Money API
    // For now, we'll create a pending payment record
    const newPayment = await createPayment({
      ...payment,
      status: 'Pending',
      metadata: {
        ...payment.metadata,
        paymentProvider: 'Wave Money',
        initiatedAt: new Date().toISOString(),
      },
    });

    // Simulate API call delay
    // In production, you would integrate with Wave Money API here
    console.log('Wave Money payment initiated:', newPayment.id);

    return newPayment;
  } catch (error) {
    console.error('Failed to initiate Wave Money payment:', error);
    throw new Error('Could not initiate Wave Money payment.');
  }
}

export async function processCashOnDelivery(payment: Omit<Payment, 'id' | 'createdAt' | 'status'>): Promise<Payment> {
  try {
    // For cash on delivery, we create a pending payment that will be marked as completed upon delivery
    const newPayment = await createPayment({
      ...payment,
      status: 'Pending',
      metadata: {
        ...payment.metadata,
        paymentProvider: 'Cash on Delivery',
        note: 'Payment will be collected upon delivery',
      },
    });

    console.log('Cash on Delivery payment created:', newPayment.id);

    return newPayment;
  } catch (error) {
    console.error('Failed to create COD payment:', error);
    throw new Error('Could not create Cash on Delivery payment.');
  }
}

export async function refundPayment(id: string, reason?: string): Promise<void> {
  try {
    const payment = await getPaymentById(id);
    if (!payment) throw new Error('Payment not found');

    if (payment.status !== 'Completed') {
      throw new Error('Only completed payments can be refunded');
    }

    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'Refunded',
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          refundReason: reason,
          refundedAt: new Date().toISOString()
        }
      })
      .eq('id', id);

    if (error) throw error;

    // Update order status
    await updateOrderStatus(payment.orderId, 'Cancelled');
  } catch (error) {
    console.error(`Failed to refund payment ${id}:`, error);
    throw new Error('Could not process refund.');
  }
}

export async function getPaymentStats(): Promise<{
  totalRevenue: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
}> {
  try {
    const payments = await getAllPayments();

    const stats = {
      totalRevenue: 0,
      totalPayments: payments.length,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
    };

    payments.forEach(payment => {
      if (payment.status === 'Completed') {
        stats.totalRevenue += payment.amount;
        stats.completedPayments++;
      } else if (payment.status === 'Pending' || payment.status === 'Processing') {
        stats.pendingPayments++;
      } else if (payment.status === 'Failed') {
        stats.failedPayments++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Failed to calculate payment stats:', error);
    return {
      totalRevenue: 0,
      totalPayments: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
    };
  }
}
