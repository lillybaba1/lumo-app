/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let usersResult: any;
let userProfilesResult: any;
let businessAccountResult: any;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u-1', email: 'me@example.com', user_metadata: { name: 'Me' } } },
    error: null,
  });

  usersResult = { data: { id: 'u-1', name: 'Me', role: 'customer' }, error: null };
  userProfilesResult = { data: { name: 'Me' }, error: null };
  businessAccountResult = { data: null, error: null };

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
            single: vi.fn(() => {
              if (table === 'users') return Promise.resolve(usersResult);
              if (table === 'user_profiles') return Promise.resolve(userProfilesResult);
              if (table === 'business_accounts') return Promise.resolve(businessAccountResult);
              return Promise.resolve({ data: null, error: null });
            }),
          })),
        })),
      })),
    },
  }));
});

describe('GET /api/auth/me', () => {
  it('returns authenticated=false when no user is logged in', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
    expect(body.user).toBeNull();
  });

  it('returns user info on happy path with role=customer', async () => {
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.user.uid).toBe('u-1');
    expect(body.user.role).toBe('customer');
    expect(body.user.hasBusinessAccount).toBe(false);
  });

  it('normalizes APP_OWNER_ADMIN role to admin', async () => {
    usersResult = { data: { id: 'u-1', name: 'Admin', role: 'APP_OWNER_ADMIN' }, error: null };
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET();
    const body = await res.json();
    expect(body.user.role).toBe('admin');
  });

  it('reports business account when present', async () => {
    businessAccountResult = { data: { id: 'ba-1', status: 'APPROVED' }, error: null };
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET();
    const body = await res.json();
    expect(body.user.hasBusinessAccount).toBe(true);
    expect(body.user.businessStatus).toBe('APPROVED');
  });
});
