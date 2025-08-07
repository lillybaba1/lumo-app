
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Order } from '@/lib/types';
import { orders as mockOrders } from '@/lib/mock-data';

export async function getOrders(): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCol);
    const orderList = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    if (orderList.length === 0) {
        return mockOrders;
    }
    return orderList;
  } catch (error) {
    console.warn('Failed to connect to Firestore. Falling back to mock orders.', error);
    return mockOrders;
  }
}
