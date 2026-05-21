// @vitest-environment node
/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockVerifyWebhook: ReturnType<typeof vi.fn>;
let mockOnPaymentReceived: ReturnType<typeof vi.fn>;
let mockUpdatePayoutByTransferId: ReturnType<typeof vi.fn>;
let mockPaymentsSingle: ReturnType<typeof vi.fn>;
let mockOrdersUpdate: ReturnType<typeof vi.fn>;
let mockPaymentsUpdate: ReturnType<typeof vi.fn>;
let mockFrom: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockVerifyWebhook = vi.fn().mockReturnValue(null);
  mockOnPaymentReceived = vi.fn().mockResolvedValue(true);
  mockUpdatePayoutByTransferId = vi.fn().mockResolvedValue(true);

  mockPaymentsSingle = vi.fn().mockResolvedValue({
    data: { id: 'pay-1', order_id: 'order-1' },
    error: null,
  });
  mockOrdersUpdate = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ error: null })),
  }));
  mockPaymentsUpdate = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ error: null })),
  }));

  mockFrom = vi.fn((table: string) => {
    if (table === 'payments') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockPaymentsSingle })),
        })),
        update: mockPaymentsUpdate,
      };
    }
    if (table === 'orders') {
      return { update: mockOrdersUpdate };
    }
    return {};
  });

  vi.doMock('@/lib/modempay', () => ({
    verifyModemPayWebhook: mockVerifyWebhook,
  }));

  vi.doMock('@/services/payoutService', () => ({
    updatePayoutByTransferId: mockUpdatePayoutByTransferId,
  }));

  vi.doMock('@/services/escrowService', () => ({
    onPaymentReceived: mockOnPaymentReceived,
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: { from: mockFrom },
  }));

  vi.doMock('@/lib/logger', () => ({
    logger: {
      child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    },
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/webhooks/modempay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  });
}

describe('POST /api/webhooks/modempay', () => {
  it('rejects with 401 when signature verification fails (secret configured)', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', 'whsec_test');
    mockVerifyWebhook.mockReturnValueOnce(null);

    const { POST } = await import('@/app/api/webhooks/modempay/route');
    const res = await POST(makeRequest(
      JSON.stringify({ event: 'charge.succeeded' }),
      { 'x-modempay-signature': 'bad-sig' },
    ) as any);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/invalid signature/i);
  });

  it('SECURITY: accepts unsigned payload when MODEMPAY_WEBHOOK_SECRET is NOT configured — replay possible', async () => {
    // FIXME: route does not verify webhook signature when MODEMPAY_WEBHOOK_SECRET
    // is unset OR when no x-modempay-signature header is provided. Replay attacks
    // and forged webhook events are possible in this configuration. Production
    // deployments MUST set MODEMPAY_WEBHOOK_SECRET — but the route should arguably
    // hard-fail instead of degrading to "no-verify mode".
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', '');

    const { POST } = await import('@/app/api/webhooks/modempay/route');
    const res = await POST(makeRequest(
      JSON.stringify({
        event: 'charge.succeeded',
        payload: { id: 'pi_x', metadata: { order_id: 'order-1' } },
      }),
    ) as any);

    expect(res.status).toBe(200);
    expect(mockVerifyWebhook).not.toHaveBeenCalled();
  });

  it('SECURITY: skips signature verification when header missing even if secret configured', async () => {
    // FIXME: even with MODEMPAY_WEBHOOK_SECRET set, the route only verifies if the
    // signature header is also present. An attacker can simply omit the header to
    // bypass verification entirely.
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', 'whsec_test');

    const { POST } = await import('@/app/api/webhooks/modempay/route');
    const res = await POST(makeRequest(
      JSON.stringify({ event: 'charge.succeeded', payload: { id: 'x' } }),
      // no x-modempay-signature header
    ) as any);

    expect(res.status).toBe(200);
    expect(mockVerifyWebhook).not.toHaveBeenCalled();
  });

  it('returns 400 when body is invalid JSON and no signature is configured', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', '');

    const { POST } = await import('@/app/api/webhooks/modempay/route');
    const res = await POST(makeRequest('not-json{{{') as any);

    expect(res.status).toBe(400);
  });

  it('happy path: charge.succeeded triggers escrow update', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', '');

    const { POST } = await import('@/app/api/webhooks/modempay/route');
    const res = await POST(makeRequest(
      JSON.stringify({
        event: 'charge.succeeded',
        payload: { id: 'pi_succ', metadata: { order_id: 'order-1' } },
      }),
    ) as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(mockOnPaymentReceived).toHaveBeenCalledWith('order-1');
  });

  it('happy path with verified signature: parses event from verifier output', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', 'whsec_test');
    mockVerifyWebhook.mockReturnValueOnce({
      event: 'transfer.completed',
      payload: { id: 'tr_1', metadata: { seller_id: 'seller-1' }, amount: 1000 },
    });

    const { POST } = await import('@/app/api/webhooks/modempay/route');
    const res = await POST(makeRequest(
      JSON.stringify({ event: 'transfer.completed' }),
      { 'x-modempay-signature': 'good-sig' },
    ) as any);

    expect(res.status).toBe(200);
    expect(mockVerifyWebhook).toHaveBeenCalled();
    expect(mockUpdatePayoutByTransferId).toHaveBeenCalledWith('tr_1', 'completed');
  });

  it('charge.failed updates payment + order to Failed', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', '');

    const { POST } = await import('@/app/api/webhooks/modempay/route');
    const res = await POST(makeRequest(
      JSON.stringify({
        event: 'charge.failed',
        payload: { id: 'pi_fail', metadata: { order_id: 'order-2' } },
      }),
    ) as any);

    expect(res.status).toBe(200);
    expect(mockOrdersUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'Failed' }),
    );
  });

  it('SECURITY: no idempotency / replay protection — same event can be processed multiple times', async () => {
    // FIXME: the route has no event-id deduplication. Sending the same webhook
    // payload twice will call onPaymentReceived twice (which may double-credit
    // sellers depending on escrowService implementation). Add an
    // idempotency_key check using event.id stored in a processed_webhooks table.
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', '');

    const { POST } = await import('@/app/api/webhooks/modempay/route');
    const payload = JSON.stringify({
      event: 'charge.succeeded',
      payload: { id: 'pi_dup', metadata: { order_id: 'order-dup' } },
    });

    await POST(makeRequest(payload) as any);
    await POST(makeRequest(payload) as any);

    expect(mockOnPaymentReceived).toHaveBeenCalledTimes(2);
  });

  it('unhandled event type returns 200 (received) without crashing', async () => {
    vi.stubEnv('MODEMPAY_WEBHOOK_SECRET', '');

    const { POST } = await import('@/app/api/webhooks/modempay/route');
    const res = await POST(makeRequest(
      JSON.stringify({ event: 'something.unknown', payload: {} }),
    ) as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });
});
