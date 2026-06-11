/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockResendOTP: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockResendOTP = vi.fn().mockResolvedValue({ success: true });

  vi.doMock('@/lib/otp-service', () => ({
    resendOTP: mockResendOTP,
  }));

  vi.doMock('@/lib/rate-limiter', () => ({
    getClientIdentifier: vi.fn(() => 'client-1'),
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/resend-otp', () => {
  it('returns 400 when phone is missing', async () => {
    const { POST } = await import('@/app/api/auth/resend-otp/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
  });

  it('returns 200 on happy path', async () => {
    const { POST } = await import('@/app/api/auth/resend-otp/route');
    const res = await POST(makeRequest({ phone: '+2201234567' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockResendOTP).toHaveBeenCalledWith('+2201234567', 'client-1');
  });

  it('returns 429 when rate-limited', async () => {
    mockResendOTP.mockResolvedValueOnce({ success: false, error: 'rate limited', retryAfter: 60 });
    const { POST } = await import('@/app/api/auth/resend-otp/route');
    const res = await POST(makeRequest({ phone: '+2201234567' }) as any);
    expect(res.status).toBe(429);
  });

  it('returns 400 when resendOTP fails without retryAfter', async () => {
    mockResendOTP.mockResolvedValueOnce({ success: false, error: 'invalid phone' });
    const { POST } = await import('@/app/api/auth/resend-otp/route');
    const res = await POST(makeRequest({ phone: '+2201234567' }) as any);
    expect(res.status).toBe(400);
  });
});
