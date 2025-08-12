
'use server';

import { auth, db } from '@/lib/firebaseClient';
import { dbAdmin, authAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';


export async function createUser(email: string, password: string, name: string) {
  if (!isFirebaseAdminInitialized || !dbAdmin) {
    throw new Error("User creation is not available. Please configure Firebase Admin SDK.");
  }

  // Check if this is the first user
  const usersSnapshot = await dbAdmin.collection('users').limit(1).get();
  const role = usersSnapshot.empty ? 'admin' : 'customer';

  // Use the client SDK to create the user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Use the Admin SDK to create the user document in Firestore
  // This should be done on the server to ensure data integrity
  await dbAdmin.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    name: name,
    createdAt: new Date().toISOString(),
    role: role,
  });

  return { uid: user.uid, email: user.email };
}

// Sign-in is a client-side operation
export async function signInUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}


export async function getUsers(): Promise<User[]> {
  if (!isFirebaseAdminInitialized || !authAdmin || !dbAdmin) {
    console.warn("Cannot get users, Firebase Admin not initialized.");
    return [];
  }
  try {
    const userRecords = await authAdmin.listUsers();
    const users: User[] = await Promise.all(userRecords.users.map(async (userRecord) => {
      const firestoreUserDoc = await dbAdmin.collection('users').doc(userRecord.uid).get();
      const firestoreUserData = firestoreUserDoc.data();
      return {
        uid: userRecord.uid,
        email: userRecord.email || '',
        name: firestoreUserData?.name || userRecord.displayName || 'N/A',
        createdAt: userRecord.metadata.creationTime,
        role: firestoreUserData?.role || 'customer',
      };
    }));
    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}

export async function deleteUser(uid: string) {
   if (!isFirebaseAdminInitialized || !authAdmin || !dbAdmin) {
    const message = "User deletion is not available. Please configure Firebase Admin SDK.";
    console.error(message);
    return { success: false, message };
  }
  try {
    // Use the Admin SDK to delete the auth user and their Firestore document
    await authAdmin.deleteUser(uid);
    await dbAdmin.collection('users').doc(uid).delete();

    revalidatePath('/admin/customers');
    
    return { success: true, message: "User deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, message: error.message };
  }
}

export async function getUserRole(userId: string): Promise<string | null> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        // This will be the case in client-side components.
        // We will need a client-callable wrapper.
        return null;
    }
    try {
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data()?.role || null;
        }
        return null;
    } catch (error) {
        console.error("Error getting user role:", error);
        return null;
    }
}

// Client-callable function to get role
export async function getUserRoleClient(userId: string): Promise<string | null> {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return userDoc.data()?.role || 'customer';
        }
        return 'customer';
    } catch (error) {
        console.error("Error fetching user role on client:", error);
        return 'customer';
    }
}
