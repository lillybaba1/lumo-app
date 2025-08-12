
'use server';

import { dbAdmin } from '@/lib/firebaseAdmin';
import { Order } from '@/lib/types';

export async function getOrders(): Promise<Order[]> {
  try {
    const ordersCol = dbAdmin.collection('orders');
    const orderSnapshot = await ordersCol.get();
    if (orderSnapshot.empty) {
      return [];
    }
    const orderList = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    return orderList;
  } catch (error) {
    console.error('Failed to fetch orders from Firestore:', error);
    return [];
  }
}
