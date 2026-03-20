import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

const routeLogger = logger.child('SellerMobileMoney');

/**
 * Get mobile money accounts for a seller (by business account ID)
 * Used at checkout to show buyer how to pay the seller directly
 */
export async function GET(request: NextRequest) {
  try {
    const sellerId = request.nextUrl.searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json(
        { error: 'sellerId parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('business_accounts')
      .select('id, business_name, mobile_money_accounts')
      .eq('id', sellerId)
      .eq('status', 'ACTIVE')
      .single();

    if (error || !data) {
      routeLogger.error('Seller not found or error', { sellerId, error: error?.message });
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sellerId: data.id,
      businessName: data.business_name,
      mobileMoneyAccounts: data.mobile_money_accounts || [],
    });
  } catch (error) {
    routeLogger.error('Error fetching seller mobile money', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
