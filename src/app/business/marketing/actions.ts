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

// Subscribers
export async function getSubscribers() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_subscribers')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('subscribed_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addSubscriber(data: { email: string; name?: string; source?: string }) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data: subscriber, error } = await supabase
      .from('boutique_subscribers')
      .insert({
        boutique_id: boutiqueId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true, data: subscriber };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function unsubscribe(email: string) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('boutique_id', boutiqueId)
      .eq('email', email);

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Campaigns
export async function getCampaigns() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_campaigns')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCampaign(data: { name: string; subject: string; content: string }) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data: campaign, error } = await supabase
      .from('boutique_campaigns')
      .insert({
        boutique_id: boutiqueId,
        ...data,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true, data: campaign };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCampaign(id: string, data: any) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_campaigns')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCampaign(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendCampaign(id: string) {
  try {
    const supabase = await createClient();

    // In production, this would trigger the actual email sending
    const { error } = await supabase
      .from('boutique_campaigns')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Referral Program
export async function getReferralProgram() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_referral_programs')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || {
      is_active: false,
      referrer_reward_type: 'percentage',
      referrer_reward_amount: 10,
      referee_reward_type: 'percentage',
      referee_reward_amount: 10,
      max_referrals_per_user: 10,
    }};
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateReferralProgram(data: any) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_referral_programs')
      .upsert({
        boutique_id: boutiqueId,
        ...data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Automations
export async function getAutomations() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_automations')
      .select('*')
      .eq('boutique_id', boutiqueId);

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAutomation(data: {
  name: string;
  trigger_type: string;
  email_subject?: string;
  email_content?: string;
  delay_hours?: number;
}) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data: automation, error } = await supabase
      .from('boutique_automations')
      .insert({
        boutique_id: boutiqueId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true, data: automation };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAutomation(id: string, data: any) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_automations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Social Sharing
export async function getSocialSharing() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_social_sharing')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSocialSharing(data: any) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_social_sharing')
      .upsert({
        boutique_id: boutiqueId,
        ...data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    revalidatePath('/business/marketing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
