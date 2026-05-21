/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockAdminAssistant: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockAdminAssistant = vi.fn().mockResolvedValue({ answer: 'hi' });

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(message = 'Admin authentication required') {
      super(message);
      this.name = 'UnauthorizedError';
    }
  }

  vi.doMock('@/lib/auth-admin', () => ({
    requireAdmin: mockRequireAdmin,
    UnauthorizedError,
  }));

  vi.doMock('@/ai/flows/admin-assistant', () => ({
    adminAssistant: mockAdminAssistant,
  }));
});

function req(body: unknown): Request {
  return new Request('http://localhost/api/admin/ai-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/ai-assistant', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    mockRequireAdmin.mockRejectedValueOnce(new UnauthorizedError('Not authenticated'));

    const { POST } = await import('@/app/api/admin/ai-assistant/route');
    const res = await POST(req({ query: 'hi' }) as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when query missing', async () => {
    const { POST } = await import('@/app/api/admin/ai-assistant/route');
    const res = await POST(req({}) as any);
    expect(res.status).toBe(400);
  });

  it('returns 200 with assistant result on happy path', async () => {
    const { POST } = await import('@/app/api/admin/ai-assistant/route');
    const res = await POST(req({ query: 'hello' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.answer).toBe('hi');
    expect(mockAdminAssistant).toHaveBeenCalledWith({ query: 'hello', history: [] });
  });
});
