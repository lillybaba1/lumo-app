/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let usersResult: any;
let profilesResult: any;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u-1' } },
    error: null,
  });

  usersResult = { data: { role: 'customer' }, error: null };
  profilesResult = { data: null, error: null };

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { getUser: mockGetUser },
    })),
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve(
              table === 'users' ? usersResult : profilesResult
            )),
          })),
        })),
      })),
    },
  }));
});

describe('GET /api/auth/check-role', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { GET } = await import('@/app/api/auth/check-role/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns role=customer for a regular user', async () => {
    const { GET } = await import('@/app/api/auth/check-role/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('customer');
    expect(body.userId).toBe('u-1');
  });

  it('returns role=admin for an admin user', async () => {
    usersResult = { data: { role: 'admin' }, error: null };
    const { GET } = await import('@/app/api/auth/check-role/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('admin');
  });

  it('returns role=admin when user_profiles has APP_OWNER_ADMIN', async () => {
    usersResult = { data: { role: 'customer' }, error: null };
    profilesResult = { data: { role: 'APP_OWNER_ADMIN' }, error: null };
    const { GET } = await import('@/app/api/auth/check-role/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('admin');
  });
});
