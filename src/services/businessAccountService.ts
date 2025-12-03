'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BusinessAccount } from '@/lib/types';

/**
 * Get a business account by ID
 */
export async function getBusinessAccount(businessId: string): Promise<BusinessAccount | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error) {
      console.error('Error fetching business account:', error);
      return null;
    }

    return data ? mapDbToBusinessAccount(data) : null;
  } catch (error) {
    console.error('Error in getBusinessAccount:', error);
    return null;
  }
}

/**
 * Get business account by owner user ID
 */
export async function getBusinessAccountByOwner(userId: string): Promise<BusinessAccount | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .select('*')
      .eq('owner_user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No business account found
        return null;
      }
      console.error('Error fetching business account by owner:', error);
      return null;
    }

    return data ? mapDbToBusinessAccount(data) : null;
  } catch (error) {
    console.error('Error in getBusinessAccountByOwner:', error);
    return null;
  }
}

/**
 * Get all business accounts (admin only)
 */
export async function getAllBusinessAccounts(): Promise<BusinessAccount[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all business accounts:', error);
      return [];
    }

    return data ? data.map(mapDbToBusinessAccount) : [];
  } catch (error) {
    console.error('Error in getAllBusinessAccounts:', error);
    return [];
  }
}

/**
 * Create a new business account
 */
export async function createBusinessAccount(
  ownerUserId: string,
  businessData: Partial<BusinessAccount>
): Promise<BusinessAccount | null> {
  try {
    const dbData: Record<string, any> = {
      owner_user_id: ownerUserId,
      business_name: businessData.businessName || '',
      contact_person_name: businessData.contactPersonName || '',
      contact_email: businessData.contactEmail || '',
      business_address: businessData.businessAddress || '',
      business_phone: businessData.businessPhone,
      tax_id: businessData.taxId,
      website: businessData.website,
      description: businessData.description,
      logo: businessData.logo,
      status: businessData.status || 'PENDING_VERIFICATION',
      payout_method: businessData.payoutMethod,
      payout_details: businessData.payoutDetails,
      shipping_policies: businessData.shippingPolicies,
      return_policy: businessData.returnPolicy,
      created_at: new Date().toISOString(),
    };
    
    // Add new boutique fields if provided
    if (businessData.sellerType) dbData.seller_type = businessData.sellerType;
    if (businessData.subscriptionTier) dbData.subscription_tier = businessData.subscriptionTier;
    if (businessData.verificationStatus) dbData.verification_status = businessData.verificationStatus;

    console.log('[BusinessAccount] Attempting to create business account:', {
      ownerUserId,
      businessName: dbData.business_name,
    });

    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('[BusinessAccount] Error creating business account:', {
        error: JSON.stringify(error),
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    console.log('[BusinessAccount] Successfully created business account:', data?.id);
    return data ? mapDbToBusinessAccount(data) : null;
  } catch (error) {
    console.error('[BusinessAccount] Exception in createBusinessAccount:', error);
    return null;
  }
}

/**
 * Update a business account
 */
export async function updateBusinessAccount(
  businessId: string,
  updates: Partial<BusinessAccount>
): Promise<BusinessAccount | null> {
  try {
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
    if (updates.contactPersonName !== undefined) dbUpdates.contact_person_name = updates.contactPersonName;
    if (updates.contactEmail !== undefined) dbUpdates.contact_email = updates.contactEmail;
    if (updates.businessAddress !== undefined) dbUpdates.business_address = updates.businessAddress;
    if (updates.businessPhone !== undefined) dbUpdates.business_phone = updates.businessPhone;
    if (updates.taxId !== undefined) dbUpdates.tax_id = updates.taxId;
    if (updates.website !== undefined) dbUpdates.website = updates.website;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.logo !== undefined) dbUpdates.logo = updates.logo;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.payoutMethod !== undefined) dbUpdates.payout_method = updates.payoutMethod;
    if (updates.payoutDetails !== undefined) dbUpdates.payout_details = updates.payoutDetails;
    if (updates.shippingPolicies !== undefined) dbUpdates.shipping_policies = updates.shippingPolicies;
    if (updates.returnPolicy !== undefined) dbUpdates.return_policy = updates.returnPolicy;
    // New boutique fields
    if (updates.sellerType !== undefined) dbUpdates.seller_type = updates.sellerType;
    if (updates.subscriptionTier !== undefined) dbUpdates.subscription_tier = updates.subscriptionTier;
    if (updates.subscriptionStatus !== undefined) dbUpdates.subscription_status = updates.subscriptionStatus;
    if (updates.subscriptionStartDate !== undefined) dbUpdates.subscription_start_date = updates.subscriptionStartDate;
    if (updates.subscriptionEndDate !== undefined) dbUpdates.subscription_end_date = updates.subscriptionEndDate;
    if (updates.stripeCustomerId !== undefined) dbUpdates.stripe_customer_id = updates.stripeCustomerId;
    if (updates.stripeSubscriptionId !== undefined) dbUpdates.stripe_subscription_id = updates.stripeSubscriptionId;
    if (updates.verificationStatus !== undefined) dbUpdates.verification_status = updates.verificationStatus;
    if (updates.verificationDocuments !== undefined) dbUpdates.verification_documents = updates.verificationDocuments;
    if (updates.boutiqueId !== undefined) dbUpdates.boutique_id = updates.boutiqueId;
    if (updates.boutiqueSlug !== undefined) dbUpdates.boutique_slug = updates.boutiqueSlug;
    if (updates.totalEarnings !== undefined) dbUpdates.total_earnings = updates.totalEarnings;
    if (updates.totalCommissionPaid !== undefined) dbUpdates.total_commission_paid = updates.totalCommissionPaid;
    if (updates.pendingPayout !== undefined) dbUpdates.pending_payout = updates.pendingPayout;
    // Multi-phase approval fields
    if (updates.accountApproved !== undefined) dbUpdates.account_approved = updates.accountApproved;
    if (updates.accountApprovedAt !== undefined) dbUpdates.account_approved_at = updates.accountApprovedAt;
    if (updates.accountApprovedBy !== undefined) dbUpdates.account_approved_by = updates.accountApprovedBy;
    if (updates.boutiqueSubmitted !== undefined) dbUpdates.boutique_submitted = updates.boutiqueSubmitted;
    if (updates.boutiqueSubmittedAt !== undefined) dbUpdates.boutique_submitted_at = updates.boutiqueSubmittedAt;
    if (updates.boutiqueApproved !== undefined) dbUpdates.boutique_approved = updates.boutiqueApproved;
    if (updates.boutiqueApprovedAt !== undefined) dbUpdates.boutique_approved_at = updates.boutiqueApprovedAt;
    if (updates.boutiqueApprovedBy !== undefined) dbUpdates.boutique_approved_by = updates.boutiqueApprovedBy;
    if (updates.boutiqueRejectionReason !== undefined) dbUpdates.boutique_rejection_reason = updates.boutiqueRejectionReason;

    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .update(dbUpdates)
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('Error updating business account:', error);
      return null;
    }

    return data ? mapDbToBusinessAccount(data) : null;
  } catch (error) {
    console.error('Error in updateBusinessAccount:', error);
    return null;
  }
}

/**
 * Delete/deactivate a business account
 */
export async function deleteBusinessAccount(businessId: string): Promise<boolean> {
  try {
    // Soft delete by setting status to SUSPENDED
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({
        status: 'SUSPENDED',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (error) {
      console.error('Error deleting business account:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBusinessAccount:', error);
    return false;
  }
}

/**
 * Map database record to BusinessAccount type
 */
function mapDbToBusinessAccount(dbRecord: any): BusinessAccount {
  return {
    id: dbRecord.id,
    ownerUserId: dbRecord.owner_user_id,
    businessName: dbRecord.business_name,
    contactPersonName: dbRecord.contact_person_name,
    contactEmail: dbRecord.contact_email,
    businessAddress: dbRecord.business_address,
    businessPhone: dbRecord.business_phone,
    taxId: dbRecord.tax_id,
    website: dbRecord.website,
    description: dbRecord.description,
    logo: dbRecord.logo,
    status: dbRecord.status,
    // Multi-phase approval tracking
    accountApproved: dbRecord.account_approved ?? false,
    accountApprovedAt: dbRecord.account_approved_at,
    accountApprovedBy: dbRecord.account_approved_by,
    boutiqueSubmitted: dbRecord.boutique_submitted ?? false,
    boutiqueSubmittedAt: dbRecord.boutique_submitted_at,
    boutiqueApproved: dbRecord.boutique_approved ?? false,
    boutiqueApprovedAt: dbRecord.boutique_approved_at,
    boutiqueApprovedBy: dbRecord.boutique_approved_by,
    boutiqueRejectionReason: dbRecord.boutique_rejection_reason,
    // New boutique fields
    sellerType: dbRecord.seller_type || 'individual',
    subscriptionTier: dbRecord.subscription_tier || 'free',
    subscriptionStatus: dbRecord.subscription_status || 'active',
    subscriptionStartDate: dbRecord.subscription_start_date,
    subscriptionEndDate: dbRecord.subscription_end_date,
    stripeCustomerId: dbRecord.stripe_customer_id,
    stripeSubscriptionId: dbRecord.stripe_subscription_id,
    verificationStatus: dbRecord.verification_status || 'unverified',
    verificationDocuments: dbRecord.verification_documents,
    boutiqueId: dbRecord.boutique_id,
    boutiqueSlug: dbRecord.boutique_slug,
    totalEarnings: parseFloat(dbRecord.total_earnings) || 0,
    totalCommissionPaid: parseFloat(dbRecord.total_commission_paid) || 0,
    pendingPayout: parseFloat(dbRecord.pending_payout) || 0,
    // Original fields
    payoutMethod: dbRecord.payout_method,
    payoutDetails: dbRecord.payout_details,
    shippingPolicies: dbRecord.shipping_policies,
    returnPolicy: dbRecord.return_policy,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}
