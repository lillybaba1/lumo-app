/// <reference types="vitest" />
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser: ReturnType<typeof vi.fn>;
let mockUsersSingle: ReturnType<typeof vi.fn>;
let mockStorageUpload: ReturnType<typeof vi.fn>;
let mockGetPublicUrl: ReturnType<typeof vi.fn>;
let mockWithRateLimit: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-1', email: 'a@b.com' } },
    error: null,
  });

  mockUsersSingle = vi.fn().mockResolvedValue({ data: { role: 'customer' }, error: null });

  mockStorageUpload = vi.fn().mockResolvedValue({
    data: { path: 'uploads/123_file.png' },
    error: null,
  });

  mockGetPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: 'https://example.com/uploads/123_file.png' },
  });

  mockWithRateLimit = vi.fn().mockResolvedValue({ allowed: true, headers: {} });

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockUsersSingle })),
        })),
      })),
      storage: {
        from: vi.fn(() => ({
          upload: mockStorageUpload,
          getPublicUrl: mockGetPublicUrl,
        })),
      },
    },
  }));

  vi.doMock('@/lib/rate-limiter', () => ({
    withRateLimit: mockWithRateLimit,
    RATE_LIMITS: { UPLOAD: { limit: 10, window: 60_000 } },
  }));
});

function makeRequest(formData: FormData): Request {
  return new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });
}

function makeFile(opts: { name?: string; type?: string; size?: number; content?: string } = {}): File {
  const content = opts.content ?? 'x';
  const blob = new Blob([opts.size ? new Uint8Array(opts.size) : content], {
    type: opts.type ?? 'image/png',
  });
  return new File([blob], opts.name ?? 'pic.png', { type: opts.type ?? 'image/png' });
}

describe('POST /api/upload', () => {
  it('rejects unauthenticated requests with 401', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const { POST } = await import('@/app/api/upload/route');
    const fd = new FormData();
    fd.append('file', makeFile());
    const res = await POST(makeRequest(fd) as any);

    expect(res.status).toBe(401);
  });

  it('rejects requests with no file with 400', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const fd = new FormData();
    const res = await POST(makeRequest(fd) as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no file/i);
  });

  it('rejects files over 10MB with 400', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const fd = new FormData();
    fd.append('file', makeFile({ size: 11 * 1024 * 1024 }));
    const res = await POST(makeRequest(fd) as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/size/i);
  });

  it('rejects disallowed MIME types with 400', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const fd = new FormData();
    fd.append('file', makeFile({ type: 'application/x-msdownload', name: 'evil.exe' }));
    const res = await POST(makeRequest(fd) as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/not allowed/i);
  });

  it('rejects filenames containing ".." or path separators', async () => {
    const { POST } = await import('@/app/api/upload/route');

    for (const evilName of ['../etc.png', 'a/b.png', 'a\\b.png']) {
      const fd = new FormData();
      fd.append('file', makeFile({ name: evilName }));
      const res = await POST(makeRequest(fd) as any);
      expect(res.status).toBe(400);
    }
  });

  it('rejects non-admin uploading to admin-only folder (chatbot) with 403', async () => {
    mockUsersSingle.mockResolvedValueOnce({ data: { role: 'customer' }, error: null });

    const { POST } = await import('@/app/api/upload/route');
    const fd = new FormData();
    fd.append('file', makeFile());
    fd.append('folder', 'chatbot');
    const res = await POST(makeRequest(fd) as any);

    expect(res.status).toBe(403);
  });

  it('allows admin to upload to admin-only folder (chatbot)', async () => {
    mockUsersSingle.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });

    const { POST } = await import('@/app/api/upload/route');
    const fd = new FormData();
    fd.append('file', makeFile());
    fd.append('folder', 'chatbot');
    const res = await POST(makeRequest(fd) as any);

    expect(res.status).toBe(200);
    expect(mockStorageUpload).toHaveBeenCalled();
    const uploadedPath = mockStorageUpload.mock.calls[0][0];
    expect(uploadedPath.startsWith('chatbot/')).toBe(true);
  });

  it('sanitizes folder path against directory traversal', async () => {
    const { POST } = await import('@/app/api/upload/route');
    // Path-traversal attempt in folder — sanitizer strips ".." and leading slashes
    const fd = new FormData();
    fd.append('file', makeFile());
    fd.append('folder', '../../uploads');
    const res = await POST(makeRequest(fd) as any);

    expect(res.status).toBe(200);
    const uploadedPath = mockStorageUpload.mock.calls[0][0];
    expect(uploadedPath.includes('..')).toBe(false);
    expect(uploadedPath.startsWith('/')).toBe(false);
  });

  it('returns the 429 response when rate-limited', async () => {
    mockWithRateLimit.mockResolvedValueOnce({
      allowed: false,
      headers: {},
      response: new Response('rate limited', { status: 429 }),
    });

    const { POST } = await import('@/app/api/upload/route');
    const fd = new FormData();
    fd.append('file', makeFile());
    const res = await POST(makeRequest(fd) as any);

    expect(res.status).toBe(429);
  });
});
