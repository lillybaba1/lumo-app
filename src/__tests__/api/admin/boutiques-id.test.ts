/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockGetBoutiqueById: ReturnType<typeof vi.fn>;
let mockUpdateBoutique: ReturnType<typeof vi.fn>;
let mockGetBusinessAccount: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockGetBoutiqueById = vi.fn().mockResolvedValue({ id: 'b1', businessAccountId: 'ba1' });
  mockUpdateBoutique = vi.fn().mockResolvedValue(true);
  mockGetBusinessAccount = vi.fn().mockResolvedValue({ id: 'ba1' });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/boutiqueService', () => ({
    getBoutiqueById: mockGetBoutiqueById,
    updateBoutique: mockUpdateBoutique,
  }));
  vi.doMock('@/services/businessAccountService', () => ({
    getBusinessAccount: mockGetBusinessAccount,
  }));
});

describe('GET /api/admin/boutiques/[id]', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { GET } = await import('@/app/api/admin/boutiques/[id]/route');
    const res = await GET(new Request('http://localhost/x') as any, { params: { id: 'b1' } });
    expect(res.status).toBe(401);
  });

  it('returns 404 when boutique not found', async () => {
    mockGetBoutiqueById.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/admin/boutiques/[id]/route');
    const res = await GET(new Request('http://localhost/x') as any, { params: { id: 'missing' } });
    expect(res.status).toBe(404);
  });

  it('returns 200 with boutique and seller', async () => {
    const { GET } = await import('@/app/api/admin/boutiques/[id]/route');
    const res = await GET(new Request('http://localhost/x') as any, { params: { id: 'b1' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe('b1');
    expect(body.data.seller.id).toBe('ba1');
  });
});

describe('PATCH /api/admin/boutiques/[id]', () => {
  it('returns 400 on invalid action', async () => {
    const { PATCH } = await import('@/app/api/admin/boutiques/[id]/route');
    const res = await PATCH(new Request('http://localhost/x', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'bogus' }) }) as any, { params: { id: 'b1' } });
    expect(res.status).toBe(400);
  });

  it('handles feature action', async () => {
    const { PATCH } = await import('@/app/api/admin/boutiques/[id]/route');
    const res = await PATCH(new Request('http://localhost/x', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'feature' }) }) as any, { params: { id: 'b1' } });
    expect(res.status).toBe(200);
    expect(mockUpdateBoutique).toHaveBeenCalledWith('b1', { isFeatured: true });
  });
});
