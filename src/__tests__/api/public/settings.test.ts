/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetSettings: ReturnType<typeof vi.fn>;
let mockSaveSettings: ReturnType<typeof vi.fn>;
let mockGetUser: ReturnType<typeof vi.fn>;
let mockUserSingle: ReturnType<typeof vi.fn>;
let mockProfileSingle: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetSettings = vi.fn().mockResolvedValue({ siteName: 'JulaZone', theme: 'light' });
  mockSaveSettings = vi.fn().mockResolvedValue(undefined);
  mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  mockUserSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' } });
  mockProfileSingle = vi.fn().mockResolvedValue({ data: null });

  vi.doMock('@/services/settingsService', () => ({
    getSettings: mockGetSettings,
    saveSettings: mockSaveSettings,
  }));

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
      auth: { getUser: mockGetUser },
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: table === 'users' ? mockUserSingle : mockProfileSingle,
          })),
        })),
      })),
    })),
  }));
});

describe('GET /api/settings', () => {
  it('returns 200 with settings on happy path', async () => {
    const { GET } = await import('@/app/api/settings/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.siteName).toBe('JulaZone');
  });
});

describe('POST /api/settings', () => {
  it('returns 200 when admin saves settings', async () => {
    const { POST } = await import('@/app/api/settings/route');
    const res = await POST(new Request('http://localhost/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteName: 'Updated' }),
    }) as any);
    expect(res.status).toBe(200);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/settings/route');
    const res = await POST(new Request('http://localhost/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteName: 'X' }),
    }) as any);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockUserSingle.mockResolvedValueOnce({ data: { role: 'customer' } });
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'customer' } });
    const { POST } = await import('@/app/api/settings/route');
    const res = await POST(new Request('http://localhost/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteName: 'X' }),
    }) as any);
    expect(res.status).toBe(403);
  });
});
