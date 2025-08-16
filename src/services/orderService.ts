'use server';

import { Order } from '@/lib/types';
import { orders as mockOrders } from '@/lib/mock-data';

// Edge-safe stub (no firebase-admin here)
export async function getOrders(): Promise<Order[]> {
  // Temporarily stubbed for Cloudflare Edge compatibility
  return [];
}

/* ===========================
   Node.js-only implementation
   (keep this commented or move
   to a Node runtime build)
================================
import { dbAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

export async function getOrders(): Promise<Order[]> {
  try {
    if (isFirebaseAdminInitialized() && dbAdmin) {
      const ordersCol = dbAdmin.collection('orders');
      const orderSnapshot = await ordersCol.get();
      if (orderSnapshot.empty) return [];
      return orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch orders from Firestore:', error);
    return mockOrders;
  }
}
*/
