import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/boutiques/like — like a boutique
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in to like a boutique' }, { status: 401 });
    }

    const body = await request.json();
    const { boutiqueId } = body;

    if (!boutiqueId) {
      return NextResponse.json({ error: 'boutiqueId is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if already liked
    const { data: existing } = await adminClient
      .from('boutique_likes')
      .select('id')
      .eq('boutique_id', boutiqueId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, alreadyLiked: true });
    }

    const { error } = await adminClient
      .from('boutique_likes')
      .insert({ boutique_id: boutiqueId, user_id: user.id });

    if (error) {
      console.error('Error liking boutique:', error);
      return NextResponse.json({ error: 'Failed to like boutique' }, { status: 500 });
    }

    // Increment like count
    const { data: boutiqueData } = await adminClient
      .from('boutiques')
      .select('like_count')
      .eq('id', boutiqueId)
      .single();
    
    if (boutiqueData) {
      await adminClient
        .from('boutiques')
        .update({ like_count: (boutiqueData.like_count || 0) + 1 })
        .eq('id', boutiqueId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boutiques/like — unlike a boutique
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
      .from('boutique_likes')
      .delete()
      .eq('boutique_id', boutiqueId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error unliking boutique:', error);
      return NextResponse.json({ error: 'Failed to unlike boutique' }, { status: 500 });
    }

    // Decrement like count
    const { data: boutiqueData } = await adminClient
      .from('boutiques')
      .select('like_count')
      .eq('id', boutiqueId)
      .single();
    
    if (boutiqueData) {
      await adminClient
        .from('boutiques')
        .update({ like_count: Math.max(0, (boutiqueData.like_count || 0) - 1) })
        .eq('id', boutiqueId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlike error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
