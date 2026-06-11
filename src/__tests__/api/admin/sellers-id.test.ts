/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockGetBA: ReturnType<typeof vi.fn>;
let mockUpdateBA: ReturnType<typeof vi.fn>;
let mockGetBoutiqueByBA: ReturnType<typeof vi.fn>;
let mockUpdateBoutique: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockGetBA = vi.fn().mockResolvedValue({ id: 's1', status: 'ACTIVE' });
  mockUpdateBA = vi.fn().mockResolvedValue(true);
  mockGetBoutiqueByBA = vi.fn().mockResolvedValue({ id: 'b1' });
  mockUpdateBoutique = vi.fn().mockResolvedValue(true);

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/businessAccountService', () => ({
    getBusinessAccount: mockGetBA,
    updateBusinessAccount: mockUpdateBA,
  }));
  vi.doMock('@/services/boutiqueService', () => ({
    getBoutiqueByBusinessAccount: mockGetBoutiqueByBA,
    updateBoutique: mockUpdateBoutique,
  }));
});

describe('GET /api/admin/sellers/[id]', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { GET } = await import('@/app/api/admin/sellers/[id]/route');
    const res = await GET(new Request('http://localhost/x') as any, { params: { id: 's1' } });
    expect(res.status).toBe(401);
  });

  it('returns 404 when seller not found', async () => {
    mockGetBA.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/admin/sellers/[id]/route');
    const res = await GET(new Request('http://localhost/x') as any, { params: { id: 'missing' } });
    expect(res.status).toBe(404);
  });

  it('returns 200 with seller + boutique', async () => {
    const { GET } = await import('@/app/api/admin/sellers/[id]/route');
    const res = await GET(new Request('http://localhost/x') as any, { params: { id: 's1' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.boutique.id).toBe('b1');
  });
});

describe('PATCH /api/admin/sellers/[id]', () => {
  it('returns 400 on invalid action', async () => {
    const { PATCH } = await import('@/app/api/admin/sellers/[id]/route');
    const res = await PATCH(new Request('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ action: 'bogus' }), headers: {'Content-Type':'application/json'} }) as any, { params: { id: 's1' } });
    expect(res.status).toBe(400);
  });

  it('suspends seller', async () => {
    const { PATCH } = await import('@/app/api/admin/sellers/[id]/route');
    const res = await PATCH(new Request('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ action: 'suspend' }), headers: {'Content-Type':'application/json'} }) as any, { params: { id: 's1' } });
    expect(res.status).toBe(200);
    expect(mockUpdateBA).toHaveBeenCalledWith('s1', { status: 'SUSPENDED' });
  });
});
