/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockFrom: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  // Build a fluent supabase chain stub. Each method returns `this` until terminated.
  // Different terminal methods are stubbed to return our canned data.
  const settingsChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { value: { productIds: [] } } }),
  };

  const ordersChain = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    neq: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  mockFrom = vi.fn((table: string) => {
    if (table === 'site_settings') return settingsChain;
    if (table === 'orders') return ordersChain;
    // products table - if hit
    return {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
  });

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: { from: mockFrom },
  }));
});

describe('GET /api/trending', () => {
  it('returns 200 with empty products when nothing trending', async () => {
    const { GET } = await import('@/app/api/trending/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toEqual([]);
    expect(body.productIds).toEqual([]);
  });
});
