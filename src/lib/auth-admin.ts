import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/services/authService';
import { authAdmin, isFirebaseAdminInitialized, dbAdmin } from './firebaseAdmin';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'session';

export class UnauthorizedError extends Error {
  statusCode: number;

  constructor(message = 'Admin authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export type RequireAdminOptions = {
  redirect?: boolean;
  loginRedirect?: string;
  unauthorizedRedirect?: string;
};

/**
 * Server-side authentication helper for admin routes
 * Checks if user is authenticated and has admin role
 */
export async function requireAdmin(
  options: RequireAdminOptions = {}
): Promise<{ userId: string; email: string; role: string }> {
  const redirectOnFail = options.redirect !== false;
  const loginRedirectPath = options.loginRedirect ?? '/admin/login?redirect=/admin/dashboard';
  const unauthorizedRedirectPath = options.unauthorizedRedirect ?? '/?error=unauthorized';

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  const fail = (message: string, redirectTo: 'login' | 'unauthorized' = 'login'): never => {
    if (redirectOnFail) {
      redirect(redirectTo === 'login' ? loginRedirectPath : unauthorizedRedirectPath);
    }
    throw new UnauthorizedError(message);
  };

  if (!sessionCookie || !sessionCookie.value) {
    fail('Not authenticated', 'login');
  }

  try {
    // If Firebase Admin is available, verify session cookie
    if (isFirebaseAdminInitialized()) {
      try {
        const decodedClaims = await authAdmin().verifySessionCookie(sessionCookie.value, true);
        const userId = decodedClaims.uid;
        const email = decodedClaims.email || '';

        // Check user role from database using Admin SDK
        const userDoc = await dbAdmin().collection('users').doc(userId).get();
        const role = userDoc.exists && userDoc.data()?.role ? userDoc.data()!.role : 'customer';

        if (role !== 'admin') {
          fail('Admin role required', 'unauthorized');
        }

        return { userId, email, role };
      } catch (verifyError) {
        console.error('Session verification failed:', verifyError);
        fail('Session verification failed', 'login');
      }
    }

    // Fallback: Parse as JSON (for local development without Firebase Admin)
    const session = JSON.parse(sessionCookie.value);
    const { userId, email } = session;

    if (!userId) {
      fail('Session missing user id', 'login');
    }

    // Check user role from database
    const role = (await getUserRole(userId)) || 'customer';

    if (role !== 'admin') {
      fail('Admin role required', 'unauthorized');
    }

    return { userId, email, role };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    console.error('Auth error:', error);
    fail('Authentication failed', 'login');
  }
}

/**
 * Check if user is admin without redirecting
 * Returns null if not authenticated or not admin
 */
export async function checkAdminAccess(): Promise<{ userId: string; email: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    // If Firebase Admin is available, verify session cookie
    if (isFirebaseAdminInitialized()) {
      try {
        const decodedClaims = await authAdmin().verifySessionCookie(sessionCookie.value, true);
        const userId = decodedClaims.uid;
        const email = decodedClaims.email || '';

        // Get role from database using Admin SDK
        const userDoc = await dbAdmin().collection('users').doc(userId).get();
        const role = userDoc.exists && userDoc.data()?.role ? userDoc.data()!.role : 'customer';

        if (role !== 'admin') {
          return null;
        }

        return { userId, email, role };
      } catch {
        return null;
      }
    }

    // Fallback: Parse as JSON
    const session = JSON.parse(sessionCookie.value);
    const { userId, email } = session;

    if (!userId) {
      return null;
    }

    const role = await getUserRole(userId) || 'customer';

    if (role !== 'admin') {
      return null;
    }

    return { userId, email, role };
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

/**
 * Get current authenticated user (admin or customer)
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<{ userId: string; email: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    // If Firebase Admin is available, verify session cookie
    if (isFirebaseAdminInitialized()) {
      try {
        const decodedClaims = await authAdmin().verifySessionCookie(sessionCookie.value, true);
        const userId = decodedClaims.uid;
        const email = decodedClaims.email || '';

        // Get role from database using Admin SDK
        const userDoc = await dbAdmin().collection('users').doc(userId).get();
        const role = userDoc.exists && userDoc.data()?.role ? userDoc.data()!.role : 'customer';

        return { userId, email, role };
      } catch {
        return null;
      }
    }

    // Fallback: Parse as JSON
    const session = JSON.parse(sessionCookie.value);
    const { userId, email } = session;

    if (!userId) {
      return null;
    }

    const role = await getUserRole(userId) || 'customer';

    return { userId, email, role };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
