
'use server';

import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  deleteUser as deleteFirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';


export async function createUser(email: string, password: string, name: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Now, create a document in the 'users' collection
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name: name,
      createdAt: new Date().toISOString(),
    });

    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
}


export async function getUsers(): Promise<User[]> {
  try {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    if (userSnapshot.empty) {
      return [];
    }
    return userSnapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}

export async function deleteUser(uid: string) {
  try {
    // This is tricky because deleting a Firebase Auth user is a privileged operation
    // and cannot be safely called from the client-side without admin privileges.
    // For this prototype, we'll just delete the user's document from Firestore.
    // A real implementation would require a backend function (e.g., Cloud Function)
    // with admin SDK to properly delete the auth user.
    
    await deleteDoc(doc(db, "users", uid));

    revalidatePath('/admin/customers');
    
    return { success: true, message: "User document deleted. Auth user not deleted." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
