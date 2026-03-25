import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/boutiques/follow — follow a boutique
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in to follow a boutique' }, { status: 401 });
    }

    const body = await request.json();
    const { boutiqueId, notificationsEnabled = true } = body;

    if (!boutiqueId) {
      return NextResponse.json({ error: 'boutiqueId is required' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const adminClient = createAdminClient();

    // Check if already following
    const { data: existing } = await adminClient
      .from('boutique_followers')
      .select('id')
      .eq('boutique_id', boutiqueId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, alreadyFollowing: true });
    }

    // Insert follow record
    const { error } = await adminClient
      .from('boutique_followers')
      .insert({
        boutique_id: boutiqueId,
        user_id: user.id,
        notifications_enabled: notificationsEnabled,
      });

    if (error) {
      console.error('Error following boutique:', error);
      return NextResponse.json({ error: 'Failed to follow boutique' }, { status: 500 });
    }

    // Update follower count on boutique
    const { data: boutiqueData } = await adminClient
      .from('boutiques')
      .select('follower_count')
      .eq('id', boutiqueId)
      .single();
    
    if (boutiqueData) {
      await adminClient
        .from('boutiques')
        .update({ follower_count: (boutiqueData.follower_count || 0) + 1 })
        .eq('id', boutiqueId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boutiques/follow — unfollow a boutique
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boutiqueId = searchParams.get('boutiqueId');

    if (!boutiqueId) {
      return NextResponse.json({ error: 'boutiqueId is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('boutique_followers')
      .delete()
      .eq('boutique_id', boutiqueId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error unfollowing boutique:', error);
      return NextResponse.json({ error: 'Failed to unfollow boutique' }, { status: 500 });
    }

    // Decrement follower count
    const { data: boutiqueData } = await adminClient
      .from('boutiques')
      .select('follower_count')
      .eq('id', boutiqueId)
      .single();
    
    if (boutiqueData) {
      await adminClient
        .from('boutiques')
        .update({ follower_count: Math.max(0, (boutiqueData.follower_count || 0) - 1) })
        .eq('id', boutiqueId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/boutiques/follow — toggle notifications
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { boutiqueId, notificationsEnabled } = body;

    if (!boutiqueId || notificationsEnabled === undefined) {
      return NextResponse.json({ error: 'boutiqueId and notificationsEnabled are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('boutique_followers')
      .update({ notifications_enabled: notificationsEnabled })
      .eq('boutique_id', boutiqueId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling notifications:', error);
      return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Toggle notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
