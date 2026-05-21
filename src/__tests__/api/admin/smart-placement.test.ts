/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetCollections: ReturnType<typeof vi.fn>;
let mockSingle: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetCollections = vi.fn().mockResolvedValue({
    bestSellers: [], newArrivals: [], deals: [], featured: [],
  });
  mockSingle = vi.fn().mockResolvedValue({ data: { value: { productIds: [] } } });

  const productsQuery = {
    select: vi.fn(() => productsQuery),
    eq: vi.fn(() => productsQuery),
    order: vi.fn(() => Promise.resolve({ data: [
      { id: 'p1', name: 'P1', price: '10', image_urls: [], product_images: [], view_count: 5, sales_count: 1, average_rating: 4, review_count: 2, is_featured: true, is_active: true, stock: 10, created_at: new Date().toISOString() },
    ], error: null })),
  };
  const ordersQuery = {
    select: vi.fn(() => ordersQuery),
    gte: vi.fn(() => ordersQuery),
    neq: vi.fn(() => Promise.resolve({ data: [], error: null })),
  };
  const siteSettingsQuery = {
    select: vi.fn(() => siteSettingsQuery),
    eq: vi.fn(() => siteSettingsQuery),
    single: mockSingle,
  };

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn((table: string) => {
        if (table === 'products') return productsQuery;
        if (table === 'orders') return ordersQuery;
        if (table === 'site_settings') return siteSettingsQuery;
        return productsQuery;
      }),
    },
  }));
  vi.doMock('@/app/admin/collections/actions', () => ({
    getCollections: mockGetCollections,
  }));
});

describe('GET /api/admin/smart-placement', () => {
  it('returns 200 with products and sections on happy path', async () => {
    const { GET } = await import('@/app/api/admin/smart-placement/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('products');
    expect(body).toHaveProperty('sections');
    expect(body).toHaveProperty('stats');
    expect(body.products.length).toBe(1);
  });

  it('returns 500 on internal error', async () => {
    vi.resetModules();
    vi.doMock('@/lib/supabaseAdmin', () => ({
      supabaseAdmin: {
        from: vi.fn(() => { throw new Error('boom'); }),
      },
    }));
    vi.doMock('@/app/admin/collections/actions', () => ({ getCollections: mockGetCollections }));
    const { GET } = await import('@/app/api/admin/smart-placement/route');
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
