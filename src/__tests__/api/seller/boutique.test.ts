/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockGetBusinessAccountByOwner: ReturnType<typeof vi.fn>;
let mockGetBoutiqueByBusinessAccount: ReturnType<typeof vi.fn>;
let mockCreateBoutique: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u1', email: 'a@b.com' } },
    error: null,
  });
  mockGetBusinessAccountByOwner = vi.fn();
  mockGetBoutiqueByBusinessAccount = vi.fn();
  mockCreateBoutique = vi.fn();

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
  }));

  vi.doMock('@/services/boutiqueService', () => ({
    createBoutique: mockCreateBoutique,
    getBoutiqueByBusinessAccount: mockGetBoutiqueByBusinessAccount,
  }));

  vi.doMock('@/services/businessAccountService', () => ({
    getBusinessAccountByOwner: mockGetBusinessAccountByOwner,
  }));
});

function makePostRequest(body: unknown): Request {
  return new Request('http://localhost/api/business/boutique', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/business/boutique', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { GET } = await import('@/app/api/business/boutique/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when business account not found', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/business/boutique/route');
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns boutique on happy path', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce({ id: 'ba1' });
    mockGetBoutiqueByBusinessAccount.mockResolvedValueOnce({ id: 'b1', displayName: 'Shop' });
    const { GET } = await import('@/app/api/business/boutique/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.boutique.displayName).toBe('Shop');
  });
});

describe('POST /api/business/boutique', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/business/boutique/route');
    const res = await POST(makePostRequest({ displayName: 'Shop' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 if boutique already exists', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce({ id: 'ba1' });
    mockGetBoutiqueByBusinessAccount.mockResolvedValueOnce({ id: 'b1' });
    const { POST } = await import('@/app/api/business/boutique/route');
    const res = await POST(makePostRequest({ displayName: 'Shop' }));
    expect(res.status).toBe(400);
  });

  it('creates boutique on happy path with 201', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce({
      id: 'ba1',
      contactEmail: 'a@b.com',
      businessPhone: '+1',
    });
    mockGetBoutiqueByBusinessAccount.mockResolvedValueOnce(null);
    mockCreateBoutique.mockResolvedValueOnce({ id: 'b1', displayName: 'Shop' });

    const { POST } = await import('@/app/api/business/boutique/route');
    const res = await POST(makePostRequest({ displayName: 'Shop' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.boutique.id).toBe('b1');
  });
});
