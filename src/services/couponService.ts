'use server';

import { db } from '@/lib/firebaseClient';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { Coupon } from '@/lib/types';

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

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const snap = await getDocs(collection(db, 'coupons'));
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data());
      return { id: d.id, ...data } as Coupon;
    });
  } catch (error) {
    console.error('Failed to fetch coupons from Firestore:', error);
    return [];
  }
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = serializeTimestamps(doc.data());
    return { id: doc.id, ...data } as Coupon;
  } catch (error) {
    console.error(`Failed to fetch coupon ${code}:`, error);
    return null;
  }
}

export async function validateCoupon(code: string, orderAmount: number): Promise<Coupon | null> {
  try {
    const coupon = await getCouponByCode(code);

    if (!coupon) return null;
    if (!coupon.isActive) return null;

    // Check expiry
    if (coupon.expiresAt) {
      const expiryDate = new Date(coupon.expiresAt);
      if (expiryDate < new Date()) return null;
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return null;
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return null;
    }

    return coupon;
  } catch (error) {
    console.error(`Failed to validate coupon ${code}:`, error);
    return null;
  }
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'createdAt' | 'usedCount'>): Promise<Coupon> {
  try {
    const ref = await addDoc(collection(db, 'coupons'), {
      ...coupon,
      code: coupon.code.toUpperCase(),
      usedCount: 0,
      createdAt: serverTimestamp(),
    });
    return {
      id: ref.id,
      ...coupon,
      usedCount: 0,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to create coupon:', error);
    throw new Error('Could not create coupon.');
  }
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
  try {
    const { id: _id, createdAt, usedCount, ...rest } = updates as any;
    await updateDoc(doc(db, 'coupons', id), rest);
  } catch (error) {
    console.error(`Failed to update coupon ${id}:`, error);
    throw new Error('Could not update coupon.');
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'coupons', id));
  } catch (error) {
    console.error(`Failed to delete coupon ${id}:`, error);
    throw new Error('Could not delete coupon.');
  }
}

export async function incrementCouponUsage(code: string): Promise<void> {
  try {
    const coupon = await getCouponByCode(code);
    if (!coupon) return;

    await updateDoc(doc(db, 'coupons', coupon.id), {
      usedCount: increment(1),
    });
  } catch (error) {
    console.error(`Failed to increment coupon usage for ${code}:`, error);
  }
}
