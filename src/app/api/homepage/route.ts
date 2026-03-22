import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCategories } from '@/services/categoryService';
import { getCollections } from '@/app/admin/collections/actions';
import { getHeroData } from '@/app/admin/hero/actions';
import { DEFAULT_PROMO_BANNER_SETTINGS } from '@/lib/types';
import type { Order, Product } from '@/lib/types';

/**
 * GET /api/homepage
 * Single aggregated endpoint for all homepage data.
 * Replaces 7 separate API calls with 1 server-side fetch.
 */
export async function GET() {
  try {
    // Fetch ALL homepage data in parallel — single round-trip
    const [
      settingsResult,
      heroData,
      categoriesData,
      collectionsData,
      trendingData,
      promoBannerResult,
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

      // 4. Collections (best sellers, new arrivals, deals, featured)
      getCollections().catch(() => ({ bestSellers: [], newArrivals: [], deals: [], featured: [] })),

      // 5. Trending products (top 8 for homepage)
      getTrendingProducts().catch(() => []),

      // 6. Promo banner
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
    ]);

    // Get general site settings from the flat key-value store
    const siteSettings = (settingsResult as Record<string, any>)['site_settings'] || {};

    // Fetch products for collections (only the IDs we need, max ~30 products)
    const allCollectionIds = new Set<string>();
    const collections = collectionsData || { bestSellers: [], newArrivals: [], deals: [], featured: [] };
    [...(collections.bestSellers || []), ...(collections.newArrivals || []), ...(collections.deals || [])].forEach(id => allCollectionIds.add(id));

    let collectionProducts: Product[] = [];
    if (allCollectionIds.size > 0) {
      const { data } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          categories:category_id (id, name),
          product_images!left (image_url, display_order, is_primary)
        `)
        .in('id', Array.from(allCollectionIds))
        .eq('is_active', true);

      collectionProducts = (data || []).map(mapProduct);
    }

    // Fetch recent active products for category sections and general browsing
    // Exclude IDs we already have to avoid duplicates
    const existingIds = new Set([
      ...collectionProducts.map(p => p.id),
      ...(trendingData || []).map((p: Product) => p.id),
    ]);

    const { data: recentProducts } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (id, name),
        product_images!left (image_url, display_order, is_primary)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(40);

    const allProducts = [
      ...(trendingData || []),
      ...collectionProducts,
      ...(recentProducts || [])
        .map(mapProduct)
        .filter(p => !existingIds.has(p.id)),
    ];

    // Build response
    return NextResponse.json({
      settings: siteSettings,
      hero: heroData,
      categories: categoriesData,
      collections,
      collectionProducts,
      trendingProducts: trendingData,
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

/** Get top 8 trending products for the homepage */
async function getTrendingProducts(): Promise<Product[]> {
  // Get admin-selected trending products
  const { data: settingsData } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'trending_products')
    .single();

  const adminSelectedIds: string[] = settingsData?.value?.productIds || [];

  // Get orders from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('items')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .neq('status', 'Cancelled');

  // Calculate top sellers
  const productSales = new Map<string, number>();
  (orders || []).forEach((order: any) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const productId = item.product?.id;
        if (productId) {
          productSales.set(productId, (productSales.get(productId) || 0) + (item.quantity || 1));
        }
      });
    }
  });

  const topSellingIds = Array.from(productSales.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  const allIds = [...new Set([...adminSelectedIds, ...topSellingIds])].slice(0, 8);

  if (allIds.length === 0) {
    // Fallback: get newest active products
    const { data } = await supabaseAdmin
      .from('products')
      .select(`*, categories:category_id (id, name), product_images!left (image_url, display_order, is_primary)`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);

    return (data || []).map(mapProduct);
  }

  const { data: products } = await supabaseAdmin
    .from('products')
    .select(`*, categories:category_id (id, name), product_images!left (image_url, display_order, is_primary)`)
    .in('id', allIds)
    .eq('is_active', true);

  // Maintain priority order
  const productMap = new Map((products || []).map(p => [p.id, p]));
  return allIds.filter(id => productMap.has(id)).map(id => mapProduct(productMap.get(id)!));
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
  };
}
