'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone_number: z.string().optional(),
});

type UpdateProfileState = {
  success: boolean;
  message: string;
  errors?: z.ZodError['formErrors']['fieldErrors'] | null;
};

export async function updateProfile(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'You must be logged in to update your profile.',
      };
    }

    // Validate input
    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = profileSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Validation failed. Please check the form fields.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, phone_number } = validatedFields.data;

    // Update user record in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        phone_number: phone_number || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return {
        success: false,
        message: 'Failed to update profile. Please try again.',
      };
    }

    // Update auth user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { name },
    });

    if (metadataError) {
      console.warn('Failed to update user metadata:', metadataError);
      // Don't fail if metadata update fails, the main update succeeded
    }

    revalidatePath('/account/profile');

    return {
      success: true,
      message: 'Profile updated successfully!',
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// ─── Change Password ─────────────────────────────────────────────────────────

const passwordSchema = z.object({
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type ChangePasswordState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]> | null;
};

export async function changePassword(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'You must be logged in to change your password.',
      };
    }

    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = passwordSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { new_password } = validatedFields.data;

    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      console.error('Failed to change password:', updateError);
      return {
        success: false,
        message: updateError.message || 'Failed to change password. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Password changed successfully!',
    };
  } catch (error) {
    console.error('Error changing password:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}
