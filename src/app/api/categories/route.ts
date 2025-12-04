
import { NextResponse } from 'next/server';
import { getCategories } from '@/services/categoryService';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(
      { categories },
      {
        headers: {
          // Categories don't change often - cache for 5 minutes, revalidate for 30 minutes
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
