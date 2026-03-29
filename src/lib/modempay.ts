import { logger } from '@/lib/logger';
import ModemPay from 'modem-pay';

const modemPayLogger = logger.child('ModemPay');

// ─── Singleton Instance ──────────────────────────────────────────────────────

let modempayInstance: ModemPay | null = null;

function getModemPay(): ModemPay {
  if (!modempayInstance) {
    const secretKey = process.env.MODEMPAY_SECRET_KEY;
    if (!secretKey) {
      throw new Error('MODEMPAY_SECRET_KEY is not configured');
    }
    modempayInstance = new ModemPay(secretKey);
  }
  return modempayInstance;
}

// ─── Configuration Check ─────────────────────────────────────────────────────

export function isModemPayConfigured(): boolean {
  return !!(process.env.MODEMPAY_SECRET_KEY && process.env.MODEMPAY_PUBLIC_KEY);
}

// ─── Create Payment Intent ───────────────────────────────────────────────────

export async function createModemPayIntent(params: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
}): Promise<{
  success: boolean;
  paymentLink?: string;
  intentId?: string;
  error?: string;
}> {
  try {
    if (!isModemPayConfigured()) {
      modemPayLogger.error('Modem Pay API keys not configured');
      return { success: false, error: 'Payment gateway not configured. Please contact support.' };
    }

    const modempay = getModemPay();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julazone.com';

    modemPayLogger.info('Creating payment intent', {
      orderId: params.orderId,
      amount: params.amount,
    });

    const intent = await modempay.paymentIntents.create({
      amount: Math.round(params.amount), // GMD integer
      currency: 'GMD',
      payment_methods: ['wallet'], // Only show mobile money (Afrimoney, QMoney, Wave) — no card
      title: `JulaZone Order #${params.orderId.substring(0, 8)}`,
      description: params.description || `Payment for JulaZone order`,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      metadata: {
        order_id: params.orderId,
      },
      return_url: `${appUrl}/checkout/payment-result?status=success&order=${params.orderId}`,
      cancel_url: `${appUrl}/checkout/payment-result?status=cancelled&order=${params.orderId}`,
      callback_url: `${appUrl}/api/webhooks/modempay`,
    });

    modemPayLogger.info('Payment intent created', {
      intentId: intent.data.id,
      status: intent.status,
    });

    return {
      success: true,
      paymentLink: intent.data.payment_link,
      intentId: intent.data.id,
    };
  } catch (error) {
    modemPayLogger.error('Failed to create payment intent', error as Error);
    return {
      success: false,
      error: 'Payment service unavailable. Please try again later.',
    };
  }
}

// ─── Retrieve Payment Intent ─────────────────────────────────────────────────

export async function getModemPayIntent(intentId: string) {
  try {
    const modempay = getModemPay();
    return await modempay.paymentIntents.retrieve(intentId);
  } catch (error) {
    modemPayLogger.error('Failed to retrieve payment intent', error as Error);
    return null;
  }
}

// ─── Verify Webhook Signature ────────────────────────────────────────────────

export function verifyModemPayWebhook(payload: string | object, signature: string) {
  try {
    const webhookSecret = process.env.MODEMPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      modemPayLogger.error('MODEMPAY_WEBHOOK_SECRET not configured');
      return null;
    }

    const modempay = getModemPay();
    return modempay.webhooks.composeEventDetails(payload, signature, webhookSecret);
  } catch (error) {
    modemPayLogger.error('Webhook verification failed', error as Error);
    return null;
  }
}

// ─── Initiate Transfer (Payout to Seller) ────────────────────────────────────

export async function initiateModemPayTransfer(params: {
  amount: number;
  network: 'afrimoney' | 'qmoney' | 'wave';
  accountNumber: string;
  beneficiaryName: string;
  orderId?: string;
  sellerId?: string;
  narration?: string;
}): Promise<{
  success: boolean;
  transferId?: string;
  status?: string;
  error?: string;
}> {
  try {
    if (!isModemPayConfigured()) {
      return { success: false, error: 'Modem Pay not configured' };
    }

    const modempay = getModemPay();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julazone.com';

    // Generate idempotency key from order + seller to prevent duplicates
    const idempotencyKey = `payout-${params.orderId || 'manual'}-${params.sellerId || 'unknown'}-${Date.now()}`;

    modemPayLogger.info('Initiating transfer', {
      amount: params.amount,
      network: params.network,
      accountNumber: params.accountNumber,
    });

    const transfer = await modempay.transfers.initiate(
      {
        amount: Math.round(params.amount),
        currency: 'GMD',
        network: params.network,
        account_number: params.accountNumber,
        beneficiary_name: params.beneficiaryName,
        narration: params.narration || `JulaZone payout${params.orderId ? ` #${params.orderId.substring(0, 8)}` : ''}`,
        metadata: {
          order_id: params.orderId || '',
          seller_id: params.sellerId || '',
        },
        callback_url: `${appUrl}/api/webhooks/modempay`,
      },
      idempotencyKey
    );

    modemPayLogger.info('Transfer initiated', {
      transferId: transfer.id,
      status: transfer.status,
    });

    return {
      success: true,
      transferId: transfer.id,
      status: transfer.status,
    };
  } catch (error) {
    modemPayLogger.error('Failed to initiate transfer', error as Error);
    return {
      success: false,
      error: 'Transfer failed. Please try again.',
    };
  }
}
