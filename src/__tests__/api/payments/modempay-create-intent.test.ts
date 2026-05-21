// @vitest-environment node
/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockIsConfigured: ReturnType<typeof vi.fn>;
let mockCreateIntent: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockIsConfigured = vi.fn().mockReturnValue(true);
  mockCreateIntent = vi.fn().mockResolvedValue({
    success: true,
    paymentLink: 'https://modempay.test/pay/abc',
    intentId: 'pi_test_123',
  });

  vi.doMock('@/lib/modempay', () => ({
    isModemPayConfigured: mockIsConfigured,
    createModemPayIntent: mockCreateIntent,
  }));

  vi.doMock('@/lib/logger', () => ({
    logger: {
      child: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/payments/modempay/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/payments/modempay/create-intent', () => {
  it('returns 503 when Modem Pay is not configured', async () => {
    mockIsConfigured.mockReturnValueOnce(false);

    const { POST } = await import('@/app/api/payments/modempay/create-intent/route');
    const res = await POST(makeRequest({
      orderId: 'o1', amount: 100, customerName: 'A', customerEmail: 'a@b.com',
    }) as any);

    expect(res.status).toBe(503);
  });

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/payments/modempay/create-intent/route');
    const res = await POST(makeRequest({ orderId: 'o1', amount: 100 }) as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing required fields/i);
  });

  it('returns 400 when amount is zero (falsy check rejects 0)', async () => {
    const { POST } = await import('@/app/api/payments/modempay/create-intent/route');
    const res = await POST(makeRequest({
      orderId: 'o1', amount: 0, customerName: 'A', customerEmail: 'a@b.com',
    }) as any);

    expect(res.status).toBe(400);
  });

  it('accepts negative amount (route does not validate amount > 0) -- FIXME amount tampering risk', async () => {
    // FIXME: route only does `!amount` check — negative numbers pass through.
    // This allows a client to send a negative amount which the provider may reject,
    // but no app-layer validation exists. Tracking current behavior.
    const { POST } = await import('@/app/api/payments/modempay/create-intent/route');
    const res = await POST(makeRequest({
      orderId: 'o1', amount: -50, customerName: 'A', customerEmail: 'a@b.com',
    }) as any);

    // Currently returns 200 because route forwards to provider without validation
    expect(res.status).toBe(200);
    expect(mockCreateIntent).toHaveBeenCalledWith(expect.objectContaining({ amount: -50 }));
  });

  it('returns 502 when provider intent creation fails', async () => {
    mockCreateIntent.mockResolvedValueOnce({ success: false, error: 'provider down' });

    const { POST } = await import('@/app/api/payments/modempay/create-intent/route');
    const res = await POST(makeRequest({
      orderId: 'o1', amount: 100, customerName: 'A', customerEmail: 'a@b.com',
    }) as any);

    expect(res.status).toBe(502);
  });

  it('happy path returns 200 with paymentLink and intentId', async () => {
    const { POST } = await import('@/app/api/payments/modempay/create-intent/route');
    const res = await POST(makeRequest({
      orderId: 'o1', amount: 500, customerName: 'A', customerEmail: 'a@b.com',
      customerPhone: '+221700000000', description: 'order',
    }) as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paymentLink).toBe('https://modempay.test/pay/abc');
    expect(body.intentId).toBe('pi_test_123');
  });
});
