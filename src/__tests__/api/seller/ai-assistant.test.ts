/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetCurrentUser: ReturnType<typeof vi.fn>;
let mockGetBusinessAccountByOwner: ReturnType<typeof vi.fn>;
let mockSellerAssistant: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetCurrentUser = vi.fn().mockResolvedValue({
    userId: 'u1',
    email: 'seller@example.com',
    role: 'BUSINESS_ACCOUNT',
  });

  mockGetBusinessAccountByOwner = vi.fn().mockResolvedValue({ id: 'ba1' });

  mockSellerAssistant = vi.fn().mockResolvedValue({
    response: 'Here are your top-selling products...',
  });

  vi.doMock('@/lib/auth-admin', () => ({
    getCurrentUser: mockGetCurrentUser,
  }));

  vi.doMock('@/services/businessAccountService', () => ({
    getBusinessAccountByOwner: mockGetBusinessAccountByOwner,
  }));

  vi.doMock('@/ai/flows/seller-assistant', () => ({
    sellerAssistant: mockSellerAssistant,
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/seller/ai-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/seller/ai-assistant', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/seller/ai-assistant/route');
    const res = await POST(makeRequest({ query: 'hi' }) as any);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no business account', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/seller/ai-assistant/route');
    const res = await POST(makeRequest({ query: 'hi' }) as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 when query is missing', async () => {
    const { POST } = await import('@/app/api/seller/ai-assistant/route');
    const res = await POST(makeRequest({ history: [] }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 200 with assistant response on happy path', async () => {
    const { POST } = await import('@/app/api/seller/ai-assistant/route');
    const res = await POST(makeRequest({ query: 'top sellers?', history: [] }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toMatch(/top-selling/);
    expect(mockSellerAssistant).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'top sellers?', sellerId: 'ba1' })
    );
  });
});
