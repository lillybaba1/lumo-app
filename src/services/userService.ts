'use server';

import { db } from '@/lib/firebaseClient';
import { collection, doc, setDoc, getDocs, getDoc, query, limit } from 'firebase/firestore';
import type { User } from '@/lib/types';

/**
 * Create user document in Firestore after Firebase Auth signup
 * This is called after client-side createUserWithEmailAndPassword
 */
export async function createUserDocument(
  uid: string,
  email: string,
  name: string
): Promise<{ success: boolean; role?: string; message?: string }> {
  try {
    // Always create users with safe default role 'customer'.
    // Manual promotion to 'admin' must be done via a protected server-side API.
    const role = 'customer';

    // Create user document in Firestore
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
    });

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
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;

    return userDoc.data() as User;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}
