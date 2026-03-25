import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/boutiques/social?boutiqueId=xxx — get social stats for a boutique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boutiqueId = searchParams.get('boutiqueId');

    if (!boutiqueId) {
      return NextResponse.json({ error: 'boutiqueId is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get boutique counts
    const { data: boutique } = await adminClient
      .from('boutiques')
      .select('follower_count, like_count, comment_count')
      .eq('id', boutiqueId)
      .single();

    let isFollowing = false;
    let notificationsEnabled = true;
    let hasLiked = false;

    // Check if the current user has a session
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check following status
        const { data: followData } = await adminClient
          .from('boutique_followers')
          .select('id, notifications_enabled')
          .eq('boutique_id', boutiqueId)
          .eq('user_id', user.id)
          .single();

        isFollowing = !!followData;
        notificationsEnabled = followData?.notifications_enabled ?? true;

        // Check like status
        const { data: likeData } = await adminClient
          .from('boutique_likes')
          .select('id')
          .eq('boutique_id', boutiqueId)
          .eq('user_id', user.id)
          .single();

        hasLiked = !!likeData;
      }
    } catch {
      // Not authenticated, that's fine
    }

    return NextResponse.json({
      followerCount: boutique?.follower_count || 0,
      likeCount: boutique?.like_count || 0,
      commentCount: boutique?.comment_count || 0,
      isFollowing,
      notificationsEnabled,
      hasLiked,
    });
  } catch (error) {
    console.error('Social stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
