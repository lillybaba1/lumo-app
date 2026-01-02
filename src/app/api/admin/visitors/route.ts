import { NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { getVisitorsByStatus } from '@/services/visitorService';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:AdminVisitors');

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin({ redirect: false });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'all' | 'active' | 'inactive' || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const data = await getVisitorsByStatus(status, page, limit);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Error fetching visitors', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
