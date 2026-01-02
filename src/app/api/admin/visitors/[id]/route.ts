import { NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { deleteVisitor } from '@/services/visitorService';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:AdminVisitors');

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin({ redirect: false });
    
    const { id } = await params;
    const success = await deleteVisitor(id);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete visitor' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Error deleting visitor', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
