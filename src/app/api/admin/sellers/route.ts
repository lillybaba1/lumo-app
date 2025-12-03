import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { getAllBusinessAccounts, updateBusinessAccount } from '@/services/businessAccountService';

// GET - Fetch all sellers with optional filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin({ redirect: false });
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const verified = searchParams.get('verified');
    
    let sellers = await getAllBusinessAccounts();
    
    // Apply filters
    if (status) {
      sellers = sellers.filter(s => s.status === status);
    }
    if (tier) {
      sellers = sellers.filter(s => s.subscriptionTier === tier);
    }
    if (verified === 'true') {
      sellers = sellers.filter(s => s.verificationStatus === 'verified');
    } else if (verified === 'false') {
      sellers = sellers.filter(s => s.verificationStatus !== 'verified');
    }
    
    return NextResponse.json({ 
      success: true, 
      data: sellers,
      count: sellers.length
    });
  } catch (error: any) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sellers' },
      { status: error.statusCode || 500 }
    );
  }
}

// PUT - Bulk update sellers
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin({ redirect: false });
    
    const body = await request.json();
    const { sellerIds, updates } = body as {
      sellerIds: string[];
      updates: {
        subscriptionTier?: 'free' | 'pro' | 'enterprise';
        verificationStatus?: 'verified' | 'unverified' | 'pending' | 'rejected';
        status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';
      };
    };
    
    if (!sellerIds || !Array.isArray(sellerIds) || sellerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'sellerIds array is required' },
        { status: 400 }
      );
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'updates object is required' },
        { status: 400 }
      );
    }
    
    let successCount = 0;
    let failedIds: string[] = [];
    
    for (const sellerId of sellerIds) {
      try {
        const success = await updateBusinessAccount(sellerId, updates);
        if (success) {
          successCount++;
        } else {
          failedIds.push(sellerId);
        }
      } catch (err) {
        failedIds.push(sellerId);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${successCount} of ${sellerIds.length} sellers`,
      successCount,
      failedCount: failedIds.length,
      failedIds: failedIds.length > 0 ? failedIds : undefined
    });
  } catch (error: any) {
    console.error('Error bulk updating sellers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update sellers' },
      { status: error.statusCode || 500 }
    );
  }
}
