import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-admin';
import {
  getForYouRecommendations,
  getAlsoViewed,
  getFrequentlyBoughtTogether,
  getBecauseYouViewed,
  getUserRecentlyViewed,
  getTrendingSearches,
} from '@/services/intelligenceService';

/**
 * GET /api/recommendations?type=for-you|also-viewed|bought-together|because-viewed|recently-viewed|trending-searches
 * &productId=xxx (for also-viewed, bought-together, because-viewed)
 * &limit=12
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'for-you';
    const productId = searchParams.get('productId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 30);

    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.userId || null;
    } catch {
      // Not authenticated
    }

    switch (type) {
      case 'for-you': {
        if (!userId) {
          return NextResponse.json({ products: [], message: 'Login to get personalized recommendations' });
        }
        const products = await getForYouRecommendations(userId, limit);
        return NextResponse.json({ products }, {
          headers: { 'Cache-Control': 'private, max-age=120' },
        });
      }

      case 'also-viewed': {
        if (!productId) {
          return NextResponse.json({ products: [], error: 'productId required' }, { status: 400 });
        }
        const products = await getAlsoViewed(productId, limit);
        return NextResponse.json({ products }, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        });
      }

      case 'bought-together': {
        if (!productId) {
          return NextResponse.json({ products: [], error: 'productId required' }, { status: 400 });
        }
        const products = await getFrequentlyBoughtTogether(productId, limit);
        return NextResponse.json({ products }, {
          headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
        });
      }

      case 'because-viewed': {
        if (!productId) {
          return NextResponse.json({ data: null, error: 'productId required' }, { status: 400 });
        }
        const data = await getBecauseYouViewed(productId, limit);
        return NextResponse.json({ data }, {
          headers: { 'Cache-Control': 'public, s-maxage=300' },
        });
      }

      case 'recently-viewed': {
        if (!userId) {
          return NextResponse.json({ products: [] });
        }
        const products = await getUserRecentlyViewed(userId, limit);
        return NextResponse.json({ products }, {
          headers: { 'Cache-Control': 'private, max-age=60' },
        });
      }

      case 'trending-searches': {
        const searches = await getTrendingSearches(limit);
        return NextResponse.json({ searches }, {
          headers: { 'Cache-Control': 'public, s-maxage=300' },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}
