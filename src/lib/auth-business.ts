import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { User, BusinessAccount } from '@/lib/types';
import { getBusinessAccountByOwner, createBusinessAccount } from '@/services/businessAccountService';

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

    // Check if user has BUSINESS_ACCOUNT role OR is an admin (APP_OWNER_ADMIN can access seller dashboard)
    const isAdmin = userData.role === 'APP_OWNER_ADMIN' || userData.role === 'admin';
    const isBusiness = userData.role === 'BUSINESS_ACCOUNT';
    
    // Get business account first - this is the source of truth for business users
    let businessAccount = await getBusinessAccountByOwner(userId);
    
    // If user has a business account, they're a business user regardless of role in users table
    const hasBusinessAccount = !!businessAccount;
    
    if (!isBusiness && !isAdmin && !hasBusinessAccount) {
      return fail('Business account required', 'unauthorized');
    }

    if (!businessAccount) {
      // For admins without a business account, auto-create "JulaZone Official" account
      if (isAdmin) {
        console.log('Auto-creating JulaZone Official business account for admin:', userId);
        businessAccount = await createBusinessAccount(userId, {
          businessName: 'JulaZone Official',
          contactPersonName: userData.name || 'Platform Admin',
          contactEmail: email,
          businessAddress: 'Platform Headquarters',
          status: 'ACTIVE',
          subscriptionTier: 'enterprise',
          subscriptionStatus: 'active',
          verificationStatus: 'verified',
          sellerType: 'company',
        });
        
        if (!businessAccount) {
          return fail('Failed to create admin business account. Please try again.', 'unauthorized');
        }
      } else {
        return fail('Business account not found. Please complete your business registration.', 'unauthorized');
      }
    }

    // Check if business account is active
    if (businessAccount.status === 'SUSPENDED') {
      return fail('Your business account has been suspended. Please contact support.', 'unauthorized');
    }

    // Multi-phase approval state machine
    // State A: Account not approved yet (email verified but waiting for admin)
    if (!businessAccount.accountApproved && businessAccount.status !== 'ACTIVE') {
      if (redirectOnFail) {
        redirect('/business/pending');
      }
      throw new UnauthorizedError('Your business account is pending approval. Please wait for admin review.');
    }

    // State B: Account approved, but boutique not set up yet
    if (businessAccount.accountApproved && !businessAccount.boutiqueSubmitted && businessAccount.status !== 'ACTIVE') {
      // Allow dashboard access (Step B requirement)
      // We only redirect if they try to access other protected routes that might require a boutique
      // For now, we'll let the page component handle the "No Boutique" state if needed
      
      // If we are strictly enforcing setup-boutique for other pages, we might need to check the path here
      // But requireBusiness is usually called inside the page.
      // We will allow it to proceed.
    }

    // State C: Boutique submitted but not approved yet
    if (businessAccount.accountApproved && businessAccount.boutiqueSubmitted && !businessAccount.boutiqueApproved && businessAccount.status !== 'ACTIVE') {
      if (redirectOnFail) {
        redirect('/business/pending-boutique-review');
      }
      throw new UnauthorizedError('Your boutique is pending approval.');
    }

    // State D: Fully approved OR legacy ACTIVE status - allow access
    // (businessAccount.boutiqueApproved === true OR businessAccount.status === 'ACTIVE')

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
