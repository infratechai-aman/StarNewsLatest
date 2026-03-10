// Shared in-memory news cache with on-demand invalidation
// This module is a singleton — all API routes share the same cache instance.

let newsCache = {
    data: null,
    lastFetch: 0
};

// 5 minutes cache TTL (saves ~99% of Firebase reads)
export const CACHE_TTL = 5 * 60 * 1000;

export function getCachedNews() {
    if (newsCache.data && (Date.now() - newsCache.lastFetch < CACHE_TTL)) {
        return newsCache.data;
    }
    return null;
}

export function setCachedNews(data) {
    newsCache.data = data;
    newsCache.lastFetch = Date.now();
}

/**
 * Purge the news cache immediately.
 * Call this after any create/update/delete/approve/feature action
 * so the next visitor gets fresh data from Firestore.
 */
export function purgeNewsCache() {
    newsCache.data = null;
    newsCache.lastFetch = 0;
}
