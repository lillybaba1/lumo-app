import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBoutiqueById, updateBoutique } from '@/services/boutiqueService';
import { getBusinessAccountByOwner } from '@/services/businessAccountService';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const boutique = await getBoutiqueById(id);

    if (!boutique) {
      return NextResponse.json({ error: 'Boutique not found' }, { status: 404 });
    }

    return NextResponse.json({ boutique });
  } catch (error) {
    console.error('Error fetching boutique:', error);
    return NextResponse.json({ error: 'Failed to fetch boutique' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessAccount = await getBusinessAccountByOwner(user.id);
    if (!businessAccount) {
      return NextResponse.json({ error: 'Business account not found' }, { status: 404 });
    }

    // Verify ownership
    const boutique = await getBoutiqueById(id);
    if (!boutique || boutique.businessAccountId !== businessAccount.id) {
      return NextResponse.json({ error: 'Not authorized to edit this boutique' }, { status: 403 });
    }

    const body = await request.json();

    const updatedBoutique = await updateBoutique(id, {
      displayName: body.displayName,
      tagline: body.tagline,
      description: body.description,
      logo: body.logo,
      bannerImage: body.bannerImage,
      themeColor: body.themeColor,
      accentColor: body.accentColor,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      shippingInfo: body.shippingInfo,
      returnPolicy: body.returnPolicy,
      socialLinks: body.socialLinks,
      isPublished: body.isPublished,
    });

    if (!updatedBoutique) {
      return NextResponse.json({ error: 'Failed to update boutique' }, { status: 500 });
    }

    return NextResponse.json({ boutique: updatedBoutique });
  } catch (error) {
    console.error('Error updating boutique:', error);
    return NextResponse.json({ error: 'Failed to update boutique' }, { status: 500 });
  }
}
