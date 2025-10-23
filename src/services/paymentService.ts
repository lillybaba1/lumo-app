"use server";

import {
  doc as firestoreDoc,
  getDoc as firestoreGetDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
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

function serializeTimestamps(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value instanceof Timestamp) {
      out[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = serializeTimestamps(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const adminDb = dbAdmin();
      const ref = await adminDb.collection('payments').add({ ...payment, createdAt: new Date() });
      return { id: ref.id, ...payment, createdAt: new Date().toISOString() };
    }
    const { addDoc, collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const ref = await addDoc(collection(db, 'payments'), {
      ...payment,
      createdAt: serverTimestamp(),
    });
    return {
      id: ref.id,
      ...payment,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to create payment:', error);
    throw new Error('Could not create payment record.');
  }
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('payments').doc(id).get();
      if (!snap.exists) return null;
      const data = serializeTimestamps(snap.data() || {});
      return { id: snap.id, ...data } as Payment;
    }
    const { getDoc } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const snap = await getDoc(firestoreDoc(db, 'payments', id));
    if (!snap.exists()) return null;
    const data = serializeTimestamps(snap.data() || {});
    return { id: snap.id, ...data } as Payment;
  } catch (error) {
    console.error(`Failed to fetch payment ${id}:`, error);
    return null;
  }
}

export async function getPaymentByOrder(orderId: string): Promise<Payment | null> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('payments').where('orderId', '==', orderId).get();
      if (!snap || snap.empty) return null;
      const doc = snap.docs[0];
      const data = serializeTimestamps(doc.data() || {});
      return { id: doc.id, ...data } as Payment;
    }
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const q = query(collection(db, 'payments'), where('orderId', '==', orderId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = serializeTimestamps(doc.data() || {});
    return { id: doc.id, ...data } as Payment;
  } catch (error) {
    console.error(`Failed to fetch payment for order ${orderId}:`, error);
    return null;
  }
}

export async function getPaymentsByCustomer(customerEmail: string): Promise<Payment[]> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('payments').where('customerEmail', '==', customerEmail).orderBy('createdAt', 'desc').get();
      if (!snap || snap.empty) return [];
      return snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data() || {}) } as Payment));
    }
    const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const q = query(
      collection(db, 'payments'),
      where('customerEmail', '==', customerEmail),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data() || {});
      return { id: d.id, ...data } as Payment;
    });
  } catch (error) {
    console.error(`Failed to fetch payments for customer ${customerEmail}:`, error);
    return [];
  }
}

export async function getAllPayments(): Promise<Payment[]> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('payments').orderBy('createdAt', 'desc').get();
      if (!snap || snap.empty) return [];
      return snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data() || {}) } as Payment));
    }
    const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data() || {});
      return { id: d.id, ...data } as Payment;
    });
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
      updatedAt: serverTimestamp(),
    };

    if (transactionId) {
      updates.transactionId = transactionId;
    }

    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('payments').doc(id).set({ ...updates }, { merge: true });
    } else {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { getClientDb } = await import('@/lib/firebaseClient');
      const db = getClientDb();
      await updateDoc(doc(db, 'payments', id), updates);
    }

    // Update order payment status
    if (status === 'Completed') {
      await updateOrderStatus(payment.orderId, 'Processing', 'Paid');
    } else if (status === 'Failed') {
      await updateOrderStatus(payment.orderId, payment.orderId, 'Failed');
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

    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('payments').doc(id).set({ status: 'Refunded', updatedAt: new Date(), metadata: { ...payment.metadata, refundReason: reason, refundedAt: new Date().toISOString() } }, { merge: true });
    } else {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { getClientDb } = await import('@/lib/firebaseClient');
      const db = getClientDb();
      await updateDoc(doc(db, 'payments', id), {
        status: 'Refunded',
        updatedAt: serverTimestamp(),
        metadata: {
          ...payment.metadata,
          refundReason: reason,
          refundedAt: new Date().toISOString(),
        },
      });
    }

    // Update order status
    await updateOrderStatus(payment.orderId, 'Cancelled', 'Pending');
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
