import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { getAllBusinessAccounts, updateBusinessAccount } from '@/services/businessAccountService';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { logger, getErrorMessage } from '@/lib/logger';

const apiLogger = logger.child('API:AdminSellers');

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
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Error fetching sellers', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PUT - Bulk update sellers (with rate limiting for sensitive operation)
export async function PUT(request: NextRequest) {
  try {
    // Rate limit bulk operations
    const rateLimit = await withRateLimit(request, RATE_LIMITS.API_SENSITIVE, 'admin-sellers-bulk');
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

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
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Error bulk updating sellers', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
