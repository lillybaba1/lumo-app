import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBoutique, getBoutiqueByBusinessAccount } from '@/services/boutiqueService';
import { getBusinessAccountByOwner } from '@/services/businessAccountService';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessAccount = await getBusinessAccountByOwner(user.id);
    if (!businessAccount) {
      return NextResponse.json({ error: 'Business account not found' }, { status: 404 });
    }

    const boutique = await getBoutiqueByBusinessAccount(businessAccount.id);
    
    return NextResponse.json({ boutique });
  } catch (error) {
    console.error('Error fetching boutique:', error);
    return NextResponse.json({ error: 'Failed to fetch boutique' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessAccount = await getBusinessAccountByOwner(user.id);
    if (!businessAccount) {
      return NextResponse.json({ error: 'Business account not found' }, { status: 404 });
    }

    // Check if boutique already exists
    const existingBoutique = await getBoutiqueByBusinessAccount(businessAccount.id);
    if (existingBoutique) {
      return NextResponse.json({ error: 'Boutique already exists' }, { status: 400 });
    }

    const body = await request.json();

    const boutique = await createBoutique(businessAccount.id, {
      displayName: body.displayName,
      tagline: body.tagline,
      description: body.description,
      logo: body.logo,
      bannerImage: body.bannerImage,
      themeColor: body.themeColor,
      accentColor: body.accentColor,
      contactEmail: body.contactEmail || businessAccount.contactEmail,
      contactPhone: body.contactPhone || businessAccount.businessPhone,
      shippingInfo: body.shippingInfo,
      returnPolicy: body.returnPolicy,
      socialLinks: body.socialLinks,
      isPublished: body.isPublished || false,
    });

    if (!boutique) {
      return NextResponse.json({ error: 'Failed to create boutique' }, { status: 500 });
    }

    return NextResponse.json({ boutique }, { status: 201 });
  } catch (error) {
    console.error('Error creating boutique:', error);
    return NextResponse.json({ error: 'Failed to create boutique' }, { status: 500 });
  }
}
