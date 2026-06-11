/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockUpdateTier: ReturnType<typeof vi.fn>;
let mockGetSettings: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockUpdateTier = vi.fn().mockResolvedValue(true);
  mockGetSettings = vi.fn().mockResolvedValue({ tiers: { free: { x: 1 }, pro: {}, enterprise: {} } });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(m = 'no') { super(m); this.name = 'UnauthorizedError'; }
  }
  vi.doMock('@/lib/auth-admin', () => ({ requireAdmin: mockRequireAdmin, UnauthorizedError }));
  vi.doMock('@/services/platformSettingsService', () => ({
    updateTierSettings: mockUpdateTier,
    getBoutiqueSettings: mockGetSettings,
  }));
});

describe('GET /api/admin/platform-settings/tiers', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('no'));
    const { GET } = await import('@/app/api/admin/platform-settings/tiers/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(401);
  });

  it('returns 200 with tiers', async () => {
    const { GET } = await import('@/app/api/admin/platform-settings/tiers/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(200);
  });

  it('returns 200 with specific tier', async () => {
    const { GET } = await import('@/app/api/admin/platform-settings/tiers/route');
    const res = await GET(new Request('http://localhost/x?tier=free') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.x).toBe(1);
  });
});

describe('PUT /api/admin/platform-settings/tiers', () => {
  it('returns 400 when tier missing', async () => {
    const { PUT } = await import('@/app/api/admin/platform-settings/tiers/route');
    const res = await PUT(new Request('http://localhost/x', { method: 'PUT', body: JSON.stringify({}), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid tier name', async () => {
    const { PUT } = await import('@/app/api/admin/platform-settings/tiers/route');
    const res = await PUT(new Request('http://localhost/x', { method: 'PUT', body: JSON.stringify({ tier: 'bogus', settings: {} }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(400);
  });

  it('updates tier on happy path', async () => {
    const { PUT } = await import('@/app/api/admin/platform-settings/tiers/route');
    const res = await PUT(new Request('http://localhost/x', { method: 'PUT', body: JSON.stringify({ tier: 'pro', settings: { commission: 5 } }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(200);
  });
});
