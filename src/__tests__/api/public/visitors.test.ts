/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRecordVisitor: ReturnType<typeof vi.fn>;
let mockRecordPageView: ReturnType<typeof vi.fn>;
let mockIsIPBanned: ReturnType<typeof vi.fn>;
let mockQuickVPNCheck: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockRecordVisitor = vi.fn().mockResolvedValue({ id: 'v1' });
  mockRecordPageView = vi.fn().mockResolvedValue({ id: 'pv1' });
  mockIsIPBanned = vi.fn().mockResolvedValue({ banned: false });
  mockQuickVPNCheck = vi.fn().mockResolvedValue({ is_vpn: false, is_proxy: false, threat_level: 'low' });

  vi.doMock('@/services/visitorService', () => ({
    recordVisitor: mockRecordVisitor,
    recordPageView: mockRecordPageView,
    updateSessionDuration: vi.fn().mockResolvedValue(undefined),
  }));

  vi.doMock('@/services/ipService', () => ({
    isIPBanned: mockIsIPBanned,
    quickVPNCheck: mockQuickVPNCheck,
    logSuspiciousActivity: vi.fn().mockResolvedValue(undefined),
  }));

  vi.doMock('next/headers', () => ({
    headers: vi.fn(() => Promise.resolve({
      get: (key: string) => key === 'user-agent' ? 'Mozilla/5.0 Chrome' : null,
      forEach: () => {},
    })),
  }));
});

describe('POST /api/visitors', () => {
  it('records a visit successfully', async () => {
    const { POST } = await import('@/app/api/visitors/route');
    const res = await POST(new Request('http://localhost/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'visit', visitor_id: 'vis-1', page_path: '/' }),
    }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockRecordVisitor).toHaveBeenCalled();
  });

  it('returns 403 for banned IP', async () => {
    mockIsIPBanned.mockResolvedValueOnce({ banned: true, reason: 'spam' });
    const { POST } = await import('@/app/api/visitors/route');
    const res = await POST(new Request('http://localhost/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'visit', visitor_id: 'v', page_path: '/' }),
    }) as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid action', async () => {
    const { POST } = await import('@/app/api/visitors/route');
    const res = await POST(new Request('http://localhost/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unknown', visitor_id: 'v' }),
    }) as any);
    expect(res.status).toBe(400);
  });
});
