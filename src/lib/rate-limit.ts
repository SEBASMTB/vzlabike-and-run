/**
 * In-memory rate limiter for API routes.
 * 
 * Designed for Vercel serverless: uses a Map that persists per-function instance.
 * Each serverless function has its own memory, so this provides per-instance rate limiting.
 * For distributed rate limiting, consider Upstash Redis in the future.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store: key = "method:ip" or "method:ip:endpoint", value = { count, resetAt }
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 60s)
let lastCleanup = 0;
function cleanup(now: number) {
  if (now - lastCleanup > 60_000) {
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
    lastCleanup = now;
  }
}

export interface RateLimitConfig {
  /** Time window in seconds. Default: 60 */
  windowMs?: number;
  /** Max requests per window. Default: 30 */
  maxRequests?: number;
  /** Custom key prefix (e.g., "register"). If not provided, uses IP only */
  keyPrefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of requests remaining in current window */
  remaining: number;
  /** When the rate limit resets (Unix timestamp in ms) */
  resetAt: number;
  /** HTTP retry-after header value in seconds, if rate limited */
  retryAfter?: number;
}

/**
 * Check rate limit for a request.
 * Call this at the beginning of your API route handler.
 * 
 * @example
 * ```ts
 * const limit = rateLimit(request, { windowMs: 60, maxRequests: 10, keyPrefix: "register" });
 * if (!limit.success) {
 *   return NextResponse.json({ error: "Too many requests" }, { 
 *     status: 429, 
 *     headers: { "Retry-After": String(limit.retryAfter) }
 *   });
 * }
 * ```
 */
export function rateLimit(
  request: Request,
  config: RateLimitConfig = {}
): RateLimitResult {
  const { windowMs = 60, maxRequests = 30, keyPrefix = "" } = config;
  const now = Date.now();

  // Clean up expired entries
  cleanup(now);

  // Get client IP from Vercel headers or fallback to unknown
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
    || request.headers.get("x-real-ip") 
    || "unknown";

  const key = keyPrefix ? `${keyPrefix}:${ip}` : ip;
  const windowMsMs = windowMs * 1000;
  const resetAt = Math.ceil(now / windowMsMs) * windowMsMs;

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { success: false, remaining: 0, resetAt: entry.resetAt, retryAfter };
  }

  // Increment count
  entry.count++;
  return { success: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Rate limit configs for specific endpoints.
 * Usage: import { RATE_LIMITS } from "@/lib/rate-limit";
 */
export const RATE_LIMITS = {
  /** Registration: 5 per 60s per IP (prevent spam registrations) */
  register: { windowMs: 60, maxRequests: 5, keyPrefix: "register" } as RateLimitConfig,
  /** Group registration: 3 per 60s per IP */
  registerGroup: { windowMs: 60, maxRequests: 3, keyPrefix: "register-group" } as RateLimitConfig,
  /** Product orders: 5 per 60s per IP */
  productOrder: { windowMs: 60, maxRequests: 5, keyPrefix: "product-order" } as RateLimitConfig,
  /** General API: 60 per 60s per IP */
  general: { windowMs: 60, maxRequests: 60, keyPrefix: "" } as RateLimitConfig,
  /** Admin auth: 10 per 60s per IP (prevent brute force) */
  auth: { windowMs: 60, maxRequests: 10, keyPrefix: "auth" } as RateLimitConfig,
} as const;
