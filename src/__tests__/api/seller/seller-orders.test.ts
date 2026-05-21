/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockGetSellerOrders: ReturnType<typeof vi.fn>;
let businessAccountLookup: any;
let userRoleLookup: any;
let allOrdersLookup: any;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u1', email: 'seller@example.com' } },
    error: null,
  });

  businessAccountLookup = { data: { id: 'ba1' } };
  userRoleLookup = { data: { role: 'customer' } };
  allOrdersLookup = { data: [{ id: 'o1', status: 'Paid' }] };

  mockGetSellerOrders = vi.fn().mockResolvedValue([
    { id: 'o1', total: 100, status: 'Paid' },
    { id: 'o2', total: 50, status: 'Shipped' },
  ]);

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
  }));

  vi.doMock('@/services/escrowService', () => ({
    getSellerOrders: mockGetSellerOrders,
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn((table: string) => {
        if (table === 'business_accounts') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(businessAccountLookup)),
              })),
            })),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(userRoleLookup)),
              })),
            })),
          };
        }
        if (table === 'orders') {
          return {
            select: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve(allOrdersLookup)),
                })),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    },
  }));
});

describe('GET /api/orders/seller-orders', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { GET } = await import('@/app/api/orders/seller-orders/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not a seller and not admin', async () => {
    businessAccountLookup = { data: null };
    userRoleLookup = { data: { role: 'customer' } };
    const { GET } = await import('@/app/api/orders/seller-orders/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns 200 with seller orders on happy path', async () => {
    const { GET } = await import('@/app/api/orders/seller-orders/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(2);
    expect(mockGetSellerOrders).toHaveBeenCalledWith('ba1');
  });

  it('returns 200 with all orders for admin without business account', async () => {
    businessAccountLookup = { data: null };
    userRoleLookup = { data: { role: 'admin' } };
    const { GET } = await import('@/app/api/orders/seller-orders/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
    expect(mockGetSellerOrders).not.toHaveBeenCalled();
  });
});
