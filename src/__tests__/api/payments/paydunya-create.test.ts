// @vitest-environment node
/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockCreateInvoice: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  vi.stubEnv('PAYDUNYA_MASTER_KEY', 'mk');
  vi.stubEnv('PAYDUNYA_PRIVATE_KEY', 'pk');
  vi.stubEnv('PAYDUNYA_TOKEN', 'tk');

  mockCreateInvoice = vi.fn().mockResolvedValue({
    success: true,
    checkoutUrl: 'https://paydunya.test/checkout/abc',
    token: 'pd_token_123',
  });

  vi.doMock('@/lib/paydunya', () => ({
    createPayDunyaInvoice: mockCreateInvoice,
  }));

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({})),
  }));

  vi.doMock('@/lib/logger', () => ({
    logger: {
      child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/payments/paydunya/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/payments/paydunya/create', () => {
  it('returns 503 when PayDunya env keys are not configured', async () => {
    vi.stubEnv('PAYDUNYA_MASTER_KEY', '');
    vi.stubEnv('PAYDUNYA_PRIVATE_KEY', '');
    vi.stubEnv('PAYDUNYA_TOKEN', '');

    const { POST } = await import('@/app/api/payments/paydunya/create/route');
    const res = await POST(makeRequest({
      orderId: 'o1', amount: 100, customerName: 'A', customerEmail: 'a@b.com',
    }) as any);

    expect(res.status).toBe(503);
  });

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/payments/paydunya/create/route');
    const res = await POST(makeRequest({ orderId: 'o1', amount: 100 }) as any);

    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is zero', async () => {
    const { POST } = await import('@/app/api/payments/paydunya/create/route');
    const res = await POST(makeRequest({
      orderId: 'o1', amount: 0, customerName: 'A', customerEmail: 'a@b.com',
    }) as any);

    expect(res.status).toBe(400);
  });

  it('accepts negative amount (no amount > 0 validation) -- FIXME amount tampering risk', async () => {
    // FIXME: route only checks `!amount` — negative numbers slip through to the provider.
    const { POST } = await import('@/app/api/payments/paydunya/create/route');
    const res = await POST(makeRequest({
      orderId: 'o1', amount: -100, customerName: 'A', customerEmail: 'a@b.com',
    }) as any);

    expect(res.status).toBe(200);
    expect(mockCreateInvoice).toHaveBeenCalledWith(expect.objectContaining({ amount: -100 }));
  });

  it('returns 502 when invoice creation fails at provider', async () => {
    mockCreateInvoice.mockResolvedValueOnce({ success: false, error: 'provider down' });

    const { POST } = await import('@/app/api/payments/paydunya/create/route');
    const res = await POST(makeRequest({
      orderId: 'o1', amount: 100, customerName: 'A', customerEmail: 'a@b.com',
    }) as any);

    expect(res.status).toBe(502);
  });

  it('happy path returns 200 with checkoutUrl and token', async () => {
    const { POST } = await import('@/app/api/payments/paydunya/create/route');
    const res = await POST(makeRequest({
      orderId: 'order-abcdef12', amount: 750, customerName: 'A', customerEmail: 'a@b.com',
      customerPhone: '+221700000000',
    }) as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checkoutUrl).toBe('https://paydunya.test/checkout/abc');
    expect(body.token).toBe('pd_token_123');
  });
});
