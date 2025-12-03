import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { getBoutiqueById, updateBoutique } from '@/services/boutiqueService';
import { getBusinessAccount } from '@/services/businessAccountService';

// GET - Fetch single boutique with seller info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const boutique = await getBoutiqueById(params.id);
    
    if (!boutique) {
      return NextResponse.json(
        { success: false, error: 'Boutique not found' },
        { status: 404 }
      );
    }
    
    // Also fetch seller/business account info
    let seller = null;
    if (boutique.businessAccountId) {
      seller = await getBusinessAccount(boutique.businessAccountId);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...boutique,
        seller
      }
    });
  } catch (error: any) {
    console.error('Error fetching boutique:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch boutique' },
      { status: error.statusCode || 500 }
    );
  }
}

// PUT - Update single boutique
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const body = await request.json();
    
    const success = await updateBoutique(params.id, body);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Boutique updated successfully' });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update boutique' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error updating boutique:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update boutique' },
      { status: error.statusCode || 500 }
    );
  }
}

// PATCH - Quick actions (feature, unfeature, publish, unpublish)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'feature':
        await updateBoutique(params.id, { isFeatured: true });
        return NextResponse.json({ success: true, message: 'Boutique featured' });
        
      case 'unfeature':
        await updateBoutique(params.id, { isFeatured: false });
        return NextResponse.json({ success: true, message: 'Boutique unfeatured' });
        
      case 'publish':
        await updateBoutique(params.id, { isPublished: true });
        return NextResponse.json({ success: true, message: 'Boutique published' });
        
      case 'unpublish':
        await updateBoutique(params.id, { isPublished: false });
        return NextResponse.json({ success: true, message: 'Boutique unpublished' });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error performing boutique action:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Action failed' },
      { status: error.statusCode || 500 }
    );
  }
}
