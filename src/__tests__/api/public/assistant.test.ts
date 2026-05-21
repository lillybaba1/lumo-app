/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockCheckRateLimit: ReturnType<typeof vi.fn>;
let mockShoppingAssistant: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockCheckRateLimit = vi.fn().mockResolvedValue({ limited: false, headers: {} });
  mockShoppingAssistant = vi.fn().mockResolvedValue({ answer: 'Here are some shoes', products: [] });

  vi.doMock('@/lib/rate-limiter', () => ({
    getClientIdentifier: vi.fn(() => 'client-1'),
    checkRateLimit: mockCheckRateLimit,
    RATE_LIMITS: { AI_ASSISTANT: { limit: 10, window: 60_000 } },
  }));

  vi.doMock('@/ai/flows/shopping-assistant', () => ({
    shoppingAssistant: mockShoppingAssistant,
  }));

  vi.doMock('@/lib/logger', () => ({
    createLogger: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/assistant', () => {
  it('returns 200 with answer on happy path', async () => {
    const { POST } = await import('@/app/api/assistant/route');
    const res = await POST(makeRequest({ query: 'I need shoes' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.answer).toBe('Here are some shoes');
  });

  it('returns 429 when rate-limited', async () => {
    mockCheckRateLimit.mockResolvedValueOnce({ limited: true, headers: {}, resetTime: Date.now() + 60000 });
    const { POST } = await import('@/app/api/assistant/route');
    const res = await POST(makeRequest({ query: 'shoes' }) as any);
    expect(res.status).toBe(429);
  });

  it('returns 400 when query missing', async () => {
    const { POST } = await import('@/app/api/assistant/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
  });

  it('returns 500 when shopping assistant throws', async () => {
    mockShoppingAssistant.mockRejectedValueOnce(new Error('AI down'));
    const { POST } = await import('@/app/api/assistant/route');
    const res = await POST(makeRequest({ query: 'shoes' }) as any);
    expect(res.status).toBe(500);
  });
});
