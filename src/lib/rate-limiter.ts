/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | number | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Check if a request should be rate limited
   * @param identifier Unique identifier (e.g., IP address, user ID)
   * @param limit Maximum number of requests allowed
   * @param window Time window in milliseconds
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(identifier: string, limit: number, window: number): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No previous requests or window has expired
    if (!entry || now > entry.resetAt) {
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + window,
      });
      return false;
    }

    // Increment count
    entry.count += 1;

    // Check if limit exceeded
    if (entry.count > limit) {
      return true;
    }

    this.requests.set(identifier, entry);
    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string, limit: number): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Get time until rate limit reset (in seconds)
   */
  getResetTime(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry) return 0;

    const now = Date.now();
    if (now > entry.resetAt) return 0;

    return Math.ceil((entry.resetAt - now) / 1000);
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetAt) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  reset(): void {
    this.requests.clear();
  }

  /**
   * Cleanup interval on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  AI_ASSISTANT: {
    limit: 20, // 20 requests
    window: 60 * 1000, // per minute
  },
  AI_ASSISTANT_PER_HOUR: {
    limit: 100, // 100 requests
    window: 60 * 60 * 1000, // per hour
  },
  API_GENERAL: {
    limit: 100, // 100 requests
    window: 60 * 1000, // per minute
  },
  API_AUTH: {
    limit: 5, // 5 attempts
    window: 15 * 60 * 1000, // per 15 minutes
  },
  UPLOAD: {
    limit: 10, // 10 uploads
    window: 60 * 1000, // per minute
  },
} as const;

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (not ideal but better than nothing)
  return 'unknown';
}

/**
 * Check rate limit and return appropriate response headers
 */
export function checkRateLimit(
  identifier: string,
  config: { limit: number; window: number }
): {
  limited: boolean;
  remaining: number;
  resetTime: number;
  headers: Record<string, string>;
} {
  const limited = rateLimiter.isRateLimited(identifier, config.limit, config.window);
  const remaining = rateLimiter.getRemaining(identifier, config.limit);
  const resetTime = rateLimiter.getResetTime(identifier);

  return {
    limited,
    remaining,
    resetTime,
    headers: {
      'X-RateLimit-Limit': String(config.limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTime),
    },
  };
}
