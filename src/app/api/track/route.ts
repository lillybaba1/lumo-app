import { NextRequest, NextResponse } from 'next/server';
import { trackActivity, incrementViewCount } from '@/services/intelligenceService';
import { getCurrentUser } from '@/lib/auth-admin';

/**
 * POST /api/track
 * Client-side tracking endpoint. Accepts user activity events.
 * Works for both authenticated and anonymous users.
 * 
 * Body: {
 *   eventType: 'view' | 'cart_add' | 'search' | 'wishlist_add' | 'wishlist_remove',
 *   productId?: string,
 *   categoryId?: string,
 *   searchQuery?: string,
 *   sessionId?: string,
 *   metadata?: Record<string, unknown>,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, productId, categoryId, searchQuery, sessionId, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType required' }, { status: 400 });
    }

    // Try to get authenticated user
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.userId || null;
    } catch {
      // Not authenticated — that's fine
    }

    // Track the activity (non-blocking)
    trackActivity({
      userId,
      sessionId: sessionId || null,
      eventType,
      productId: productId || null,
      categoryId: categoryId || null,
      searchQuery: searchQuery || null,
      metadata: metadata || {},
    });

    // For views, also increment the product view_count
    if (eventType === 'view' && productId) {
      incrementViewCount(productId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json({ ok: false }, { status: 200 }); // Don't fail
  }
}
