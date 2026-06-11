/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetProductsPaginated: ReturnType<typeof vi.fn>;
let mockWithRateLimit: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetProductsPaginated = vi.fn().mockResolvedValue({
    data: [{ id: 'p1', name: 'Test Product' }],
    count: 1,
  });
  mockWithRateLimit = vi.fn().mockResolvedValue({ allowed: true, headers: {} });

  vi.doMock('@/services/productService', () => ({
    getProductsPaginated: mockGetProductsPaginated,
  }));

  vi.doMock('@/lib/rate-limiter', () => ({
    withRateLimit: mockWithRateLimit,
    RATE_LIMITS: { API_GENERAL: { limit: 100, window: 60_000 } },
  }));
});

function makeRequest(url = 'http://localhost/api/products'): Request {
  return new Request(url);
}

describe('GET /api/products', () => {
  it('returns 200 with array of products on happy path', async () => {
    const { GET } = await import('@/app/api/products/route');
    const res = await GET(makeRequest() as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].id).toBe('p1');
  });

  it('returns 400 on invalid query parameters', async () => {
    const { GET } = await import('@/app/api/products/route');
    const res = await GET(makeRequest('http://localhost/api/products?limit=999') as any);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate-limited', async () => {
    mockWithRateLimit.mockResolvedValueOnce({
      allowed: false,
      headers: {},
      response: new Response('rate limited', { status: 429 }),
    });
    const { GET } = await import('@/app/api/products/route');
    const res = await GET(makeRequest() as any);
    expect(res.status).toBe(429);
  });
});
