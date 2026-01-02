'use server';

import { logger } from '@/lib/logger';

const boutiqueLogger = logger.child('BoutiqueService');

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Boutique, BusinessAccount, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/types';

/**
 * Database row type for boutiques table
 */
interface DbBoutiqueRow {
  id: string;
  business_account_id: string;
  slug: string;
  display_name: string;
  tagline: string | null;
  description: string | null;
  logo: string | null;
  banner_image: string | null;
  theme_color: string | null;
  accent_color: string | null;
  social_links: Record<string, string> | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  store_address: string | null;
  store_city: string | null;
  store_country: string | null;
  store_location: string | null;
  business_hours: string | null;
  established_year: number | null;
  trust_badges: string[] | null;
  specializations: string[] | null;
  accepted_payments: string[] | null;
  shipping_info: string | null;
  return_policy: string | null;
  total_products: number;
  total_sales: number;
  average_rating: string | number | null;
  total_reviews: number;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * Type for product image from DB
 */
interface DbProductImage {
  image_url: string;
  display_order: number | null;
}

// Map database row to Boutique type
function mapDbToBoutique(data: DbBoutiqueRow): Boutique {
  return {
    id: data.id,
    businessAccountId: data.business_account_id,
    slug: data.slug,
    displayName: data.display_name,
    tagline: data.tagline ?? undefined,
    description: data.description ?? undefined,
    logo: data.logo ?? undefined,
    bannerImage: data.banner_image ?? undefined,
    themeColor: data.theme_color ?? undefined,
    accentColor: data.accent_color ?? undefined,
    socialLinks: data.social_links || {},
    contactEmail: data.contact_email ?? undefined,
    contactPhone: data.contact_phone ?? undefined,
    whatsapp: data.whatsapp ?? undefined,
    storeAddress: data.store_address ?? undefined,
    storeCity: data.store_city ?? undefined,
    storeCountry: data.store_country ?? undefined,
    storeLocation: data.store_location ?? undefined,
    businessHours: data.business_hours ?? undefined,
    establishedYear: data.established_year ? String(data.established_year) : undefined,
    trustBadges: data.trust_badges || [],
    specializations: data.specializations || [],
    acceptedPayments: data.accepted_payments || [],
    shippingInfo: data.shipping_info ?? undefined,
    returnPolicy: data.return_policy ?? undefined,
    totalProducts: data.total_products || 0,
    totalSales: data.total_sales || 0,
    averageRating: parseFloat(String(data.average_rating)) || 0,
    totalReviews: data.total_reviews || 0,
    isPublished: data.is_published,
    isFeatured: data.is_featured,
    createdAt: data.created_at,
    updatedAt: data.updated_at ?? undefined,
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
      boutiqueLogger.error('Error fetching boutique:', error);
      return null;
    }

    return data ? mapDbToBoutique(data) : null;
  } catch (error) {
    boutiqueLogger.error('Error in getBoutiqueById:', error);
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
      boutiqueLogger.error('Error fetching boutique by slug:', error);
      return null;
    }

    return data ? mapDbToBoutique(data) : null;
  } catch (error) {
    boutiqueLogger.error('Error in getBoutiqueBySlug:', error);
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
      boutiqueLogger.error('Error fetching boutique:', error);
      return null;
    }

    return data ? mapDbToBoutique(data) : null;
  } catch (error) {
    boutiqueLogger.error('Error in getBoutiqueByBusinessAccount:', error);
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
      boutiqueLogger.error('Error creating boutique:', error);
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
    boutiqueLogger.error('Error in createBoutique:', error);
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
    const updateData: Partial<Record<string, unknown>> = {};
    
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
    if (updates.whatsapp !== undefined) updateData.whatsapp = updates.whatsapp;
    if (updates.storeAddress !== undefined) updateData.store_address = updates.storeAddress;
    if (updates.storeCity !== undefined) updateData.store_city = updates.storeCity;
    if (updates.storeCountry !== undefined) updateData.store_country = updates.storeCountry;
    if (updates.storeLocation !== undefined) updateData.store_location = updates.storeLocation;
    if (updates.businessHours !== undefined) updateData.business_hours = updates.businessHours;
    if (updates.establishedYear !== undefined) updateData.established_year = updates.establishedYear;
    if (updates.trustBadges !== undefined) updateData.trust_badges = updates.trustBadges;
    if (updates.specializations !== undefined) updateData.specializations = updates.specializations;
    if (updates.acceptedPayments !== undefined) updateData.accepted_payments = updates.acceptedPayments;
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
      boutiqueLogger.error('Error updating boutique:', error);
      return null;
    }

    return data ? mapDbToBoutique(data) : null;
  } catch (error) {
    boutiqueLogger.error('Error in updateBoutique:', error);
    return null;
  }
}

/**
 * Delete boutique (admin only)
 */
export async function deleteBoutique(boutiqueId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('boutiques')
      .delete()
      .eq('id', boutiqueId);

    if (error) {
      boutiqueLogger.error('Error deleting boutique:', error);
      return false;
    }

    return true;
  } catch (error) {
    boutiqueLogger.error('Error in deleteBoutique:', error);
    return false;
  }
}

/**
 * Ban boutique (sets it to unpublished and marks business as suspended)
 */
export async function banBoutique(boutiqueId: string): Promise<boolean> {
  try {
    // Get boutique to find business account
    const boutique = await getBoutiqueById(boutiqueId);
    if (!boutique) return false;

    // Unpublish the boutique
    const { error: boutiqueError } = await supabaseAdmin
      .from('boutiques')
      .update({ is_published: false, is_featured: false })
      .eq('id', boutiqueId);

    if (boutiqueError) {
      boutiqueLogger.error('Error banning boutique:', boutiqueError);
      return false;
    }

    // Suspend the business account
    const { error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .update({ status: 'SUSPENDED' })
      .eq('id', boutique.businessAccountId);

    if (businessError) {
      boutiqueLogger.error('Error suspending business account:', businessError);
      // Boutique is already unpublished, so partial success
    }

    return true;
  } catch (error) {
    boutiqueLogger.error('Error in banBoutique:', error);
    return false;
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
      boutiqueLogger.error('Error fetching boutiques:', error);
      return [];
    }

    return data ? data.map(mapDbToBoutique) : [];
  } catch (error) {
    boutiqueLogger.error('Error in getPublishedBoutiques:', error);
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
      .select(`
        *,
        categories:category_id (
          id,
          name
        ),
        product_images!left (
          image_url,
          display_order,
          is_primary
        )
      `)
      .eq('seller_id', boutique.business_account_id)
      .eq('is_active', true)
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
      boutiqueLogger.error('Error fetching boutique products:', error);
      return [];
    }

    // Map to Product type - define inline interface for DB product row
    interface DbBoutiqueProductRow {
      id: string;
      name: string;
      description: string | null;
      price: string | number;
      image_urls: string[] | null;
      product_images: DbProductImage[] | null;
      categories: { name: string } | null;
      category_id: string | null;
      stock: number | null;
      seller_id: string | null;
    }

    return (data || []).map((product: DbBoutiqueProductRow) => {
      const images = (Array.isArray(product.product_images) ? product.product_images : []) as DbProductImage[];
      const orderedImageUrls = images
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((img) => img.image_url);

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(String(product.price)),
        imageUrls: product.image_urls || [],
        productImages: orderedImageUrls,
        category: product.categories?.name || '',
        categoryId: product.category_id || '',
        stock: product.stock || 0,
        sellerId: product.seller_id,
      };
    });
  } catch (error) {
    boutiqueLogger.error('Error in getBoutiqueProducts:', error);
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
    boutiqueLogger.error('Error updating boutique stats:', error);
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
    boutiqueLogger.error('Error calculating commission:', error);
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
      boutiqueLogger.error('Error recording transaction:', error);
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
    boutiqueLogger.error('Error in recordSellerTransaction:', error);
    return false;
  }
}

