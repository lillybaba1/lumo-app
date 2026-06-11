import { NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCollections } from '@/app/admin/collections/actions';

/**
 * GET /api/admin/smart-placement
 * Returns scored product data for the admin Smart Placement dashboard.
 * Shows how each product is ranked and which sections it appears in.
 */
export async function GET() {
  try {
    await requireAdmin({ redirect: false });

    const [productsResult, ordersResult, collectionsData, trendingSettings] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select(`
          id, name, price, image_urls, 
          product_images!left (image_url, display_order, is_primary),
          view_count, sales_count, average_rating, review_count,
          is_featured, is_active, stock, created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),

      supabaseAdmin
        .from('orders')
        .select('items, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .neq('status', 'Cancelled'),

      getCollections().catch(() => ({ bestSellers: [], newArrivals: [], deals: [], featured: [] })),

      Promise.resolve(
        supabaseAdmin
          .from('site_settings')
          .select('value')
          .eq('key', 'trending_products')
          .single()
          .then(({ data }) => data?.value?.productIds || [])
      ).catch(() => []),
    ]);

    const products = productsResult.data || [];
    const orders = ordersResult.data || [];
    const collections = collectionsData || { bestSellers: [], newArrivals: [], deals: [], featured: [] };
    const adminTrendingIds: string[] = trendingSettings || [];

    // Calculate recent sales from orders
    const recentSales = new Map<string, number>();
    (orders as any[]).forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const pid = item.product?.id;
          if (pid) recentSales.set(pid, (recentSales.get(pid) || 0) + (item.quantity || 1));
        });
      }
    });

    const now = Date.now();

    // Score each product using the same engine as the homepage
    const scored = products.map((p: any) => {
      const ageHours = (now - new Date(p.created_at).getTime()) / (1000 * 60 * 60);
      const ageDays = ageHours / 24;

      const salesScore = (recentSales.get(p.id) || p.sales_count || 0) * 10;
      const viewScore = (p.view_count || 0) * 0.5;
      const ratingScore = (p.average_rating || 0) * (p.review_count || 0) * 3;
      const recencyBoost = ageDays < 7 ? 30 : ageDays < 14 ? 20 : ageDays < 30 ? 10 : 0;
      const stockPenalty = (p.stock || 0) === 0 ? -50 : 0;
      const featuredBoost = p.is_featured ? 15 : 0;
      const totalScore = salesScore + viewScore + ratingScore + recencyBoost + stockPenalty + featuredBoost;

      // Get the best image
      const images = Array.isArray(p.product_images) ? p.product_images : [];
      const sortedImages = images.sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
      const imageUrl = sortedImages[0]?.image_url || (p.image_urls && p.image_urls[0]) || '';

      return {
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        imageUrl,
        viewCount: p.view_count || 0,
        salesCount: (recentSales.get(p.id) || 0) + (p.sales_count || 0),
        averageRating: p.average_rating || 0,
        reviewCount: p.review_count || 0,
        isFeatured: p.is_featured || false,
        createdAt: p.created_at,
        stock: p.stock || 0,
        score: totalScore,
        ageDays,
      };
    });

    // Sort by score
    scored.sort((a: any, b: any) => b.score - a.score);

    // Build sections using the same logic as homepage API
    const trendingIds = buildSectionIds(adminTrendingIds, scored.map((s: any) => s.id), 12);

    const bestSellerCandidates = scored
      .filter((s: any) => s.salesCount > 0)
      .sort((a: any, b: any) => b.salesCount - a.salesCount)
      .map((s: any) => s.id);
    const bestSellerIds = buildSectionIds(collections.bestSellers || [], bestSellerCandidates, 10);

    const newArrivalCandidates = scored
      .filter((s: any) => s.ageDays < 30)
      .sort((a: any, b: any) => a.ageDays - b.ageDays)
      .map((s: any) => s.id);
    const newArrivalIds = buildSectionIds(collections.newArrivals || [], newArrivalCandidates, 10);

    const dealCandidates = scored
      .filter((s: any) => s.isFeatured || s.score > 20)
      .map((s: any) => s.id);
    const dealIds = buildSectionIds(collections.deals || [], dealCandidates, 10);

    // Annotate which sections each product appears in
    const trendingSet = new Set(trendingIds);
    const bestSellerSet = new Set(bestSellerIds);
    const newArrivalSet = new Set(newArrivalIds);
    const dealSet = new Set(dealIds);

    const productsWithPlacement = scored.map((s: any) => {
      const placement: string[] = [];
      if (trendingSet.has(s.id)) placement.push('trending');
      if (bestSellerSet.has(s.id)) placement.push('bestSellers');
      if (newArrivalSet.has(s.id)) placement.push('newArrivals');
      if (dealSet.has(s.id)) placement.push('deals');
      return { ...s, placement, ageDays: undefined };
    });

    // Stats
    const stats = {
      totalProducts: products.length,
      totalViews: products.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0),
      totalSales: products.reduce((sum: number, p: any) => sum + (p.sales_count || 0), 0) +
        Array.from(recentSales.values()).reduce((sum, v) => sum + v, 0),
      avgRating: products.length > 0
        ? products.reduce((sum: number, p: any) => sum + (p.average_rating || 0), 0) / products.length
        : 0,
    };

    return NextResponse.json({
      products: productsWithPlacement,
      sections: {
        trending: trendingIds,
        bestSellers: bestSellerIds,
        newArrivals: newArrivalIds,
        deals: dealIds,
      },
      stats,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Smart placement API error:', error);
    return NextResponse.json({ products: [], sections: {}, stats: {} }, { status: 500 });
  }
}

function buildSectionIds(adminIds: string[], smartIds: string[], max: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of adminIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= max) return result;
  }

  for (const id of smartIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= max) return result;
  }

  return result;
}
