/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockGetVisitors: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockGetVisitors = vi.fn().mockResolvedValue({ visitors: [], total: 0, page: 1 });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/visitorService', () => ({ getVisitorsByStatus: mockGetVisitors }));
});

describe('GET /api/admin/visitors', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { GET } = await import('@/app/api/admin/visitors/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(401);
  });

  it('returns 200 with visitors', async () => {
    const { GET } = await import('@/app/api/admin/visitors/route');
    const res = await GET(new Request('http://localhost/x?status=active') as any);
    expect(res.status).toBe(200);
    expect(mockGetVisitors).toHaveBeenCalledWith('active', 1, 50);
  });
});
