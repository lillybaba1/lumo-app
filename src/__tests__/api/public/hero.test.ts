/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetHeroData: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetHeroData = vi.fn().mockResolvedValue({
    products: [{ id: 'p1' }],
    heroLabelText: 'New Arrivals',
    heroLabelPosition: { x: 20, y: 30 },
  });

  vi.doMock('@/app/admin/hero/actions', () => ({
    getHeroData: mockGetHeroData,
  }));
});

describe('GET /api/hero', () => {
  it('returns 200 with hero data on happy path', async () => {
    const { GET } = await import('@/app/api/hero/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.heroLabelText).toBe('New Arrivals');
    expect(body.products[0].id).toBe('p1');
  });

  it('returns defaults when getHeroData throws', async () => {
    mockGetHeroData.mockRejectedValueOnce(new Error('fail'));
    const { GET } = await import('@/app/api/hero/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.heroLabelText).toBe('Featured');
  });
});
