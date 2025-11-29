import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from '../middleware';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'session';

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
    expect(response.headers.get('location')).toBe('https://example.com/login?next=%2Fadmin%2Fdashboard');
  });

  it('allows protected admin paths when a session cookie exists', async () => {
    const request = buildRequest('/admin/dashboard', true);
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
