/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();

  // supabaseAdmin builds chains for site_settings / products / orders.
  // Each query needs to be thenable since the route awaits .then(...).
  const settingsChain: any = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: (resolve: any) => resolve({ data: [] }),
  };

  const promoChain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ then: (resolve: any) => resolve({ data: null, error: null }) })),
  };

  const productsChain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(() => ({ then: (resolve: any) => resolve({ data: [] }) })),
  };

  const ordersChain: any = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    neq: vi.fn(() => ({ then: (resolve: any) => resolve({ data: [] }) })),
  };

  let call = 0;
  const from = vi.fn((table: string) => {
    if (table === 'site_settings') {
      call++;
      // First call is for keys IN, second for promo single
      return call === 1 ? settingsChain : promoChain;
    }
    if (table === 'products') return productsChain;
    if (table === 'orders') return ordersChain;
    return {};
  });

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: { from },
  }));

  vi.doMock('@/services/categoryService', () => ({
    getCategories: vi.fn().mockResolvedValue([{ id: 'c1', name: 'Shoes' }]),
  }));

  vi.doMock('@/app/admin/collections/actions', () => ({
    getCollections: vi.fn().mockResolvedValue({
      bestSellers: [], newArrivals: [], deals: [], featured: [],
    }),
  }));

  vi.doMock('@/app/admin/hero/actions', () => ({
    getHeroData: vi.fn().mockResolvedValue({ products: [], heroLabelText: 'Hero', heroLabelPosition: { x: 0, y: 0 } }),
  }));
});

describe('GET /api/homepage', () => {
  it('returns 200 with all aggregated homepage data', async () => {
    const { GET } = await import('@/app/api/homepage/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('settings');
    expect(body).toHaveProperty('categories');
    expect(body).toHaveProperty('collections');
    expect(body).toHaveProperty('products');
    expect(body).toHaveProperty('promoBanner');
  });
});
