/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockCheckRateLimit: ReturnType<typeof vi.fn>;
let mockValidateEmail: ReturnType<typeof vi.fn>;
let mockNormalizePhone: ReturnType<typeof vi.fn>;
let mockValidatePhone: ReturnType<typeof vi.fn>;
let mockCheckEmailExists: ReturnType<typeof vi.fn>;
let mockCheckPhoneExists: ReturnType<typeof vi.fn>;
let mockSendOTP: ReturnType<typeof vi.fn>;
let mockSignUp: ReturnType<typeof vi.fn>;
let mockInsert: ReturnType<typeof vi.fn>;
let mockDeleteUser: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockCheckRateLimit = vi.fn().mockResolvedValue({ limited: false, headers: {}, resetTime: 0 });
  mockValidateEmail = vi.fn().mockResolvedValue({ valid: true });
  mockNormalizePhone = vi.fn((p: string) => p);
  mockValidatePhone = vi.fn().mockReturnValue({ valid: true, normalized: '+2201234567' });
  mockCheckEmailExists = vi.fn().mockResolvedValue(false);
  mockCheckPhoneExists = vi.fn().mockResolvedValue(false);
  mockSendOTP = vi.fn().mockResolvedValue({ success: true });
  mockSignUp = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mockInsert = vi.fn().mockResolvedValue({ error: null });
  mockDeleteUser = vi.fn().mockResolvedValue({ error: null });

  vi.doMock('@/lib/rate-limiter', () => ({
    checkRateLimit: mockCheckRateLimit,
    getClientIdentifier: vi.fn(() => 'client-1'),
    RATE_LIMITS: { AUTH: { limit: 5, window: 60_000 } },
    withRateLimit: vi.fn().mockResolvedValue({ allowed: true, headers: {} }),
  }));

  vi.doMock('@/lib/email-validation', () => ({
    validateEmail: mockValidateEmail,
  }));

  vi.doMock('@/lib/phone-validation', () => ({
    normalizePhoneNumber: mockNormalizePhone,
    validatePhoneNumber: mockValidatePhone,
  }));

  vi.doMock('@/lib/otp-service', () => ({
    sendOTP: mockSendOTP,
    checkEmailExists: mockCheckEmailExists,
    checkPhoneExists: mockCheckPhoneExists,
  }));

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { signUp: mockSignUp },
    })),
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({ insert: mockInsert })),
      auth: { admin: { deleteUser: mockDeleteUser } },
    },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  email: 'test@example.com',
  password: 'StrongPass123!@',
  name: 'Test User',
  phone: '1234567',
  countryCode: '+220',
  acceptedTerms: true,
};

describe('POST /api/auth/signup', () => {
  it('returns 429 when rate-limited', async () => {
    mockCheckRateLimit.mockResolvedValueOnce({ limited: true, headers: {}, resetTime: 60 });
    const { POST } = await import('@/app/api/auth/signup/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(429);
  });

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/auth/signup/route');
    const res = await POST(makeRequest({ email: 'a@b.com' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 when terms are not accepted', async () => {
    const { POST } = await import('@/app/api/auth/signup/route');
    const res = await POST(makeRequest({ ...validBody, acceptedTerms: false }) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/terms/i);
  });

  it('returns 400 when password is weak', async () => {
    const { POST } = await import('@/app/api/auth/signup/route');
    const res = await POST(makeRequest({ ...validBody, password: 'short' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 409 when email already exists', async () => {
    mockCheckEmailExists.mockResolvedValueOnce(true);
    const { POST } = await import('@/app/api/auth/signup/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(409);
  });

  it('returns 201 on happy path', async () => {
    const { POST } = await import('@/app/api/auth/signup/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.userId).toBe('user-1');
  });
});
