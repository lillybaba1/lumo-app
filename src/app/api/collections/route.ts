import { NextResponse } from 'next/server';
import { getCollections } from '@/app/admin/collections/actions';

export async function GET() {
  try {
    const collections = await getCollections();
    return NextResponse.json(collections || { bestSellers: [], newArrivals: [], deals: [] });
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return NextResponse.json(
      { bestSellers: [], newArrivals: [], deals: [] },
      { status: 200 } // Return empty collections instead of error
    );
  }
}
