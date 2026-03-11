// Shared in-memory cache for all API routes to drastically reduce Firebase reads
// and speed up data delivery across the Next.js application.

let apiCache = new Map();

// Default Cache TTL: 5 minutes (saves massive amounts of Firebase reads)
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

export function getCache(key) {
    const cached = apiCache.get(key);
    if (cached && (Date.now() - cached.lastFetch < (cached.ttl || DEFAULT_CACHE_TTL))) {
        return cached.data;
    }
    return null;
}

export function setCache(key, data, ttl = DEFAULT_CACHE_TTL) {
    if (!data) return; // Don't cache empty or undefined if something went wrong
    apiCache.set(key, { data, lastFetch: Date.now(), ttl });
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
