import { NextRequest, NextResponse } from 'next/server';
import { verifyModemPayWebhook } from '@/lib/modempay';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { updatePayoutByTransferId } from '@/services/payoutService';
import { onPaymentReceived } from '@/services/escrowService';

const webhookLogger = logger.child('ModemPayWebhook');

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-modempay-signature') || '';

    webhookLogger.info('Modem Pay webhook received', {
      hasSignature: !!signature,
      contentLength: body.length,
    });

    // Verify webhook signature if secret is configured
    let event: any;
    if (process.env.MODEMPAY_WEBHOOK_SECRET && signature) {
      const verified = verifyModemPayWebhook(body, signature);
      if (!verified) {
        webhookLogger.error('Webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      event = verified;
    } else {
      // Parse raw body if no webhook secret configured (dev/test mode)
      try {
        event = JSON.parse(body);
      } catch {
        webhookLogger.error('Failed to parse webhook body');
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
      }
    }

    const eventType = event.event || event.type;
    const payload = event.payload || event.data || event;

    webhookLogger.info('Processing webhook event', { eventType });

    switch (eventType) {
      case 'charge.succeeded': {
        const orderId = payload.metadata?.order_id;
        const intentId = payload.id || payload.payment_intent_id;

        webhookLogger.info('Payment succeeded', { orderId, intentId });

        if (orderId) {
          // Update payment record
          await updatePaymentByIntentId(intentId, 'Completed');
          // Use escrow flow: transition to 'Paid' (money held in platform account)
          const escrowUpdated = await onPaymentReceived(orderId);
          if (!escrowUpdated) {
            webhookLogger.warn('Escrow update failed, doing direct DB update', { orderId });
            // Fallback direct update
            await supabaseAdmin
              .from('orders')
              .update({
                payment_status: 'Paid',
                status: 'Paid',
                updated_at: new Date().toISOString(),
              })
              .eq('id', orderId);
          }
        }
        break;
      }

      case 'charge.failed': {
        const orderId = payload.metadata?.order_id;
        const intentId = payload.id || payload.payment_intent_id;

        webhookLogger.info('Payment failed', { orderId, intentId });

        if (intentId) {
          await updatePaymentByIntentId(intentId, 'Failed');
        }
        if (orderId) {
          await supabaseAdmin
            .from('orders')
            .update({
              payment_status: 'Failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
        break;
      }

      case 'charge.cancelled': {
        const orderId = payload.metadata?.order_id;
        const intentId = payload.id || payload.payment_intent_id;

        webhookLogger.info('Payment cancelled', { orderId, intentId });

        if (intentId) {
          await updatePaymentByIntentId(intentId, 'Failed');
        }
        if (orderId) {
          await supabaseAdmin
            .from('orders')
            .update({
              payment_status: 'Failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
        break;
      }

      case 'transfer.completed': {
        const transferId = payload.id;
        const sellerId = payload.metadata?.seller_id;
        webhookLogger.info('Transfer completed', {
          transferId,
          amount: payload.amount,
          sellerId,
        });
        
        // Update the payout record and seller's business account
        if (transferId) {
          const updated = await updatePayoutByTransferId(transferId, 'completed');
          if (updated) {
            webhookLogger.info('Payout record updated to completed', { transferId });
          } else {
            webhookLogger.warn('Could not find payout record for transfer', { transferId });
          }
        }
        break;
      }

      case 'transfer.failed': {
        const transferId = payload.id;
        const sellerId = payload.metadata?.seller_id;
        const failureReason = payload.failure_reason || payload.error || 'Unknown error';
        webhookLogger.error('Transfer failed', {
          transferId,
          sellerId,
          failureReason,
        });
        
        // Update the payout record as failed
        if (transferId) {
          const updated = await updatePayoutByTransferId(transferId, 'failed', failureReason);
          if (updated) {
            webhookLogger.info('Payout record updated to failed', { transferId });
          }
        }
        break;
      }

      default:
        webhookLogger.info('Unhandled webhook event', { eventType });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    webhookLogger.error('Webhook processing error', error as Error);
    // Return 200 to prevent Modem Pay from retrying
    return NextResponse.json({ error: 'Processing error' }, { status: 200 });
  }
}

/**
 * Find and update a payment record by Modem Pay intent ID (stored as transaction_id)
 */
async function updatePaymentByIntentId(intentId: string, status: 'Completed' | 'Failed' | 'Pending') {
  try {
    if (!intentId) return;

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('id, order_id')
      .eq('transaction_id', intentId)
      .single();

    if (error || !data) {
      webhookLogger.warn('Payment record not found for intent', { intentId });
      return;
    }

    await supabaseAdmin
      .from('payments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    webhookLogger.info('Payment record updated', { paymentId: data.id, status });
  } catch (error) {
    webhookLogger.error('Failed to update payment by intent ID', { intentId, error });
  }
}
