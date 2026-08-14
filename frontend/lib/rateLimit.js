/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window counter pattern.
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rateLimit';
 *   const limiter = rateLimit({ windowMs: 60000, max: 10 });
 *
 *   // In your route handler:
 *   const ip = request.headers.get('x-forwarded-for') || 'unknown';
 *   const { success, remaining } = limiter.check(ip);
 *   if (!success) {
 *     return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 */

const limiters = new Map();

/**
 * Creates a rate limiter instance.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60s)
 * @param {number} options.max - Max requests per window (default: 10)
 * @returns {{ check: (key: string) => { success: boolean, remaining: number } }}
 */
export function rateLimit({ windowMs = 60 * 1000, max = 10 } = {}) {
    const hits = new Map();

    // Periodic cleanup to prevent memory leaks (every 5 minutes)
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of hits) {
            if (now - record.windowStart >= windowMs * 2) {
                hits.delete(key);
            }
        }
    }, 5 * 60 * 1000);

    // Allow garbage collection if the module is unloaded
    if (typeof cleanupInterval.unref === 'function') {
        cleanupInterval.unref();
    }

    return {
        check(key) {
            const now = Date.now();
            const record = hits.get(key);

            if (!record || now - record.windowStart >= windowMs) {
                // New window
                hits.set(key, { count: 1, windowStart: now });
                return { success: true, remaining: max - 1 };
            }

            if (record.count >= max) {
                return { success: false, remaining: 0 };
            }

            record.count++;
            return { success: true, remaining: max - record.count };
        }
    };
}

// Pre-configured limiters for common use cases
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 });    // 15 per 15 min
export const submitLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });         // 5 per minute
export const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });        // 10 per minute
export const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });       // 30 per minute
