"use server";

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import type { User, UserRole } from '@/lib/types';
import { logger } from '@/lib/logger';

const authLogger = logger.child('AuthService');

// Interface for database user row
interface DbUserRow {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  role: string | null;
  phone: string | null;
  phone_number?: string | null;
}

// Map database role string to UserRole type
function mapToUserRole(dbRole: string | null): UserRole {
  if (dbRole === 'admin' || dbRole === 'APP_OWNER_ADMIN') return 'APP_OWNER_ADMIN';
  if (dbRole === 'BUSINESS_ACCOUNT') return 'BUSINESS_ACCOUNT';
  return 'PERSONAL_ACCOUNT';
}

export async function createUser(email: string, password: string, name: string): Promise<{ success: boolean; message?: string; data?: { uid: string; email: string | undefined; } }> {
  try {
    const supabase = await createClient();
    
    // SECURITY: Use platform_settings to check if first admin already set
    // This prevents race conditions where multiple users could become admin
    const { data: adminSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'first_admin_set')
      .single();
    
    let role = 'customer';
    
    if (!adminSetting?.value) {
      // Check if any admin users exist
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      
      if (count === 0) {
        role = 'admin';
        // Set flag to prevent race condition
        await supabaseAdmin
          .from('platform_settings')
          .upsert({
            key: 'first_admin_set',
            value: true,
            category: 'security',
            description: 'Flag indicating first admin has been created',
          }, { onConflict: 'key' });
      }
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (authError) {
      if (authError.message.includes('weak')) {
        return { success: false, message: 'Password is too weak. Please use at least 6 characters.' };
      }
      if (authError.message.includes('already registered')) {
        return { success: false, message: 'An account with this email already exists.' };
      }
      return { success: false, message: authError.message };
    }

    if (!authData.user) {
      return { success: false, message: 'Failed to create user account.' };
    }

    // Create user profile (should be handled by trigger, but we can do it explicitly)
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: role,
      });

    if (profileError && !profileError.message.includes('duplicate')) {
      authLogger.error('Error creating user profile', profileError);
      // Don't fail the signup if profile creation fails (might be handled by trigger)
    }

    return { 
      success: true, 
      data: { 
        uid: authData.user.id, 
        email: authData.user.email 
      } 
    };
  } catch (error) {
    authLogger.error('Error in createUser', error as Error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during signup.';
    return { success: false, message };
  }
}


export async function getUsers(): Promise<User[]> {
  try {
    const supabase = await createClient();

    // Fetch from user_profiles table (new Supabase system)
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!profileError && profiles && profiles.length > 0) {
      return profiles.map((profile: DbUserRow) => ({
        uid: profile.id,
        email: profile.email || '',
        name: profile.name || 'N/A',
        createdAt: profile.created_at,
        role: mapToUserRole(profile.role),
        phoneNumber: profile.phone || '',
      }));
    }

    // Fallback to users table (old Firebase system)
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      authLogger.error('Failed to fetch users', error);
      return [];
    }

    return users.map((user: DbUserRow) => ({
      uid: user.id,
      email: user.email || '',
      name: user.name || 'N/A',
      createdAt: user.created_at,
      role: mapToUserRole(user.role),
      phoneNumber: user.phone || user.phone_number || '',
    }));
  } catch (error) {
    authLogger.error('Failed to fetch users', error as Error);
    return [];
  }
}


export async function deleteUser(uid: string) {
  try {
    // Use admin client for deleting users (requires service role key)
    
    // First check if user has a business account and delete it
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('id')
      .eq('owner_user_id', uid)
      .single();

    if (businessAccount) {
      // Delete business account first
      await supabaseAdmin
        .from('business_accounts')
        .delete()
        .eq('id', businessAccount.id);
    }

    // Delete from user_profiles table
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', uid);

    // Delete from users table
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', uid);

    // Delete from auth.users (this is the main auth record)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(uid);
    
    if (authError) {
      authLogger.error('Error deleting user from auth', authError);
      return { success: false, message: authError.message };
    }

    revalidatePath('/admin/customers');
    revalidatePath('/admin/sellers');
    
    return { success: true, message: "User deleted successfully." };
  } catch (error) {
    authLogger.error('Error deleting user', error as Error);
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    return { success: false, message };
  }
}


export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();

    // Check both tables to ensure we catch admin status from either
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // If either says admin, return admin
    if (profile?.role === 'admin' || user?.role === 'admin') {
      return 'admin';
    }

    return profile?.role || user?.role || 'customer';
  } catch (error) {
    authLogger.error('Error getting user role', error as Error);
    return null;
  }
}

// Client-callable function to get role
export async function getUserRoleClient(userId: string): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    // Check both tables
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // If either says admin, return admin
    if (profile?.role === 'admin' || user?.role === 'admin') {
      return 'admin';
    }

    return profile?.role || user?.role || 'customer';
  } catch (error) {
    authLogger.error('Error fetching user role on client', error as Error);
    return 'customer';
  }
}
