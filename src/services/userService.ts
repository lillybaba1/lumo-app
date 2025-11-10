'use server';

import { doc as firestoreDoc, setDoc as firestoreSetDoc, getDoc as firestoreGetDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

// We'll dynamically pick adminDb() on the server or getClientDb() on the client inside functions.

/**
 * Create user document in Firestore after Firebase Auth signup
 * This is called after client-side createUserWithEmailAndPassword
 */
export async function createUserDocument(
  uid: string,
  email: string,
  name: string,
  phoneNumber?: string
): Promise<{ success: boolean; role?: string; message?: string }> {
  try {
    // Always create users with safe default role 'customer'.
    // Manual promotion to 'admin' must be done via a protected server-side API.
    const role = 'customer';
    const userData = {
      uid,
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
      emailVerified: false, // Will be updated when user verifies email
      ...(phoneNumber && { phoneNumber })
    };

    // Create user document in Firestore (prefer Admin SDK on server)
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const adminDb = dbAdmin();
      await adminDb.collection('users').doc(uid).set(userData);
    } else {
      const { getClientDb } = await import('@/lib/firebaseClient');
      const db = getClientDb();
      await firestoreSetDoc(firestoreDoc(db, 'users', uid), userData);
    }

    return { success: true, role };
  } catch (error: any) {
    console.error('Failed to create user document:', error);
    return { success: false, message: error.message || 'Failed to create user profile.' };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(uid: string): Promise<User | null> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const adminDb = dbAdmin();
      const snap = await adminDb.collection('users').doc(uid).get();
      if (!snap.exists) return null;
      return snap.data() as User;
    }
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const userDoc = await firestoreGetDoc(firestoreDoc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    return userDoc.data() as User;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}
