import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { updateBusinessAccount } from '@/services/businessAccountService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessAccountId,
      displayName,
      slug,
      tagline,
      description,
      themeColor,
      logo,
      bannerImage,
    } = body;

    if (!businessAccountId || !displayName || !slug || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('*')
      .eq('id', businessAccountId)
      .eq('owner_user_id', user.id)
      .single();

    if (!businessAccount) {
      return NextResponse.json(
        { error: 'Business account not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if slug is already taken by another boutique
    const { data: existingSlug } = await supabaseAdmin
      .from('business_accounts')
      .select('id')
      .eq('boutique_slug', slug)
      .neq('id', businessAccountId)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'This store URL is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // Update business account with boutique data
    const updatedAccount = await updateBusinessAccount(businessAccountId, {
      businessName: displayName,
      boutiqueSlug: slug,
      description: description,
      logo: logo || undefined,
      boutiqueSubmitted: true,
      boutiqueSubmittedAt: new Date().toISOString(),
    });

    if (!updatedAccount) {
      return NextResponse.json(
        { error: 'Failed to update boutique' },
        { status: 500 }
      );
    }

    // Create admin notification
    await supabaseAdmin.from('admin_notifications').insert({
      type: 'boutique_submitted',
      title: 'New Boutique Submission',
      message: `${displayName} has submitted their boutique for review.`,
      business_account_id: businessAccountId,
      user_id: user.id,
    });

    // Also store boutique-specific data in a separate boutiques table if it exists
    // For now, we're storing it in business_accounts
    
    // Update or create boutique record if table exists
    try {
      const { data: existingBoutique } = await supabaseAdmin
        .from('boutiques')
        .select('id')
        .eq('business_account_id', businessAccountId)
        .single();

      if (existingBoutique) {
        await supabaseAdmin
          .from('boutiques')
          .update({
            display_name: displayName,
            slug: slug,
            tagline: tagline || null,
            description: description,
            theme_color: themeColor || '#6366f1',
            logo: logo || null,
            banner_image: bannerImage || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingBoutique.id);
      } else {
        await supabaseAdmin
          .from('boutiques')
          .insert({
            business_account_id: businessAccountId,
            display_name: displayName,
            slug: slug,
            tagline: tagline || null,
            description: description,
            theme_color: themeColor || '#6366f1',
            logo: logo || null,
            banner_image: bannerImage || null,
          });
      }
    } catch (boutiqueError) {
      // Boutiques table might not exist yet - that's okay
      console.log('Boutiques table update skipped:', boutiqueError);
    }

    return NextResponse.json({
      success: true,
      message: 'Boutique submitted for review',
    });

  } catch (error: any) {
    console.error('Boutique submit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit boutique' },
      { status: 500 }
    );
  }
}
