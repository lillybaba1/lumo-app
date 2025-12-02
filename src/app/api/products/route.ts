import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/services/productService';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim();
    const limit = searchParams.get('limit');
    const category = searchParams.get('category');
    
    let products = await getProducts();
    
    // Filter by search query
    if (search && search.length > 0) {
      products = products.filter((product: { name?: string; description?: string; category?: string; tags?: string[] }) => {
        const name = (product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const productCategory = (product.category || '').toLowerCase();
        const tags = (product.tags || []).map((t: string) => t.toLowerCase());
        
        return (
          name.includes(search) ||
          description.includes(search) ||
          productCategory.includes(search) ||
          tags.some((tag: string) => tag.includes(search))
        );
      });
    }
    
    // Filter by category
    if (category) {
      products = products.filter((product: { category?: string }) => 
        (product.category || '').toLowerCase() === category.toLowerCase()
      );
    }
    
    // Limit results
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        products = products.slice(0, limitNum);
      }
    }
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json([], { status: 500 });
  }
}
