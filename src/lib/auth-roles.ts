import { User, UserRole } from '@/lib/types';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/hooks/use-auth';

/**
 * Check if user has APP_OWNER_ADMIN role
 */
export function isAppOwnerAdmin(user: User | null): boolean {
  if (!user) return false;
  // Support legacy 'admin' role
  return user.role === 'APP_OWNER_ADMIN' || (user.role as any) === 'admin';
}

/**
 * Check if user has BUSINESS_ACCOUNT role
 */
export function isBusinessAccount(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'BUSINESS_ACCOUNT';
}

/**
 * Check if user has PERSONAL_ACCOUNT role
 */
export function isPersonalAccount(user: User | null): boolean {
  if (!user) return false;
  // Support legacy 'customer' role
  return user.role === 'PERSONAL_ACCOUNT' || (user.role as any) === 'customer';
}

/**
 * Require user to be APP_OWNER_ADMIN, redirect otherwise
 */
export async function requireAppOwnerAdmin(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?error=authentication_required');
  }

  if (!isAppOwnerAdmin(user)) {
    redirect('/');
  }

  return user;
}

/**
 * Require user to be BUSINESS_ACCOUNT, redirect otherwise
 */
export async function requireBusinessAccount(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?error=authentication_required');
  }

  if (!isBusinessAccount(user)) {
    redirect('/');
  }

  return user;
}

/**
 * Require user to be authenticated (any role)
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?error=authentication_required');
  }

  return user;
}

/**
 * Get user's business account ID
 */
export function getBusinessAccountId(user: User | null): string | null {
  if (!user || !isBusinessAccount(user)) {
    return null;
  }
  return user.businessAccountId || null;
}

/**
 * Check if user can access seller's data (either app owner or the seller themselves)
 */
export function canAccessSellerData(user: User | null, sellerId: string): boolean {
  if (!user) return false;

  // App owner admin can access all seller data
  if (isAppOwnerAdmin(user)) return true;

  // Business account can only access their own data
  if (isBusinessAccount(user)) {
    return user.businessAccountId === sellerId;
  }

  return false;
}

/**
 * Migrate legacy role to new role system
 */
export function migrateUserRole(role: string): UserRole {
  if (role === 'admin') return 'APP_OWNER_ADMIN';
  if (role === 'customer') return 'PERSONAL_ACCOUNT';
  return role as UserRole;
}
