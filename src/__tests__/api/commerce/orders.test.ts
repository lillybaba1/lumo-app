/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockUserRoleSingle: ReturnType<typeof vi.fn>;
let mockGetOrdersByEmail: ReturnType<typeof vi.fn>;
let mockWithRateLimit: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u1', email: 'me@x.com' } },
    error: null,
  });
  mockUserRoleSingle = vi.fn().mockResolvedValue({ data: { role: 'customer' } });
  mockGetOrdersByEmail = vi.fn().mockResolvedValue([{ id: 'o1' }]);
  mockWithRateLimit = vi.fn().mockResolvedValue({ allowed: true, headers: {} });

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { getUser: mockGetUser },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockUserRoleSingle })),
        })),
      })),
    })),
  }));

  vi.doMock('@/services/orderService', () => ({
    getOrdersByEmail: mockGetOrdersByEmail,
  }));

  vi.doMock('@/lib/rate-limiter', () => ({
    withRateLimit: mockWithRateLimit,
    RATE_LIMITS: { API_GENERAL: { limit: 100, window: 60_000 } },
  }));
});

function makeRequest(email?: string): Request {
  const url = email
    ? `http://localhost/api/orders?email=${encodeURIComponent(email)}`
    : 'http://localhost/api/orders';
  return new Request(url);
}

describe('GET /api/orders', () => {
  it('returns 200 with own orders on happy path', async () => {
    const { GET } = await import('@/app/api/orders/route');
    const res = await GET(makeRequest('me@x.com') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].id).toBe('o1');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { GET } = await import('@/app/api/orders/route');
    const res = await GET(makeRequest('me@x.com') as any);
    expect(res.status).toBe(401);
  });

  it('returns 403 when non-admin requests another user email', async () => {
    const { GET } = await import('@/app/api/orders/route');
    const res = await GET(makeRequest('someone-else@x.com') as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid email', async () => {
    const { GET } = await import('@/app/api/orders/route');
    const res = await GET(makeRequest('not-an-email') as any);
    expect(res.status).toBe(400);
  });
});
