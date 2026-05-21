/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockGetBusinessAccountByOwner: ReturnType<typeof vi.fn>;
let mockGetBoutiqueById: ReturnType<typeof vi.fn>;
let mockUpdateBoutique: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u1', email: 'a@b.com' } },
    error: null,
  });
  mockGetBusinessAccountByOwner = vi.fn();
  mockGetBoutiqueById = vi.fn();
  mockUpdateBoutique = vi.fn();

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
  }));

  vi.doMock('@/services/boutiqueService', () => ({
    getBoutiqueById: mockGetBoutiqueById,
    updateBoutique: mockUpdateBoutique,
  }));

  vi.doMock('@/services/businessAccountService', () => ({
    getBusinessAccountByOwner: mockGetBusinessAccountByOwner,
  }));
});

function makePutRequest(body: unknown): Request {
  return new Request('http://localhost/api/business/boutique/b1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: 'b1' });

describe('GET /api/business/boutique/[id]', () => {
  it('returns 404 when boutique not found', async () => {
    mockGetBoutiqueById.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/business/boutique/[id]/route');
    const res = await GET(new Request('http://localhost/x'), { params });
    expect(res.status).toBe(404);
  });

  it('returns boutique on happy path', async () => {
    mockGetBoutiqueById.mockResolvedValueOnce({ id: 'b1', displayName: 'Shop' });
    const { GET } = await import('@/app/api/business/boutique/[id]/route');
    const res = await GET(new Request('http://localhost/x'), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.boutique.id).toBe('b1');
  });
});

describe('PUT /api/business/boutique/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { PUT } = await import('@/app/api/business/boutique/[id]/route');
    const res = await PUT(makePutRequest({ displayName: 'X' }), { params });
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller does not own the boutique', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce({ id: 'ba1' });
    mockGetBoutiqueById.mockResolvedValueOnce({ id: 'b1', businessAccountId: 'other-ba' });
    const { PUT } = await import('@/app/api/business/boutique/[id]/route');
    const res = await PUT(makePutRequest({ displayName: 'X' }), { params });
    expect(res.status).toBe(403);
  });

  it('updates boutique on happy path', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce({ id: 'ba1' });
    mockGetBoutiqueById.mockResolvedValueOnce({ id: 'b1', businessAccountId: 'ba1' });
    mockUpdateBoutique.mockResolvedValueOnce({ id: 'b1', displayName: 'New' });

    const { PUT } = await import('@/app/api/business/boutique/[id]/route');
    const res = await PUT(makePutRequest({ displayName: 'New' }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.boutique.displayName).toBe('New');
  });
});
