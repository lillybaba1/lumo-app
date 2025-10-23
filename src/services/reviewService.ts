'use server';

import { Timestamp } from 'firebase/firestore';
import { Review, ProductStats } from '@/lib/types';

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

export async function getAllReviews(): Promise<Review[]> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('reviews').orderBy('createdAt', 'desc').get();
      if (!snap || snap.empty) return [];
      return snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data() || {}) } as Review));
    }
    const firestore = await import('firebase/firestore');
    const { collection, getDocs, query, orderBy } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data() || {}) } as Review));
  } catch (error) {
    console.error('Failed to fetch all reviews:', error);
    return [];
  }
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('reviews').where('productId', '==', productId).orderBy('createdAt', 'desc').get();
      if (!snap || snap.empty) return [];
      return snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data() || {}) } as Review));
    }
    const firestore = await import('firebase/firestore');
    const { collection, getDocs, query, where, orderBy } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const q = query(collection(db, 'reviews'), where('productId', '==', productId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data() || {}) } as Review));
  } catch (error) {
    console.error(`Failed to fetch reviews for product ${productId}:`, error);
    return [];
  }
}

export async function getProductStats(productId: string): Promise<ProductStats> {
  try {
    const reviews = await getReviewsByProduct(productId);

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        totalSales: 0,
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      totalSales: 0, // This will be calculated from orders
    };
  } catch (error) {
    console.error(`Failed to get product stats for ${productId}:`, error);
    return {
      averageRating: 0,
      totalReviews: 0,
      totalSales: 0,
    };
  }
}

export async function createReview(review: Omit<Review, 'id' | 'createdAt' | 'helpful'>): Promise<Review> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const ref = await dbAdmin().collection('reviews').add({ ...review, helpful: 0, createdAt: new Date() });
      return { id: ref.id, ...review, helpful: 0, createdAt: new Date().toISOString() };
    }
    const firestore = await import('firebase/firestore');
    const { addDoc, collection, serverTimestamp } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const ref = await addDoc(collection(db, 'reviews'), { ...review, helpful: 0, createdAt: serverTimestamp() });
    return { id: ref.id, ...review, helpful: 0, createdAt: new Date().toISOString() };
  } catch (error) {
    console.error('Failed to create review:', error);
    throw new Error('Could not create review.');
  }
}

export async function updateReview(id: string, updates: Partial<Review>): Promise<void> {
  try {
    const { id: _id, createdAt, helpful, ...rest } = updates as any;
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('reviews').doc(id).set(rest, { merge: true });
      return;
    }
    const { updateDoc, doc } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await updateDoc(doc(db, 'reviews', id), rest);
  } catch (error) {
    console.error(`Failed to update review ${id}:`, error);
    throw new Error('Could not update review.');
  }
}

export async function deleteReview(id: string): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('reviews').doc(id).delete();
      return;
    }
    const { deleteDoc, doc } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await deleteDoc(doc(db, 'reviews', id));
  } catch (error) {
    console.error(`Failed to delete review ${id}:`, error);
    throw new Error('Could not delete review.');
  }
}

export async function markReviewHelpful(id: string): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      const admin = await import('firebase-admin');
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('reviews').doc(id).update({ helpful: admin.firestore.FieldValue.increment(1) });
      return;
    }
    const { updateDoc, doc, increment } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await updateDoc(doc(db, 'reviews', id), { helpful: increment(1) });
  } catch (error) {
    console.error(`Failed to mark review ${id} as helpful:`, error);
    throw new Error('Could not update review.');
  }
}

export async function getUserReviewForProduct(userId: string, productId: string): Promise<Review | null> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('reviews').where('userId', '==', userId).where('productId', '==', productId).get();
      if (!snap || snap.empty) return null;
      return { id: snap.docs[0].id, ...serializeTimestamps(snap.docs[0].data() || {}) } as Review;
    }
    const firestore = await import('firebase/firestore');
    const { collection, getDocs, query, where } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const q = query(collection(db, 'reviews'), where('userId', '==', userId), where('productId', '==', productId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const data = serializeTimestamps(snap.docs[0].data() || {});
    return { id: snap.docs[0].id, ...data } as Review;
  } catch (error) {
    console.error(`Failed to get user review:`, error);
    return null;
  }
}
