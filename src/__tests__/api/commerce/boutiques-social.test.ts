/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

  const adminFrom = vi.fn((table: string) => {
    if (table === 'boutiques') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { follower_count: 10, like_count: 20, comment_count: 3 },
            }),
          })),
        })),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null }),
          })),
        })),
      })),
    };
  });

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { getUser: mockGetUser },
    })),
    createAdminClient: vi.fn(() => ({ from: adminFrom })),
  }));
});

describe('GET /api/boutiques/social', () => {
  it('returns 200 with counts on happy path', async () => {
    const { GET } = await import('@/app/api/boutiques/social/route');
    const res = await GET(new Request('http://localhost/api/boutiques/social?boutiqueId=b-1') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.followerCount).toBe(10);
    expect(body.likeCount).toBe(20);
    expect(body.isFollowing).toBe(false);
  });

  it('returns 400 when boutiqueId missing', async () => {
    const { GET } = await import('@/app/api/boutiques/social/route');
    const res = await GET(new Request('http://localhost/api/boutiques/social') as any);
    expect(res.status).toBe(400);
  });
});
