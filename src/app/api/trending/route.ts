import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order, Product } from '@/lib/types';

// Get top 15 trending products based on sales + admin-selected trending products
export async function GET() {
  try {
    // Get admin-selected trending products from site_settings
    const { data: settingsData } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'trending_products')
      .single();
    
    const adminSelectedIds: string[] = settingsData?.value?.productIds || [];
    
    // Get orders from last 30 days for trending calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('status', 'Cancelled');

    if (error) {
      console.error('Failed to fetch orders for trending:', error);
    }

    // Calculate top selling products
    const productSales = new Map<string, number>();
    
    if (orders && orders.length > 0) {
      orders.forEach((order: any) => {
        const orderData = order as Order;
        if (orderData.items && Array.isArray(orderData.items)) {
          orderData.items.forEach((item) => {
            const productId = item.product.id;
            const quantity = item.quantity;
            productSales.set(productId, (productSales.get(productId) || 0) + quantity);
          });
        }
      });
    }

    // Sort by sales and get top 15
    const topSellingIds = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([id]) => id);

    // Combine admin-selected + top selling (admin-selected takes priority)
    const allTrendingIds = [...new Set([...adminSelectedIds, ...topSellingIds])].slice(0, 15);

    // Fetch the actual products
    if (allTrendingIds.length === 0) {
      return NextResponse.json({ products: [], productIds: [] }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    const { data: products, error: productsError } = await supabaseAdmin
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
      .in('id', allTrendingIds)
      .eq('is_active', true);

    if (productsError) {
      console.error('Failed to fetch trending products:', productsError);
      return NextResponse.json({ products: [], productIds: [] }, { status: 500 });
    }

    // Map products and maintain order based on allTrendingIds
    const productMap = new Map(products?.map(p => [p.id, p]) || []);
    const orderedProducts = allTrendingIds
      .filter(id => productMap.has(id))
      .map(id => {
        const product = productMap.get(id)!;
        const images = Array.isArray(product.product_images) ? product.product_images : [];
        const orderedImageUrls = images
          .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((img: any) => img.image_url);

        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: parseFloat(product.price),
          imageUrls: product.image_urls || [],
          productImages: orderedImageUrls,
          category: product.categories?.name || '',
          categoryId: product.category_id || '',
          stock: product.stock || 0,
          sellerId: product.seller_id,
        };
      });

    return NextResponse.json(
      { 
        products: orderedProducts, 
        productIds: allTrendingIds 
      },
      {
        headers: {
          // Cache for 5 minutes, revalidate for 10 minutes
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Failed to get trending products:', error);
    return NextResponse.json({ products: [], productIds: [] }, { status: 500 });
  }
}
