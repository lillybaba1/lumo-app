/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetCategories: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetCategories = vi.fn().mockResolvedValue([{ id: 'c1', name: 'Hats' }]);
  vi.doMock('@/services/categoryService', () => ({
    getCategories: mockGetCategories,
  }));
});

describe('GET /api/categories', () => {
  it('returns 200 with categories array', async () => {
    const { GET } = await import('@/app/api/categories/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0].id).toBe('c1');
  });

  it('returns 500 on service error', async () => {
    mockGetCategories.mockRejectedValueOnce(new Error('db fail'));
    const { GET } = await import('@/app/api/categories/route');
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
