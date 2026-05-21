/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockLimit: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockLimit = vi.fn().mockResolvedValue({ data: [{ id: 'x' }], error: null });

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ limit: mockLimit })),
      })),
    },
  }));
});

describe('GET /api/health', () => {
  it('returns 200 healthy on happy path', async () => {
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(['healthy', 'degraded']).toContain(body.status);
    expect(body.checks.database.status).toBe('ok');
  });

  it('reports degraded when database errors', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'db down' } });
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    const body = await res.json();
    expect(body.checks.database.status).toBe('error');
  });
});
