import { NextRequest, NextResponse } from 'next/server';
import { checkPayDunyaInvoiceStatus } from '@/lib/paydunya';
import { updatePaymentByToken } from '@/services/paymentService';
import { logger } from '@/lib/logger';

const callbackLogger = logger.child('PayDunyaCallback');

/**
 * PayDunya IPN (Instant Payment Notification) callback
 * Called by PayDunya when a payment status changes
 * 
 * PayDunya sends data as application/x-www-form-urlencoded
 * The payment data is in the 'data' key as a JSON string
 */
export async function POST(request: NextRequest) {
  try {
    // PayDunya may send as form-urlencoded or JSON
    let paymentData: any;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      const dataStr = formData.get('data');
      if (dataStr) {
        paymentData = JSON.parse(dataStr as string);
      }
    } else {
      paymentData = await request.json();
    }

    callbackLogger.info('PayDunya IPN callback received', { 
      responseCode: paymentData?.response_code,
      status: paymentData?.invoice?.status,
      token: paymentData?.invoice?.token,
    });

    if (!paymentData) {
      callbackLogger.error('No payment data in callback');
      return NextResponse.json({ error: 'No data' }, { status: 400 });
    }

    const token = paymentData.invoice?.token;
    if (!token) {
      callbackLogger.error('No token in callback data');
      return NextResponse.json({ error: 'No token' }, { status: 400 });
    }

    // Verify the payment status directly with PayDunya API for security
    const verified = await checkPayDunyaInvoiceStatus(token);
    
    if (!verified) {
      callbackLogger.error('Could not verify payment with PayDunya', { token });
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }

    const invoiceStatus = verified.invoice?.status;
    callbackLogger.info('PayDunya verified status', { token, status: invoiceStatus });

    // Map PayDunya status to our payment status
    let paymentStatus: 'Completed' | 'Failed' | 'Pending';
    if (invoiceStatus === 'completed') {
      paymentStatus = 'Completed';
    } else if (invoiceStatus === 'cancelled') {
      paymentStatus = 'Failed';
    } else {
      paymentStatus = 'Pending';
    }

    // Update the payment record
    await updatePaymentByToken(token, paymentStatus);

    callbackLogger.info('Payment updated successfully', { token, status: paymentStatus });

    return NextResponse.json({ success: true });
  } catch (error) {
    callbackLogger.error('PayDunya callback error', error as Error);
    // Return 200 to prevent PayDunya from retrying
    return NextResponse.json({ error: 'Processing error' }, { status: 200 });
  }
}

// PayDunya may also send GET requests for verification
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'PayDunya IPN Callback' });
}
