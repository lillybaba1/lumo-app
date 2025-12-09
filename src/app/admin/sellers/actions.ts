'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import { sendEmail, getSellerApprovalEmail, getAccountApprovalEmail } from '@/lib/email';

export async function approveBusinessAccount(businessId: string) {
  try {
    // Step 1: Approve Account
    // This allows the user to access the dashboard and create a boutique
    const { error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .update({
        account_approved: true,
        account_approved_at: new Date().toISOString(),
        // We do NOT set status to ACTIVE yet, that happens after boutique approval
        // But if status was PENDING_VERIFICATION, we might want to move it to PENDING_APPROVAL or similar?
        // Actually, status is separate. Let's keep status as is or update if needed.
        // If it was PENDING_APPROVAL, it remains so until boutique is approved?
        // Or maybe we use a new status?
        // For now, let's just set the flag.
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (businessError) {
      console.error('Error approving business account:', businessError);
      return { success: false, error: 'Failed to approve business account' };
    }

    // Get the business account to find owner and send email
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('owner_user_id, business_name, contact_person_name, contact_email')
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
        
      // Send account approval email
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julazone.com';
      const dashboardUrl = `${baseUrl}/business/setup-boutique`;
      
      const emailTemplate = getAccountApprovalEmail(
        businessAccount.contact_person_name || 'Seller',
        businessAccount.business_name,
        dashboardUrl
      );
      
      const emailResult = await sendEmail({
        ...emailTemplate,
        to: businessAccount.contact_email,
      });
      
      if (!emailResult.success) {
        console.error('Failed to send account approval email:', emailResult.error);
        // Don't fail the approval, just log the error
      } else {
        console.log(`Account approval email sent to ${businessAccount.contact_email}`);
      }
    }

    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${businessId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in approveBusinessAccount:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function approveBoutique(businessId: string) {
  try {
    // Get business account details first for the email
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('owner_user_id, business_name, contact_person_name, contact_email')
      .eq('id', businessId)
      .single();
      
    // Get boutique slug for the email link
    const { data: boutique } = await supabaseAdmin
      .from('boutiques')
      .select('slug, display_name')
      .eq('business_account_id', businessId)
      .single();

    // Step 2: Approve Boutique
    // This makes the boutique visible and sets status to ACTIVE
    const { error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .update({
        boutique_approved: true,
        boutique_approved_at: new Date().toISOString(),
        status: 'ACTIVE', // Now they are fully active
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (businessError) {
      console.error('Error approving boutique:', businessError);
      return { success: false, error: 'Failed to approve boutique' };
    }
    
    // Also update the boutiques table if it exists
    try {
      await supabaseAdmin
        .from('boutiques')
        .update({
          is_published: true,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('business_account_id', businessId);
    } catch (err) {
      console.log('Boutiques table update skipped:', err);
    }

    // Send boutique approval email
    if (businessAccount && businessAccount.contact_email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julazone.com';
      const boutiqueUrl = boutique?.slug 
        ? `${baseUrl}/boutique/${boutique.slug}`
        : `${baseUrl}/business/dashboard`;
      
      const emailTemplate = getSellerApprovalEmail(
        businessAccount.contact_person_name || 'Seller',
        boutique?.display_name || businessAccount.business_name,
        boutiqueUrl
      );
      
      const emailResult = await sendEmail({
        ...emailTemplate,
        to: businessAccount.contact_email,
      });
      
      if (!emailResult.success) {
        console.error('Failed to send boutique approval email:', emailResult.error);
        // Don't fail the approval, just log the error
      } else {
        console.log(`Boutique approval email sent to ${businessAccount.contact_email}`);
      }
    }

    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${businessId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in approveBoutique:', error);
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

export async function deleteBusinessAccountAndUser(businessId: string) {
  try {
    // Get the business account to find owner
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('owner_user_id')
      .eq('id', businessId)
      .single();

    if (!businessAccount) {
      return { success: false, error: 'Business account not found' };
    }

    const ownerId = businessAccount.owner_user_id;

    // Delete business account
    const { error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .delete()
      .eq('id', businessId);

    if (businessError) {
      console.error('Error deleting business account:', businessError);
      return { success: false, error: 'Failed to delete business account' };
    }

    // Delete from user_profiles table
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', ownerId);

    // Delete from users table
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', ownerId);

    // Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(ownerId);
    
    if (authError) {
      console.error('Error deleting user from auth:', authError);
      // Continue anyway, the business account is already deleted
    }

    revalidatePath('/admin/sellers');
    revalidatePath('/admin/customers');

    return { success: true };
  } catch (error) {
    console.error('Error in deleteBusinessAccountAndUser:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}