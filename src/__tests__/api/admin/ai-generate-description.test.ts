/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockGenerate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  mockRequireAdmin = vi.fn().mockResolvedValue({ userId: 'u', email: 'a@x.com', role: 'admin' });
  mockGenerate = vi.fn().mockResolvedValue({ text: 'A nice product.' });

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

  vi.doMock('@/ai/genkit', () => ({
    ai: { generate: mockGenerate },
  }));
});

function req(body: unknown): Request {
  return new Request('http://localhost/api/admin/ai/generate-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/ai/generate-description', () => {
  it('returns 401 when not admin', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-admin');
    const err = new UnauthorizedError('No');
    mockRequireAdmin.mockRejectedValueOnce(err);

    const { POST } = await import('@/app/api/admin/ai/generate-description/route');
    const res = await POST(req({ imageUrls: ['https://x/a.png'] }) as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when imageUrls missing', async () => {
    const { POST } = await import('@/app/api/admin/ai/generate-description/route');
    const res = await POST(req({}) as any);
    expect(res.status).toBe(400);
  });

  it('returns 200 with description on happy path', async () => {
    const { POST } = await import('@/app/api/admin/ai/generate-description/route');
    const res = await POST(req({ type: 'description', imageUrls: ['https://x/a.png'] }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.description).toBe('A nice product.');
  });
});
