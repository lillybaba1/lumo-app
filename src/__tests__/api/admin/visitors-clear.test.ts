/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockClearInactive: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockClearInactive = vi.fn().mockResolvedValue({ deleted: 5, error: null });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/visitorService', () => ({ clearInactiveVisitors: mockClearInactive }));
});

function req(body: unknown): Request {
  return new Request('http://localhost/api/admin/visitors/clear', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/visitors/clear', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { POST } = await import('@/app/api/admin/visitors/clear/route');
    const res = await POST(req({ hoursInactive: 24 }) as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid input (out of range)', async () => {
    const { POST } = await import('@/app/api/admin/visitors/clear/route');
    const res = await POST(req({ hoursInactive: 10000 }) as any);
    expect(res.status).toBe(400);
  });

  it('clears visitors on happy path', async () => {
    const { POST } = await import('@/app/api/admin/visitors/clear/route');
    const res = await POST(req({ hoursInactive: 12 }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(5);
  });
});
