import { NextResponse } from 'next/server';
import { getProducts } from '@/services/productService';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getProducts();
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
