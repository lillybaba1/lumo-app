/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockSignUp: ReturnType<typeof vi.fn>;
let mockCheckPhoneExists: ReturnType<typeof vi.fn>;
let mockCreateBusinessAccount: ReturnType<typeof vi.fn>;
let mockUpsert: ReturnType<typeof vi.fn>;
let mockMaybeSingle: ReturnType<typeof vi.fn>;
let mockDeleteUser: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockSignUp = vi.fn().mockResolvedValue({
    data: { user: { id: 'biz-user-1' } },
    error: null,
  });
  mockCheckPhoneExists = vi.fn().mockResolvedValue(false);
  mockCreateBusinessAccount = vi.fn().mockResolvedValue({ id: 'biz-acct-1' });
  mockUpsert = vi.fn().mockResolvedValue({ error: null });
  mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  mockDeleteUser = vi.fn().mockResolvedValue({ error: null });

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { signUp: mockSignUp },
    })),
  }));

  vi.doMock('@/lib/otp-service', () => ({
    checkPhoneExists: mockCheckPhoneExists,
  }));

  vi.doMock('@/services/businessAccountService', () => ({
    createBusinessAccount: mockCreateBusinessAccount,
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
        upsert: mockUpsert,
      })),
      auth: { admin: { deleteUser: mockDeleteUser } },
    },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/signup-business', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  signupMethod: 'email',
  email: 'biz@example.com',
  password: 'StrongPass123!@',
  name: 'Biz Owner',
  businessName: 'My Biz',
  businessAddress: '123 Main St',
};

describe('POST /api/auth/signup-business', () => {
  it('returns 400 on invalid body (missing required fields)', async () => {
    const { POST } = await import('@/app/api/auth/signup-business/route');
    const res = await POST(makeRequest({ email: 'a@b.com' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid JSON body', async () => {
    const { POST } = await import('@/app/api/auth/signup-business/route');
    const req = new Request('http://localhost/api/auth/signup-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('returns 409 when business name already taken', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'existing' }, error: null });
    const { POST } = await import('@/app/api/auth/signup-business/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(409);
  });

  it('returns 201 on happy path', async () => {
    const { POST } = await import('@/app/api/auth/signup-business/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.businessAccountId).toBe('biz-acct-1');
  });

  it('returns 500 when business account creation fails', async () => {
    mockCreateBusinessAccount.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/auth/signup-business/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(500);
  });
});
