/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockExistingSingle: ReturnType<typeof vi.fn>;
let mockInsert: ReturnType<typeof vi.fn>;
let mockDelete: ReturnType<typeof vi.fn>;
let mockBoutiqueSingle: ReturnType<typeof vi.fn>;
let mockUpdate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });

  mockExistingSingle = vi.fn().mockResolvedValue({ data: null });
  mockInsert = vi.fn().mockResolvedValue({ error: null });
  mockDelete = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) }));
  mockBoutiqueSingle = vi.fn().mockResolvedValue({ data: { follower_count: 5, like_count: 5 } });
  mockUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));

  const adminFrom = vi.fn((table: string) => {
    if (table === 'boutique_followers') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockExistingSingle })),
          })),
        })),
        insert: mockInsert,
        delete: mockDelete,
        update: mockUpdate,
      };
    }
    if (table === 'boutiques') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockBoutiqueSingle })),
        })),
        update: mockUpdate,
      };
    }
    return {};
  });

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { getUser: mockGetUser },
    })),
    createAdminClient: vi.fn(() => ({ from: adminFrom })),
  }));
});

describe('POST /api/boutiques/follow', () => {
  it('returns 200 on successful follow', async () => {
    const { POST } = await import('@/app/api/boutiques/follow/route');
    const res = await POST(new Request('http://localhost/api/boutiques/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boutiqueId: 'b-1' }),
    }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/boutiques/follow/route');
    const res = await POST(new Request('http://localhost/api/boutiques/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boutiqueId: 'b-1' }),
    }) as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when boutiqueId missing', async () => {
    const { POST } = await import('@/app/api/boutiques/follow/route');
    const res = await POST(new Request('http://localhost/api/boutiques/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }) as any);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/boutiques/follow', () => {
  it('returns 200 on successful unfollow', async () => {
    const { DELETE } = await import('@/app/api/boutiques/follow/route');
    const res = await DELETE(new Request('http://localhost/api/boutiques/follow?boutiqueId=b-1', {
      method: 'DELETE',
    }) as any);
    expect(res.status).toBe(200);
  });
});
