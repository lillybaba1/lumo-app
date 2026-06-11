/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockConfirmDelivery: ReturnType<typeof vi.fn>;
let mockDisputeOrder: ReturnType<typeof vi.fn>;
let mockConfirmationSingle: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockConfirmDelivery = vi.fn().mockResolvedValue({ success: true, orderId: 'order-123' });
  mockDisputeOrder = vi.fn().mockResolvedValue({ success: true });
  mockConfirmationSingle = vi.fn().mockResolvedValue({ data: { order_id: 'order-123' } });

  vi.doMock('@/services/escrowService', () => ({
    confirmDelivery: mockConfirmDelivery,
    disputeOrder: mockDisputeOrder,
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockConfirmationSingle })),
        })),
      })),
    },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/orders/confirm-delivery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/orders/confirm-delivery', () => {
  it('returns 200 on successful delivery confirmation', async () => {
    const { POST } = await import('@/app/api/orders/confirm-delivery/route');
    const res = await POST(makeRequest({ token: 'tok-123' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.orderId).toBe('order-123');
  });

  it('returns 400 when token is missing', async () => {
    const { POST } = await import('@/app/api/orders/confirm-delivery/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 when confirmation fails', async () => {
    mockConfirmDelivery.mockResolvedValueOnce({ success: false, error: 'Token expired' });
    const { POST } = await import('@/app/api/orders/confirm-delivery/route');
    const res = await POST(makeRequest({ token: 'expired-token' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/expired/i);
  });

  it('returns 400 for dispute action without reason', async () => {
    const { POST } = await import('@/app/api/orders/confirm-delivery/route');
    const res = await POST(makeRequest({ token: 'tok-123', action: 'dispute' }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/reason/i);
  });

  it('processes a dispute with a reason successfully', async () => {
    const { POST } = await import('@/app/api/orders/confirm-delivery/route');
    const res = await POST(makeRequest({ token: 'tok-123', action: 'dispute', reason: 'item damaged' }) as any);
    expect(res.status).toBe(200);
    expect(mockDisputeOrder).toHaveBeenCalledWith('order-123', 'item damaged');
  });
});
