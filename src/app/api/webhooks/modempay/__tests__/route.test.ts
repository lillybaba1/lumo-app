import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const verifyModemPayWebhook = vi.fn();
const updatePayoutByTransferId = vi.fn();
const onPaymentReceived = vi.fn();

vi.mock('@/lib/modempay', () => ({
  verifyModemPayWebhook: (...args: unknown[]) => verifyModemPayWebhook(...args),
}));
vi.mock('@/services/payoutService', () => ({
  updatePayoutByTransferId: (...args: unknown[]) => updatePayoutByTransferId(...args),
}));
vi.mock('@/services/escrowService', () => ({
  onPaymentReceived: (...args: unknown[]) => onPaymentReceived(...args),
}));
vi.mock('@/lib/logger', () => {
  const noop = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn() };
  noop.child.mockReturnValue(noop);
  return { logger: noop };
});

// Chainable Supabase mock: every builder method returns the chain, the chain
// is awaitable, and .single() resolves with the configured result.
function makeChain(result: { data: unknown; error: unknown }) {
  const chain: any = {};
  for (const m of ['select', 'update', 'insert', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

const supabaseChain = makeChain({ data: { id: 'pay-1', order_id: 'order-1' }, error: null });
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn(() => supabaseChain) },
}));

import { POST } from '../route';

function makeRequest(body: object, signature?: string) {
  return new NextRequest('http://localhost/api/webhooks/modempay', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: signature ? { 'x-modempay-signature': signature } : {},
  });
}

const chargeSucceeded = {
  event: 'charge.succeeded',
  payload: { id: 'pi_123', metadata: { order_id: 'order-1' } },
};

describe('ModemPay webhook security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onPaymentReceived.mockResolvedValue(true);
    updatePayoutByTransferId.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects all events in production when no webhook secret is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', '');

    const res = await POST(makeRequest(chargeSucceeded));

    expect(res.status).toBe(500);
    expect(onPaymentReceived).not.toHaveBeenCalled();
  });

  it('rejects unsigned events when a webhook secret is configured', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', 'whsec_test');

    const res = await POST(makeRequest(chargeSucceeded));

    expect(res.status).toBe(401);
    expect(verifyModemPayWebhook).not.toHaveBeenCalled();
    expect(onPaymentReceived).not.toHaveBeenCalled();
  });

  it('rejects events with an invalid signature', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', 'whsec_test');
    verifyModemPayWebhook.mockReturnValue(null);

    const res = await POST(makeRequest(chargeSucceeded, 'bad-signature'));

    expect(res.status).toBe(401);
    expect(onPaymentReceived).not.toHaveBeenCalled();
  });

  it('processes a correctly signed charge.succeeded event', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', 'whsec_test');
    verifyModemPayWebhook.mockReturnValue(chargeSucceeded);

    const res = await POST(makeRequest(chargeSucceeded, 'good-signature'));

    expect(res.status).toBe(200);
    expect(onPaymentReceived).toHaveBeenCalledWith('order-1');
  });

  it('still accepts unsigned events outside production when no secret is set (dev mode)', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', '');

    const res = await POST(makeRequest(chargeSucceeded));

    expect(res.status).toBe(200);
    expect(onPaymentReceived).toHaveBeenCalledWith('order-1');
  });

  it('returns 500 on processing errors so the provider retries', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', 'whsec_test');
    verifyModemPayWebhook.mockReturnValue(chargeSucceeded);
    onPaymentReceived.mockRejectedValue(new Error('db down'));

    const res = await POST(makeRequest(chargeSucceeded, 'good-signature'));

    expect(res.status).toBe(500);
  });
});
