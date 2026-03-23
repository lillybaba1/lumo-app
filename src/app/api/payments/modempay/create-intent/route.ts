import { NextRequest, NextResponse } from 'next/server';
import { createModemPayIntent, isModemPayConfigured } from '@/lib/modempay';
import { logger } from '@/lib/logger';

const routeLogger = logger.child('ModemPayCreateIntent');

export async function POST(request: NextRequest) {
  try {
    // Check if Modem Pay is configured
    if (!isModemPayConfigured()) {
      routeLogger.warn('Modem Pay API keys not configured');
      return NextResponse.json(
        { error: 'Mobile money payments are not yet configured. Please use Cash on Delivery.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { orderId, amount, customerName, customerEmail, customerPhone, description } = body;

    if (!orderId || !amount || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, amount, customerName, customerEmail' },
        { status: 400 }
      );
    }

    routeLogger.info('Creating Modem Pay payment intent', { orderId, amount });

    const result = await createModemPayIntent({
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      description,
    });

    if (!result.success) {
      routeLogger.error('Modem Pay intent creation failed', { error: result.error });
      return NextResponse.json(
        { error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      paymentLink: result.paymentLink,
      intentId: result.intentId,
    });
  } catch (error) {
    routeLogger.error('Error in POST /api/payments/modempay/create-intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
