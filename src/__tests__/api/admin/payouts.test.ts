/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockUsersSingle: ReturnType<typeof vi.fn>;
let svc: Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.resetModules();
  mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null });
  mockUsersSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
  svc = {
    calculateAllSellerEarnings: vi.fn().mockResolvedValue([{ sellerId: 's1' }]),
    getPayoutRecords: vi.fn().mockResolvedValue([]),
    processSellerPayout: vi.fn().mockResolvedValue({ success: true, payoutId: 'p1', transferId: null }),
    getPayoutStats: vi.fn().mockResolvedValue({ total: 0 }),
  };

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
  }));
  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockUsersSingle })),
        })),
      })),
    },
  }));
  vi.doMock('@/services/payoutService', () => svc);
});

describe('GET /api/admin/payouts', () => {
  it('returns 403 when not admin', async () => {
    mockUsersSingle.mockResolvedValueOnce({ data: { role: 'customer' }, error: null });
    const { GET } = await import('@/app/api/admin/payouts/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(403);
  });

  it('returns 200 with earnings on default view', async () => {
    const { GET } = await import('@/app/api/admin/payouts/route');
    const res = await GET(new Request('http://localhost/x') as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.earnings).toHaveLength(1);
  });

  it('returns 200 with history on view=history', async () => {
    const { GET } = await import('@/app/api/admin/payouts/route');
    const res = await GET(new Request('http://localhost/x?view=history') as any);
    expect(res.status).toBe(200);
    expect(svc.getPayoutRecords).toHaveBeenCalled();
  });
});

describe('POST /api/admin/payouts', () => {
  it('returns 403 when not admin', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/admin/payouts/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({ sellerId: 's1', amount: 100 }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields missing', async () => {
    const { POST } = await import('@/app/api/admin/payouts/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({}), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(400);
  });

  it('processes payout on happy path', async () => {
    const { POST } = await import('@/app/api/admin/payouts/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({ sellerId: 's1', amount: 100, commission: 10 }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.payoutId).toBe('p1');
  });

  it('returns 400 when service reports failure', async () => {
    svc.processSellerPayout.mockResolvedValueOnce({ success: false, error: 'bad' });
    const { POST } = await import('@/app/api/admin/payouts/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({ sellerId: 's1', amount: 100 }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(400);
  });
});
