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

// Get reviews
export async function getReviews(status?: 'pending' | 'approved' | 'rejected' | 'responded') {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    let query = supabase
      .from('seller_reviews')
      .select(`
        *,
        response:seller_review_responses(id, content, created_at)
      `)
      .eq('boutique_id', boutiqueId)
      .order('created_at', { ascending: false });

    if (status === 'responded') {
      // Filter for reviews with responses - handled client-side
    } else if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get customer profiles
    const customerIds = [...new Set(data?.map(r => r.customer_id) || [])];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', customerIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    let reviewsWithDetails = (data || []).map(review => ({
      ...review,
      customer_name: profileMap.get(review.customer_id)?.display_name || 'Customer',
      customer_avatar: profileMap.get(review.customer_id)?.avatar_url,
      response: review.response?.[0] || null,
    }));

    // Filter for responded if needed
    if (status === 'responded') {
      reviewsWithDetails = reviewsWithDetails.filter(r => r.response);
    }

    return { success: true, data: reviewsWithDetails };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get rating summary
export async function getRatingSummary() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_rating_summary')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || {
      average_rating: 0,
      total_reviews: 0,
      rating_1_count: 0,
      rating_2_count: 0,
      rating_3_count: 0,
      rating_4_count: 0,
      rating_5_count: 0,
    }};
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get badges
export async function getBadges() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_badge_assignments')
      .select(`
        earned_at,
        badge:seller_badges(id, name, description, icon, color, tier)
      `)
      .eq('boutique_id', boutiqueId)
      .is('expires_at', null);

    if (error) throw error;

    const badges = (data || [])
      .filter(item => item.badge)
      .map(item => {
        const badge = item.badge as any;
        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color,
          tier: badge.tier,
          earned_at: item.earned_at,
        };
      });

    return { success: true, data: badges };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Respond to review
export async function respondToReview(reviewId: string, content: string) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_review_responses')
      .insert({
        review_id: reviewId,
        boutique_id: boutiqueId,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/reviews');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update response
export async function updateReviewResponse(responseId: string, content: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('seller_review_responses')
      .update({ 
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId);

    if (error) throw error;

    revalidatePath('/business/reviews');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete response
export async function deleteReviewResponse(responseId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('seller_review_responses')
      .delete()
      .eq('id', responseId);

    if (error) throw error;

    revalidatePath('/business/reviews');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Request review from customer (after order completion)
export async function requestReview(orderId: string, customerId: string) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    // Check if review already exists
    const { data: existing } = await supabase
      .from('seller_reviews')
      .select('id')
      .eq('boutique_id', boutiqueId)
      .eq('customer_id', customerId)
      .eq('order_id', orderId)
      .single();

    if (existing) {
      return { success: false, error: 'Review already requested for this order' };
    }

    // In production, you'd send an email here
    // For now, just return success
    return { success: true, message: 'Review request sent' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
