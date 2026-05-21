/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockMaybeSingle: ReturnType<typeof vi.fn>;
let mockIlikeList: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  mockIlikeList = vi.fn().mockResolvedValue({ data: [], error: null });

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn((cols: string) => ({
          // .ilike(name).maybeSingle() OR .ilike(name%) returning list
          ilike: vi.fn((_col: string, pattern: string) => {
            if (pattern.endsWith('%')) {
              return mockIlikeList();
            }
            return {
              maybeSingle: mockMaybeSingle,
            };
          }),
        })),
      })),
    },
  }));
});

function makeRequest(query: string): any {
  const url = `http://localhost/api/auth/check-business-name${query}`;
  const req = new Request(url);
  return Object.assign(req, {
    nextUrl: new URL(url),
  });
}

describe('GET /api/auth/check-business-name', () => {
  it('returns available=true when name is empty or too short', async () => {
    const { GET } = await import('@/app/api/auth/check-business-name/route');
    const res = await GET(makeRequest('?name=a'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
    expect(body.suggestions).toEqual([]);
  });

  it('returns available=true when business name does not exist', async () => {
    const { GET } = await import('@/app/api/auth/check-business-name/route');
    const res = await GET(makeRequest('?name=BrandNewBiz'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
  });

  it('returns available=false with suggestions when name is taken', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'b1' }, error: null });
    const { GET } = await import('@/app/api/auth/check-business-name/route');
    const res = await GET(makeRequest('?name=TakenBiz'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions.length).toBeGreaterThan(0);
  });

  it('returns 500 when database errors out', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const { GET } = await import('@/app/api/auth/check-business-name/route');
    const res = await GET(makeRequest('?name=AnyName'));
    expect(res.status).toBe(500);
  });
});
