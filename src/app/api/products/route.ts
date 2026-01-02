import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProductsPaginated } from '@/services/productService';
import { errors, paginated } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:Products');

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Input validation schema
const querySchema = z.object({
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  category: z.string().max(50).optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'name_asc', 'name_desc']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const params = querySchema.safeParse({
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || undefined,
      page: searchParams.get('page') || undefined,
      category: searchParams.get('category') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
    });
    
    if (!params.success) {
      return errors.validationError(params.error);
    }
    
    const { page, limit, search, category, categoryId, minPrice, maxPrice, sortBy } = params.data;
    
    // Fetch paginated data
    const { data, count } = await getProductsPaginated({
      page,
      limit,
      search,
      category,
      categoryId,
      minPrice,
      maxPrice,
      sortBy,
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
    apiLogger.error('Failed to fetch products', error as Error);
    return errors.serverError('Failed to fetch products');
  }
}
