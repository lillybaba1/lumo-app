
'use server';

import { dbAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';
import { Order } from '@/lib/types';
import { orders as mockOrders } from '@/lib/mock-data';

export async function getOrders(): Promise<Order[]> {
  if (!isFirebaseAdminInitialized || !dbAdmin) {
    return mockOrders;
  }
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
    return mockOrders;
  }
}
