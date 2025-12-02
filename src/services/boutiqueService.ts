'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Boutique, BusinessAccount, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/types';

// Map database row to Boutique type
function mapDbToBoutique(data: any): Boutique {
  return {
    id: data.id,
    businessAccountId: data.business_account_id,
    slug: data.slug,
    displayName: data.display_name,
    tagline: data.tagline,
    description: data.description,
    logo: data.logo,
    bannerImage: data.banner_image,
    themeColor: data.theme_color,
    accentColor: data.accent_color,
    socialLinks: data.social_links || {},
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    shippingInfo: data.shipping_info,
    returnPolicy: data.return_policy,
    totalProducts: data.total_products || 0,
    totalSales: data.total_sales || 0,
    averageRating: parseFloat(data.average_rating) || 0,
    totalReviews: data.total_reviews || 0,
    isPublished: data.is_published,
    isFeatured: data.is_featured,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get boutique by ID
 */
export async function getBoutiqueById(boutiqueId: string): Promise<Boutique | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('boutiques')
      .select('*')
      .eq('id', boutiqueId)
      .single();

    if (error) {
      console.error('Error fetching boutique:', error);
      return null;
    }

    return data ? mapDbToBoutique(data) : null;
  } catch (error) {
    console.error('Error in getBoutiqueById:', error);
    return null;
  }
}

/**
 * Get boutique by slug (for public storefront URLs)
 */
export async function getBoutiqueBySlug(slug: string): Promise<Boutique | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('boutiques')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching boutique by slug:', error);
      return null;
    }

    return data ? mapDbToBoutique(data) : null;
  } catch (error) {
    console.error('Error in getBoutiqueBySlug:', error);
    return null;
  }
}

/**
 * Get boutique by business account ID
 */
export async function getBoutiqueByBusinessAccount(businessAccountId: string): Promise<Boutique | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('boutiques')
      .select('*')
      .eq('business_account_id', businessAccountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching boutique:', error);
      return null;
    }

    return data ? mapDbToBoutique(data) : null;
  } catch (error) {
    console.error('Error in getBoutiqueByBusinessAccount:', error);
    return null;
  }
}

/**
 * Create a new boutique for a business account
 */
export async function createBoutique(
  businessAccountId: string,
  boutiqueData: Partial<Boutique>
): Promise<Boutique | null> {
  try {
    // Generate unique slug
    const baseSlug = boutiqueData.displayName || 'boutique';
    const { data: slugData } = await supabaseAdmin.rpc('generate_boutique_slug', {
      base_name: baseSlug,
    });
    
    const slug = slugData || `boutique-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('boutiques')
      .insert({
        business_account_id: businessAccountId,
        slug,
        display_name: boutiqueData.displayName || '',
        tagline: boutiqueData.tagline,
        description: boutiqueData.description,
        logo: boutiqueData.logo,
        banner_image: boutiqueData.bannerImage,
        theme_color: boutiqueData.themeColor || '#8b5cf6',
        accent_color: boutiqueData.accentColor || '#ec4899',
        social_links: boutiqueData.socialLinks || {},
        contact_email: boutiqueData.contactEmail,
        contact_phone: boutiqueData.contactPhone,
        shipping_info: boutiqueData.shippingInfo,
        return_policy: boutiqueData.returnPolicy,
        is_published: boutiqueData.isPublished || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating boutique:', error);
      return null;
    }

    // Update business account with boutique reference
    await supabaseAdmin
      .from('business_accounts')
      .update({
        boutique_id: data.id,
        boutique_slug: slug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessAccountId);

    return data ? mapDbToBoutique(data) : null;
  } catch (error) {
    console.error('Error in createBoutique:', error);
    return null;
  }
}

/**
 * Update boutique
 */
export async function updateBoutique(
  boutiqueId: string,
  updates: Partial<Boutique>
): Promise<Boutique | null> {
  try {
    const updateData: any = {};
    
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.tagline !== undefined) updateData.tagline = updates.tagline;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.logo !== undefined) updateData.logo = updates.logo;
    if (updates.bannerImage !== undefined) updateData.banner_image = updates.bannerImage;
    if (updates.themeColor !== undefined) updateData.theme_color = updates.themeColor;
    if (updates.accentColor !== undefined) updateData.accent_color = updates.accentColor;
    if (updates.socialLinks !== undefined) updateData.social_links = updates.socialLinks;
    if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
    if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
    if (updates.shippingInfo !== undefined) updateData.shipping_info = updates.shippingInfo;
    if (updates.returnPolicy !== undefined) updateData.return_policy = updates.returnPolicy;
    if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished;

    const { data, error } = await supabaseAdmin
      .from('boutiques')
      .update(updateData)
      .eq('id', boutiqueId)
      .select()
      .single();

    if (error) {
      console.error('Error updating boutique:', error);
      return null;
    }

    return data ? mapDbToBoutique(data) : null;
  } catch (error) {
    console.error('Error in updateBoutique:', error);
    return null;
  }
}

/**
 * Get all published boutiques (for browse/discover page)
 */
export async function getPublishedBoutiques(options?: {
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Boutique[]> {
  try {
    let query = supabaseAdmin
      .from('boutiques')
      .select('*')
      .eq('is_published', true)
      .order('total_sales', { ascending: false });

    if (options?.featured) {
      query = query.eq('is_featured', true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching boutiques:', error);
      return [];
    }

    return data ? data.map(mapDbToBoutique) : [];
  } catch (error) {
    console.error('Error in getPublishedBoutiques:', error);
    return [];
  }
}

/**
 * Get boutique products
 */
export async function getBoutiqueProducts(boutiqueId: string, options?: {
  limit?: number;
  offset?: number;
  categoryId?: string;
}) {
  try {
    // First get business account ID from boutique
    const { data: boutique } = await supabaseAdmin
      .from('boutiques')
      .select('business_account_id')
      .eq('id', boutiqueId)
      .single();

    if (!boutique) return [];

    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('seller_id', boutique.business_account_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching boutique products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBoutiqueProducts:', error);
    return [];
  }
}

/**
 * Update boutique stats (called after order, review, etc.)
 */
export async function updateBoutiqueStats(businessAccountId: string): Promise<void> {
  try {
    // Get product count
    const { count: productCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', businessAccountId)
      .eq('status', 'active');

    // Get sales count (from order_items)
    const { count: salesCount } = await supabaseAdmin
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', businessAccountId);

    // First get seller's product IDs
    const { data: productIds } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('seller_id', businessAccountId);
    
    const ids = productIds?.map(p => p.id) || [];
    
    // Get reviews and average rating for those products
    let totalReviews = 0;
    let averageRating = 0;
    
    if (ids.length > 0) {
      const { data: reviewStats } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .in('product_id', ids);
      
      totalReviews = reviewStats?.length || 0;
      averageRating = totalReviews > 0
        ? reviewStats!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
    }

    // Update boutique
    await supabaseAdmin
      .from('boutiques')
      .update({
        total_products: productCount || 0,
        total_sales: salesCount || 0,
        total_reviews: totalReviews,
        average_rating: averageRating,
        updated_at: new Date().toISOString(),
      })
      .eq('business_account_id', businessAccountId);
  } catch (error) {
    console.error('Error updating boutique stats:', error);
  }
}

/**
 * Calculate commission for a sale
 */
export async function calculateCommission(
  businessAccountId: string,
  saleAmount: number
): Promise<{ commissionRate: number; commissionAmount: number; netAmount: number }> {
  try {
    // Get seller's subscription tier
    const { data: business } = await supabaseAdmin
      .from('business_accounts')
      .select('subscription_tier')
      .eq('id', businessAccountId)
      .single();

    const tier = (business?.subscription_tier || 'free') as SubscriptionTier;
    const tierDetails = SUBSCRIPTION_TIERS[tier];
    const commissionRate = tierDetails.commissionRate;
    const commissionAmount = Math.round(saleAmount * commissionRate) / 100;
    const netAmount = saleAmount - commissionAmount;

    return { commissionRate, commissionAmount, netAmount };
  } catch (error) {
    console.error('Error calculating commission:', error);
    // Default to highest commission if error
    return {
      commissionRate: 15,
      commissionAmount: Math.round(saleAmount * 0.15 * 100) / 100,
      netAmount: Math.round(saleAmount * 0.85 * 100) / 100,
    };
  }
}

/**
 * Record a seller transaction
 */
export async function recordSellerTransaction(
  businessAccountId: string,
  transaction: {
    orderId?: string;
    orderItemId?: string;
    type: 'sale' | 'commission' | 'payout' | 'refund' | 'adjustment' | 'subscription_fee';
    amount: number;
    commissionRate?: number;
    commissionAmount?: number;
    netAmount?: number;
    description?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('seller_transactions')
      .insert({
        business_account_id: businessAccountId,
        order_id: transaction.orderId,
        order_item_id: transaction.orderItemId,
        type: transaction.type,
        amount: transaction.amount,
        commission_rate: transaction.commissionRate,
        commission_amount: transaction.commissionAmount,
        net_amount: transaction.netAmount,
        description: transaction.description,
        status: 'completed',
      });

    if (error) {
      console.error('Error recording transaction:', error);
      return false;
    }

    // Update business account totals
    if (transaction.type === 'sale' && transaction.netAmount) {
      await supabaseAdmin.rpc('increment_seller_earnings', {
        p_business_account_id: businessAccountId,
        p_amount: transaction.netAmount,
        p_commission: transaction.commissionAmount || 0,
      });
    }

    return true;
  } catch (error) {
    console.error('Error in recordSellerTransaction:', error);
    return false;
  }
}
