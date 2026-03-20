import { NextRequest, NextResponse } from 'next/server';
import { createPayDunyaInvoice } from '@/lib/paydunya';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const routeLogger = logger.child('PayDunyaCreate');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, description, customerName, customerEmail, customerPhone, items } = body;

    if (!orderId || !amount || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, amount, customerName, customerEmail' },
        { status: 400 }
      );
    }

    routeLogger.info('Creating PayDunya invoice', { orderId, amount });

    const result = await createPayDunyaInvoice({
      orderId,
      amount,
      description: description || `JulaZone Order #${orderId.substring(0, 8)}`,
      customerName,
      customerEmail,
      customerPhone,
      items,
    });

    if (!result.success) {
      routeLogger.error('PayDunya invoice creation failed', { error: result.error });
      return NextResponse.json(
        { error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      token: result.token,
    });
  } catch (error) {
    routeLogger.error('PayDunya create route error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
