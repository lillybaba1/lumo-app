
'use server';

import { cookies } from "next/headers";
import { authAdmin } from "@/lib/firebaseAdmin";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { DecodedIdToken } from "firebase-admin/auth";

export interface AuthenticatedUser extends DecodedIdToken {
    role?: 'admin' | 'customer';
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const sessionCookie = (cookies().get("session")?.value) || "";
  if (!sessionCookie) return null;
  
  try {
    const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie, true);
    
    // Get user role from Firestore
    const userDoc = await dbAdmin.collection('users').doc(decodedClaims.uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : 'customer';

    return { ...decodedClaims, role };

  } catch (error) {
    console.error("Session cookie verification failed:", error);
    return null;
  }
}
