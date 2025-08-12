
'use server';

import { auth, db } from '@/lib/firebaseClient';
import { dbAdmin, authAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';


export async function createUser(email: string, password: string, name: string) {
  if (!isFirebaseAdminInitialized || !dbAdmin) {
    throw new Error("User creation is not available. Please configure Firebase Admin SDK.");
  }
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
