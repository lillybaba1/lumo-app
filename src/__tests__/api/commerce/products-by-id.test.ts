/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetProductById: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetProductById = vi.fn();
  vi.doMock('@/services/productService', () => ({
    getProductById: mockGetProductById,
  }));
});

describe('GET /api/products/[id]', () => {
  it('returns 200 with product on happy path', async () => {
    mockGetProductById.mockResolvedValueOnce({ id: 'p1', name: 'Hat' });
    const { GET } = await import('@/app/api/products/[id]/route');
    const res = await GET(new Request('http://localhost/api/products/p1') as any, { params: { id: 'p1' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product.id).toBe('p1');
  });

  it('returns 404 when product not found', async () => {
    mockGetProductById.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/products/[id]/route');
    const res = await GET(new Request('http://localhost/api/products/none') as any, { params: { id: 'none' } });
    expect(res.status).toBe(404);
  });
});
