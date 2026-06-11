/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockDeleteRow: ReturnType<typeof vi.fn>;
let mockUpdateRow: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockDeleteRow = vi.fn().mockResolvedValue(true);
  mockUpdateRow = vi.fn().mockResolvedValue(true);

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/databaseService', () => ({
    deleteTableRow: mockDeleteRow,
    updateTableRow: mockUpdateRow,
  }));
});

describe('DELETE /api/admin/database/[table]/[id]', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { DELETE } = await import('@/app/api/admin/database/[table]/[id]/route');
    const res = await DELETE(new Request('http://localhost/x') as any, { params: Promise.resolve({ table: 'users', id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 200 on successful delete', async () => {
    const { DELETE } = await import('@/app/api/admin/database/[table]/[id]/route');
    const res = await DELETE(new Request('http://localhost/x') as any, { params: Promise.resolve({ table: 'users', id: '1' }) });
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/admin/database/[table]/[id]', () => {
  it('returns 200 on successful update', async () => {
    const { PUT } = await import('@/app/api/admin/database/[table]/[id]/route');
    const res = await PUT(new Request('http://localhost/x', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: 'New' }) }) as any, { params: Promise.resolve({ table: 'users', id: '1' }) });
    expect(res.status).toBe(200);
  });
});
