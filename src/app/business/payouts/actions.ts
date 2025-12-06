'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Get user's boutique ID
async function getBoutiqueId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { data: businessAccount } = await supabase
    .from('business_accounts')
    .select('id')
    .eq('owner_user_id', user.id)
    .single();

  if (!businessAccount) throw new Error('No business account found');

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id')
    .eq('business_account_id', businessAccount.id)
    .single();

  if (!boutique) throw new Error('No boutique found');

  return boutique.id;
}

// Get balance
export async function getBalance() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_balances')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { 
      success: true, 
      data: data || {
        pending_balance: 0,
        available_balance: 0,
        total_earnings: 0,
        total_paid: 0,
        total_fees: 0,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get earnings
export async function getEarnings(limit = 50) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get payouts
export async function getPayouts(limit = 50) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_payouts')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get payout accounts
export async function getPayoutAccounts() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_payout_accounts')
      .select('id, account_type, account_name, is_primary, is_verified')
      .eq('boutique_id', boutiqueId)
      .order('is_primary', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Create payout account
export async function createPayoutAccount(data: {
  account_type: 'bank' | 'paypal' | 'stripe';
  account_name: string;
  account_details: Record<string, any>;
  is_primary?: boolean;
}) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    // If setting as primary, unset other primaries
    if (data.is_primary) {
      await supabase
        .from('seller_payout_accounts')
        .update({ is_primary: false })
        .eq('boutique_id', boutiqueId);
    }

    const { data: account, error } = await supabase
      .from('seller_payout_accounts')
      .insert({
        boutique_id: boutiqueId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/payouts');
    return { success: true, data: account };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update payout account
export async function updatePayoutAccount(
  id: string,
  data: {
    account_name?: string;
    is_primary?: boolean;
  }
) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    // If setting as primary, unset other primaries
    if (data.is_primary) {
      await supabase
        .from('seller_payout_accounts')
        .update({ is_primary: false })
        .eq('boutique_id', boutiqueId);
    }

    const { error } = await supabase
      .from('seller_payout_accounts')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/payouts');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete payout account
export async function deletePayoutAccount(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('seller_payout_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/payouts');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get payout settings
export async function getPayoutSettings() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_payout_settings')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { 
      success: true, 
      data: data || {
        payout_frequency: 'weekly',
        minimum_payout: 25,
        hold_period_days: 7,
        auto_payout: true,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update payout settings
export async function updatePayoutSettings(data: {
  payout_frequency?: string;
  payout_day?: number;
  minimum_payout?: number;
  hold_period_days?: number;
  auto_payout?: boolean;
}) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('seller_payout_settings')
      .upsert({
        boutique_id: boutiqueId,
        ...data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    revalidatePath('/business/payouts');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Request payout
export async function requestPayout(amount: number) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    // Get primary verified account
    const { data: account } = await supabase
      .from('seller_payout_accounts')
      .select('id, account_type')
      .eq('boutique_id', boutiqueId)
      .eq('is_primary', true)
      .eq('is_verified', true)
      .single();

    if (!account) {
      throw new Error('No verified payout account found');
    }

    // Check available balance
    const { data: balance } = await supabase
      .from('seller_balances')
      .select('available_balance')
      .eq('boutique_id', boutiqueId)
      .single();

    if (!balance || balance.available_balance < amount) {
      throw new Error('Insufficient available balance');
    }

    // Create payout request
    const { data: payout, error } = await supabase
      .from('seller_payouts')
      .insert({
        boutique_id: boutiqueId,
        payout_account_id: account.id,
        amount,
        payout_method: account.account_type,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Update earnings to processing
    await supabase
      .from('seller_earnings')
      .update({ status: 'processing', payout_id: payout.id })
      .eq('boutique_id', boutiqueId)
      .eq('status', 'available');

    revalidatePath('/business/payouts');
    return { success: true, data: payout };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get commission tiers
export async function getCommissionTiers() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('commission_tiers')
      .select('*')
      .eq('is_active', true)
      .order('min_monthly_sales');

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
