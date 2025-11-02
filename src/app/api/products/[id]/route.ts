import { NextResponse } from 'next/server';
import { getProductById } from '@/services/productService';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Product API');

export const runtime = 'nodejs';

/**
 * GET /api/products/[id]
 * Fetches a single product by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.info('Fetching product', { id });

    const product = await getProductById(id);

    if (!product) {
      logger.warn('Product not found', { id });
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    logger.info('Product fetched successfully', { id, name: product.name });

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    logger.error('Failed to fetch product', error);

    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
