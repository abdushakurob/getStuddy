/**
 * Simple in-memory rate limiter for server actions
 * Prevents abuse by limiting requests per user per time window
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;    // Max requests allowed
  windowMs: number;       // Time window in milliseconds
  keyPrefix?: string;     // Optional prefix for different endpoints
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;    // Seconds until reset
}

/**
 * Check if a request is allowed under rate limit
 * 
 * @param userId - User identifier
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.keyPrefix || 'default'}:${userId}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No existing entry or expired - create new
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000)
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt
  };
}

/**
 * Resets the rate limit for a user (useful for testing or admin overrides)
 */
export function resetRateLimit(userId: string, keyPrefix?: string): void {
  const key = `${keyPrefix || 'default'}:${userId}`;
  rateLimitStore.delete(key);
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  // Message sending (most expensive operation)
  MESSAGE: {
    maxRequests: 50,          // 50 messages
    windowMs: 60 * 1000,      // per minute
    keyPrefix: 'msg'
  },
  
  // Session creation
  SESSION: {
    maxRequests: 10,          // 10 sessions
    windowMs: 60 * 1000,      // per minute
    keyPrefix: 'session'
  },
  
  // File upload
  UPLOAD: {
    maxRequests: 20,          // 20 uploads
    windowMs: 60 * 1000,      // per minute
    keyPrefix: 'upload'
  },
  
  // General API calls
  API: {
    maxRequests: 100,         // 100 requests
    windowMs: 60 * 1000,      // per minute
    keyPrefix: 'api'
  }
} as const;
