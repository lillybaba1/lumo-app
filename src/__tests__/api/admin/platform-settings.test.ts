/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let svc: Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  svc = {
    getBoutiqueSettings: vi.fn().mockResolvedValue({ tiers: { free: {}, pro: {}, enterprise: {} } }),
    updateBoutiqueSettings: vi.fn().mockResolvedValue(true),
    resetBoutiqueSettings: vi.fn().mockResolvedValue(true),
    getAllPlatformSettings: vi.fn().mockResolvedValue([{ key: 'a' }]),
    setPlatformSetting: vi.fn().mockResolvedValue(true),
  };
  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/platformSettingsService', () => svc);
});

describe('GET /api/admin/platform-settings', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { GET } = await import('@/app/api/admin/platform-settings/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(401);
  });

  it('returns 200 with all settings', async () => {
    const { GET } = await import('@/app/api/admin/platform-settings/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });
});

describe('PUT /api/admin/platform-settings', () => {
  it('returns 400 on invalid body', async () => {
    const { PUT } = await import('@/app/api/admin/platform-settings/route');
    const res = await PUT(new Request('http://localhost/x', { method: 'PUT', body: JSON.stringify({}), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(400);
  });

  it('updates boutique settings on happy path', async () => {
    const { PUT } = await import('@/app/api/admin/platform-settings/route');
    const res = await PUT(new Request('http://localhost/x', { method: 'PUT', body: JSON.stringify({ type: 'boutique', settings: { foo: 1 } }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(200);
  });
});
