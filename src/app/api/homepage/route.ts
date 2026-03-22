import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCategories } from '@/services/categoryService';
import { getCollections } from '@/app/admin/collections/actions';
import { getHeroData } from '@/app/admin/hero/actions';
import { DEFAULT_PROMO_BANNER_SETTINGS } from '@/lib/types';
import type { Product } from '@/lib/types';

/**
 * GET /api/homepage
 * Single aggregated endpoint for all homepage data.
 * 
 * Philosophy:
 *   - ALL active products are shown on the homepage (marketplace model)
 *   - Admin manually picks products for collections (best sellers, new arrivals, deals)
 *   - Smart engine auto-fills trending + suggests for empty collections
 *   - Admin picks always take priority over smart suggestions
 */
export async function GET() {
  try {
    const [
      settingsResult,
      heroData,
      categoriesData,
      collectionsData,
      promoBannerResult,
      allProductsRaw,
      ordersData,
    ] = await Promise.all([
      // 1. Site settings
      Promise.resolve(
        supabaseAdmin
          .from('site_settings')
          .select('key, value')
          .in('key', ['site_settings', 'promo_banner_settings', 'trending_products'])
          .then(({ data }) => {
            const map: Record<string, any> = {};
            (data || []).forEach(row => { map[row.key] = row.value; });
            return map;
          })
      ).catch(() => ({})),

      // 2. Hero data
      getHeroData().catch(() => null),

      // 3. Categories
      getCategories().catch(() => []),

      // 4. Collections (admin-curated: best sellers, new arrivals, deals, featured)
      getCollections().catch(() => ({ bestSellers: [], newArrivals: [], deals: [], featured: [] })),

      // 5. Promo banner
      Promise.resolve(
        supabaseAdmin
          .from('site_settings')
          .select('value')
          .eq('key', 'promo_banner_settings')
          .single()
          .then(({ data, error }) => {
            if (error) return DEFAULT_PROMO_BANNER_SETTINGS;
            return { ...DEFAULT_PROMO_BANNER_SETTINGS, ...data?.value };
          })
      ).catch(() => DEFAULT_PROMO_BANNER_SETTINGS),

      // 6. ALL active products (marketplace: every seller's product is shown)
      Promise.resolve(
        supabaseAdmin
          .from('products')
          .select(`
            *,
            categories:category_id (id, name),
            product_images!left (image_url, display_order, is_primary)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .then(({ data }) => data || [])
      ).catch(() => [] as any[]),

      // 7. Recent orders for smart scoring (last 30 days)
      Promise.resolve(
        supabaseAdmin
          .from('orders')
          .select('items, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .neq('status', 'Cancelled')
          .then(({ data }) => data || [])
      ).catch(() => [] as any[]),
    ]);

    // Map all products
    const allProducts = (allProductsRaw as any[]).map(mapProduct);
    const allProductsWithMeta = (allProductsRaw as any[]).map(p => ({
      mapped: mapProduct(p),
      raw: p,
    }));

    // ─── Smart Product Scoring Engine ────────────────────────────────────────
    // Computes a score for each product based on multiple signals.
    // Admin picks always override, this fills gaps intelligently.

    const recentSales = new Map<string, number>();
    (ordersData as any[]).forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const pid = item.product?.id;
          if (pid) recentSales.set(pid, (recentSales.get(pid) || 0) + (item.quantity || 1));
        });
      }
    });

    const now = Date.now();
    const scoredProducts = allProductsWithMeta.map(({ mapped, raw }) => {
      const ageHours = (now - new Date(raw.created_at).getTime()) / (1000 * 60 * 60);
      const ageDays = ageHours / 24;

      // Scoring weights
      const salesScore = (recentSales.get(mapped.id) || raw.sales_count || 0) * 10;
      const viewScore = (raw.view_count || 0) * 0.5;
      const ratingScore = (raw.average_rating || 0) * (raw.review_count || 0) * 3;
      const recencyBoost = ageDays < 7 ? 30 : ageDays < 14 ? 20 : ageDays < 30 ? 10 : 0;
      const stockPenalty = (raw.stock || 0) === 0 ? -50 : 0;
      const featuredBoost = raw.is_featured ? 15 : 0;

      const totalScore = salesScore + viewScore + ratingScore + recencyBoost + stockPenalty + featuredBoost;

      return { product: mapped, raw, score: totalScore, ageDays };
    });

    // Sort by score descending
    const ranked = scoredProducts.sort((a, b) => b.score - a.score);

    // ─── Build Smart Sections ────────────────────────────────────────────────
    // Admin picks first, then smart engine fills the rest

    const siteSettings = (settingsResult as Record<string, any>)['site_settings'] || {};
    const adminTrendingIds: string[] = (settingsResult as Record<string, any>)['trending_products']?.productIds || [];
    const collections = collectionsData || { bestSellers: [], newArrivals: [], deals: [], featured: [] };

    const productLookup = new Map(allProducts.map(p => [p.id, p]));

    // TRENDING: admin picks + smart top scorers
    const trendingProducts = buildSection(
      adminTrendingIds,
      ranked.map(r => r.product.id),
      productLookup,
      12
    );

    // BEST SELLERS: admin picks + top by sales_count
    const bestSellerIds = ranked
      .filter(r => (recentSales.get(r.product.id) || r.raw.sales_count || 0) > 0)
      .sort((a, b) => {
        const aSales = (recentSales.get(a.product.id) || 0) + (a.raw.sales_count || 0);
        const bSales = (recentSales.get(b.product.id) || 0) + (b.raw.sales_count || 0);
        return bSales - aSales;
      })
      .map(r => r.product.id);
    const smartBestSellers = buildSection(
      collections.bestSellers || [],
      bestSellerIds,
      productLookup,
      10
    ).map(p => p.id);

    // NEW ARRIVALS: admin picks + newest products (< 30 days)
    const newArrivalIds = ranked
      .filter(r => r.ageDays < 30)
      .sort((a, b) => a.ageDays - b.ageDays)
      .map(r => r.product.id);
    const smartNewArrivals = buildSection(
      collections.newArrivals || [],
      newArrivalIds,
      productLookup,
      10
    ).map(p => p.id);

    // DEALS: admin picks + products with high view-to-sale ratio or featured
    const dealIds = ranked
      .filter(r => r.raw.is_featured || r.score > 20)
      .map(r => r.product.id);
    const smartDeals = buildSection(
      collections.deals || [],
      dealIds,
      productLookup,
      10
    ).map(p => p.id);

    const smartCollections = {
      bestSellers: smartBestSellers,
      newArrivals: smartNewArrivals,
      deals: smartDeals,
      featured: collections.featured || [],
    };

    // Collect all products referenced by collections for the collectionProducts field
    const collectionProductIds = new Set<string>();
    [...smartBestSellers, ...smartNewArrivals, ...smartDeals, ...(collections.featured || [])].forEach(id => collectionProductIds.add(id));
    const collectionProducts = Array.from(collectionProductIds)
      .map(id => productLookup.get(id))
      .filter(Boolean) as Product[];

    return NextResponse.json({
      settings: siteSettings,
      hero: heroData,
      categories: categoriesData,
      collections: smartCollections,
      collectionProducts,
      trendingProducts,
      products: allProducts,
      promoBanner: promoBannerResult,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Homepage API error:', error);
    return NextResponse.json({
      settings: {},
      hero: null,
      categories: [],
      collections: { bestSellers: [], newArrivals: [], deals: [], featured: [] },
      collectionProducts: [],
      trendingProducts: [],
      products: [],
      promoBanner: DEFAULT_PROMO_BANNER_SETTINGS,
    }, { status: 200 });
  }
}

/**
 * Build a section: admin picks first, then smart suggestions fill remaining slots.
 * Admin-selected IDs always take priority. Smart IDs fill empty slots.
 */
function buildSection(
  adminIds: string[],
  smartIds: string[],
  lookup: Map<string, Product>,
  maxItems: number
): Product[] {
  const seen = new Set<string>();
  const result: Product[] = [];

  // 1. Admin picks first (verified to exist & active)
  for (const id of adminIds) {
    if (seen.has(id)) continue;
    const p = lookup.get(id);
    if (p) { result.push(p); seen.add(id); }
    if (result.length >= maxItems) return result;
  }

  // 2. Smart suggestions fill remaining slots
  for (const id of smartIds) {
    if (seen.has(id)) continue;
    const p = lookup.get(id);
    if (p) { result.push(p); seen.add(id); }
    if (result.length >= maxItems) return result;
  }

  return result;
}

/** Map a DB product row to our Product type */
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
    // Smart placement fields
    viewCount: p.view_count || 0,
    salesCount: p.sales_count || 0,
    averageRating: p.average_rating || 0,
    reviewCount: p.review_count || 0,
    isFeatured: p.is_featured || false,
    createdAt: p.created_at,
  };
}
