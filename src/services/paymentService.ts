"use server";

import { logger } from '@/lib/logger';

const paymentLogger = logger.child('PaymentService');

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
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Database row type for payments table
 */
interface DbPaymentRow {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: 'Wave Money' | 'Cash on Delivery';
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded';
  transaction_id: string | null;
  customer_email: string;
  customer_name: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

function mapDbToPayment(data: DbPaymentRow): Payment {
  return {
    id: data.id,
    orderId: data.order_id,
    amount: data.amount,
    currency: data.currency,
    paymentMethod: data.payment_method,
    status: data.status,
    transactionId: data.transaction_id ?? undefined,
    customerEmail: data.customer_email,
    customerName: data.customer_name,
    metadata: data.metadata ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at ?? undefined
  };
}

interface DbPaymentInsert {
  order_id: string;
  amount: number;
  currency: string;
  payment_method: 'Wave Money' | 'Cash on Delivery';
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded';
  transaction_id?: string;
  customer_email: string;
  customer_name: string;
  metadata?: Record<string, unknown>;
  updated_at?: string;
}

function mapPaymentToDb(payment: Omit<Payment, 'id' | 'createdAt'>): DbPaymentInsert {
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
    paymentLogger.error('Failed to create payment', error as Error);
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
    paymentLogger.error('Failed to fetch payment', { paymentId: id, error: String(error) });
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
    paymentLogger.error('Failed to fetch payment for order', { orderId, error: String(error) });
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
    paymentLogger.error('Failed to fetch payments for customer', { customerEmail, error: String(error) });
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
    paymentLogger.error('Failed to fetch payments', error as Error);
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
    paymentLogger.error('Failed to update payment status', { paymentId: id, error: String(error) });
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
    paymentLogger.debug('Wave Money payment initiated', { paymentId: newPayment.id });

    return newPayment;
  } catch (error) {
    paymentLogger.error('Failed to initiate Wave Money payment', error as Error);
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

    paymentLogger.debug('Cash on Delivery payment created', { paymentId: newPayment.id });

    return newPayment;
  } catch (error) {
    paymentLogger.error('Failed to create COD payment', error as Error);
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
    paymentLogger.error('Failed to refund payment', { paymentId: id, error: String(error) });
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
    paymentLogger.error('Failed to calculate payment stats', error as Error);
    return {
      totalRevenue: 0,
      totalPayments: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
    };
  }
}

