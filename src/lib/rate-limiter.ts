/**
 * Production-ready rate limiter with Redis support and in-memory fallback
 * 
 * Uses Redis in production for distributed rate limiting across multiple instances
 * Falls back to in-memory storage for development or when Redis is unavailable
 */

import { logger } from './logger';

const rateLimitLogger = logger.child('RateLimiter');

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterBackend {
  isRateLimited(identifier: string, limit: number, window: number): Promise<boolean>;
  getRemaining(identifier: string, limit: number): Promise<number>;
  getResetTime(identifier: string): Promise<number>;
  reset(): Promise<void>;
}

/**
 * In-memory rate limiter backend (for development or fallback)
 */
class InMemoryBackend implements RateLimiterBackend {
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

  async isRateLimited(identifier: string, limit: number, window: number): Promise<boolean> {
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

  async getRemaining(identifier: string, limit: number): Promise<number> {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  async getResetTime(identifier: string): Promise<number> {
    const entry = this.requests.get(identifier);
    if (!entry) return 0;

    const now = Date.now();
    if (now > entry.resetAt) return 0;

    return Math.ceil((entry.resetAt - now) / 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetAt) {
        this.requests.delete(key);
      }
    }
  }

  async reset(): Promise<void> {
    this.requests.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Redis rate limiter backend (for production)
 * Uses sliding window algorithm with atomic operations
 * Compatible with Upstash Redis REST API
 */
class RedisBackend implements RateLimiterBackend {
  private redisUrl: string;
  private prefix: string = 'ratelimit:';

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl;
  }

  /**
   * Execute a Redis command using fetch to a Redis HTTP API
   * This is compatible with services like Upstash Redis
   */
  private async redisCommand(command: string[]): Promise<any> {
    const redisRestUrl = this.redisUrl;
    const redisToken = process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisRestUrl || !redisToken) {
      throw new Error('Redis configuration missing');
    }

    try {
      const response = await fetch(redisRestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`Redis request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      rateLimitLogger.error('Redis command failed', error as Error);
      throw error;
    }
  }

  async isRateLimited(identifier: string, limit: number, windowMs: number): Promise<boolean> {
    const key = `${this.prefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Use sorted set with timestamps for sliding window
      // Remove old entries outside the window
      await this.redisCommand(['ZREMRANGEBYSCORE', key, '0', String(windowStart)]);

      // Count current entries in window
      const count = await this.redisCommand(['ZCARD', key]);

      if (count >= limit) {
        return true;
      }

      // Add new request with current timestamp as score
      await this.redisCommand(['ZADD', key, String(now), `${now}-${Math.random()}`]);

      // Set expiry on the key
      const expireSeconds = Math.ceil(windowMs / 1000) + 1;
      await this.redisCommand(['EXPIRE', key, String(expireSeconds)]);

      return false;
    } catch (error) {
      rateLimitLogger.error('Redis rate limit check failed', error as Error);
      // Fail closed on Redis errors - block request for safety
      return true;
    }
  }

  async getRemaining(identifier: string, limit: number): Promise<number> {
    const key = `${this.prefix}${identifier}`;

    try {
      const count = await this.redisCommand(['ZCARD', key]);
      return Math.max(0, limit - (count || 0));
    } catch (error) {
      return limit;
    }
  }

  async getResetTime(identifier: string): Promise<number> {
    const key = `${this.prefix}${identifier}`;

    try {
      const ttl = await this.redisCommand(['TTL', key]);
      return ttl > 0 ? ttl : 0;
    } catch (error) {
      return 0;
    }
  }

  async reset(): Promise<void> {
    // Note: This would need SCAN + DEL in production
    rateLimitLogger.warn('Redis reset not fully implemented - use with caution');
  }
}

/**
 * Main RateLimiter class with automatic backend selection
 */
class RateLimiter {
  private backend: RateLimiterBackend;
  private inMemoryFallback: InMemoryBackend;
  private isRedis: boolean = false;

  constructor() {
    // Always create in-memory fallback
    this.inMemoryFallback = new InMemoryBackend();
    
    // Check for Redis configuration
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

    if (redisUrl && process.env.NODE_ENV === 'production') {
      rateLimitLogger.info('Using Redis backend');
      this.backend = new RedisBackend(redisUrl);
      this.isRedis = true;
    } else {
      if (process.env.NODE_ENV === 'production') {
        rateLimitLogger.warn(
          'Redis not configured. Using in-memory backend. ' +
          'This will not work correctly with multiple server instances.'
        );
      }
      this.backend = this.inMemoryFallback;
    }
  }

  /**
   * Check if a request should be rate limited
   */
  async isRateLimited(identifier: string, limit: number, window: number): Promise<boolean> {
    return this.backend.isRateLimited(identifier, limit, window);
  }

  /**
   * Synchronous version for backward compatibility (uses in-memory only)
   * @deprecated Use async isRateLimited() instead
   */
  isRateLimitedSync(identifier: string, limit: number, window: number): boolean {
    // Use in-memory fallback for sync operations
    const entry = (this.inMemoryFallback as any).requests.get(identifier);
    const now = Date.now();

    if (!entry || now > entry.resetAt) {
      (this.inMemoryFallback as any).requests.set(identifier, {
        count: 1,
        resetAt: now + window,
      });
      return false;
    }

    entry.count += 1;
    if (entry.count > limit) {
      return true;
    }

    (this.inMemoryFallback as any).requests.set(identifier, entry);
    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  async getRemaining(identifier: string, limit: number): Promise<number> {
    return this.backend.getRemaining(identifier, limit);
  }

  /**
   * Get time until rate limit reset (in seconds)
   */
  async getResetTime(identifier: string): Promise<number> {
    return this.backend.getResetTime(identifier);
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  async reset(): Promise<void> {
    await this.backend.reset();
    await this.inMemoryFallback.reset();
  }

  /**
   * Check if using Redis backend
   */
  isUsingRedis(): boolean {
    return this.isRedis;
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
  API_SENSITIVE: {
    limit: 10, // 10 requests
    window: 60 * 1000, // per minute
  },
  UPLOAD: {
    limit: 10, // 10 uploads
    window: 60 * 1000, // per minute
  },
  PASSWORD_RESET: {
    limit: 3, // 3 attempts
    window: 60 * 60 * 1000, // per hour
  },
  SIGNUP: {
    limit: 5, // 5 signups
    window: 60 * 60 * 1000, // per hour per IP
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

  // Check Cloudflare header
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default (not ideal but better than nothing)
  return 'unknown';
}

/**
 * Check rate limit and return appropriate response headers (async version)
 */
export async function checkRateLimit(
  identifier: string,
  config: { limit: number; window: number }
): Promise<{
  limited: boolean;
  remaining: number;
  resetTime: number;
  headers: Record<string, string>;
}> {
  const limited = await rateLimiter.isRateLimited(identifier, config.limit, config.window);
  const remaining = await rateLimiter.getRemaining(identifier, config.limit);
  const resetTime = await rateLimiter.getResetTime(identifier);

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

/**
 * Synchronous rate limit check for backward compatibility
 * @deprecated Use async checkRateLimit() instead
 */
export function checkRateLimitSync(
  identifier: string,
  config: { limit: number; window: number }
): {
  limited: boolean;
  headers: Record<string, string>;
} {
  const limited = rateLimiter.isRateLimitedSync(identifier, config.limit, config.window);

  return {
    limited,
    headers: {
      'X-RateLimit-Limit': String(config.limit),
    },
  };
}

/**
 * Middleware helper to apply rate limiting to API routes
 */
export async function withRateLimit(
  request: Request,
  config: { limit: number; window: number },
  keyPrefix: string = ''
): Promise<{ allowed: boolean; headers: Record<string, string>; response?: Response }> {
  const clientId = getClientIdentifier(request);
  const identifier = keyPrefix ? `${keyPrefix}:${clientId}` : clientId;

  const { limited, headers } = await checkRateLimit(identifier, config);

  if (limited) {
    return {
      allowed: false,
      headers,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: headers['X-RateLimit-Reset'],
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': headers['X-RateLimit-Reset'],
            ...headers,
          },
        }
      ),
    };
  }

  return { allowed: true, headers };
}
