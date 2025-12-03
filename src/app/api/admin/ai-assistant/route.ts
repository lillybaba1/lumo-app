import { NextRequest, NextResponse } from 'next/server';
import { adminAssistant } from '@/ai/flows/admin-assistant';
import { requireAdmin } from '@/lib/auth-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { query, history } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('[Admin AI API] Processing query:', query);

    const result = await adminAssistant({
      query,
      history: history || [],
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Admin AI API] Error:', error);
    
    // Handle auth errors
    if (error.message?.includes('Unauthorized') || error.message?.includes('Not authenticated')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
