'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function approveBusinessAccount(businessId: string) {
  try {
    // Update business account status to ACTIVE
    const { error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .update({
        status: 'ACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (businessError) {
      console.error('Error approving business account:', businessError);
      return { success: false, error: 'Failed to approve business account' };
    }

    // Get the business account to find owner
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('owner_user_id')
      .eq('id', businessId)
      .single();

    if (businessAccount) {
      // Update user role to BUSINESS_ACCOUNT
      await supabaseAdmin
        .from('users')
        .update({
          role: 'BUSINESS_ACCOUNT',
          updated_at: new Date().toISOString()
        })
        .eq('id', businessAccount.owner_user_id);
    }

    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${businessId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in approveBusinessAccount:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function rejectBusinessAccount(businessId: string, reason?: string) {
  try {
    // Update business account status to SUSPENDED (rejected)
    const { error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .update({
        status: 'SUSPENDED',
        description: reason ? `Rejected: ${reason}` : 'Application rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (businessError) {
      console.error('Error rejecting business account:', businessError);
      return { success: false, error: 'Failed to reject business account' };
    }

    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${businessId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in rejectBusinessAccount:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function suspendBusinessAccount(businessId: string, reason?: string) {
  try {
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({
        status: 'SUSPENDED',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (error) {
      console.error('Error suspending business account:', error);
      return { success: false, error: 'Failed to suspend business account' };
    }

    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${businessId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in suspendBusinessAccount:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function reactivateBusinessAccount(businessId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({
        status: 'ACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (error) {
      console.error('Error reactivating business account:', error);
      return { success: false, error: 'Failed to reactivate business account' };
    }

    // Also ensure user role is set correctly
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('owner_user_id')
      .eq('id', businessId)
      .single();

    if (businessAccount) {
      await supabaseAdmin
        .from('users')
        .update({
          role: 'BUSINESS_ACCOUNT',
          updated_at: new Date().toISOString()
        })
        .eq('id', businessAccount.owner_user_id);
    }

    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${businessId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in reactivateBusinessAccount:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
