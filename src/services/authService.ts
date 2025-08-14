
'use server';

import { auth, db } from '@/lib/firebaseClient';
import { dbAdmin, authAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';


export async function createUser(email: string, password: string, name: string): Promise<{ success: boolean; message?: string; data?: { uid: string; email: string | undefined; } }> {
  if (!isFirebaseAdminInitialized || !dbAdmin || !authAdmin) {
    return { success: false, message: "User creation is not available. Please configure Firebase Admin SDK." };
  }
  
  try {
    const usersSnapshot = await dbAdmin.collection('users').limit(1).get();
    const role = usersSnapshot.empty ? 'admin' : 'customer';

    const userRecord = await authAdmin.createUser({
      email,
      password,
      displayName: name,
    });

    await dbAdmin.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      name: name,
      createdAt: new Date().toISOString(),
      role: role,
    });

    return { success: true, data: { uid: userRecord.uid, email: userRecord.email } };
  } catch (error: any) {
    if (error.code === 'auth/weak-password') {
      return { success: false, message: 'Password is too weak. Please use at least 6 characters.' };
    }
    if (error.code === 'auth/email-already-exists') {
      return { success: false, message: 'An account with this email already exists.' };
    }
    return { success: false, message: error.message || 'An unknown error occurred during signup.' };
  }
}


export async function loginUser(idToken: string): Promise<{ success: boolean; message?: string }> {
  if (!isFirebaseAdminInitialized || !authAdmin) {
    const message = "Authentication is not available. Please configure Firebase Admin SDK.";
    return { success: false, message };
  }

  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const decodedIdToken = await authAdmin.verifyIdToken(idToken, true);

    if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
      const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });
      cookies().set("session", sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: expiresIn / 1000,
      });
      revalidatePath('/', 'layout');
      return { success: true };
    } else {
      return { success: false, message: "Recent sign-in required." };
    }
  } catch (error: any) {
    console.error("Login user error:", error);
    return { success: false, message: "Failed to create session." };
  }
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
