/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect } from 'vitest';

describe('POST /api/admin/make-admin (stub)', () => {
  it('returns 501 Not Implemented', async () => {
    const { POST } = await import('@/app/api/admin/make-admin/route');
    const res = await POST();
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.error).toMatch(/not implemented/i);
  });
});
