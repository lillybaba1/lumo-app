import { NextRequest, NextResponse } from 'next/server';
import { sellerAssistant } from '@/ai/flows/seller-assistant';
import { getCurrentUser } from '@/lib/auth-admin';
import { getBusinessAccountByOwner } from '@/services/businessAccountService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ==========================================
// SELLER AI ASSISTANT API
// ==========================================
// For business account users (sellers) on their dashboard.
// Provides inventory, writing, and order management help.

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get business account
    const businessAccount = await getBusinessAccountByOwner(user.userId);
    
    if (!businessAccount) {
      return NextResponse.json(
        { error: 'Business account required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { query, history } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('[Seller AI API] Processing query:', query, 'for seller:', businessAccount.id);

    const result = await sellerAssistant({
      query,
      history: history || [],
      sellerId: businessAccount.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Seller AI API] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
