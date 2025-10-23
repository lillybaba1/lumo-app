'use server';

import { db } from '@/lib/firebaseClient';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
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
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data());
      return { id: d.id, ...data } as Order;
    });
  } catch (error) {
    console.error('Failed to fetch orders from Firestore:', error);
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const ref = doc(db, 'orders', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = serializeTimestamps(snap.data());
    return { id: snap.id, ...data } as Order;
  } catch (error) {
    console.error(`Failed to fetch order ${id} from Firestore:`, error);
    return null;
  }
}

export async function getOrdersByCustomer(customerEmail: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('customerEmail', '==', customerEmail),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data());
      return { id: d.id, ...data } as Order;
    });
  } catch (error) {
    console.error(`Failed to fetch orders for customer ${customerEmail}:`, error);
    return [];
  }
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  try {
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
    await updateDoc(doc(db, 'orders', orderId), {
      ...rest,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error);
    throw new Error('Could not update order.');
  }
}

