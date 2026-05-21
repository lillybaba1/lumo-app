/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockSelectSingle: ReturnType<typeof vi.fn>;
let mockUpdateEq: ReturnType<typeof vi.fn>;
let mockInsert: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  vi.doMock('server-only', () => ({}));
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'admin-1', email: 'admin@x.com', role: 'admin' });
  mockSelectSingle = vi.fn().mockResolvedValue({ data: { id: 'target-1', email: 't@x.com', role: 'customer' }, error: null });
  mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null });
  mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/lib/supabase/server', () => ({
    createAdminClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockSelectSingle })),
        })),
        update: vi.fn(() => ({ eq: mockUpdateEq })),
        insert: mockInsert,
      })),
    })),
  }));
});

describe('POST /api/admin/users/[id]/promote', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { POST } = await import('@/app/api/admin/users/[id]/promote/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }) as any, { params: { id: 'target-1' } });
    expect(res.status).toBe(401);
  });

  it('returns 400 when promoting self', async () => {
    const { POST } = await import('@/app/api/admin/users/[id]/promote/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }) as any, { params: { id: 'admin-1' } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/own admin status/i);
  });

  it('returns 404 when user not found', async () => {
    mockSelectSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    const { POST } = await import('@/app/api/admin/users/[id]/promote/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }) as any, { params: { id: 'missing' } });
    expect(res.status).toBe(404);
  });

  it('promotes user on happy path', async () => {
    const { POST } = await import('@/app/api/admin/users/[id]/promote/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }) as any, { params: { id: 'target-1' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
