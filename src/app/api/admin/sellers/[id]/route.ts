import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { getBusinessAccount, updateBusinessAccount } from '@/services/businessAccountService';
import { getBoutiqueByBusinessAccount, updateBoutique } from '@/services/boutiqueService';

// GET - Fetch single seller with boutique info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const seller = await getBusinessAccount(params.id);
    
    if (!seller) {
      return NextResponse.json(
        { success: false, error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    // Also fetch boutique info
    const boutique = await getBoutiqueByBusinessAccount(params.id);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...seller,
        boutique
      }
    });
  } catch (error: any) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch seller' },
      { status: error.statusCode || 500 }
    );
  }
}

// PUT - Update single seller
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const body = await request.json();
    const { seller: sellerUpdates, boutique: boutiqueUpdates } = body;
    
    let sellerSuccess = true;
    let boutiqueSuccess = true;
    
    // Update seller/business account
    if (sellerUpdates && Object.keys(sellerUpdates).length > 0) {
      const result = await updateBusinessAccount(params.id, sellerUpdates);
      sellerSuccess = result !== null;
    }
    
    // Update boutique if provided
    if (boutiqueUpdates && Object.keys(boutiqueUpdates).length > 0) {
      const boutique = await getBoutiqueByBusinessAccount(params.id);
      if (boutique) {
        const result = await updateBoutique(boutique.id, boutiqueUpdates);
        boutiqueSuccess = result !== null;
      }
    }
    
    if (sellerSuccess && boutiqueSuccess) {
      return NextResponse.json({ success: true, message: 'Seller updated successfully' });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Some updates failed',
        sellerUpdated: sellerSuccess,
        boutiqueUpdated: boutiqueSuccess
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error updating seller:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update seller' },
      { status: error.statusCode || 500 }
    );
  }
}

// PATCH - Quick actions (suspend, activate, verify, feature)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'suspend':
        await updateBusinessAccount(params.id, { status: 'SUSPENDED' });
        return NextResponse.json({ success: true, message: 'Seller suspended' });
        
      case 'activate':
        await updateBusinessAccount(params.id, { status: 'ACTIVE' });
        return NextResponse.json({ success: true, message: 'Seller activated' });
        
      case 'verify':
        await updateBusinessAccount(params.id, { verificationStatus: 'verified' });
        return NextResponse.json({ success: true, message: 'Seller verified' });
        
      case 'unverify':
        await updateBusinessAccount(params.id, { verificationStatus: 'unverified' });
        return NextResponse.json({ success: true, message: 'Seller verification removed' });
        
      case 'upgrade-pro':
        await updateBusinessAccount(params.id, { subscriptionTier: 'pro' });
        return NextResponse.json({ success: true, message: 'Seller upgraded to Pro' });
        
      case 'upgrade-enterprise':
        await updateBusinessAccount(params.id, { 
          subscriptionTier: 'enterprise',
          verificationStatus: 'verified'
        });
        return NextResponse.json({ success: true, message: 'Seller upgraded to Enterprise' });
        
      case 'downgrade-free':
        await updateBusinessAccount(params.id, { subscriptionTier: 'free' });
        return NextResponse.json({ success: true, message: 'Seller downgraded to Free' });
        
      case 'feature':
        const boutique = await getBoutiqueByBusinessAccount(params.id);
        if (boutique) {
          await updateBoutique(boutique.id, { isFeatured: true });
          return NextResponse.json({ success: true, message: 'Boutique featured' });
        }
        return NextResponse.json({ success: false, error: 'Boutique not found' }, { status: 404 });
        
      case 'unfeature':
        const boutique2 = await getBoutiqueByBusinessAccount(params.id);
        if (boutique2) {
          await updateBoutique(boutique2.id, { isFeatured: false });
          return NextResponse.json({ success: true, message: 'Boutique unfeatured' });
        }
        return NextResponse.json({ success: false, error: 'Boutique not found' }, { status: 404 });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error performing seller action:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Action failed' },
      { status: error.statusCode || 500 }
    );
  }
}
