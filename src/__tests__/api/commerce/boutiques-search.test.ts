/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockWithRateLimit: ReturnType<typeof vi.fn>;
let mockLimit: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockWithRateLimit = vi.fn().mockResolvedValue({ allowed: true, headers: {} });
  mockLimit = vi.fn().mockResolvedValue({
    data: [
      { id: 'b1', slug: 'shop-one', display_name: 'Shop One', tagline: 'best', logo: 'l.png', total_products: 5, is_published: true },
    ],
    error: null,
  });

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            ilike: vi.fn(() => ({ limit: mockLimit })),
          })),
        })),
      })),
    },
  }));

  vi.doMock('@/lib/rate-limiter', () => ({
    withRateLimit: mockWithRateLimit,
    RATE_LIMITS: { API_GENERAL: { limit: 100, window: 60_000 } },
  }));
});

describe('GET /api/boutiques/search', () => {
  it('returns 200 with mapped results on happy path', async () => {
    const { GET } = await import('@/app/api/boutiques/search/route');
    const res = await GET(new Request('http://localhost/api/boutiques/search?q=shop') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].displayName).toBe('Shop One');
    expect(body[0].totalProducts).toBe(5);
  });

  it('returns empty array when query too short', async () => {
    const { GET } = await import('@/app/api/boutiques/search/route');
    const res = await GET(new Request('http://localhost/api/boutiques/search?q=a') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});
