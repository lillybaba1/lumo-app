/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetCurrentUser: ReturnType<typeof vi.fn>;
let mockGetBusinessAccountByOwner: ReturnType<typeof vi.fn>;
let mockAiGenerate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetCurrentUser = vi.fn().mockResolvedValue({
    userId: 'u1',
    email: 'a@b.com',
    role: 'BUSINESS_ACCOUNT',
  });
  mockGetBusinessAccountByOwner = vi.fn();
  mockAiGenerate = vi.fn().mockResolvedValue({ text: 'A cool product.' });

  vi.doMock('@/lib/auth-admin', () => ({
    getCurrentUser: mockGetCurrentUser,
  }));

  vi.doMock('@/services/businessAccountService', () => ({
    getBusinessAccountByOwner: mockGetBusinessAccountByOwner,
  }));

  vi.doMock('@/ai/genkit', () => ({
    ai: { generate: mockAiGenerate },
  }));
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/business/ai/generate-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/business/ai/generate-description', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/business/ai/generate-description/route');
    const res = await POST(makeRequest({ type: 'description', imageUrls: ['http://x/1.jpg'] }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no business account', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/business/ai/generate-description/route');
    const res = await POST(makeRequest({ type: 'description', imageUrls: ['http://x/1.jpg'] }));
    expect(res.status).toBe(403);
  });

  it('returns 403 when business account is not approved', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce({
      id: 'ba1',
      status: 'PENDING',
      accountApproved: false,
      boutiqueApproved: false,
    });
    const { POST } = await import('@/app/api/business/ai/generate-description/route');
    const res = await POST(makeRequest({ type: 'description', imageUrls: ['http://x/1.jpg'] }));
    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid input (no images)', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce({
      id: 'ba1',
      status: 'ACTIVE',
    });
    const { POST } = await import('@/app/api/business/ai/generate-description/route');
    const res = await POST(makeRequest({ type: 'description', imageUrls: [] }));
    expect(res.status).toBe(400);
  });

  it('generates description on happy path', async () => {
    mockGetBusinessAccountByOwner.mockResolvedValueOnce({
      id: 'ba1',
      status: 'ACTIVE',
    });
    const { POST } = await import('@/app/api/business/ai/generate-description/route');
    const res = await POST(makeRequest({
      type: 'description',
      imageUrls: ['http://x/1.jpg'],
      productName: 'Widget',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.description).toBe('A cool product.');
  });
});
