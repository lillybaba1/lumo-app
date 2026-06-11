/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockVerifyOTP: ReturnType<typeof vi.fn>;
let mockClientVerifyOtp: ReturnType<typeof vi.fn>;
let mockAdminListUsers: ReturnType<typeof vi.fn>;
let mockAdminUpdateUser: ReturnType<typeof vi.fn>;
let mockAdminGenerateLink: ReturnType<typeof vi.fn>;
let mockAdminInsert: ReturnType<typeof vi.fn>;
let mockAdminUpdate: ReturnType<typeof vi.fn>;
let userSelectResult: any;

beforeEach(() => {
  vi.resetModules();

  mockVerifyOTP = vi.fn().mockResolvedValue({ success: true });
  mockClientVerifyOtp = vi.fn().mockResolvedValue({
    data: { session: { access_token: 't' }, user: { id: 'u-1' } },
    error: null,
  });
  mockAdminListUsers = vi.fn().mockResolvedValue({ data: { users: [] }, error: null });
  mockAdminUpdateUser = vi.fn().mockResolvedValue({ data: {}, error: null });
  mockAdminGenerateLink = vi.fn().mockResolvedValue({
    data: {
      properties: {
        action_link: 'http://localhost/auth?token=abc&token_hash=xyz&type=magiclink',
      },
    },
    error: null,
  });
  mockAdminInsert = vi.fn().mockResolvedValue({ error: null });
  mockAdminUpdate = vi.fn().mockResolvedValue({ error: null });

  userSelectResult = { data: { id: 'u-1', email: 'me@example.com', name: 'Me' }, error: null };

  vi.doMock('@/lib/otp-service', () => ({
    verifyOTP: mockVerifyOTP,
  }));

  vi.doMock('@/lib/rate-limiter', () => ({
    getClientIdentifier: vi.fn(() => 'client-1'),
  }));

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { verifyOtp: mockClientVerifyOtp },
    })),
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve(userSelectResult)),
          })),
        })),
        insert: vi.fn(() => mockAdminInsert()),
        update: vi.fn(() => ({
          eq: vi.fn(() => mockAdminUpdate()),
        })),
      })),
      auth: {
        admin: {
          listUsers: mockAdminListUsers,
          updateUserById: mockAdminUpdateUser,
          generateLink: mockAdminGenerateLink,
        },
      },
    },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/verify-otp', () => {
  it('returns 400 when phone or code is missing', async () => {
    const { POST } = await import('@/app/api/auth/verify-otp/route');
    const res = await POST(makeRequest({ phone: '+2201234567' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 when code is not 6 digits', async () => {
    const { POST } = await import('@/app/api/auth/verify-otp/route');
    const res = await POST(makeRequest({ phone: '+2201234567', code: '12a' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 when OTP verification fails', async () => {
    mockVerifyOTP.mockResolvedValueOnce({ success: false, error: 'invalid', remainingAttempts: 2 });
    const { POST } = await import('@/app/api/auth/verify-otp/route');
    const res = await POST(makeRequest({ phone: '+2201234567', code: '123456' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when user is not found in users or auth', async () => {
    userSelectResult = { data: null, error: { message: 'not found' } };
    mockAdminListUsers.mockResolvedValueOnce({ data: { users: [] }, error: null });
    const { POST } = await import('@/app/api/auth/verify-otp/route');
    const res = await POST(makeRequest({ phone: '+2201234567', code: '123456' }) as any);
    expect(res.status).toBe(404);
  });

  it('returns 200 with session on happy path', async () => {
    const { POST } = await import('@/app/api/auth/verify-otp/route');
    const res = await POST(makeRequest({ phone: '+2201234567', code: '123456' }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.id).toBe('u-1');
  });
});
