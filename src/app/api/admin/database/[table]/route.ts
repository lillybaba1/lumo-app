import { NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { getTableData } from '@/services/databaseService';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:AdminDatabase');

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const { table } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const orderBy = searchParams.get('orderBy') || undefined;
    const ascending = searchParams.get('ascending') === 'true';

    const data = await getTableData(table, page, limit, orderBy, ascending);

    if (!data) {
      return NextResponse.json({ error: 'Table not found or not accessible' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Error fetching table data', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
