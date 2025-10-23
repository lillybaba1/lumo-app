'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserRoleClient } from '@/services/authService';

/**
 * Server-side authentication helper for admin routes
 * Checks if user is authenticated and has admin role
 */
export async function requireAdmin(): Promise<{ userId: string; email: string; role: string }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie || !sessionCookie.value) {
    redirect('/admin/login?redirect=/admin/dashboard');
  }

  try {
    // Parse the session data (stored as JSON)
    const session = JSON.parse(sessionCookie.value);
    const { userId, email } = session;

    if (!userId) {
      redirect('/admin/login?redirect=/admin/dashboard');
    }

    // Check user role from database
    const role = await getUserRoleClient(userId);

    if (role !== 'admin') {
      redirect('/?error=unauthorized');
    }

    return { userId, email, role };
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/admin/login?redirect=/admin/dashboard');
  }
}

/**
 * Check if user is admin without redirecting
 * Returns null if not authenticated or not admin
 */
export async function checkAdminAccess(): Promise<{ userId: string; email: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    const { userId, email } = session;

    if (!userId) {
      return null;
    }

    const role = await getUserRoleClient(userId);

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
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    const { userId, email } = session;

    if (!userId) {
      return null;
    }

    const role = await getUserRoleClient(userId);

    return { userId, email, role: role || 'customer' };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
