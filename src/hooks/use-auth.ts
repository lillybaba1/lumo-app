
'use server';

import { cookies } from "next/headers";
import { authAdmin, dbAdmin } from "@/lib/firebaseAdmin";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface AuthenticatedUser extends DecodedIdToken {
    role?: 'admin' | 'customer';
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const jar = await cookies(); // Next 15 requires await
  const session = jar.get(process.env.FIREBASE_COOKIE_NAME || 'session')?.value || '';
  if (!session) return null;
  
  try {
    const decodedClaims = await authAdmin.verifySessionCookie(session, true);
    
    // Get user role from Firestore
    const userDoc = await dbAdmin.collection('users').doc(decodedClaims.uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : 'customer';

    return { ...decodedClaims, role };

  } catch (error) {
    // Session cookie is invalid or expired.
    return null;
  }
}
