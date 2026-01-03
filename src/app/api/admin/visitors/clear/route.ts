import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { clearInactiveVisitors } from '@/services/visitorService';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:AdminVisitors');

// Accept decimal hours (e.g., 0.083 for 5 minutes) and range up to 720 (30 days)
const clearVisitorsSchema = z.object({
  hoursInactive: z.number().min(0.01).max(720).default(24),
});

export async function POST(request: Request) {
  try {
    await requireAdmin({ redirect: false });

    const body = await request.json();
    const parsed = clearVisitorsSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 });
    }

    const { hoursInactive } = parsed.data;
    const result = await clearInactiveVisitors(hoursInactive);

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: result.deleted });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Error clearing inactive visitors', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
