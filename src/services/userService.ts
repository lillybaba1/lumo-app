// Client-side user service - runs in the browser
import { getClientDb } from '@/lib/firebaseClient';
import { collection, doc, setDoc, getDocs, getDoc, query, limit } from 'firebase/firestore';
import type { User } from '@/lib/types';

/**
 * Create user document in Firestore after Firebase Auth signup
 * This is called after client-side createUserWithEmailAndPassword
 * RUNS ON CLIENT SIDE ONLY
 */
export async function createUserDocument(
  uid: string,
  email: string,
  name: string
): Promise<{ success: boolean; message?: string; role?: string }> {
  try {
    const db = getClientDb();

    // Check if this is the first user (should be admin)
    const usersSnapshot = await getDocs(query(collection(db, 'users'), limit(1)));
    const role = usersSnapshot.empty ? 'admin' : 'customer';

    console.log('Creating user document:', { uid, email, name, role, isFirstUser: usersSnapshot.empty });

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
 * RUNS ON CLIENT SIDE ONLY
 */
export async function getUserById(uid: string): Promise<User | null> {
  try {
    const db = getClientDb();
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;

    return userDoc.data() as User;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}
