/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockLimit: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockLimit = vi.fn().mockResolvedValue({ data: [{ id: 'p1' }], error: null });

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ limit: mockLimit })),
      })),
    },
  }));
});

describe('GET /api/admin/verify', () => {
  it('returns 200 with ok:true and available:true when products exist', async () => {
    const { GET } = await import('@/app/api/admin/verify/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.available).toBe(true);
  });

  it('returns 500 when supabase throws', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'db down' } });
    const { GET } = await import('@/app/api/admin/verify/route');
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
