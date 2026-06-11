/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let userSelectResult: any;
let profileUpsertResult: any;
let adminBusinessSelect: any;
let adminBusinessUpdate: any;

beforeEach(() => {
  vi.resetModules();

  userSelectResult = { data: null, error: null };
  profileUpsertResult = { error: null };
  adminBusinessSelect = { data: null, error: null };
  adminBusinessUpdate = { error: null };

  vi.doMock('next/headers', () => ({
    cookies: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(() => []),
    })),
  }));

  vi.doMock('@supabase/ssr', () => ({
    createServerClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve(userSelectResult)),
          })),
        })),
        upsert: vi.fn(() => Promise.resolve(profileUpsertResult)),
      })),
    })),
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve(adminBusinessSelect)),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve(adminBusinessUpdate)),
        })),
      })),
    },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/verify-callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/verify-callback', () => {
  it('returns 400 when userId or email is missing', async () => {
    const { POST } = await import('@/app/api/auth/verify-callback/route');
    const res = await POST(makeRequest({ email: 'a@b.com' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns success on happy path (no existing user)', async () => {
    const { POST } = await import('@/app/api/auth/verify-callback/route');
    const res = await POST(makeRequest({
      userId: 'u-1', email: 'a@b.com', name: 'A', role: 'customer',
    }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.role).toBe('customer');
  });

  it('preserves existing user role over requested role', async () => {
    userSelectResult = { data: { role: 'admin' }, error: null };
    const { POST } = await import('@/app/api/auth/verify-callback/route');
    const res = await POST(makeRequest({
      userId: 'u-1', email: 'a@b.com', name: 'A', role: 'customer',
    }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('admin');
  });

  it('returns 500 when profile upsert fails', async () => {
    profileUpsertResult = { error: { message: 'upsert failed' } };
    const { POST } = await import('@/app/api/auth/verify-callback/route');
    const res = await POST(makeRequest({
      userId: 'u-1', email: 'a@b.com',
    }) as any);
    expect(res.status).toBe(500);
  });

  it('updates pending business account to PENDING_APPROVAL', async () => {
    adminBusinessSelect = { data: { id: 'ba-1', status: 'PENDING_VERIFICATION' }, error: null };
    const { POST } = await import('@/app/api/auth/verify-callback/route');
    const res = await POST(makeRequest({
      userId: 'u-1', email: 'a@b.com',
    }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.businessStatus).toBe('PENDING_APPROVAL');
  });
});
