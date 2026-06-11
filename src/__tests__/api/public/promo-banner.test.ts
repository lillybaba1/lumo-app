/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockSingle: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockSingle = vi.fn().mockResolvedValue({
    data: { value: { enabled: true, text: 'Big Sale' } },
    error: null,
  });

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockSingle })),
        })),
      })),
    },
  }));
});

describe('GET /api/promo-banner', () => {
  it('returns 200 with banner settings on happy path', async () => {
    const { GET } = await import('@/app/api/promo-banner/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('enabled');
  });

  it('returns defaults when row not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    const { GET } = await import('@/app/api/promo-banner/route');
    const res = await GET();
    expect(res.status).toBe(200);
  });
});
