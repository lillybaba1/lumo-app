/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockWithRateLimit: ReturnType<typeof vi.fn>;
let mockFrom: ReturnType<typeof vi.fn>;
let queryResults: { selectSingle: any; update: any };

beforeEach(() => {
  vi.resetModules();

  queryResults = {
    selectSingle: { data: null, error: { message: 'not found' } },
    update: { error: null },
  };

  mockRequireAdmin = vi.fn().mockResolvedValue({
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'admin@example.com',
    role: 'admin',
  });

  mockWithRateLimit = vi.fn().mockResolvedValue({ allowed: true, headers: {} });

  // Build the supabaseAdmin.from(...) chain such that:
  //   .select(...).eq(...).single() resolves to queryResults.selectSingle
  //   .update(...).eq(...) resolves to queryResults.update
  mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(queryResults.selectSingle)),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve(queryResults.update)),
    })),
  }));

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(message = 'Admin authentication required') {
      super(message);
      this.name = 'UnauthorizedError';
    }
  }

  vi.doMock('@/lib/auth-admin', () => ({
    requireAdmin: mockRequireAdmin,
    UnauthorizedError,
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: { from: mockFrom },
  }));

  vi.doMock('@/lib/rate-limiter', () => ({
    withRateLimit: mockWithRateLimit,
    RATE_LIMITS: { API_SENSITIVE: { limit: 10, window: 60_000 } },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/admin/promote-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/promote-user', () => {
  it('returns 401 when requireAdmin throws UnauthorizedError', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('Not authenticated'));

    const { POST } = await import('@/app/api/admin/promote-user/route');
    const res = await POST(makeRequest({ email: 't@x.com', role: 'admin' }) as any);

    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body (missing role)', async () => {
    const { POST } = await import('@/app/api/admin/promote-user/route');
    const res = await POST(makeRequest({ email: 't@x.com' }) as any);

    expect(res.status).toBe(400);
  });

  it('returns 400 when neither userId nor email is provided', async () => {
    const { POST } = await import('@/app/api/admin/promote-user/route');
    const res = await POST(makeRequest({ role: 'admin' }) as any);

    expect(res.status).toBe(400);
  });

  it('returns 404 when user not found in either table', async () => {
    queryResults.selectSingle = { data: null, error: { message: 'not found' } };

    const { POST } = await import('@/app/api/admin/promote-user/route');
    const res = await POST(makeRequest({ email: 'nobody@x.com', role: 'admin' }) as any);

    expect(res.status).toBe(404);
  });

  it('returns 403 when admin tries to demote themselves', async () => {
    const adminUuid = '11111111-1111-1111-1111-111111111111';
    queryResults.selectSingle = {
      data: { id: adminUuid, email: 'admin@example.com', name: 'A', role: 'admin' },
      error: null,
    };

    const { POST } = await import('@/app/api/admin/promote-user/route');
    const res = await POST(makeRequest({ userId: adminUuid, role: 'customer' }) as any);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/cannot demote yourself/i);
  });

  it('promotes successfully on happy path', async () => {
    const targetUuid = '22222222-2222-2222-2222-222222222222';
    queryResults.selectSingle = {
      data: { id: targetUuid, email: 't@x.com', name: 'T', role: 'customer' },
      error: null,
    };
    queryResults.update = { error: null };

    const { POST } = await import('@/app/api/admin/promote-user/route');
    const res = await POST(makeRequest({ userId: targetUuid, role: 'admin' }) as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.newRole).toBe('admin');
    expect(body.user.previousRole).toBe('customer');
  });

  it('returns the 429 response when rate-limited', async () => {
    mockWithRateLimit.mockResolvedValueOnce({
      allowed: false,
      headers: {},
      response: new Response('rate limited', { status: 429 }),
    });

    const { POST } = await import('@/app/api/admin/promote-user/route');
    const res = await POST(makeRequest({ email: 't@x.com', role: 'admin' }) as any);

    expect(res.status).toBe(429);
    expect(mockRequireAdmin).not.toHaveBeenCalled();
  });
});
