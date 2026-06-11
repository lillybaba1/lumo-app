// @vitest-environment node
/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockCheckStatus: ReturnType<typeof vi.fn>;
let mockUpdatePayment: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockCheckStatus = vi.fn().mockResolvedValue({
    invoice: { status: 'completed', token: 'tok_abc' },
  });
  mockUpdatePayment = vi.fn().mockResolvedValue(undefined);

  vi.doMock('@/lib/paydunya', () => ({
    checkPayDunyaInvoiceStatus: mockCheckStatus,
  }));

  vi.doMock('@/services/paymentService', () => ({
    updatePaymentByToken: mockUpdatePayment,
  }));

  vi.doMock('@/lib/logger', () => ({
    logger: {
      child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    },
  }));
});

function makeJsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/payments/paydunya/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeFormRequest(dataObj: unknown): Request {
  const form = new URLSearchParams();
  form.set('data', JSON.stringify(dataObj));
  return new Request('http://localhost/api/payments/paydunya/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
}

describe('POST /api/payments/paydunya/callback (IPN)', () => {
  // SECURITY NOTE: This callback does NOT verify an HMAC signature from PayDunya.
  // It defends against forgery by re-fetching invoice status from the PayDunya API
  // server-side using the provided token. An attacker who knows a valid token could
  // still trigger an unsolicited verification call, but cannot fabricate status.
  // FIXME: route does not verify a webhook signature header — relies entirely on
  // server-side re-verification by token, which is acceptable but not best-practice.

  it('returns 400 when token is missing from callback data', async () => {
    const { POST } = await import('@/app/api/payments/paydunya/callback/route');
    const res = await POST(makeJsonRequest({ response_code: '00', invoice: {} }) as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no token/i);
  });

  it('returns 500 when PayDunya verification fails (unverifiable token)', async () => {
    mockCheckStatus.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/payments/paydunya/callback/route');
    const res = await POST(makeJsonRequest({
      invoice: { token: 'forged_token', status: 'completed' },
    }) as any);

    expect(res.status).toBe(500);
    expect(mockUpdatePayment).not.toHaveBeenCalled();
  });

  it('happy path JSON body: completed status updates payment as Completed', async () => {
    mockCheckStatus.mockResolvedValueOnce({
      invoice: { status: 'completed', token: 'tok_ok' },
    });

    const { POST } = await import('@/app/api/payments/paydunya/callback/route');
    const res = await POST(makeJsonRequest({
      invoice: { token: 'tok_ok', status: 'completed' },
    }) as any);

    expect(res.status).toBe(200);
    expect(mockUpdatePayment).toHaveBeenCalledWith('tok_ok', 'Completed');
  });

  it('happy path form-urlencoded body: cancelled status updates payment as Failed', async () => {
    mockCheckStatus.mockResolvedValueOnce({
      invoice: { status: 'cancelled', token: 'tok_cancel' },
    });

    const { POST } = await import('@/app/api/payments/paydunya/callback/route');
    const res = await POST(makeFormRequest({
      invoice: { token: 'tok_cancel', status: 'cancelled' },
    }) as any);

    expect(res.status).toBe(200);
    expect(mockUpdatePayment).toHaveBeenCalledWith('tok_cancel', 'Failed');
  });

  it('attacker spoofing "completed" status is overridden by server verification', async () => {
    // Attacker POSTs a fake "completed" payload, but PayDunya API actually reports "pending"
    mockCheckStatus.mockResolvedValueOnce({
      invoice: { status: 'pending', token: 'tok_attack' },
    });

    const { POST } = await import('@/app/api/payments/paydunya/callback/route');
    const res = await POST(makeJsonRequest({
      invoice: { token: 'tok_attack', status: 'completed' },
    }) as any);

    expect(res.status).toBe(200);
    // Payment is NOT marked Completed despite attacker's claim
    expect(mockUpdatePayment).toHaveBeenCalledWith('tok_attack', 'Pending');
  });

  it('GET returns ok status (health check)', async () => {
    const { GET } = await import('@/app/api/payments/paydunya/callback/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
