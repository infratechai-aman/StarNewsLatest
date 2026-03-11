// Shared in-memory news cache with on-demand invalidation
// This module is a singleton — all API routes share the same cache instance.

let newsCache = new Map();

// 5 minutes cache TTL (saves ~99% of Firebase reads)
export const CACHE_TTL = 5 * 60 * 1000;

export function getCachedNews(key = 'default') {
    const cached = newsCache.get(key);
    if (cached && (Date.now() - cached.lastFetch < CACHE_TTL)) {
        return cached.data;
    }
    return null;
}

export function setCachedNews(key = 'default', data) {
    newsCache.set(key, { data, lastFetch: Date.now() });
}

/**
 * Purge the news cache immediately.
 * Call this after any create/update/delete/approve/feature action
 * so the next visitor gets fresh data from Firestore.
 */
export function purgeNewsCache() {
    newsCache.clear();
}
