// @vitest-environment node
/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';

let queryResult: { data: any; error: any };
let mockSingle: ReturnType<typeof vi.fn>;
let mockEq2: ReturnType<typeof vi.fn>;
let mockEq1: ReturnType<typeof vi.fn>;
let mockSelect: ReturnType<typeof vi.fn>;
let mockFrom: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  queryResult = { data: null, error: { message: 'not found' } };

  mockSingle = vi.fn(() => Promise.resolve(queryResult));
  mockEq2 = vi.fn(() => ({ single: mockSingle }));
  mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
  mockSelect = vi.fn(() => ({ eq: mockEq1 }));
  mockFrom = vi.fn(() => ({ select: mockSelect }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: { from: mockFrom },
  }));

  vi.doMock('@/lib/logger', () => ({
    logger: {
      child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    },
  }));
});

function makeRequest(url: string) {
  // Build a NextRequest-like object with nextUrl.searchParams
  const u = new URL(url);
  return {
    nextUrl: u,
    headers: new Headers(),
  } as any;
}

describe('GET /api/payments/seller-mobile-money', () => {
  it('returns 400 when sellerId param is missing', async () => {
    const { GET } = await import('@/app/api/payments/seller-mobile-money/route');
    const res = await GET(makeRequest('http://localhost/api/payments/seller-mobile-money'));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/sellerId/i);
  });

  it('returns 404 when seller not found (or not ACTIVE)', async () => {
    queryResult = { data: null, error: { message: 'not found' } };

    const { GET } = await import('@/app/api/payments/seller-mobile-money/route');
    const res = await GET(makeRequest('http://localhost/api/payments/seller-mobile-money?sellerId=missing'));

    expect(res.status).toBe(404);
  });

  it('happy path returns 200 with seller mobile money accounts', async () => {
    queryResult = {
      data: {
        id: 'seller-1',
        business_name: 'ACME Shop',
        mobile_money_accounts: [
          { provider: 'Wave', number: '+221700000000' },
        ],
      },
      error: null,
    };

    const { GET } = await import('@/app/api/payments/seller-mobile-money/route');
    const res = await GET(makeRequest('http://localhost/api/payments/seller-mobile-money?sellerId=seller-1'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sellerId).toBe('seller-1');
    expect(body.businessName).toBe('ACME Shop');
    expect(body.mobileMoneyAccounts).toHaveLength(1);
    expect(body.mobileMoneyAccounts[0].provider).toBe('Wave');
  });

  it('returns empty array when seller has no mobile_money_accounts set', async () => {
    queryResult = {
      data: {
        id: 'seller-2',
        business_name: 'Cash Only',
        mobile_money_accounts: null,
      },
      error: null,
    };

    const { GET } = await import('@/app/api/payments/seller-mobile-money/route');
    const res = await GET(makeRequest('http://localhost/api/payments/seller-mobile-money?sellerId=seller-2'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mobileMoneyAccounts).toEqual([]);
  });

  it('PUBLIC ENDPOINT: no auth required — anyone can query a seller — verify scope is limited to ACTIVE accounts', async () => {
    // FIXME: This is a public endpoint that exposes seller payment numbers.
    // No auth check; relies only on .eq('status','ACTIVE') as the filter.
    // Verify the query restricts to ACTIVE status to prevent leaking inactive/banned sellers.
    queryResult = {
      data: { id: 's', business_name: 'X', mobile_money_accounts: [] },
      error: null,
    };
    const { GET } = await import('@/app/api/payments/seller-mobile-money/route');
    const res = await GET(makeRequest('http://localhost/api/payments/seller-mobile-money?sellerId=s'));

    expect(res.status).toBe(200);
    // Verify ACTIVE filter is applied
    expect(mockEq2).toHaveBeenCalledWith('status', 'ACTIVE');
  });
});
