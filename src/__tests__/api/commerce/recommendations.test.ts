/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetCurrentUser: ReturnType<typeof vi.fn>;
let mockForYou: ReturnType<typeof vi.fn>;
let mockAlsoViewed: ReturnType<typeof vi.fn>;
let mockBoughtTogether: ReturnType<typeof vi.fn>;
let mockBecauseViewed: ReturnType<typeof vi.fn>;
let mockRecentlyViewed: ReturnType<typeof vi.fn>;
let mockTrendingSearches: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetCurrentUser = vi.fn().mockResolvedValue(null);
  mockForYou = vi.fn().mockResolvedValue([{ id: 'p1' }]);
  mockAlsoViewed = vi.fn().mockResolvedValue([{ id: 'p2' }]);
  mockBoughtTogether = vi.fn().mockResolvedValue([{ id: 'p3' }]);
  mockBecauseViewed = vi.fn().mockResolvedValue({ products: [], sourceProduct: null });
  mockRecentlyViewed = vi.fn().mockResolvedValue([]);
  mockTrendingSearches = vi.fn().mockResolvedValue(['shoes', 'hats']);

  vi.doMock('@/lib/auth-admin', () => ({
    getCurrentUser: mockGetCurrentUser,
  }));

  vi.doMock('@/services/intelligenceService', () => ({
    getForYouRecommendations: mockForYou,
    getAlsoViewed: mockAlsoViewed,
    getFrequentlyBoughtTogether: mockBoughtTogether,
    getBecauseYouViewed: mockBecauseViewed,
    getUserRecentlyViewed: mockRecentlyViewed,
    getTrendingSearches: mockTrendingSearches,
  }));
});

describe('GET /api/recommendations', () => {
  it('returns 200 with trending-searches happy path', async () => {
    const { GET } = await import('@/app/api/recommendations/route');
    const res = await GET(new Request('http://localhost/api/recommendations?type=trending-searches') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.searches).toEqual(['shoes', 'hats']);
  });

  it('returns empty for-you with message when not authenticated', async () => {
    const { GET } = await import('@/app/api/recommendations/route');
    const res = await GET(new Request('http://localhost/api/recommendations?type=for-you') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toEqual([]);
    expect(body.message).toMatch(/login/i);
  });

  it('returns 400 when also-viewed missing productId', async () => {
    const { GET } = await import('@/app/api/recommendations/route');
    const res = await GET(new Request('http://localhost/api/recommendations?type=also-viewed') as any);
    expect(res.status).toBe(400);
  });
});
