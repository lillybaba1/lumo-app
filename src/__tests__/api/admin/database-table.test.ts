/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockGetTableData: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockGetTableData = vi.fn().mockResolvedValue({ rows: [], count: 0 });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/databaseService', () => ({ getTableData: mockGetTableData }));
});

describe('GET /api/admin/database/[table]', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { GET } = await import('@/app/api/admin/database/[table]/route');
    const res = await GET(new Request('http://localhost/x') as any, { params: Promise.resolve({ table: 'users' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when table not found', async () => {
    mockGetTableData.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/admin/database/[table]/route');
    const res = await GET(new Request('http://localhost/x') as any, { params: Promise.resolve({ table: 'bogus' }) });
    expect(res.status).toBe(404);
  });

  it('returns 200 with table data', async () => {
    const { GET } = await import('@/app/api/admin/database/[table]/route');
    const res = await GET(new Request('http://localhost/x') as any, { params: Promise.resolve({ table: 'users' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ rows: [], count: 0 });
  });
});
