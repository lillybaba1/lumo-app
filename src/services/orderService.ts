'use server';

import { doc as firestoreDoc, getDoc as firestoreGetDoc, Timestamp } from 'firebase/firestore';
import { Order } from '@/lib/types';

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

export async function getOrders(): Promise<Order[]> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const adminDb = dbAdmin();
      const snap = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
      if (!snap || snap.empty) return [];
      return snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data() || {}) } as Order));
    }
      const firestore = await import('firebase/firestore');
      const { collection, getDocs, query, orderBy } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data() || {});
      return { id: d.id, ...data } as Order;
    });
  } catch (error) {
    console.error('Failed to fetch orders from Firestore:', error);
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('orders').doc(id).get();
      if (!snap.exists) return null;
      return { id: snap.id, ...serializeTimestamps(snap.data() || {}) } as Order;
    }
    const { getDoc } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const ref = firestoreDoc(db, 'orders', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = serializeTimestamps(snap.data() || {});
    return { id: snap.id, ...data } as Order;
  } catch (error) {
    console.error(`Failed to fetch order ${id} from Firestore:`, error);
    return null;
  }
}

export async function getOrdersByCustomer(customerEmail: string): Promise<Order[]> {
  try {
    const firestore = await import('firebase/firestore');
    const { collection, getDocs, query, where, orderBy } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const q = query(
      collection(db, 'orders'),
      where('customerEmail', '==', customerEmail),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data() || {});
      return { id: d.id, ...data } as Order;
    });
  } catch (error) {
    console.error(`Failed to fetch orders for customer ${customerEmail}:`, error);
    return [];
  }
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const adminDb = dbAdmin();
      const ref = await adminDb.collection('orders').add({ ...order, createdAt: new Date() });
      return { id: ref.id, ...order, createdAt: new Date().toISOString() };
    }
    const firestore = await import('firebase/firestore');
    const { addDoc, collection, serverTimestamp } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const ref = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, ...order, createdAt: new Date().toISOString() };
  } catch (error) {
    console.error('Failed to create order in Firestore:', error);
    throw new Error('Could not create order.');
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('orders').doc(orderId).set({ status, updatedAt: new Date() }, { merge: true });
      return;
    }
    const firestore = await import('firebase/firestore');
    const { updateDoc, doc, serverTimestamp } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Failed to update order ${orderId} status:`, error);
    throw new Error('Could not update order status.');
  }
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
  try {
    const { id, ...rest } = updates as any;
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('orders').doc(orderId).set({ ...rest, updatedAt: new Date() }, { merge: true });
      return;
    }
    const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await updateDoc(doc(db, 'orders', orderId), {
      ...rest,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error);
    throw new Error('Could not update order.');
  }
}

