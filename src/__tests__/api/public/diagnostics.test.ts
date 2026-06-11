/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockProfileSingle: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mockProfileSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' } });

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { getUser: mockGetUser },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockProfileSingle })),
        })),
      })),
    })),
  }));
});

describe('GET /api/diagnostics', () => {
  it('returns 200 with diagnostics for admin user', async () => {
    const { GET } = await import('@/app/api/diagnostics/route');
    const res = await GET(new Request('http://localhost/api/diagnostics') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.nodeEnv).toBe('test');
    expect(typeof body.hasGoogleKey).toBe('boolean');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { GET } = await import('@/app/api/diagnostics/route');
    const res = await GET(new Request('http://localhost/api/diagnostics') as any);
    expect(res.status).toBe(401);
  });

  it('returns 403 when not an admin', async () => {
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'customer' } });
    const { GET } = await import('@/app/api/diagnostics/route');
    const res = await GET(new Request('http://localhost/api/diagnostics') as any);
    expect(res.status).toBe(403);
  });
});
