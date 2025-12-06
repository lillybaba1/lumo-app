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

  return { boutiqueId: boutique.id, userId: user.id };
}

// Get conversations
export async function getConversations(status: 'open' | 'closed' | 'archived' = 'open') {
  try {
    const { boutiqueId } = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_conversations')
      .select(`
        id,
        customer_id,
        subject,
        status,
        last_message_at,
        seller_unread_count,
        order_id
      `)
      .eq('boutique_id', boutiqueId)
      .eq('status', status)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Get customer profiles
    const customerIds = [...new Set(data?.map(c => c.customer_id) || [])];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', customerIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Get last message for each conversation
    const conversationsWithDetails = await Promise.all(
      (data || []).map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from('seller_messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const profile = profileMap.get(conv.customer_id);
        
        return {
          ...conv,
          customer_name: profile?.display_name || 'Customer',
          customer_avatar: profile?.avatar_url,
          last_message: lastMsg?.content,
        };
      })
    );

    return { success: true, data: conversationsWithDetails };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get messages for a conversation
export async function getMessages(conversationId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Send a message
export async function sendMessage(conversationId: string, content: string) {
  try {
    const { userId } = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_type: 'seller',
        content,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/messages');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Mark conversation as read
export async function markConversationRead(conversationId: string) {
  try {
    const supabase = await createClient();

    // Reset seller unread count
    const { error: convError } = await supabase
      .from('seller_conversations')
      .update({ seller_unread_count: 0 })
      .eq('id', conversationId);

    if (convError) throw convError;

    // Mark all messages as read
    const { error: msgError } = await supabase
      .from('seller_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'customer');

    if (msgError) throw msgError;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update conversation status
export async function updateConversationStatus(
  conversationId: string,
  status: 'open' | 'closed' | 'archived'
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('seller_conversations')
      .update({ status })
      .eq('id', conversationId);

    if (error) throw error;

    revalidatePath('/business/messages');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Quick Replies CRUD
export async function getQuickReplies() {
  try {
    const { boutiqueId } = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_quick_replies')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('usage_count', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createQuickReply(data: { title: string; content: string; category?: string }) {
  try {
    const { boutiqueId } = await getBoutiqueId();
    const supabase = await createClient();

    const { data: reply, error } = await supabase
      .from('seller_quick_replies')
      .insert({
        boutique_id: boutiqueId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/messages');
    return { success: true, data: reply };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateQuickReply(
  id: string,
  data: { title?: string; content?: string; category?: string }
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('seller_quick_replies')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/messages');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuickReply(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('seller_quick_replies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/messages');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Notification Settings
export async function getNotificationSettings() {
  try {
    const { boutiqueId } = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_notification_settings')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || getDefaultSettings() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function getDefaultSettings() {
  return {
    email_notifications: true,
    push_notifications: true,
    auto_reply_enabled: false,
    auto_reply_message: '',
    business_hours_only: false,
    business_hours_start: '09:00',
    business_hours_end: '17:00',
  };
}

export async function updateNotificationSettings(data: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  auto_reply_enabled?: boolean;
  auto_reply_message?: string;
  business_hours_only?: boolean;
  business_hours_start?: string;
  business_hours_end?: string;
}) {
  try {
    const { boutiqueId } = await getBoutiqueId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('seller_notification_settings')
      .upsert({
        boutique_id: boutiqueId,
        ...data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    revalidatePath('/business/messages');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
