'use server';

import { Coupon } from '@/lib/types';

function serializeTimestamps(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value.toDate === 'function') {
      try {
        out[key] = value.toDate().toISOString();
        continue;
      } catch (e) {
        // fallthrough
      }
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = serializeTimestamps(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function getCoupons(): Promise<Coupon[]> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('coupons').get();
      if (!snap || snap.empty) return [];
      return snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data() || {}) } as Coupon));
    }

    const firestore = await import('firebase/firestore');
    const { collection, getDocs } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const snap = await getDocs(collection(db, 'coupons'));
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data() || {});
      return { id: d.id, ...data } as Coupon;
    });
  } catch (error) {
    console.error('Failed to fetch coupons from Firestore:', error);
    return [];
  }
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const snap = await dbAdmin().collection('coupons').where('code', '==', code.toUpperCase()).get();
      if (!snap || snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...serializeTimestamps(d.data() || {}) } as Coupon;
    }

    const firestore = await import('firebase/firestore');
    const { collection, getDocs, query, where } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = serializeTimestamps(doc.data() || {});
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
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const ref = await dbAdmin().collection('coupons').add({
        ...coupon,
        code: coupon.code.toUpperCase(),
        usedCount: 0,
        createdAt: new Date(),
      });
      return { id: ref.id, ...coupon, usedCount: 0, createdAt: new Date().toISOString() } as Coupon;
    }

    const firestore = await import('firebase/firestore');
    const { addDoc, collection, serverTimestamp } = firestore;
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
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
    } as Coupon;
  } catch (error) {
    console.error('Failed to create coupon:', error);
    throw new Error('Could not create coupon.');
  }
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
  try {
    const { id: _id, createdAt, usedCount, ...rest } = updates as any;
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('coupons').doc(id).set(rest, { merge: true });
      return;
    }

    const { updateDoc, doc } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await updateDoc(doc(db, 'coupons', id), rest);
  } catch (error) {
    console.error(`Failed to update coupon ${id}:`, error);
    throw new Error('Could not update coupon.');
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('coupons').doc(id).delete();
      return;
    }

    const { deleteDoc, doc } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
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

    if (typeof window === 'undefined') {
      const admin = await import('firebase-admin');
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('coupons').doc(coupon.id).update({
        usedCount: admin.firestore.FieldValue.increment(1),
      });
      return;
    }

    const { updateDoc, doc, increment } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await updateDoc(doc(db, 'coupons', coupon.id), {
      usedCount: increment(1),
    });
  } catch (error) {
    console.error(`Failed to increment coupon usage for ${code}:`, error);
  }
}
