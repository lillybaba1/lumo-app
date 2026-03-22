import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getOrdersByEmail } from '@/services/orderService';
import { logger } from '@/lib/logger';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

const apiLogger = logger.child('API:Orders');

const querySchema = z.object({
  email: z.string().email(),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = await withRateLimit(request, RATE_LIMITS.API_GENERAL, 'orders');
    if (!rateLimit.allowed) return rateLimit.response!;

    // SECURITY: Require authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Validate email format
    const parsed = querySchema.safeParse({ email });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // SECURITY: Users can only fetch their own orders unless they're admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin' || userData?.role === 'APP_OWNER_ADMIN';

    if (!isAdmin && user.email !== email) {
      return NextResponse.json(
        { error: 'You can only view your own orders' },
        { status: 403 }
      );
    }

    const orders = await getOrdersByEmail(parsed.data.email);
    return NextResponse.json(orders);
  } catch (error) {
    apiLogger.error('Error fetching orders', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
