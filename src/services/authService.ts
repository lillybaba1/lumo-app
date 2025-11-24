"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';


export async function createUser(email: string, password: string, name: string): Promise<{ success: boolean; message?: string; data?: { uid: string; email: string | undefined; } }> {
  try {
    const supabase = await createClient();
    
    // Check if this is the first user
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const role = count === 0 ? 'admin' : 'customer';

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
      console.error('Error creating user profile:', profileError);
      // Don't fail the signup if profile creation fails (might be handled by trigger)
    }

    return { 
      success: true, 
      data: { 
        uid: authData.user.id, 
        email: authData.user.email 
      } 
    };
  } catch (error: any) {
    console.error('Error in createUser:', error);
    return { success: false, message: error.message || 'An unknown error occurred during signup.' };
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
      return profiles.map((profile: any) => ({
        uid: profile.id,
        email: profile.email || '',
        name: profile.name || 'N/A',
        createdAt: profile.created_at,
        role: profile.role || 'user',
        phoneNumber: profile.phone || null,
      }));
    }

    // Fallback to users table (old Firebase system)
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }

    return users.map((user: any) => ({
      uid: user.id,
      email: user.email || '',
      name: user.name || 'N/A',
      createdAt: user.created_at,
      role: user.role || 'customer',
      phoneNumber: user.phone || null,
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}


export async function deleteUser(uid: string) {
  try {
    const supabase = await createClient();
    
    // Delete from auth.users (this will cascade to users table if set up properly)
    const { error: authError } = await supabase.auth.admin.deleteUser(uid);
    
    if (authError) {
      console.error("Error deleting user from auth:", authError);
      return { success: false, message: authError.message };
    }

    // Also delete from users table explicitly
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', uid);

    if (dbError) {
      console.error("Error deleting user from database:", dbError);
      // Don't fail if already deleted by cascade
    }

    revalidatePath('/admin/customers');
    
    return { success: true, message: "User deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, message: error.message };
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
    console.error("Error getting user role:", error);
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
    console.error("Error fetching user role on client:", error);
    return 'customer';
  }
}
