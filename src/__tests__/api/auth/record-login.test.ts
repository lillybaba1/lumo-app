/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockRecordUserLogin: ReturnType<typeof vi.fn>;
let mockHeadersGet: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u-1', email: 'me@example.com' } },
    error: null,
  });

  mockRecordUserLogin = vi.fn().mockResolvedValue(undefined);

  const headersMap: Record<string, string | null> = {
    'x-forwarded-for': '1.2.3.4',
    'user-agent': 'vitest',
  };
  mockHeadersGet = vi.fn((key: string) => headersMap[key.toLowerCase()] ?? null);

  vi.doMock('next/headers', () => ({
    headers: vi.fn(() => Promise.resolve({ get: mockHeadersGet })),
    cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
  }));

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { getUser: mockGetUser },
    })),
  }));

  vi.doMock('@/services/ipService', () => ({
    recordUserLogin: mockRecordUserLogin,
  }));
});

function makeRequest(body?: unknown): Request {
  return new Request('http://localhost/api/auth/record-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : '',
  });
}

describe('POST /api/auth/record-login', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/auth/record-login/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(401);
  });

  it('returns 401 when user has no email', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u-1', email: null } },
      error: null,
    });
    const { POST } = await import('@/app/api/auth/record-login/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(401);
  });

  it('records login on happy path and returns ip', async () => {
    const { POST } = await import('@/app/api/auth/record-login/route');
    const res = await POST(makeRequest({ loginType: 'password' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.ip).toBe('1.2.3.4');
    expect(mockRecordUserLogin).toHaveBeenCalledWith(
      'u-1',
      'me@example.com',
      '1.2.3.4',
      expect.objectContaining({ loginType: 'password' })
    );
  });

  it('returns 500 when recordUserLogin throws', async () => {
    mockRecordUserLogin.mockRejectedValueOnce(new Error('db down'));
    const { POST } = await import('@/app/api/auth/record-login/route');
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(500);
  });
});
