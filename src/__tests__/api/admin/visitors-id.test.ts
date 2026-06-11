/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockDeleteVisitor: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockDeleteVisitor = vi.fn().mockResolvedValue(true);

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/visitorService', () => ({ deleteVisitor: mockDeleteVisitor }));
});

describe('DELETE /api/admin/visitors/[id]', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { DELETE } = await import('@/app/api/admin/visitors/[id]/route');
    const res = await DELETE(new Request('http://localhost/x', { method: 'DELETE' }) as any, { params: Promise.resolve({ id: 'v1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 200 on successful delete', async () => {
    const { DELETE } = await import('@/app/api/admin/visitors/[id]/route');
    const res = await DELETE(new Request('http://localhost/x', { method: 'DELETE' }) as any, { params: Promise.resolve({ id: 'v1' }) });
    expect(res.status).toBe(200);
  });

  it('returns 500 when delete fails', async () => {
    mockDeleteVisitor.mockResolvedValueOnce(false);
    const { DELETE } = await import('@/app/api/admin/visitors/[id]/route');
    const res = await DELETE(new Request('http://localhost/x', { method: 'DELETE' }) as any, { params: Promise.resolve({ id: 'v1' }) });
    expect(res.status).toBe(500);
  });
});
