/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockTrackActivity: ReturnType<typeof vi.fn>;
let mockIncrementViewCount: ReturnType<typeof vi.fn>;
let mockGetCurrentUser: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockTrackActivity = vi.fn();
  mockIncrementViewCount = vi.fn();
  mockGetCurrentUser = vi.fn().mockResolvedValue({ userId: 'user-1' });

  vi.doMock('@/services/intelligenceService', () => ({
    trackActivity: mockTrackActivity,
    incrementViewCount: mockIncrementViewCount,
  }));

  vi.doMock('@/lib/auth-admin', () => ({
    getCurrentUser: mockGetCurrentUser,
  }));
});

describe('POST /api/track', () => {
  it('returns 200 on happy path', async () => {
    const { POST } = await import('@/app/api/track/route');
    const res = await POST(new Request('http://localhost/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'view', productId: 'p1' }),
    }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockTrackActivity).toHaveBeenCalled();
    expect(mockIncrementViewCount).toHaveBeenCalledWith('p1');
  });

  it('returns 400 when eventType missing', async () => {
    const { POST } = await import('@/app/api/track/route');
    const res = await POST(new Request('http://localhost/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'p1' }),
    }) as any);
    expect(res.status).toBe(400);
  });
});
