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
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { Wishlist } from '@/lib/types';

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

export async function getWishlistByUser(userId: string): Promise<Wishlist | null> {
  try {
    const q = query(collection(db, 'wishlists'), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = serializeTimestamps(doc.data());
    return { id: doc.id, ...data } as Wishlist;
  } catch (error) {
    console.error(`Failed to fetch wishlist for user ${userId}:`, error);
    return null;
  }
}

export async function createWishlist(userId: string): Promise<Wishlist> {
  try {
    const ref = await addDoc(collection(db, 'wishlists'), {
      userId,
      productIds: [],
      createdAt: serverTimestamp(),
    });
    return {
      id: ref.id,
      userId,
      productIds: [],
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to create wishlist:', error);
    throw new Error('Could not create wishlist.');
  }
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  try {
    let wishlist = await getWishlistByUser(userId);

    if (!wishlist) {
      wishlist = await createWishlist(userId);
    }

    await updateDoc(doc(db, 'wishlists', wishlist.id), {
      productIds: arrayUnion(productId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Failed to add product ${productId} to wishlist:`, error);
    throw new Error('Could not add product to wishlist.');
  }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  try {
    const wishlist = await getWishlistByUser(userId);
    if (!wishlist) return;

    await updateDoc(doc(db, 'wishlists', wishlist.id), {
      productIds: arrayRemove(productId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Failed to remove product ${productId} from wishlist:`, error);
    throw new Error('Could not remove product from wishlist.');
  }
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const wishlist = await getWishlistByUser(userId);
    if (!wishlist) return false;
    return wishlist.productIds.includes(productId);
  } catch (error) {
    console.error(`Failed to check if product ${productId} is in wishlist:`, error);
    return false;
  }
}

export async function clearWishlist(userId: string): Promise<void> {
  try {
    const wishlist = await getWishlistByUser(userId);
    if (!wishlist) return;

    await updateDoc(doc(db, 'wishlists', wishlist.id), {
      productIds: [],
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Failed to clear wishlist for user ${userId}:`, error);
    throw new Error('Could not clear wishlist.');
  }
}
