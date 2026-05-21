/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequireBusiness: ReturnType<typeof vi.fn>;
let mockUpdateBusinessAccount: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockRequireBusiness = vi.fn();
  mockUpdateBusinessAccount = vi.fn();

  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(message = 'Business authentication required') {
      super(message);
      this.name = 'UnauthorizedError';
    }
  }

  vi.doMock('@/lib/auth-business', () => ({
    requireBusiness: mockRequireBusiness,
    UnauthorizedError,
  }));

  vi.doMock('@/services/businessAccountService', () => ({
    getBusinessAccountByOwner: vi.fn(),
    updateBusinessAccount: mockUpdateBusinessAccount,
  }));
});

function makePutRequest(body: unknown): Request {
  return new Request('http://localhost/api/business/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/business/profile', () => {
  it('returns 401 when not authenticated as business', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-business');
    mockRequireBusiness.mockRejectedValueOnce(new UnauthorizedError('Not authenticated'));

    const { GET } = await import('@/app/api/business/profile/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns the business account on happy path', async () => {
    mockRequireBusiness.mockResolvedValueOnce({
      user: { uid: 'u1' },
      businessAccount: { id: 'ba1', businessName: 'Acme' },
    });

    const { GET } = await import('@/app/api/business/profile/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.businessName).toBe('Acme');
  });
});

describe('PUT /api/business/profile', () => {
  it('returns 401 when not authenticated as business', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-business');
    mockRequireBusiness.mockRejectedValueOnce(new UnauthorizedError('Not authenticated'));

    const { PUT } = await import('@/app/api/business/profile/route');
    const res = await PUT(makePutRequest({ businessName: 'X' }));
    expect(res.status).toBe(401);
  });

  it('returns 500 when update fails', async () => {
    mockRequireBusiness.mockResolvedValueOnce({
      user: { uid: 'u1' },
      businessAccount: { id: 'ba1' },
    });
    mockUpdateBusinessAccount.mockResolvedValueOnce(null);

    const { PUT } = await import('@/app/api/business/profile/route');
    const res = await PUT(makePutRequest({ businessName: 'New Name' }));
    expect(res.status).toBe(500);
  });

  it('updates the business profile on happy path', async () => {
    mockRequireBusiness.mockResolvedValueOnce({
      user: { uid: 'u1' },
      businessAccount: { id: 'ba1' },
    });
    mockUpdateBusinessAccount.mockResolvedValueOnce({ id: 'ba1', businessName: 'New Name' });

    const { PUT } = await import('@/app/api/business/profile/route');
    const res = await PUT(makePutRequest({ businessName: 'New Name' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.businessName).toBe('New Name');
    expect(mockUpdateBusinessAccount).toHaveBeenCalledWith(
      'ba1',
      expect.objectContaining({ businessName: 'New Name' })
    );
  });
});
