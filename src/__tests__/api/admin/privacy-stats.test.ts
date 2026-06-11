/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockSelect: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({ select: mockSelect })),
    },
  }));
});

describe('GET /api/admin/privacy-stats', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { GET } = await import('@/app/api/admin/privacy-stats/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 200 with stats shape', async () => {
    const { GET } = await import('@/app/api/admin/privacy-stats/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('totalVisitors');
    expect(body).toHaveProperty('cookieConsents');
  });
});
