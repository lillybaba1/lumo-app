/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockUsersSingle: ReturnType<typeof vi.fn>;
let mockRpc: ReturnType<typeof vi.fn>;
let mockLimit: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null });
  mockUsersSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
  mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
  mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ single: mockUsersSingle })),
            })),
          };
        }
        // delivery_confirmations
        return {
          select: vi.fn(() => ({ limit: mockLimit })),
        };
      }),
      rpc: mockRpc,
    },
  }));
});

describe('POST /api/admin/run-migration', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/admin/run-migration/route');
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns 403 when not admin', async () => {
    mockUsersSingle.mockResolvedValueOnce({ data: { role: 'customer' }, error: null });
    const { POST } = await import('@/app/api/admin/run-migration/route');
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it('returns 200 with migration results on happy path', async () => {
    const { POST } = await import('@/app/api/admin/run-migration/route');
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.message).toMatch(/migration/i);
  });
});
