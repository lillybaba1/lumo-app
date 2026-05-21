/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockUsersSingle: ReturnType<typeof vi.fn>;
let mockAutoConfirm: ReturnType<typeof vi.fn>;
let mockGetPending: ReturnType<typeof vi.fn>;
let mockReleasePayout: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null });
  mockUsersSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
  mockAutoConfirm = vi.fn().mockResolvedValue(0);
  mockGetPending = vi.fn().mockResolvedValue([{ id: 'o1' }]);
  mockReleasePayout = vi.fn().mockResolvedValue({ success: true });

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
  vi.doMock('@/services/escrowService', () => ({
    autoConfirmExpiredDeliveries: mockAutoConfirm,
    getPayoutPendingOrders: mockGetPending,
    adminReleasePayout: mockReleasePayout,
  }));
});

describe('GET /api/admin/escrow', () => {
  it('returns 403 when not admin', async () => {
    mockUsersSingle.mockResolvedValueOnce({ data: { role: 'customer' }, error: null });
    const { GET } = await import('@/app/api/admin/escrow/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns 200 with pending orders on happy path', async () => {
    const { GET } = await import('@/app/api/admin/escrow/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(1);
  });
});

describe('POST /api/admin/escrow', () => {
  it('returns 403 when not admin', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/admin/escrow/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({ orderId: 'o1' }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 when orderId missing', async () => {
    const { POST } = await import('@/app/api/admin/escrow/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({}), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(400);
  });

  it('releases payout on happy path', async () => {
    const { POST } = await import('@/app/api/admin/escrow/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({ orderId: 'o1' }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 400 when service reports failure', async () => {
    mockReleasePayout.mockResolvedValueOnce({ success: false, error: 'bad state' });
    const { POST } = await import('@/app/api/admin/escrow/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: JSON.stringify({ orderId: 'o1' }), headers: {'Content-Type':'application/json'} }) as any);
    expect(res.status).toBe(400);
  });
});
