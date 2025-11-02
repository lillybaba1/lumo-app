import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter, checkRateLimit, getClientIdentifier, RATE_LIMITS } from '../rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    rateLimiter.reset();
  });

  describe('isRateLimited', () => {
    it('should allow first request', () => {
      const limited = rateLimiter.isRateLimited('user-1', 10, 60000);
      expect(limited).toBe(false);
    });

    it('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        const limited = rateLimiter.isRateLimited('user-1', 10, 60000);
        expect(limited).toBe(false);
      }
    });

    it('should block requests exceeding limit', () => {
      // Make 10 requests (limit)
      for (let i = 0; i < 10; i++) {
        rateLimiter.isRateLimited('user-1', 10, 60000);
      }

      // 11th request should be blocked
      const limited = rateLimiter.isRateLimited('user-1', 10, 60000);
      expect(limited).toBe(true);
    });

    it('should track different identifiers separately', () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.isRateLimited('user-1', 10, 60000);
      }

      // user-2 should not be rate limited
      const limited = rateLimiter.isRateLimited('user-2', 10, 60000);
      expect(limited).toBe(false);
    });

    it('should reset after time window', () => {
      vi.useFakeTimers();

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.isRateLimited('user-1', 10, 1000);
      }

      // Should be blocked
      expect(rateLimiter.isRateLimited('user-1', 10, 1000)).toBe(true);

      // Advance time beyond window
      vi.advanceTimersByTime(1001);

      // Should be allowed again
      const limited = rateLimiter.isRateLimited('user-1', 10, 1000);
      expect(limited).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('getRemaining', () => {
    it('should return limit for new identifier', () => {
      const remaining = rateLimiter.getRemaining('user-1', 10);
      expect(remaining).toBe(10);
    });

    it('should decrease with each request', () => {
      rateLimiter.isRateLimited('user-1', 10, 60000);
      const remaining = rateLimiter.getRemaining('user-1', 10);
      expect(remaining).toBe(9);
    });

    it('should return 0 when limit exceeded', () => {
      for (let i = 0; i < 15; i++) {
        rateLimiter.isRateLimited('user-1', 10, 60000);
      }
      const remaining = rateLimiter.getRemaining('user-1', 10);
      expect(remaining).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return 0 for new identifier', () => {
      const resetTime = rateLimiter.getResetTime('user-1');
      expect(resetTime).toBe(0);
    });

    it('should return positive time for active limit', () => {
      rateLimiter.isRateLimited('user-1', 10, 60000);
      const resetTime = rateLimiter.getResetTime('user-1');
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(60);
    });
  });

  describe('checkRateLimit', () => {
    it('should return complete rate limit info', () => {
      const result = checkRateLimit('user-1', { limit: 10, window: 60000 });

      expect(result).toHaveProperty('limited');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('resetTime');
      expect(result).toHaveProperty('headers');
      expect(result.limited).toBe(false);
    });

    it('should include proper headers', () => {
      const result = checkRateLimit('user-1', { limit: 10, window: 60000 });

      expect(result.headers).toHaveProperty('X-RateLimit-Limit', '10');
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining');
      expect(result.headers).toHaveProperty('X-RateLimit-Reset');
    });
  });

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '192.168.1.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should return unknown when no IP headers present', () => {
      const request = new Request('https://example.com');
      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('unknown');
    });
  });

  describe('RATE_LIMITS constants', () => {
    it('should have AI_ASSISTANT rate limit', () => {
      expect(RATE_LIMITS.AI_ASSISTANT).toBeDefined();
      expect(RATE_LIMITS.AI_ASSISTANT.limit).toBeGreaterThan(0);
      expect(RATE_LIMITS.AI_ASSISTANT.window).toBeGreaterThan(0);
    });

    it('should have API_AUTH rate limit', () => {
      expect(RATE_LIMITS.API_AUTH).toBeDefined();
      expect(RATE_LIMITS.API_AUTH.limit).toBeLessThanOrEqual(10); // Strict for auth
    });

    it('should have UPLOAD rate limit', () => {
      expect(RATE_LIMITS.UPLOAD).toBeDefined();
      expect(RATE_LIMITS.UPLOAD.limit).toBeGreaterThan(0);
    });
  });
});
