/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetCollections: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetCollections = vi.fn().mockResolvedValue({
    bestSellers: [{ id: 'b1' }],
    newArrivals: [],
    deals: [],
    featured: [],
  });
  vi.doMock('@/app/admin/collections/actions', () => ({
    getCollections: mockGetCollections,
  }));
});

describe('GET /api/collections', () => {
  it('returns 200 with collections on happy path', async () => {
    const { GET } = await import('@/app/api/collections/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bestSellers).toHaveLength(1);
  });

  it('returns 200 with empty collections on error', async () => {
    mockGetCollections.mockRejectedValueOnce(new Error('fail'));
    const { GET } = await import('@/app/api/collections/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bestSellers).toEqual([]);
  });
});
