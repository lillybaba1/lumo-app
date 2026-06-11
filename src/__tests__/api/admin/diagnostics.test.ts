/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetCurrentUser: ReturnType<typeof vi.fn>;
let mockSelect: ReturnType<typeof vi.fn>;
let mockStorageList: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetCurrentUser = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockSelect = vi.fn(() => ({ limit: vi.fn(() => Promise.resolve({ data: [{ id: 1 }], error: null })) }));
  mockStorageList = vi.fn().mockResolvedValue({ data: [], error: null });

  vi.doMock('@/lib/auth-admin', () => ({ getCurrentUser: mockGetCurrentUser }));
  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({ select: mockSelect })),
      storage: { from: vi.fn(() => ({ list: mockStorageList })) },
    },
  }));
});

describe('GET /api/admin/diagnostics', () => {
  it('returns 200 with successful diagnostics when admin', async () => {
    const { GET } = await import('@/app/api/admin/diagnostics/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks.authentication.status).toBe('success');
    expect(body.checks.adminRole.status).toBe('success');
  });

  it('reports auth error when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/admin/diagnostics/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks.authentication.status).toBe('error');
  });
});
