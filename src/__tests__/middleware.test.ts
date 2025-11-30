import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: async (request: NextRequest) => {
    const hasSession = (request.headers.get('cookie') || '').includes('session=');

    if (request.nextUrl.pathname.startsWith('/admin') && !hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }
}));

import { middleware } from '../middleware';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'session';

const originalEnv = { ...process.env };

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
});

afterAll(() => {
  process.env = originalEnv;
});

function buildRequest(path: string, includeSession = false) {
  const headers: Record<string, string> = {};

  if (includeSession) {
    headers.cookie = `${COOKIE_NAME}=test-session`;
  }

  return new NextRequest(`https://example.com${path}`, { headers });
}

describe('auth middleware routing', () => {
  it('allows visiting login when a stale session cookie exists', async () => {
    const request = buildRequest('/login', true);
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects protected admin paths to login when no session is present', async () => {
    const request = buildRequest('/admin/dashboard');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/admin/login');
  });

  it('allows protected admin paths when a session cookie exists', async () => {
    const request = buildRequest('/admin/dashboard', true);
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
