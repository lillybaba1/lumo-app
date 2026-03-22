'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Product } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════
// JulaZone Intelligence Engine — Server-side recommendation logic
// ═══════════════════════════════════════════════════════════════════

type ActivityEvent = {
  event_type: string;
  product_id: string | null;
  category_id: string | null;
  search_query: string | null;
  created_at: string;
};

/**
 * Ensure the user_activity table exists. Uses service role to create if missing.
 * This is called lazily on first tracking call so the migration doesn't need to
 * be run manually.
 */
let tableVerified = false;
async function ensureTable() {
  if (tableVerified) return;
  try {
    const { error } = await supabaseAdmin.from('user_activity').select('id').limit(1);
    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      // Table doesn't exist — create it via raw SQL
      try {
        await supabaseAdmin.rpc('exec_sql', {
          query: `
            CREATE TABLE IF NOT EXISTS public.user_activity (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID,
              session_id TEXT,
              event_type TEXT NOT NULL,
              product_id UUID,
              category_id UUID,
              search_query TEXT,
              metadata JSONB DEFAULT '{}',
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_ua_user ON public.user_activity(user_id);
            CREATE INDEX IF NOT EXISTS idx_ua_product ON public.user_activity(product_id);
            CREATE INDEX IF NOT EXISTS idx_ua_event ON public.user_activity(event_type);
            CREATE INDEX IF NOT EXISTS idx_ua_created ON public.user_activity(created_at DESC);
          `
        });
      } catch {
        // exec_sql might not exist — that's fine, the migration file handles it
      }
    }
    tableVerified = true;
  } catch {
    tableVerified = true; // Don't block on errors
  }
}

// ─── Activity Tracking ───────────────────────────────────────────────────────

export async function trackActivity(params: {
  userId?: string | null;
  sessionId?: string | null;
  eventType: 'view' | 'cart_add' | 'purchase' | 'search' | 'wishlist_add' | 'wishlist_remove';
  productId?: string | null;
  categoryId?: string | null;
  searchQuery?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await ensureTable();
    const { error } = await supabaseAdmin.from('user_activity').insert({
      user_id: params.userId || null,
      session_id: params.sessionId || null,
      event_type: params.eventType,
      product_id: params.productId || null,
      category_id: params.categoryId || null,
      search_query: params.searchQuery || null,
      metadata: params.metadata || {},
    });
    if (error) {
      console.error('Track activity error:', error.message);
    }
  } catch (err) {
    // Non-blocking — never let tracking crash the app
    console.error('Track activity failed:', err);
  }
}

/** Increment product view_count in the products table */
export async function incrementViewCount(productId: string) {
  try {
    // Try RPC first (atomic), fall back to direct update
    const { error: rpcError } = await supabaseAdmin.rpc('increment_product_view_count', { pid: productId });
    if (rpcError) {
      // Fallback: direct update
      const { data: current } = await supabaseAdmin
        .from('products')
        .select('view_count')
        .eq('id', productId)
        .single();
      await supabaseAdmin
        .from('products')
        .update({ view_count: (current?.view_count || 0) + 1 })
        .eq('id', productId);
    }
  } catch {
    // Non-blocking
  }
}

/** Increment product sales_count for each item in an order */
export async function trackPurchase(userId: string | null, items: Array<{ product: { id: string }; quantity: number }>) {
  try {
    for (const item of items) {
      // Track activity
      await trackActivity({
        userId,
        eventType: 'purchase',
        productId: item.product.id,
        metadata: { quantity: item.quantity },
      });

      // Increment sales_count
      const { error: rpcError } = await supabaseAdmin.rpc('increment_product_sales_count', {
        pid: item.product.id,
        qty: item.quantity,
      });
      if (rpcError) {
        // Fallback: direct update
        const { data: current } = await supabaseAdmin
          .from('products')
          .select('sales_count')
          .eq('id', item.product.id)
          .single();
        await supabaseAdmin
          .from('products')
          .update({ sales_count: (current?.sales_count || 0) + item.quantity })
          .eq('id', item.product.id);
      }
    }
  } catch {
    // Non-blocking
  }
}

// ─── Personalized Recommendations (For You) ─────────────────────────────────

/**
 * Generate "For You" recommendations for a user based on:
 * 1. Recently viewed categories → show similar products
 * 2. Purchase history → collaborative filtering (users who bought X also bought Y)
 * 3. View patterns → products the user hasn't seen but are popular in viewed categories
 * 4. Trending boost → high-score products they haven't interacted with
 */
export async function getForYouRecommendations(
  userId: string,
  limit: number = 12,
): Promise<Product[]> {
  try {
    await ensureTable();

    // 1. Get user's recent activity (last 60 days)
    const { data: activity } = await supabaseAdmin
      .from('user_activity')
      .select('event_type, product_id, category_id, search_query, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(200);

    if (!activity || activity.length === 0) {
      // No activity — return trending products as fallback
      return getTrendingFallback(limit);
    }

    const events = activity as ActivityEvent[];

    // 2. Extract user's interests
    const viewedProductIds = new Set<string>();
    const purchasedProductIds = new Set<string>();
    const interestedCategories = new Map<string, number>(); // category → weight
    const searchTerms: string[] = [];

    for (const e of events) {
      if (e.product_id) {
        if (e.event_type === 'view') viewedProductIds.add(e.product_id);
        if (e.event_type === 'purchase') purchasedProductIds.add(e.product_id);
        if (e.event_type === 'cart_add') viewedProductIds.add(e.product_id);
      }
      if (e.category_id) {
        const weight = e.event_type === 'purchase' ? 5 : e.event_type === 'cart_add' ? 3 : 1;
        interestedCategories.set(e.category_id, (interestedCategories.get(e.category_id) || 0) + weight);
      }
      if (e.search_query) {
        searchTerms.push(e.search_query);
      }
    }

    // 3. If user viewed products but we don't know categories, look them up
    if (interestedCategories.size === 0 && viewedProductIds.size > 0) {
      const { data: viewedProducts } = await supabaseAdmin
        .from('products')
        .select('category_id')
        .in('id', Array.from(viewedProductIds).slice(0, 20));
      (viewedProducts || []).forEach(p => {
        if (p.category_id) {
          interestedCategories.set(p.category_id, (interestedCategories.get(p.category_id) || 0) + 1);
        }
      });
    }

    // 4. Get all products in interested categories that user hasn't seen
    const alreadyInteracted = new Set([...viewedProductIds, ...purchasedProductIds]);
    const topCategories = Array.from(interestedCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([catId]) => catId);

    let candidateProducts: any[] = [];

    if (topCategories.length > 0) {
      const { data } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          categories:category_id (id, name),
          product_images!left (image_url, display_order, is_primary)
        `)
        .eq('is_active', true)
        .in('category_id', topCategories)
        .order('sales_count', { ascending: false, nullsFirst: false })
        .limit(limit * 3);
      candidateProducts = data || [];
    }

    // 5. Also get top-rated products user hasn't seen (diversity)
    const { data: topRated } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (id, name),
        product_images!left (image_url, display_order, is_primary)
      `)
      .eq('is_active', true)
      .gt('average_rating', 0)
      .order('average_rating', { ascending: false })
      .limit(limit);

    candidateProducts = [...candidateProducts, ...(topRated || [])];

    // 6. Score and rank candidates
    const seen = new Set<string>();
    const scored = candidateProducts
      .filter(p => {
        if (seen.has(p.id) || alreadyInteracted.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .map(p => {
        let score = 0;
        // Category match boost
        const catWeight = interestedCategories.get(p.category_id) || 0;
        score += catWeight * 10;
        // Popularity
        score += (p.sales_count || 0) * 2;
        score += (p.view_count || 0) * 0.3;
        // Rating
        score += (p.average_rating || 0) * (p.review_count || 0) * 2;
        // Recency
        const ageDays = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays < 7) score += 15;
        else if (ageDays < 30) score += 5;
        // Stock
        if ((p.stock || 0) === 0) score -= 30;

        return { product: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => mapProduct(s.product));

    // If not enough, fill with trending
    if (scored.length < limit) {
      const fallback = await getTrendingFallback(limit - scored.length, alreadyInteracted);
      return [...scored, ...fallback];
    }

    return scored;
  } catch (err) {
    console.error('getForYouRecommendations error:', err);
    return getTrendingFallback(limit);
  }
}

// ─── "Customers Also Viewed" ─────────────────────────────────────────────────

/**
 * Find products that were viewed by users who also viewed the given product.
 * Classic collaborative filtering via view co-occurrence.
 */
export async function getAlsoViewed(
  productId: string,
  limit: number = 6,
): Promise<Product[]> {
  try {
    await ensureTable();

    // Get users who viewed this product
    const { data: viewers } = await supabaseAdmin
      .from('user_activity')
      .select('user_id')
      .eq('product_id', productId)
      .eq('event_type', 'view')
      .not('user_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(50);

    if (!viewers || viewers.length === 0) {
      return getSameCategoryProducts(productId, limit);
    }

    const viewerIds = [...new Set(viewers.map(v => v.user_id))].slice(0, 20);

    // Get other products those users viewed
    const { data: coViewed } = await supabaseAdmin
      .from('user_activity')
      .select('product_id')
      .in('user_id', viewerIds)
      .eq('event_type', 'view')
      .neq('product_id', productId)
      .not('product_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(200);

    if (!coViewed || coViewed.length === 0) {
      return getSameCategoryProducts(productId, limit);
    }

    // Count co-occurrences
    const counts = new Map<string, number>();
    coViewed.forEach(v => {
      if (v.product_id) counts.set(v.product_id, (counts.get(v.product_id) || 0) + 1);
    });

    const topIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (topIds.length === 0) return getSameCategoryProducts(productId, limit);

    const { data: products } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (id, name),
        product_images!left (image_url, display_order, is_primary)
      `)
      .in('id', topIds)
      .eq('is_active', true);

    // Maintain order by co-occurrence count
    const productMap = new Map((products || []).map(p => [p.id, p]));
    return topIds
      .filter(id => productMap.has(id))
      .map(id => mapProduct(productMap.get(id)!));
  } catch (err) {
    console.error('getAlsoViewed error:', err);
    return getSameCategoryProducts(productId, limit);
  }
}

// ─── "Frequently Bought Together" ────────────────────────────────────────────

/**
 * Find products that appear in the same orders as the given product.
 */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit: number = 4,
): Promise<Product[]> {
  try {
    // Try RPC first (more efficient)
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      'get_frequently_bought_together',
      { target_product_id: productId, max_results: limit }
    );

    if (!rpcError && rpcResult && rpcResult.length > 0) {
      const ids = rpcResult.map((r: any) => r.product_id);
      const { data: products } = await supabaseAdmin
        .from('products')
        .select(`*, categories:category_id (id, name), product_images!left (image_url, display_order, is_primary)`)
        .in('id', ids)
        .eq('is_active', true);

      const productMap = new Map((products || []).map(p => [p.id, p]));
      return ids.filter((id: string) => productMap.has(id)).map((id: string) => mapProduct(productMap.get(id)!));
    }

    // Fallback: manual co-purchase analysis from orders table
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('items')
      .neq('status', 'Cancelled')
      .limit(500);

    if (!orders || orders.length === 0) return getSameCategoryProducts(productId, limit);

    const coProducts = new Map<string, number>();
    orders.forEach((order: any) => {
      if (!order.items || !Array.isArray(order.items)) return;
      const itemIds = order.items.map((i: any) => i.product?.id || i.id).filter(Boolean);
      if (!itemIds.includes(productId)) return;
      itemIds.forEach((id: string) => {
        if (id !== productId) coProducts.set(id, (coProducts.get(id) || 0) + 1);
      });
    });

    const topIds = Array.from(coProducts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (topIds.length === 0) return getSameCategoryProducts(productId, limit);

    const { data: products } = await supabaseAdmin
      .from('products')
      .select(`*, categories:category_id (id, name), product_images!left (image_url, display_order, is_primary)`)
      .in('id', topIds)
      .eq('is_active', true);

    const productMap = new Map((products || []).map(p => [p.id, p]));
    return topIds.filter(id => productMap.has(id)).map(id => mapProduct(productMap.get(id)!));
  } catch (err) {
    console.error('getFrequentlyBoughtTogether error:', err);
    return getSameCategoryProducts(productId, limit);
  }
}

// ─── "Because You Viewed X" ─────────────────────────────────────────────────

/**
 * Gets similar products to a specific product (same category, similar price).
 * Used for "Because you viewed [Product Name]" sections.
 */
export async function getBecauseYouViewed(
  productId: string,
  limit: number = 6,
): Promise<{ sourceProduct: { id: string; name: string }; products: Product[] } | null> {
  try {
    // Get the source product
    const { data: source } = await supabaseAdmin
      .from('products')
      .select('id, name, price, category_id')
      .eq('id', productId)
      .single();

    if (!source) return null;

    // Find similar products (same category, similar price range ±50%)
    const minPrice = source.price * 0.5;
    const maxPrice = source.price * 1.5;

    const { data: similar } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (id, name),
        product_images!left (image_url, display_order, is_primary)
      `)
      .eq('is_active', true)
      .eq('category_id', source.category_id)
      .neq('id', productId)
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .order('sales_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (!similar || similar.length === 0) return null;

    return {
      sourceProduct: { id: source.id, name: source.name },
      products: similar.map(mapProduct),
    };
  } catch {
    return null;
  }
}

// ─── User's Recent View History (server-side) ────────────────────────────────

export async function getUserRecentlyViewed(userId: string, limit: number = 8): Promise<Product[]> {
  try {
    await ensureTable();

    const { data: views } = await supabaseAdmin
      .from('user_activity')
      .select('product_id')
      .eq('user_id', userId)
      .eq('event_type', 'view')
      .not('product_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Get extra to account for deduplication

    if (!views || views.length === 0) return [];

    // Deduplicate, maintain order
    const seen = new Set<string>();
    const uniqueIds: string[] = [];
    for (const v of views) {
      if (v.product_id && !seen.has(v.product_id)) {
        seen.add(v.product_id);
        uniqueIds.push(v.product_id);
        if (uniqueIds.length >= limit) break;
      }
    }

    const { data: products } = await supabaseAdmin
      .from('products')
      .select(`*, categories:category_id (id, name), product_images!left (image_url, display_order, is_primary)`)
      .in('id', uniqueIds)
      .eq('is_active', true);

    const productMap = new Map((products || []).map(p => [p.id, p]));
    return uniqueIds.filter(id => productMap.has(id)).map(id => mapProduct(productMap.get(id)!));
  } catch {
    return [];
  }
}

// ─── Trending Search Suggestions ─────────────────────────────────────────────

export async function getTrendingSearches(limit: number = 5): Promise<string[]> {
  try {
    await ensureTable();

    const { data } = await supabaseAdmin
      .from('user_activity')
      .select('search_query')
      .eq('event_type', 'search')
      .not('search_query', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(200);

    if (!data || data.length === 0) return [];

    const counts = new Map<string, number>();
    data.forEach(row => {
      const q = (row.search_query || '').toLowerCase().trim();
      if (q.length >= 2) counts.set(q, (counts.get(q) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([q]) => q);
  } catch {
    return [];
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getTrendingFallback(limit: number, exclude?: Set<string>): Promise<Product[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select(`*, categories:category_id (id, name), product_images!left (image_url, display_order, is_primary)`)
    .eq('is_active', true)
    .order('view_count', { ascending: false, nullsFirst: false })
    .limit(limit + (exclude?.size || 0));

  return (data || [])
    .filter(p => !exclude || !exclude.has(p.id))
    .slice(0, limit)
    .map(mapProduct);
}

async function getSameCategoryProducts(productId: string, limit: number): Promise<Product[]> {
  const { data: source } = await supabaseAdmin
    .from('products')
    .select('category_id')
    .eq('id', productId)
    .single();

  if (!source?.category_id) return [];

  const { data } = await supabaseAdmin
    .from('products')
    .select(`*, categories:category_id (id, name), product_images!left (image_url, display_order, is_primary)`)
    .eq('is_active', true)
    .eq('category_id', source.category_id)
    .neq('id', productId)
    .order('sales_count', { ascending: false, nullsFirst: false })
    .limit(limit);

  return (data || []).map(mapProduct);
}

function mapProduct(p: any): Product {
  const images = Array.isArray(p.product_images) ? p.product_images : [];
  const orderedImageUrls = images
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((img: any) => img.image_url);

  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: parseFloat(p.price),
    imageUrls: p.image_urls || [],
    productImages: orderedImageUrls,
    category: p.categories?.name || '',
    categoryId: p.category_id || '',
    stock: p.stock || 0,
    sellerId: p.seller_id,
    sellerName: p.business_accounts?.business_name,
    viewCount: p.view_count || 0,
    salesCount: p.sales_count || 0,
    averageRating: p.average_rating || 0,
    reviewCount: p.review_count || 0,
    isFeatured: p.is_featured || false,
    createdAt: p.created_at,
  };
}
