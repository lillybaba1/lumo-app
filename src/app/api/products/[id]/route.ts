
import { NextResponse } from 'next/server';
import { getProductById } from '@/services/productService';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(
      { product },
      {
        headers: {
          // Cache individual product for 60 seconds, revalidate for 5 minutes
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error(`Error fetching product ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
