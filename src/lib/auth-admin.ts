import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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

  const fail = (message: string, redirectTo: 'login' | 'unauthorized' = 'login'): never => {
    if (redirectOnFail) {
      redirect(redirectTo === 'login' ? loginRedirectPath : unauthorizedRedirectPath);
    }
    throw new UnauthorizedError(message);
  };

  try {
    // Use Supabase authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!authError && user) {
      // User is authenticated with Supabase
      const userId = user.id;
      const email = user.email || '';

      // Check user role from user_profiles table AND users table
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      // If either says admin, return admin
      let role = 'customer';
      if (profile?.role === 'admin' || userData?.role === 'admin') {
        role = 'admin';
      } else {
        role = profile?.role || userData?.role || 'user';
      }

      if (role !== 'admin') {
        fail('Admin role required', 'unauthorized');
      }

      return { userId, email, role };
    }

    // Not authenticated
    fail('Not authenticated', 'login');
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
  try {
    // Use Supabase authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!authError && user) {
      const userId = user.id;
      const email = user.email || '';

      // Check user role from user_profiles table AND users table
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      // If either says admin, return admin
      let role = 'customer';
      if (profile?.role === 'admin' || userData?.role === 'admin') {
        role = 'admin';
      } else {
        role = profile?.role || userData?.role || 'user';
      }

      if (role !== 'admin') {
        return null;
      }

      return { userId, email, role };
    }

    return null;
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
  try {
    // Use Supabase authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!authError && user) {
      const userId = user.id;
      const email = user.email || '';

      // Check user role from user_profiles table AND users table
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      // If either says admin, return admin
      let role = 'customer';
      if (profile?.role === 'admin' || userData?.role === 'admin') {
        role = 'admin';
      } else {
        role = profile?.role || userData?.role || 'user';
      }

      return { userId, email, role };
    }

    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
