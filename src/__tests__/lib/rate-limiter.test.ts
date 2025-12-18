/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Rate Limiter', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('In-Memory Backend', () => {
    it('should allow requests under the limit', async () => {
      const { rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const identifier = 'test-user-1';
      const limit = 5;
      const window = 60000; // 1 minute

      // First request should pass
      const result = await rateLimiter.isRateLimited(identifier, limit, window);
      expect(result).toBe(false);
    });

    it('should block requests over the limit', async () => {
      const { rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const identifier = 'test-user-2';
      const limit = 3;
      const window = 60000;

      // Make requests up to and over the limit
      for (let i = 0; i < limit; i++) {
        await rateLimiter.isRateLimited(identifier, limit, window);
      }

      // This should be blocked
      const isBlocked = await rateLimiter.isRateLimited(identifier, limit, window);
      expect(isBlocked).toBe(true);
    });

    it('should track remaining requests correctly', async () => {
      const { rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const identifier = 'test-user-3';
      const limit = 10;
      const window = 60000;

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        await rateLimiter.isRateLimited(identifier, limit, window);
      }

      const remaining = await rateLimiter.getRemaining(identifier, limit);
      expect(remaining).toBe(7);
    });

    it('should isolate different identifiers', async () => {
      const { rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const limit = 2;
      const window = 60000;

      // Exhaust limit for user1
      await rateLimiter.isRateLimited('user1', limit, window);
      await rateLimiter.isRateLimited('user1', limit, window);
      const user1Blocked = await rateLimiter.isRateLimited('user1', limit, window);

      // user2 should still be allowed
      const user2Allowed = await rateLimiter.isRateLimited('user2', limit, window);

      expect(user1Blocked).toBe(true);
      expect(user2Allowed).toBe(false);
    });

    it('should return reset time', async () => {
      const { rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const identifier = 'test-user-4';
      const limit = 5;
      const window = 60000; // 1 minute

      await rateLimiter.isRateLimited(identifier, limit, window);

      const resetTime = await rateLimiter.getResetTime(identifier);
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(60);
    });

    it('should support sync operations for backward compatibility', async () => {
      const { rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const identifier = 'sync-test';
      const limit = 5;
      const window = 60000;

      const result = rateLimiter.isRateLimitedSync(identifier, limit, window);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Rate Limit Configurations', () => {
    it('should have appropriate limits for AI assistant', async () => {
      const { RATE_LIMITS } = await import('@/lib/rate-limiter');

      expect(RATE_LIMITS.AI_ASSISTANT.limit).toBe(20);
      expect(RATE_LIMITS.AI_ASSISTANT.window).toBe(60 * 1000); // 1 minute
    });

    it('should have stricter limits for auth endpoints', async () => {
      const { RATE_LIMITS } = await import('@/lib/rate-limiter');

      expect(RATE_LIMITS.API_AUTH.limit).toBe(5);
      expect(RATE_LIMITS.API_AUTH.window).toBe(15 * 60 * 1000); // 15 minutes
    });

    it('should have limits for password reset', async () => {
      const { RATE_LIMITS } = await import('@/lib/rate-limiter');

      expect(RATE_LIMITS.PASSWORD_RESET.limit).toBe(3);
      expect(RATE_LIMITS.PASSWORD_RESET.window).toBe(60 * 60 * 1000); // 1 hour
    });

    it('should have limits for signup', async () => {
      const { RATE_LIMITS } = await import('@/lib/rate-limiter');

      expect(RATE_LIMITS.SIGNUP.limit).toBe(5);
      expect(RATE_LIMITS.SIGNUP.window).toBe(60 * 60 * 1000); // 1 hour
    });
  });

  describe('Client Identifier Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const { getClientIdentifier } = await import('@/lib/rate-limiter');

      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', async () => {
      const { getClientIdentifier } = await import('@/lib/rate-limiter');

      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '10.0.0.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('10.0.0.1');
    });

    it('should extract IP from cf-connecting-ip header (Cloudflare)', async () => {
      const { getClientIdentifier } = await import('@/lib/rate-limiter');

      const request = new Request('https://example.com', {
        headers: {
          'cf-connecting-ip': '203.0.113.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('203.0.113.1');
    });

    it('should return unknown when no headers present', async () => {
      const { getClientIdentifier } = await import('@/lib/rate-limiter');

      const request = new Request('https://example.com');

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('unknown');
    });
  });

  describe('checkRateLimit helper', () => {
    it('should return rate limit status and headers', async () => {
      const { checkRateLimit, rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const result = await checkRateLimit('test-check', { limit: 10, window: 60000 });

      expect(result.limited).toBe(false);
      expect(result.headers['X-RateLimit-Limit']).toBe('10');
      expect(result.headers['X-RateLimit-Remaining']).toBeDefined();
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should indicate when rate limited', async () => {
      const { checkRateLimit, rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const config = { limit: 2, window: 60000 };

      // Exhaust limit
      await checkRateLimit('test-limited', config);
      await checkRateLimit('test-limited', config);

      // Should now be limited
      const result = await checkRateLimit('test-limited', config);
      expect(result.limited).toBe(true);
    });
  });

  describe('withRateLimit middleware helper', () => {
    it('should allow requests under limit', async () => {
      const { withRateLimit, rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await withRateLimit(request, { limit: 10, window: 60000 });

      expect(result.allowed).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should block requests over limit with 429 response', async () => {
      const { withRateLimit, rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      const config = { limit: 1, window: 60000 };

      // First request
      await withRateLimit(request, config, 'test-prefix');

      // Second request should be blocked
      const result = await withRateLimit(request, config, 'test-prefix');

      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(429);
    });

    it('should include key prefix for different endpoints', async () => {
      const { withRateLimit, rateLimiter } = await import('@/lib/rate-limiter');
      await rateLimiter.reset();

      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '9.10.11.12' },
      });

      const config = { limit: 1, window: 60000 };

      // Exhaust limit for 'login' prefix
      await withRateLimit(request, config, 'login');
      const loginResult = await withRateLimit(request, config, 'login');

      // 'signup' prefix should still work
      const signupResult = await withRateLimit(request, config, 'signup');

      expect(loginResult.allowed).toBe(false);
      expect(signupResult.allowed).toBe(true);
    });
  });
});
