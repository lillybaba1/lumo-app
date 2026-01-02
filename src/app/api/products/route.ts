import { NextRequest, NextResponse } from 'next/server';
import { getProductsPaginated } from '@/services/productService';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || undefined;
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    const category = searchParams.get('category') || undefined;
    
    // Parse parameters
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    
    // Fetch paginated data
    const { data } = await getProductsPaginated({
      page,
      limit,
      search,
      category
    });
    
    // Return just the array for backward compatibility with existing components
    // that expect Product[] response
    return NextResponse.json(data, {
      headers: {
        // Allow browser caching for 60 seconds, revalidate in background for up to 5 minutes
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json([], { status: 500 });
  }
}
