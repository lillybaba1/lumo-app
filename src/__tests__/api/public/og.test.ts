/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  // Mock global fetch for image proxy
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'image/jpeg' }),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  }));
});

describe('GET /api/og', () => {
  it('returns 400 when url is missing', async () => {
    const { GET } = await import('@/app/api/og/route');
    const url = new URL('http://localhost/api/og');
    const req: any = { nextUrl: url };
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-supabase URL', async () => {
    const { GET } = await import('@/app/api/og/route');
    const url = new URL('http://localhost/api/og?url=https://evil.com/x.jpg');
    const req: any = { nextUrl: url };
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 image response for valid supabase URL', async () => {
    const { GET } = await import('@/app/api/og/route');
    const url = new URL('http://localhost/api/og?url=https://abc.supabase.co/storage/v1/object/public/x.jpg');
    const req: any = { nextUrl: url };
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
  });
});
