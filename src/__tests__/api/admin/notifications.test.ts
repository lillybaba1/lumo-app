/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockLimit: ReturnType<typeof vi.fn>;
let mockUpdateEq: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockLimit = vi.fn().mockResolvedValue({ data: [{ id: 'n1', is_read: false }], error: null });
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
          eq: vi.fn(() => ({
            order: vi.fn(() => ({ limit: mockLimit })),
          })),
        })),
        update: vi.fn(() => ({
          eq: mockUpdateEq,
        })),
      })),
    },
  }));
});

describe('GET /api/admin/notifications', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { GET } = await import('@/app/api/admin/notifications/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(401);
  });

  it('returns 200 with notifications', async () => {
    const { GET } = await import('@/app/api/admin/notifications/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
  });
});

describe('PATCH /api/admin/notifications', () => {
  it('marks single notification as read', async () => {
    const { PATCH } = await import('@/app/api/admin/notifications/route');
    const res = await PATCH(new Request('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ notificationId: 'n1' }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(200);
    expect(mockUpdateEq).toHaveBeenCalled();
  });
});
