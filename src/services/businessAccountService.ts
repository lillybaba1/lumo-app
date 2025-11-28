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
    const dbData = {
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

    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error creating business account:', error);
      return null;
    }

    return data ? mapDbToBusinessAccount(data) : null;
  } catch (error) {
    console.error('Error in createBusinessAccount:', error);
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
    payoutMethod: dbRecord.payout_method,
    payoutDetails: dbRecord.payout_details,
    shippingPolicies: dbRecord.shipping_policies,
    returnPolicy: dbRecord.return_policy,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}
