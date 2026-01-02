'use server';

import { User, UserRole } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger, getErrorMessage } from '@/lib/logger';

const userLogger = logger.child('UserService');

/**
 * Create user document in Supabase after Auth signup
 * Note: This is usually handled by the signup form, but kept for compatibility
 */
export async function createUserDocument(
  uid: string,
  email: string,
  name: string,
  phoneNumber?: string
): Promise<{ success: boolean; role?: string; message?: string }> {
  try {
    // Always create users with safe default role 'customer'.
    // Manual promotion to 'admin' must be done via a protected server-side API.
    const role = 'customer';

    const { error } = await supabaseAdmin
      .from('users')
      .insert({
        id: uid,
        email,
        name,
        phone_number: phoneNumber || null,
        phone_verified: !!phoneNumber,
        role,
      });

    if (error) {
      // If user already exists, that's okay
      if (error.code === '23505') { // PostgreSQL unique violation
        return { success: true, role };
      }
      userLogger.error('Failed to create user document', error);
      return { success: false, message: error.message || 'Failed to create user profile.' };
    }

    return { success: true, role };
  } catch (error) {
    userLogger.error('Failed to create user document', error);
    return { success: false, message: getErrorMessage(error) };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(uid: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error || !data) {
      return null;
    }

    // Map Supabase data to User type
    let role: UserRole = 'PERSONAL_ACCOUNT';
    if (data.role === 'admin' || data.role === 'APP_OWNER_ADMIN') role = 'APP_OWNER_ADMIN';
    else if (data.role === 'BUSINESS_ACCOUNT') role = 'BUSINESS_ACCOUNT';
    else if (data.role === 'customer' || data.role === 'PERSONAL_ACCOUNT') role = 'PERSONAL_ACCOUNT';
    
    return {
      uid: data.id,
      email: data.email,
      name: data.name,
      phoneNumber: data.phone_number || '',
      emailVerified: data.email_verified,
      createdAt: data.created_at,
      role: role,
    };
  } catch (error) {
    userLogger.error('Failed to get user', error as Error);
    return null;
  }
}
