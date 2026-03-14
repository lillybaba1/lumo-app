'use server';

import { logger } from '@/lib/logger';

const businessaccountLogger = logger.child('BusinessAccountService');

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
      businessaccountLogger.error('Error fetching business account:', error);
      return null;
    }

    return data ? mapDbToBusinessAccount(data) : null;
  } catch (error) {
    businessaccountLogger.error('Error in getBusinessAccount:', error);
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
      businessaccountLogger.error('Error fetching business account by owner:', error);
      return null;
    }

    return data ? mapDbToBusinessAccount(data) : null;
  } catch (error) {
    businessaccountLogger.error('Error in getBusinessAccountByOwner:', error);
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
      businessaccountLogger.error('Error fetching all business accounts:', error);
      return [];
    }

    return data ? data.map(mapDbToBusinessAccount) : [];
  } catch (error) {
    businessaccountLogger.error('Error in getAllBusinessAccounts:', error);
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

    businessaccountLogger.debug('[BusinessAccount] Attempting to create business account:', {
      ownerUserId,
      businessName: dbData.business_name,
    });

    // Check for duplicate business name (case-insensitive)
    if (dbData.business_name) {
      const { data: existing } = await supabaseAdmin
        .from('business_accounts')
        .select('id')
        .ilike('business_name', dbData.business_name.trim())
        .maybeSingle();

      if (existing) {
        businessaccountLogger.error('[BusinessAccount] Duplicate business name:', dbData.business_name);
        return null;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      businessaccountLogger.error('[BusinessAccount] Error creating business account:', {
        error: JSON.stringify(error),
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    businessaccountLogger.debug('[BusinessAccount] Successfully created business account:', data?.id);
    return data ? mapDbToBusinessAccount(data) : null;
  } catch (error) {
    businessaccountLogger.error('[BusinessAccount] Exception in createBusinessAccount:', error);
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
    const dbUpdates: Partial<Record<string, unknown>> = {
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
      businessaccountLogger.error('Error updating business account:', error);
      return null;
    }

    return data ? mapDbToBusinessAccount(data) : null;
  } catch (error) {
    businessaccountLogger.error('Error in updateBusinessAccount:', error);
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
      businessaccountLogger.error('Error deleting business account:', error);
      return false;
    }

    return true;
  } catch (error) {
    businessaccountLogger.error('Error in deleteBusinessAccount:', error);
    return false;
  }
}

/**
 * Map database record to BusinessAccount type
 */
interface DbBusinessAccountRow {
  id: string;
  owner_user_id: string;
  business_name: string;
  contact_person_name: string;
  contact_email: string;
  business_address: string;
  business_phone: string | null;
  tax_id: string | null;
  website: string | null;
  description: string | null;
  logo: string | null;
  status: string;
  account_approved: boolean | null;
  account_approved_at: string | null;
  account_approved_by: string | null;
  boutique_submitted: boolean | null;
  boutique_submitted_at: string | null;
  boutique_approved: boolean | null;
  boutique_approved_at: string | null;
  boutique_approved_by: string | null;
  boutique_rejection_reason: string | null;
  seller_type: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  verification_status: string | null;
  verification_documents: {
    idDocument?: string;
    businessLicense?: string;
    proofOfAddress?: string;
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
  } | null;
  boutique_id: string | null;
  boutique_slug: string | null;
  total_earnings: string | number | null;
  total_commission_paid: string | number | null;
  pending_payout: string | number | null;
  payout_method: string | null;
  payout_details: Record<string, unknown> | null;
  shipping_policies: string | null;
  return_policy: string | null;
  created_at: string;
  updated_at: string | null;
}

function mapDbToBusinessAccount(dbRecord: DbBusinessAccountRow): BusinessAccount {
  return {
    id: dbRecord.id,
    ownerUserId: dbRecord.owner_user_id,
    businessName: dbRecord.business_name,
    contactPersonName: dbRecord.contact_person_name,
    contactEmail: dbRecord.contact_email,
    businessAddress: dbRecord.business_address,
    businessPhone: dbRecord.business_phone ?? undefined,
    taxId: dbRecord.tax_id ?? undefined,
    website: dbRecord.website ?? undefined,
    description: dbRecord.description ?? undefined,
    logo: dbRecord.logo ?? undefined,
    status: dbRecord.status as 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'PENDING_APPROVAL',
    // Multi-phase approval tracking
    accountApproved: dbRecord.account_approved ?? false,
    accountApprovedAt: dbRecord.account_approved_at ?? undefined,
    accountApprovedBy: dbRecord.account_approved_by ?? undefined,
    boutiqueSubmitted: dbRecord.boutique_submitted ?? false,
    boutiqueSubmittedAt: dbRecord.boutique_submitted_at ?? undefined,
    boutiqueApproved: dbRecord.boutique_approved ?? false,
    boutiqueApprovedAt: dbRecord.boutique_approved_at ?? undefined,
    boutiqueApprovedBy: dbRecord.boutique_approved_by ?? undefined,
    boutiqueRejectionReason: dbRecord.boutique_rejection_reason ?? undefined,
    // New boutique fields
    sellerType: (dbRecord.seller_type || 'individual') as 'individual' | 'company',
    subscriptionTier: (dbRecord.subscription_tier || 'free') as 'free' | 'pro' | 'enterprise',
    subscriptionStatus: (dbRecord.subscription_status || 'active') as 'active' | 'cancelled' | 'past_due' | 'trialing',
    subscriptionStartDate: dbRecord.subscription_start_date ?? undefined,
    subscriptionEndDate: dbRecord.subscription_end_date ?? undefined,
    stripeCustomerId: dbRecord.stripe_customer_id ?? undefined,
    stripeSubscriptionId: dbRecord.stripe_subscription_id ?? undefined,
    verificationStatus: (dbRecord.verification_status || 'unverified') as 'unverified' | 'pending' | 'verified' | 'rejected',
    verificationDocuments: dbRecord.verification_documents ?? undefined,
    boutiqueId: dbRecord.boutique_id ?? undefined,
    boutiqueSlug: dbRecord.boutique_slug ?? undefined,
    totalEarnings: parseFloat(String(dbRecord.total_earnings)) || 0,
    totalCommissionPaid: parseFloat(String(dbRecord.total_commission_paid)) || 0,
    pendingPayout: parseFloat(String(dbRecord.pending_payout)) || 0,
    // Original fields
    payoutMethod: dbRecord.payout_method as 'bank_transfer' | 'paypal' | 'stripe' | undefined,
    payoutDetails: dbRecord.payout_details ?? undefined,
    shippingPolicies: dbRecord.shipping_policies ?? undefined,
    returnPolicy: dbRecord.return_policy ?? undefined,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at ?? undefined,
  };
}

