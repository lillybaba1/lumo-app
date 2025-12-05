'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order, Product } from '@/lib/types';

type Collections = {
  bestSellers: string[];
  newArrivals: string[];
  deals: string[];
};

type AnalyticsSuggestion = {
  product: Product;
  unitsSold: number;
  revenue: number;
};

export async function getCollections(): Promise<Collections | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'homepage_collections')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return default empty collections
        return { bestSellers: [], newArrivals: [], deals: [] };
      }
      throw error;
    }

    return data?.value as Collections || { bestSellers: [], newArrivals: [], deals: [] };
  } catch (error) {
    console.error('Failed to get collections:', error);
    return { bestSellers: [], newArrivals: [], deals: [] };
  }
}

export async function saveCollections(collections: Collections) {
  try {
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'homepage_collections',
        value: collections,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
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
