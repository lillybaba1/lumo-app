/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect } from 'vitest';

describe('/api/admin/setup-first-admin (disabled)', () => {
  it('POST returns 403 with disabled message', async () => {
    const { POST } = await import('@/app/api/admin/setup-first-admin/route');
    const req = new Request('http://localhost/api/admin/setup-first-admin', { method: 'POST' });
    const res = await POST(req as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/disabled/i);
  });

  it('GET returns 403 with disabled message', async () => {
    const { GET } = await import('@/app/api/admin/setup-first-admin/route');
    const req = new Request('http://localhost/api/admin/setup-first-admin', { method: 'GET' });
    const res = await GET(req as any);
    expect(res.status).toBe(403);
  });
});
