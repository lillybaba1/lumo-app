/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockGetPublished: ReturnType<typeof vi.fn>;
let mockUpdateBoutique: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockGetPublished = vi.fn().mockResolvedValue([
    { id: 'b1', name: 'B1', isFeatured: true },
    { id: 'b2', name: 'B2', isFeatured: false },
  ]);
  mockUpdateBoutique = vi.fn().mockResolvedValue(true);

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }

  vi.doMock('@/lib/auth-admin', () => ({
    requireAdmin: mockRequireAdmin,
    UnauthorizedError,
  }));
  vi.doMock('@/services/boutiqueService', () => ({
    getPublishedBoutiques: mockGetPublished,
    updateBoutique: mockUpdateBoutique,
  }));
});

describe('GET /api/admin/boutiques', () => {
  it('returns 401-ish error when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    const err = new UnauthorizedError('no');
    mockRequireAdmin.mockRejectedValueOnce(err);

    const { GET } = await import('@/app/api/admin/boutiques/route');
    const res = await GET(new Request('http://localhost/api/admin/boutiques') as any);
    expect(res.status).toBe(401);
  });

  it('returns 200 with boutiques list', async () => {
    const { GET } = await import('@/app/api/admin/boutiques/route');
    const res = await GET(new Request('http://localhost/api/admin/boutiques') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.count).toBe(2);
  });

  it('filters featured=true', async () => {
    const { GET } = await import('@/app/api/admin/boutiques/route');
    const res = await GET(new Request('http://localhost/api/admin/boutiques?featured=true') as any);
    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe('b1');
  });
});

describe('PUT /api/admin/boutiques', () => {
  it('returns 400 with empty boutiqueIds', async () => {
    const { PUT } = await import('@/app/api/admin/boutiques/route');
    const res = await PUT(new Request('http://localhost/api/admin/boutiques', {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ boutiqueIds: [], updates: { isFeatured: true } }),
    }) as any);
    expect(res.status).toBe(400);
  });

  it('bulk updates successfully', async () => {
    const { PUT } = await import('@/app/api/admin/boutiques/route');
    const res = await PUT(new Request('http://localhost/api/admin/boutiques', {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ boutiqueIds: ['b1','b2'], updates: { isFeatured: true } }),
    }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.successCount).toBe(2);
  });
});
