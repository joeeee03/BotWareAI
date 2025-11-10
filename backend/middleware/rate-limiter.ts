// Rate Limiter Middleware - Prevents API abuse and system overload
// Uses sliding window algorithm per IP/Bot combination

import type { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  requests: number[]
  blocked: boolean
  blockUntil?: Date
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  blockDurationMs: number // How long to block after limit exceeded
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: config.windowMs || 60000, // 1 minute default
      maxRequests: config.maxRequests || 100, // 100 requests per minute default
      blockDurationMs: config.blockDurationMs || 60000 // Block for 1 minute default
    }

    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Check if request should be rate limited
   */
  check(key: string): { allowed: boolean; remaining: number; resetAt?: Date } {
    const now = Date.now()
    let entry = this.limits.get(key)

    // Initialize entry if doesn't exist
    if (!entry) {
      entry = { requests: [], blocked: false }
      this.limits.set(key, entry)
    }

    // Check if currently blocked
    if (entry.blocked && entry.blockUntil) {
      if (now < entry.blockUntil.getTime()) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.blockUntil
        }
      } else {
        // Block expired, reset
        entry.blocked = false
        entry.blockUntil = undefined
        entry.requests = []
      }
    }

    // Remove old requests outside the window
    const windowStart = now - this.config.windowMs
    entry.requests = entry.requests.filter(time => time > windowStart)

    // Check if limit exceeded
    if (entry.requests.length >= this.config.maxRequests) {
      entry.blocked = true
      entry.blockUntil = new Date(now + this.config.blockDurationMs)
      
      console.warn(
        `[RATE-LIMIT] Key ${key} exceeded limit. Blocked until ${entry.blockUntil.toISOString()}`
      )

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockUntil
      }
    }

    // Allow request and record it
    entry.requests.push(now)
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.requests.length
    }
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.limits.entries()) {
      // Remove if no recent requests and not blocked
      const hasRecentRequests = entry.requests.some(
        time => time > now - this.config.windowMs * 2
      )
      const isActivelyBlocked = entry.blocked && entry.blockUntil && entry.blockUntil.getTime() > now

      if (!hasRecentRequests && !isActivelyBlocked) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.limits.delete(key))
    
    if (keysToDelete.length > 0) {
      console.log(`[RATE-LIMIT] Cleaned up ${keysToDelete.length} old entries`)
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      totalKeys: this.limits.size,
      config: this.config,
      entries: Array.from(this.limits.entries()).map(([key, entry]) => ({
        key,
        requestCount: entry.requests.length,
        blocked: entry.blocked,
        blockUntil: entry.blockUntil
      }))
    }
  }
}

// Create different rate limiters for different use cases
export const webhookRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 200, // 200 messages per minute per bot
  blockDurationMs: 30000 // Block for 30 seconds
})

export const apiRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 60, // 60 requests per minute per IP
  blockDurationMs: 60000 // Block for 1 minute
})

/**
 * Express middleware for webhook rate limiting
 */
export function webhookRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Create key from bot identifier and IP
  const keyBot = req.query.key_bot || req.headers['x-bot-key'] || 'unknown'
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const key = `webhook:${keyBot}:${ip}`

  const result = webhookRateLimiter.check(key)

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', 200)
  res.setHeader('X-RateLimit-Remaining', result.remaining)
  if (result.resetAt) {
    res.setHeader('X-RateLimit-Reset', result.resetAt.getTime())
  }

  if (!result.allowed) {
    console.warn(`[RATE-LIMIT] Request blocked for key: ${key}`)
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.resetAt ? Math.ceil((result.resetAt.getTime() - Date.now()) / 1000) : 30
    })
  }

  next()
}

/**
 * Express middleware for general API rate limiting
 */
export function apiRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const key = `api:${ip}`

  const result = apiRateLimiter.check(key)

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', 60)
  res.setHeader('X-RateLimit-Remaining', result.remaining)
  if (result.resetAt) {
    res.setHeader('X-RateLimit-Reset', result.resetAt.getTime())
  }

  if (!result.allowed) {
    console.warn(`[RATE-LIMIT] API request blocked for IP: ${ip}`)
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.resetAt ? Math.ceil((result.resetAt.getTime() - Date.now()) / 1000) : 60
    })
  }

  next()
}
