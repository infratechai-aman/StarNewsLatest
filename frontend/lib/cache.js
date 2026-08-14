// Shared in-memory cache for all API routes to drastically reduce Firebase reads
// and speed up data delivery across the Next.js application.

// SECURITY: Max cache entries to prevent unbounded memory growth in serverless functions.
// Vercel functions have 1024MB default memory limit.
const MAX_CACHE_SIZE = 100;

let apiCache = new Map();

// Default Cache TTL: 5 minutes (saves massive amounts of Firebase reads)
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * Evict oldest entries when cache exceeds MAX_CACHE_SIZE.
 * Uses a simple LRU-like eviction: removes the oldest entries by insertion order.
 */
function evictIfNeeded() {
    if (apiCache.size <= MAX_CACHE_SIZE) return;

    // Also evict expired entries first
    const now = Date.now();
    for (const [key, cached] of apiCache) {
        if (now - cached.lastFetch >= (cached.ttl || DEFAULT_CACHE_TTL)) {
            apiCache.delete(key);
        }
    }

    // If still over limit, remove oldest entries (Map preserves insertion order)
    while (apiCache.size > MAX_CACHE_SIZE) {
        const oldestKey = apiCache.keys().next().value;
        apiCache.delete(oldestKey);
    }
}

export function getCache(key) {
    const cached = apiCache.get(key);
    if (cached && (Date.now() - cached.lastFetch < (cached.ttl || DEFAULT_CACHE_TTL))) {
        return cached.data;
    }
    // Clean up expired entry
    if (cached) {
        apiCache.delete(key);
    }
    return null;
}

export function setCache(key, data, ttl = DEFAULT_CACHE_TTL) {
    if (!data) return; // Don't cache empty or undefined if something went wrong
    apiCache.set(key, { data, lastFetch: Date.now(), ttl });
    evictIfNeeded();
}

export function invalidateCache(key) {
    apiCache.delete(key);
}

export function purgeCache(pattern = null) {
    if (!pattern) {
        apiCache.clear();
        return;
    }

    // Purge keys matching a specific string or regex
    for (const key of apiCache.keys()) {
        if (key.includes(pattern)) {
            apiCache.delete(key);
        }
    }
}
