/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockUpdateOrder: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockUpdateOrder = vi.fn().mockResolvedValue(true);

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/orderService', () => ({ updateOrder: mockUpdateOrder }));
});

function req(body: unknown): Request {
  return new Request('http://localhost/api/admin/orders/update', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/orders/update', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { POST } = await import('@/app/api/admin/orders/update/route');
    const res = await POST(req({ orderId: '00000000-0000-0000-0000-000000000000' }) as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 on validation failure (bad uuid)', async () => {
    const { POST } = await import('@/app/api/admin/orders/update/route');
    const res = await POST(req({ orderId: 'not-a-uuid' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 200 on happy path', async () => {
    const { POST } = await import('@/app/api/admin/orders/update/route');
    const res = await POST(req({ orderId: '00000000-0000-0000-0000-000000000001', status: 'Shipped' }) as any);
    expect(res.status).toBe(200);
    expect(mockUpdateOrder).toHaveBeenCalled();
  });
});
