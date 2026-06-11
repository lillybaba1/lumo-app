/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockGetAll: ReturnType<typeof vi.fn>;
let mockUpdate: ReturnType<typeof vi.fn>;
let mockWithRateLimit: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockGetAll = vi.fn().mockResolvedValue([
    { id: 's1', status: 'ACTIVE', subscriptionTier: 'pro', verificationStatus: 'verified' },
    { id: 's2', status: 'SUSPENDED', subscriptionTier: 'free', verificationStatus: 'unverified' },
  ]);
  mockUpdate = vi.fn().mockResolvedValue(true);
  mockWithRateLimit = vi.fn().mockResolvedValue({ allowed: true, headers: {} });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/businessAccountService', () => ({
    getAllBusinessAccounts: mockGetAll,
    updateBusinessAccount: mockUpdate,
  }));
  vi.doMock('@/lib/rate-limiter', () => ({
    withRateLimit: mockWithRateLimit,
    RATE_LIMITS: { API_SENSITIVE: { limit: 10, window: 60_000 } },
  }));
});

describe('GET /api/admin/sellers', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { GET } = await import('@/app/api/admin/sellers/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(401);
  });

  it('returns 200 with all sellers', async () => {
    const { GET } = await import('@/app/api/admin/sellers/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(2);
  });

  it('filters by status', async () => {
    const { GET } = await import('@/app/api/admin/sellers/route');
    const res = await GET(new Request('http://localhost/x?status=ACTIVE') as any);
    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe('s1');
  });
});

describe('PUT /api/admin/sellers', () => {
  it('returns 429 when rate-limited', async () => {
    mockWithRateLimit.mockResolvedValueOnce({
      allowed: false, headers: {},
      response: new Response('rate limited', { status: 429 }),
    });
    const { PUT } = await import('@/app/api/admin/sellers/route');
    const res = await PUT(new Request('http://localhost/x', { method: 'PUT', body: JSON.stringify({ sellerIds: ['s1'], updates: { status: 'ACTIVE' } }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(429);
  });

  it('returns 400 when sellerIds empty', async () => {
    const { PUT } = await import('@/app/api/admin/sellers/route');
    const res = await PUT(new Request('http://localhost/x', { method: 'PUT', body: JSON.stringify({ sellerIds: [], updates: { status: 'ACTIVE' } }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(400);
  });

  it('bulk updates on happy path', async () => {
    const { PUT } = await import('@/app/api/admin/sellers/route');
    const res = await PUT(new Request('http://localhost/x', { method: 'PUT', body: JSON.stringify({ sellerIds: ['s1','s2'], updates: { verificationStatus: 'verified' } }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.successCount).toBe(2);
  });
});
