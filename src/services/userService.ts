'use server';

import type { User } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
      console.error('Failed to create user document:', error);
      return { success: false, message: error.message || 'Failed to create user profile.' };
    }

    return { success: true, role };
  } catch (error: any) {
    console.error('Failed to create user document:', error);
    return { success: false, message: error.message || 'Failed to create user profile.' };
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
    return {
      uid: data.id,
      email: data.email,
      name: data.name,
      phoneNumber: data.phone_number || '',
      phoneVerified: data.phone_verified || false,
      createdAt: data.created_at,
      role: data.role as 'admin' | 'customer',
    };
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}
