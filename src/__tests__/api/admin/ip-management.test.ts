/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockProfileSingle: ReturnType<typeof vi.fn>;
let svc: Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.resetModules();
  mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null });
  mockProfileSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });

  svc = {
    investigateIP: vi.fn().mockResolvedValue({ ip: '1.2.3.4' }),
    banIP: vi.fn().mockResolvedValue({ id: 'b1' }),
    unbanIP: vi.fn().mockResolvedValue(true),
    getBannedIPs: vi.fn().mockResolvedValue([]),
    isIPBanned: vi.fn().mockResolvedValue({ banned: false }),
    getSuspiciousActivities: vi.fn().mockResolvedValue([]),
    resolveSuspiciousActivity: vi.fn().mockResolvedValue(true),
    getIPInvestigations: vi.fn().mockResolvedValue([]),
    getUsersByIP: vi.fn().mockResolvedValue([]),
    getIPsByUser: vi.fn().mockResolvedValue([]),
    getUserLoginHistory: vi.fn().mockResolvedValue([]),
    getFlaggedUsers: vi.fn().mockResolvedValue([]),
    getMultiAccountIPs: vi.fn().mockResolvedValue([]),
    flagUser: vi.fn().mockResolvedValue(true),
    unflagUser: vi.fn().mockResolvedValue(true),
    setUserIPBlocked: vi.fn().mockResolvedValue(true),
    setUserIPTrusted: vi.fn().mockResolvedValue(true),
    getUserSecuritySummary: vi.fn().mockResolvedValue({}),
  };

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
  vi.doMock('@/services/ipService', () => svc);
});

describe('GET /api/admin/ip-management', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { GET } = await import('@/app/api/admin/ip-management/route');
    const res = await GET(new Request('http://localhost/x?action=banned') as any);
    expect(res.status).toBe(401);
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'customer' }, error: null });
    const { GET } = await import('@/app/api/admin/ip-management/route');
    const res = await GET(new Request('http://localhost/x?action=banned') as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid action', async () => {
    const { GET } = await import('@/app/api/admin/ip-management/route');
    const res = await GET(new Request('http://localhost/x?action=nope') as any);
    expect(res.status).toBe(400);
  });

  it('returns 200 for banned action', async () => {
    const { GET } = await import('@/app/api/admin/ip-management/route');
    const res = await GET(new Request('http://localhost/x?action=banned') as any);
    expect(res.status).toBe(200);
    expect(svc.getBannedIPs).toHaveBeenCalled();
  });
});

describe('POST /api/admin/ip-management', () => {
  it('returns 403 when not admin', async () => {
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'customer' }, error: null });
    const { POST } = await import('@/app/api/admin/ip-management/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({ action: 'ban', ip: '1.1.1.1' }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(403);
  });

  it('bans an IP on happy path', async () => {
    const { POST } = await import('@/app/api/admin/ip-management/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({ action: 'ban', ip: '1.1.1.1', reason: 'spam' }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(200);
    expect(svc.banIP).toHaveBeenCalled();
  });

  it('returns 400 on invalid action', async () => {
    const { POST } = await import('@/app/api/admin/ip-management/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({ action: 'nope' }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(400);
  });
});
