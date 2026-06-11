/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockExistingSingle: ReturnType<typeof vi.fn>;
let mockInsert: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });

  mockExistingSingle = vi.fn().mockResolvedValue({ data: null });
  mockInsert = vi.fn().mockResolvedValue({ error: null });

  const adminFrom = vi.fn((table: string) => {
    if (table === 'boutique_likes') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockExistingSingle })),
          })),
        })),
        insert: mockInsert,
        delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) })),
      };
    }
    if (table === 'boutiques') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { like_count: 3 } }) })),
        })),
        update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
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

describe('POST /api/boutiques/like', () => {
  it('returns 200 on successful like', async () => {
    const { POST } = await import('@/app/api/boutiques/like/route');
    const res = await POST(new Request('http://localhost/api/boutiques/like', {
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
    const { POST } = await import('@/app/api/boutiques/like/route');
    const res = await POST(new Request('http://localhost/api/boutiques/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boutiqueId: 'b-1' }),
    }) as any);
    expect(res.status).toBe(401);
  });

  it('returns alreadyLiked when like already exists', async () => {
    mockExistingSingle.mockResolvedValueOnce({ data: { id: 'like-1' } });
    const { POST } = await import('@/app/api/boutiques/like/route');
    const res = await POST(new Request('http://localhost/api/boutiques/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boutiqueId: 'b-1' }),
    }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alreadyLiked).toBe(true);
  });
});
