/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockSignOut: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockSignOut = vi.fn().mockResolvedValue({ error: null });
  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { signOut: mockSignOut },
    })),
  }));
});

describe('POST /api/auth/logout', () => {
  it('returns ok=true on successful sign out', async () => {
    const { POST } = await import('@/app/api/auth/logout/route');
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('returns 500 when createClient throws', async () => {
    vi.resetModules();
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => Promise.reject(new Error('client failed'))),
    }));
    const { POST } = await import('@/app/api/auth/logout/route');
    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
