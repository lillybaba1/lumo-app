/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockOrdersSingle: ReturnType<typeof vi.fn>;
let mockUpdateEq: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'admin-1', email: 'a@x.com', role: 'admin' });
  mockOrdersSingle = vi.fn().mockResolvedValue({ data: { id: 'o1' }, error: null });
  mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockOrdersSingle })),
        })),
        update: vi.fn(() => ({ eq: mockUpdateEq })),
      })),
    },
  }));
});

describe('POST /api/admin/orders/[id]/ship', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { POST } = await import('@/app/api/admin/orders/[id]/ship/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }) as any, { params: { id: 'o1' } });
    expect(res.status).toBe(401);
  });

  it('returns 404 when order not found', async () => {
    mockOrdersSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    const { POST } = await import('@/app/api/admin/orders/[id]/ship/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }) as any, { params: { id: 'missing' } });
    expect(res.status).toBe(404);
  });

  it('marks order as shipped on happy path', async () => {
    const { POST } = await import('@/app/api/admin/orders/[id]/ship/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }) as any, { params: { id: 'o1' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockUpdateEq).toHaveBeenCalled();
  });
});
