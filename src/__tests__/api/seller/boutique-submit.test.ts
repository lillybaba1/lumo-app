/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockUpdateBusinessAccount: ReturnType<typeof vi.fn>;
let businessAccountLookup: any;
let existingSlugLookup: any;
let existingBoutiqueLookup: any;
let insertedNotification: any;

beforeEach(() => {
  vi.resetModules();
  insertedNotification = null;

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'u1', email: 'a@b.com' } },
    error: null,
  });
  mockUpdateBusinessAccount = vi.fn().mockResolvedValue({ id: 'ba1' });

  businessAccountLookup = { data: { id: 'ba1' } };
  existingSlugLookup = { data: null };
  existingBoutiqueLookup = { data: null };

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
  }));

  vi.doMock('@/services/businessAccountService', () => ({
    updateBusinessAccount: mockUpdateBusinessAccount,
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn((table: string) => {
        if (table === 'business_accounts') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(businessAccountLookup)),
                })),
                neq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(existingSlugLookup)),
                })),
              })),
            })),
          };
        }
        if (table === 'admin_notifications') {
          return {
            insert: vi.fn((d: any) => {
              insertedNotification = d;
              return Promise.resolve({ error: null });
            }),
          };
        }
        if (table === 'boutiques') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(existingBoutiqueLookup)),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
            insert: vi.fn(() => Promise.resolve({ error: null })),
          };
        }
        return { select: vi.fn(), insert: vi.fn(), update: vi.fn() };
      }),
    },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/business/boutique/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  businessAccountId: 'ba1',
  displayName: 'My Shop',
  slug: 'my-shop',
  description: 'A great shop',
};

describe('POST /api/business/boutique/submit', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/business/boutique/submit/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/business/boutique/submit/route');
    const res = await POST(makeRequest({ businessAccountId: 'ba1' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when business account is not owned by user', async () => {
    businessAccountLookup = { data: null };
    const { POST } = await import('@/app/api/business/boutique/submit/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(404);
  });

  it('returns 409 when slug is taken by another business', async () => {
    existingSlugLookup = { data: { id: 'other-ba' } };
    const { POST } = await import('@/app/api/business/boutique/submit/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(409);
  });

  it('submits successfully on happy path', async () => {
    const { POST } = await import('@/app/api/business/boutique/submit/route');
    const res = await POST(makeRequest(validBody) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpdateBusinessAccount).toHaveBeenCalledWith(
      'ba1',
      expect.objectContaining({ boutiqueSubmitted: true, boutiqueApproved: false })
    );
    expect(insertedNotification?.type).toBe('boutique_submitted');
  });
});
