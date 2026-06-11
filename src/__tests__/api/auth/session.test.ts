/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect } from 'vitest';

describe('/api/auth/session', () => {
  it('POST returns ok=true (backward-compat noop)', async () => {
    const { POST } = await import('@/app/api/auth/session/route');
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('DELETE returns ok=true (delegated to /logout)', async () => {
    const { DELETE } = await import('@/app/api/auth/session/route');
    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
