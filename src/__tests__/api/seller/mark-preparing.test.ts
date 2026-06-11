/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockSellerPreparingOrder: ReturnType<typeof vi.fn>;
let businessAccountLookup: any;
let userRoleLookup: any;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u1', email: 'seller@example.com' } },
    error: null,
  });

  businessAccountLookup = { data: { id: 'ba1' } };
  userRoleLookup = { data: { role: 'customer' } };
  mockSellerPreparingOrder = vi.fn().mockResolvedValue(true);

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
  }));

  vi.doMock('@/services/escrowService', () => ({
    sellerPreparingOrder: mockSellerPreparingOrder,
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
        return { select: vi.fn() };
      }),
    },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/orders/mark-preparing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/orders/mark-preparing', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/orders/mark-preparing/route');
    const res = await POST(makeRequest({ orderId: 'o1' }) as any);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not a seller and not admin', async () => {
    businessAccountLookup = { data: null };
    userRoleLookup = { data: { role: 'customer' } };
    const { POST } = await import('@/app/api/orders/mark-preparing/route');
    const res = await POST(makeRequest({ orderId: 'o1' }) as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 when orderId is missing', async () => {
    const { POST } = await import('@/app/api/orders/mark-preparing/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 when order is not in correct status (service returns false)', async () => {
    mockSellerPreparingOrder.mockResolvedValueOnce(false);
    const { POST } = await import('@/app/api/orders/mark-preparing/route');
    const res = await POST(makeRequest({ orderId: 'o1' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/correct status/i);
  });

  it('marks order as preparing successfully on happy path', async () => {
    const { POST } = await import('@/app/api/orders/mark-preparing/route');
    const res = await POST(makeRequest({ orderId: 'o1' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSellerPreparingOrder).toHaveBeenCalledWith('o1', 'ba1');
  });
});
