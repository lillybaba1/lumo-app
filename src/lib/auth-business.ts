import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { User, BusinessAccount } from '@/lib/types';
import { getBusinessAccountByOwner } from '@/services/businessAccountService';

export class UnauthorizedError extends Error {
  statusCode: number;

  constructor(message = 'Business authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export type RequireBusinessOptions = {
  redirect?: boolean;
  loginRedirect?: string;
  unauthorizedRedirect?: string;
};

/**
 * Server-side authentication helper for business routes
 * Checks if user is authenticated and has BUSINESS_ACCOUNT role
 * Returns both user and business account data
 */
export async function requireBusiness(
  options: RequireBusinessOptions = {}
): Promise<{ user: User; businessAccount: BusinessAccount }> {
  const redirectOnFail = options.redirect !== false;
  const loginRedirectPath = options.loginRedirect ?? '/login?redirect=/business/dashboard';
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
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (!authUser || authError) {
      return fail('Not authenticated', 'login');
    }

    const userId = authUser.id;
    const email = authUser.email || '';

    // Get user record with role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return fail('User not found', 'login');
    }

    // Check if user has BUSINESS_ACCOUNT role
    if (userData.role !== 'BUSINESS_ACCOUNT') {
      return fail('Business account required', 'unauthorized');
    }

    // Get business account
    const businessAccount = await getBusinessAccountByOwner(userId);

    if (!businessAccount) {
      return fail('Business account not found. Please complete your business registration.', 'unauthorized');
    }

    // Check if business account is active
    if (businessAccount.status === 'SUSPENDED') {
      return fail('Your business account has been suspended. Please contact support.', 'unauthorized');
    }

    const user: User = {
      uid: userData.id,
      email: userData.email,
      name: userData.name,
      phoneNumber: userData.phone_number || '',
      emailVerified: userData.email_verified,
      createdAt: userData.created_at,
      role: userData.role,
      businessAccountId: businessAccount.id
    };

    return { user, businessAccount };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    console.error('Business auth error:', error);
    return fail('Authentication failed', 'login');
  }
}

/**
 * Check if user has business access without redirecting
 * Returns null if not authenticated or not a business account
 */
export async function checkBusinessAccess(): Promise<{
  user: User;
  businessAccount: BusinessAccount;
} | null> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (!authUser || authError) {
      return null;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!userData || userData.role !== 'BUSINESS_ACCOUNT') {
      return null;
    }

    const businessAccount = await getBusinessAccountByOwner(authUser.id);

    if (!businessAccount || businessAccount.status === 'SUSPENDED') {
      return null;
    }

    const user: User = {
      uid: userData.id,
      email: userData.email,
      name: userData.name,
      phoneNumber: userData.phone_number || '',
      emailVerified: userData.email_verified,
      createdAt: userData.created_at,
      role: userData.role,
      businessAccountId: businessAccount.id
    };

    return { user, businessAccount };
  } catch (error) {
    console.error('Business auth check error:', error);
    return null;
  }
}
