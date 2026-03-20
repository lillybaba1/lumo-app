import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    if (authError || !user) {
      return fail('Not authenticated', 'login');
    }

    // User is authenticated with Supabase
    const userId = user.id;
    const email = user.email || '';

    // Use service role client to bypass RLS (the is_admin() RLS function is broken)
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // Also check user_profiles as fallback
    const { data: profileData } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    // Determine role - check both tables
    const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
    const role = userData?.role || profileData?.role || 'customer';

    if (!ADMIN_ROLES.includes(role)) {
      return fail('Admin role required', 'unauthorized');
    }

    return { userId, email, role };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    console.error('Auth error:', error);
    return fail('Authentication failed', 'login');
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

      // Use service role client to bypass RLS (the is_admin() RLS function is broken)
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const { data: profileData } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // Determine role - check both tables
      const ADMIN_ROLES = ['admin', 'APP_OWNER_ADMIN'];
      const role = userData?.role || profileData?.role || 'customer';

      if (!ADMIN_ROLES.includes(role)) {
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

      // Use service role client to bypass RLS (the is_admin() RLS function is broken)
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      // Diagnostic logging
      console.log('[Auth] getCurrentUser:', {
        userId,
        email,
        userDataRole: userData?.role,
        userError: userError?.message,
      });

      // Determine role - users table is the source of truth
      let role = userData?.role || 'customer';

      // Normalize 'user' to 'customer' for consistency
      if (role === 'user') {
        role = 'customer';
      }

      console.log('[Auth] Final role determined:', role);

      return { userId, email, role };
    }

    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
