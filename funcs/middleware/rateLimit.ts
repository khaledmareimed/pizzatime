import { NextRequest } from 'next/server'

interface RateLimitOptions {
  limit: number // Number of requests
  window: number // Time window in milliseconds
}

interface RateLimitResult {
  success: boolean
  remaining?: number
  resetTime?: number
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    // Get client identifier (IP + User-Agent for better uniqueness)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const identifier = `${ip}:${userAgent.substring(0, 50)}` // Limit UA length
    
    const now = Date.now()
    const windowStart = now - options.window
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(identifier)
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + options.window
      }
    }
    
    // Check if limit exceeded
    if (entry.count >= options.limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }
    
    // Increment counter
    entry.count++
    rateLimitStore.set(identifier, entry)
    
    return {
      success: true,
      remaining: options.limit - entry.count,
      resetTime: entry.resetTime
    }
    
  } catch (error) {
    console.error('Rate limiting error:', error)
    // On error, allow the request (fail open)
    return { success: true }
  }
}