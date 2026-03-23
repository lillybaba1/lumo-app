import { logger } from '@/lib/logger';

const paydunyaLogger = logger.child('PayDunya');

// PayDunya API Configuration
const PAYDUNYA_BASE_URL = process.env.PAYDUNYA_MODE === 'live'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1';

const PAYDUNYA_MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || '';
const PAYDUNYA_PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY || '';
const PAYDUNYA_TOKEN = process.env.PAYDUNYA_TOKEN || '';

const BASE_URL = 'https://julazone.com';

interface PayDunyaInvoiceItem {
  name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  description?: string;
}

interface PayDunyaCreateInvoiceRequest {
  invoice: {
    total_amount: number;
    description: string;
    items?: Record<string, PayDunyaInvoiceItem>;
  };
  store: {
    name: string;
    tagline?: string;
    phone?: string;
    postal_address?: string;
    website_url?: string;
    logo_url?: string;
  };
  custom_data?: Record<string, string>;
  actions: {
    cancel_url: string;
    return_url: string;
    callback_url: string;
  };
}

export interface PayDunyaCreateInvoiceResponse {
  response_code: string;
  response_text: string;
  description?: string;
  token?: string;
}

export interface PayDunyaInvoiceStatus {
  response_code: string;
  response_text: string;
  invoice?: {
    token: string;
    status: 'pending' | 'completed' | 'cancelled';
    total_amount: number;
    description: string;
  };
  custom_data?: Record<string, string>;
  actions?: {
    cancel_url: string;
    return_url: string;
    callback_url: string;
  };
  receipt_url?: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
    'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
    'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN,
  };
}

/**
 * Create a PayDunya checkout invoice (PAR - Payment with Redirect)
 * Returns a URL to redirect the customer to for payment
 */
export async function createPayDunyaInvoice(params: {
  orderId: string;
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}): Promise<{ success: boolean; checkoutUrl?: string; token?: string; error?: string }> {
  try {
    if (!PAYDUNYA_MASTER_KEY || !PAYDUNYA_PRIVATE_KEY || !PAYDUNYA_TOKEN) {
      paydunyaLogger.error('PayDunya API keys not configured');
      return { success: false, error: 'Payment gateway not configured. Please contact support.' };
    }

    // Build items map
    const itemsMap: Record<string, PayDunyaInvoiceItem> = {};
    if (params.items) {
      params.items.forEach((item, index) => {
        itemsMap[`item_${index}`] = {
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice.toString(),
          total_price: item.totalPrice.toString(),
        };
      });
    }

    const requestBody: PayDunyaCreateInvoiceRequest = {
      invoice: {
        total_amount: Math.round(params.amount), // PayDunya expects integer (FCFA)
        description: params.description,
        ...(Object.keys(itemsMap).length > 0 ? { items: itemsMap } : {}),
      },
      store: {
        name: 'JulaZone',
        tagline: 'Your Gambian Marketplace',
        website_url: BASE_URL,
      },
      custom_data: {
        order_id: params.orderId,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone || '',
      },
      actions: {
        cancel_url: `${BASE_URL}/checkout/payment-result?status=cancelled&order=${params.orderId}`,
        return_url: `${BASE_URL}/checkout/payment-result?status=success&order=${params.orderId}`,
        callback_url: `${BASE_URL}/api/payments/paydunya/callback`,
      },
    };

    paydunyaLogger.info('Creating PayDunya invoice', { 
      orderId: params.orderId, 
      amount: params.amount,
      url: `${PAYDUNYA_BASE_URL}/checkout-invoice/create`
    });

    const response = await fetch(`${PAYDUNYA_BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    paydunyaLogger.info('PayDunya raw response', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      body: responseText.substring(0, 500),
    });

    let data: PayDunyaCreateInvoiceResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      paydunyaLogger.error('PayDunya returned non-JSON response', { body: responseText.substring(0, 500) });
      return { success: false, error: 'Payment gateway returned an invalid response. Please try again.' };
    }

    paydunyaLogger.info('PayDunya create invoice response', { 
      responseCode: data.response_code, 
      responseText: data.response_text 
    });

    if (data.response_code === '00' && data.token) {
      // The checkout URL is the response_text when successful
      return {
        success: true,
        checkoutUrl: data.response_text,
        token: data.token,
      };
    }

    return {
      success: false,
      error: data.description || data.response_text || 'Failed to create payment invoice',
    };
  } catch (error) {
    paydunyaLogger.error('PayDunya create invoice error', error as Error);
    return { success: false, error: 'Payment service unavailable. Please try again later.' };
  }
}

/**
 * Check the status of a PayDunya invoice
 */
export async function checkPayDunyaInvoiceStatus(token: string): Promise<PayDunyaInvoiceStatus | null> {
  try {
    if (!PAYDUNYA_MASTER_KEY || !PAYDUNYA_PRIVATE_KEY || !PAYDUNYA_TOKEN) {
      paydunyaLogger.error('PayDunya API keys not configured');
      return null;
    }

    const response = await fetch(`${PAYDUNYA_BASE_URL}/checkout-invoice/confirm/${token}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const text = await response.text();
    let data: PayDunyaInvoiceStatus;
    try {
      data = JSON.parse(text);
    } catch {
      paydunyaLogger.error('PayDunya status check returned non-JSON', { token, body: text.substring(0, 500) });
      return null;
    }

    paydunyaLogger.info('PayDunya status check response', {
      token,
      responseCode: data.response_code,
      status: data.invoice?.status,
    });

    return data;
  } catch (error) {
    paydunyaLogger.error('PayDunya status check error', { token, error: String(error) });
    return null;
  }
}
