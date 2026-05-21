/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockSellerShippedOrder: ReturnType<typeof vi.fn>;
let mockGenerateWhatsAppLink: ReturnType<typeof vi.fn>;
let businessAccountLookup: any;
let userRoleLookup: any;
let orderLookup: any;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u1', email: 'seller@example.com' } },
    error: null,
  });

  businessAccountLookup = { data: { id: 'ba1' } };
  userRoleLookup = { data: { role: 'customer' } };
  orderLookup = {
    data: { customer_phone: '+15551234', customer_name: 'Jane' },
  };

  mockSellerShippedOrder = vi.fn().mockResolvedValue({
    success: true,
    confirmationLink: 'https://app/confirm/o1?token=abc',
  });
  mockGenerateWhatsAppLink = vi.fn().mockReturnValue('https://wa.me/15551234?text=hi');

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
  }));

  vi.doMock('@/services/escrowService', () => ({
    sellerShippedOrder: mockSellerShippedOrder,
    generateWhatsAppLink: mockGenerateWhatsAppLink,
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
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(orderLookup)),
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
  return new Request('http://localhost/api/orders/mark-shipped', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/orders/mark-shipped', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/orders/mark-shipped/route');
    const res = await POST(makeRequest({ orderId: 'o1' }) as any);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not a seller and not admin', async () => {
    businessAccountLookup = { data: null };
    userRoleLookup = { data: { role: 'customer' } };
    const { POST } = await import('@/app/api/orders/mark-shipped/route');
    const res = await POST(makeRequest({ orderId: 'o1' }) as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 when orderId is missing', async () => {
    const { POST } = await import('@/app/api/orders/mark-shipped/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 when service refuses (wrong state / not owner)', async () => {
    mockSellerShippedOrder.mockResolvedValueOnce({
      success: false,
      error: 'Order not in preparing state',
    });
    const { POST } = await import('@/app/api/orders/mark-shipped/route');
    const res = await POST(makeRequest({ orderId: 'o1' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/preparing/i);
  });

  it('marks order shipped and returns confirmationLink + whatsappLink', async () => {
    const { POST } = await import('@/app/api/orders/mark-shipped/route');
    const res = await POST(makeRequest({ orderId: 'o1' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.confirmationLink).toBe('https://app/confirm/o1?token=abc');
    expect(body.whatsappLink).toBe('https://wa.me/15551234?text=hi');
    expect(mockSellerShippedOrder).toHaveBeenCalledWith('o1', 'ba1');
    expect(mockGenerateWhatsAppLink).toHaveBeenCalledWith(
      '+15551234',
      'https://app/confirm/o1?token=abc',
      'Jane'
    );
  });

  it('returns 200 with null whatsappLink when customer has no phone', async () => {
    orderLookup = { data: { customer_phone: null, customer_name: 'Jane' } };
    const { POST } = await import('@/app/api/orders/mark-shipped/route');
    const res = await POST(makeRequest({ orderId: 'o1' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.whatsappLink).toBeNull();
    expect(mockGenerateWhatsAppLink).not.toHaveBeenCalled();
  });
});
