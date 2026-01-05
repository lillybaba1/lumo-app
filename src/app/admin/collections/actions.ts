'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order, Product, HeroData, HeroProduct } from '@/lib/types';

type Collections = {
  bestSellers: string[];
  newArrivals: string[];
  deals: string[];
  featured: string[];
};

type AnalyticsSuggestion = {
  product: Product;
  unitsSold: number;
  revenue: number;
};

// Helper to get hero data (for syncing featured products)
async function getHeroDataInternal(): Promise<HeroData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'hero_data')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.value as HeroData || null;
  } catch (error) {
    console.error('Failed to get hero data:', error);
    return null;
  }
}

export async function getCollections(): Promise<Collections | null> {
  try {
    // Fetch both collections and hero_data in parallel
    const [collectionsResult, heroData] = await Promise.all([
      supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'homepage_collections')
        .single(),
      getHeroDataInternal()
    ]);

    let collections: Collections = { bestSellers: [], newArrivals: [], deals: [], featured: [] };

    if (!collectionsResult.error) {
      collections = collectionsResult.data?.value as Collections || collections;
    } else if (collectionsResult.error.code !== 'PGRST116') {
      throw collectionsResult.error;
    }

    // Sync featured from hero_data if collections.featured is empty but hero has products
    if (heroData?.products && heroData.products.length > 0) {
      const heroProductIds = heroData.products.map((hp: HeroProduct) => hp.productId);
      // Merge: include hero products in featured if not already present
      const existingFeatured = new Set(collections.featured || []);
      heroProductIds.forEach((id: string) => existingFeatured.add(id));
      collections.featured = Array.from(existingFeatured);
    }

    return collections;
  } catch (error) {
    console.error('Failed to get collections:', error);
    return { bestSellers: [], newArrivals: [], deals: [], featured: [] };
  }
}

export async function saveCollections(collections: Collections) {
  try {
    // Save collections
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'homepage_collections',
        value: collections,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Also sync featured products to hero_data
    if (collections.featured && collections.featured.length > 0) {
      const heroData = await getHeroDataInternal();
      
      // Get existing hero products
      const existingHeroProducts = heroData?.products || [];
      const existingProductIds = new Set(existingHeroProducts.map((hp: HeroProduct) => hp.productId));
      
      // Add new featured products to hero_data (with default positions)
      let nextOrder = existingHeroProducts.length;
      const newHeroProducts: HeroProduct[] = [];
      
      collections.featured.forEach((productId, index) => {
        if (!existingProductIds.has(productId)) {
          // Add new product with grid-like default positions
          const row = Math.floor(index / 4);
          const col = index % 4;
          newHeroProducts.push({
            id: `hero-${productId}-${Date.now()}`,
            productId,
            position: { x: 10 + (col * 22), y: 55 + (row * 15) },
            size: { width: 80, height: 80 },
            displayOrder: nextOrder++,
            createdAt: new Date().toISOString()
          });
        }
      });
      
      if (newHeroProducts.length > 0) {
        const updatedHeroData: HeroData = {
          products: [...existingHeroProducts, ...newHeroProducts],
          heroLabelText: heroData?.heroLabelText || 'Featured',
          heroLabelPosition: heroData?.heroLabelPosition || { x: 10, y: 15 }
        };
        
        await supabaseAdmin
          .from('site_settings')
          .upsert({
            key: 'hero_data',
            value: updatedHeroData,
            updated_at: new Date().toISOString()
          });
      }
    }
  } catch (error) {
    console.error('Failed to save collections:', error);
    throw new Error('Failed to save collections.');
  }
}

export async function getBestSellersAnalytics(): Promise<AnalyticsSuggestion[]> {
  try {
    // Get orders from last 90 days (excluding cancelled orders)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .gte('created_at', ninetyDaysAgo.toISOString())
      .neq('status', 'Cancelled');

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return [];
    }

    // Aggregate sales data by product
    const productSales = new Map<string, { product: Product; unitsSold: number; revenue: number }>();

    orders.forEach((order: any) => {
      const orderData = order as Order;

      if (orderData.items && Array.isArray(orderData.items)) {
        orderData.items.forEach((item) => {
          const productId = item.product.id;
          const quantity = item.quantity;
          const itemRevenue = item.product.price * quantity;

          if (productSales.has(productId)) {
            const existing = productSales.get(productId)!;
            existing.unitsSold += quantity;
            existing.revenue += itemRevenue;
          } else {
            productSales.set(productId, {
              product: item.product,
              unitsSold: quantity,
              revenue: itemRevenue
            });
          }
        });
      }
    });

    // Convert to array and sort by units sold (descending)
    const analytics = Array.from(productSales.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 20); // Return top 20 best sellers

    return analytics;
  } catch (error) {
    console.error('Failed to get best sellers analytics:', error);
    return [];
  }
}

// Trending products management
export async function getTrendingProducts(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'trending_products')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return []; // No data found
      }
      throw error;
    }

    return data?.value?.productIds || [];
  } catch (error) {
    console.error('Failed to get trending products:', error);
    return [];
  }
}

export async function saveTrendingProducts(productIds: string[]) {
  try {
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'trending_products',
        value: { productIds },
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save trending products:', error);
    throw new Error('Failed to save trending products.');
  }
}
