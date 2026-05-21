/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockCheckPhoneExists: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockCheckPhoneExists = vi.fn().mockResolvedValue(false);
  vi.doMock('@/lib/otp-service', () => ({
    checkPhoneExists: mockCheckPhoneExists,
  }));
});

function makeRequest(query: string): any {
  const url = `http://localhost/api/auth/check-phone${query}`;
  const req = new Request(url);
  return Object.assign(req, {
    nextUrl: new URL(url),
  });
}

describe('GET /api/auth/check-phone', () => {
  it('returns 400 when phone parameter is missing', async () => {
    const { GET } = await import('@/app/api/auth/check-phone/route');
    const res = await GET(makeRequest(''));
    expect(res.status).toBe(400);
  });

  it('returns exists=false when phone is not registered', async () => {
    const { GET } = await import('@/app/api/auth/check-phone/route');
    const res = await GET(makeRequest('?phone=%2B2201234567'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exists).toBe(false);
  });

  it('returns exists=true when phone is registered', async () => {
    mockCheckPhoneExists.mockResolvedValueOnce(true);
    const { GET } = await import('@/app/api/auth/check-phone/route');
    const res = await GET(makeRequest('?phone=%2B2201234567'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exists).toBe(true);
  });

  it('returns exists=false when underlying check throws', async () => {
    mockCheckPhoneExists.mockRejectedValueOnce(new Error('db down'));
    const { GET } = await import('@/app/api/auth/check-phone/route');
    const res = await GET(makeRequest('?phone=%2B2201234567'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exists).toBe(false);
  });
});
