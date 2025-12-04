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
    // Step C: Boutique Creation - Status defaults to Pending (boutiqueApproved = false)
    const updatedAccount = await updateBusinessAccount(businessAccountId, {
      businessName: displayName,
      boutiqueSlug: slug,
      description: description,
      logo: logo || undefined,
      boutiqueSubmitted: true,
      boutiqueSubmittedAt: new Date().toISOString(),
      boutiqueApproved: false, // Explicitly set to false (Pending)
    });

    if (!updatedAccount) {
      return NextResponse.json(
        { error: 'Failed to update boutique' },
        { status: 500 }
      );
    }

    // Create admin notification (Step C: Notification)
    await supabaseAdmin.from('admin_notifications').insert({
      type: 'boutique_submitted',
      title: 'New Boutique Submission',
      message: `${displayName} has submitted their boutique for review.`,
      business_account_id: businessAccountId,
      user_id: user.id,
    });

    // Also store boutique-specific data in a separate boutiques table if it exists
    // Step C: Boutique Creation - Status defaults to 'pending'
    try {
      const { data: existingBoutique } = await supabaseAdmin
        .from('boutiques')
        .select('id')
        .eq('business_account_id', businessAccountId)
        .single();

      if (existingBoutique) {
        await supabaseAdmin.from('boutiques').update({
          slug,
          display_name: displayName,
          tagline: tagline || null,
          description,
          logo,
          banner_image: bannerImage,
          theme_color: themeColor,
          is_published: false, // Step D: Not visible until active
          status: 'pending', // Step C: Status defaults to pending
          updated_at: new Date().toISOString(),
        }).eq('id', existingBoutique.id);
      } else {
        await supabaseAdmin.from('boutiques').insert({
          business_account_id: businessAccountId,
          slug,
          display_name: displayName,
          tagline: tagline || null,
          description,
          logo,
          banner_image: bannerImage,
          theme_color: themeColor,
          is_published: false, // Step D: Not visible until active
          status: 'pending', // Step C: Status defaults to pending
        });
      }
    } catch (err) {
      console.error('Error updating boutiques table:', err);
      // Continue as business_accounts is the source of truth for now
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
