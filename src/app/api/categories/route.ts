import { NextResponse } from 'next/server';
import { getCategories } from '@/services/productService';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Categories API');

export const runtime = 'nodejs';

/**
 * GET /api/categories
 * Fetches all product categories
 */
export async function GET() {
  try {
    logger.info('Fetching categories');

    const categories = await getCategories();

    logger.info('Categories fetched successfully', { count: categories.length });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    logger.error('Failed to fetch categories', error);

    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
