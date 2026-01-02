import { NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { deleteTableRow, updateTableRow } from '@/services/databaseService';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:AdminDatabase');

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const { table, id } = await params;
    const success = await deleteTableRow(table, id);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete row' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Error deleting row', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const { table, id } = await params;
    const body = await request.json();
    const success = await updateTableRow(table, id, body);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update row' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Error updating row', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
