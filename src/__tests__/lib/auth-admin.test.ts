/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';

type AuthGetUserResult = { data: { user: { id: string; email: string } | null }; error: Error | null };

let mockGetUser: ReturnType<typeof vi.fn<[], Promise<AuthGetUserResult>>>;
let mockUsersSingle: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn();
  mockUsersSingle = vi.fn();

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() =>
      Promise.resolve({
        auth: { getUser: mockGetUser },
      })
    ),
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockUsersSingle,
          })),
        })),
      })),
    },
  }));
});

const authedUser = { id: 'user-1', email: 'a@b.com' };

describe('auth-admin / requireAdmin', () => {
  it('throws UnauthorizedError when no session and redirect:false', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { requireAdmin, UnauthorizedError } = await import('@/lib/auth-admin');

    await expect(requireAdmin({ redirect: false })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when authed user has no role row (default customer)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockUsersSingle.mockResolvedValue({ data: null, error: null });

    const { requireAdmin, UnauthorizedError } = await import('@/lib/auth-admin');

    await expect(requireAdmin({ redirect: false })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when role is customer', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockUsersSingle.mockResolvedValue({ data: { role: 'customer' }, error: null });

    const { requireAdmin, UnauthorizedError } = await import('@/lib/auth-admin');

    await expect(requireAdmin({ redirect: false })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('returns user when role is admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockUsersSingle.mockResolvedValue({ data: { role: 'admin' }, error: null });

    const { requireAdmin } = await import('@/lib/auth-admin');

    const result = await requireAdmin({ redirect: false });
    expect(result).toEqual({ userId: 'user-1', email: 'a@b.com', role: 'admin' });
  });

  it('returns user when role is APP_OWNER_ADMIN', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockUsersSingle.mockResolvedValue({ data: { role: 'APP_OWNER_ADMIN' }, error: null });

    const { requireAdmin } = await import('@/lib/auth-admin');

    const result = await requireAdmin({ redirect: false });
    expect(result.role).toBe('APP_OWNER_ADMIN');
  });

  it('throws UnauthorizedError on auth error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('JWT expired') });

    const { requireAdmin, UnauthorizedError } = await import('@/lib/auth-admin');

    await expect(requireAdmin({ redirect: false })).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('auth-admin / checkAdminAccess', () => {
  it('returns null when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { checkAdminAccess } = await import('@/lib/auth-admin');

    await expect(checkAdminAccess()).resolves.toBeNull();
  });

  it('returns null when authed user is not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockUsersSingle.mockResolvedValue({ data: { role: 'customer' }, error: null });

    const { checkAdminAccess } = await import('@/lib/auth-admin');

    await expect(checkAdminAccess()).resolves.toBeNull();
  });

  it('returns user details when authed and admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockUsersSingle.mockResolvedValue({ data: { role: 'admin' }, error: null });

    const { checkAdminAccess } = await import('@/lib/auth-admin');

    await expect(checkAdminAccess()).resolves.toEqual({
      userId: 'user-1',
      email: 'a@b.com',
      role: 'admin',
    });
  });
});

describe('auth-admin / getCurrentUser', () => {
  it('returns null when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { getCurrentUser } = await import('@/lib/auth-admin');

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it('normalizes legacy "user" role to "customer"', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockUsersSingle.mockResolvedValue({ data: { role: 'user' }, error: null });

    const { getCurrentUser } = await import('@/lib/auth-admin');

    const result = await getCurrentUser();
    expect(result?.role).toBe('customer');
  });

  it('passes through admin role unchanged', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockUsersSingle.mockResolvedValue({ data: { role: 'admin' }, error: null });

    const { getCurrentUser } = await import('@/lib/auth-admin');

    const result = await getCurrentUser();
    expect(result?.role).toBe('admin');
  });
});
