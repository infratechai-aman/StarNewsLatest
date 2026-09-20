// API utility functions

import { auth as firebaseAuth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

export const API_BASE = '/api'

// fix(DEFECT-05): Client-side in-memory cache for GET requests.
// Prevents re-fetching data when user navigates back to a previously visited page.
const CLIENT_CACHE = new Map()
const CLIENT_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

function getClientCache(key) {
  const cached = CLIENT_CACHE.get(key)
  if (cached && (Date.now() - cached.ts < CLIENT_CACHE_TTL)) {
    return cached.data
  }
  if (cached) CLIENT_CACHE.delete(key)
  return null
}

function setClientCache(key, data) {
  // Evict old entries if cache grows too large (max 50)
  if (CLIENT_CACHE.size > 50) {
    const oldest = CLIENT_CACHE.keys().next().value
    CLIENT_CACHE.delete(oldest)
  }
  CLIENT_CACHE.set(key, { data, ts: Date.now() })
}

// Invalidate cache entries matching a pattern (called after mutations)
function invalidateClientCache(pattern) {
  for (const key of CLIENT_CACHE.keys()) {
    if (key.includes(pattern)) {
      CLIENT_CACHE.delete(key)
    }
  }
}

/**
 * Retrieve a fresh Firebase ID token.
 * If Firebase Auth is initialized and the user is logged in, this will
 * automatically refresh the token if it is expired (or force refresh if requested).
 */
export async function getFreshToken(forceRefresh = false) {
  if (typeof window === 'undefined') return null;

  if (firebaseAuth) {
    try {
      if (typeof firebaseAuth.authStateReady === 'function') {
        await firebaseAuth.authStateReady();
      }
      if (firebaseAuth.currentUser) {
        const freshToken = await firebaseAuth.currentUser.getIdToken(forceRefresh);
        if (freshToken) {
          localStorage.setItem('token', freshToken);
          return freshToken;
        }
      }
    } catch (e) {
      console.warn("Failed to get fresh Firebase token:", e);
    }
  }

  return localStorage.getItem('token');
}

/**
 * Authenticated fetch helper for raw requests (e.g. multipart FormData file uploads).
 * Automatically injects fresh Bearer token and retries once on 401 with a force-refreshed token.
 */
export async function authenticatedFetch(url, options = {}) {
  let token = await getFreshToken(false);
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  let response = await fetch(url, { ...options, headers });

  // If 401 Unauthorized, automatically force-refresh token and retry once
  if (response.status === 401 && firebaseAuth?.currentUser) {
    try {
      const refreshedToken = await getFreshToken(true);
      if (refreshedToken && refreshedToken !== token) {
        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${refreshedToken}`
        };
        response = await fetch(url, { ...options, headers: retryHeaders });
      }
    } catch (refreshErr) {
      console.warn('authenticatedFetch auto-retry failed:', refreshErr);
    }
  }

  return response;
}

export async function apiRequest(endpoint, options = {}) {
  let token = await getFreshToken(false);

  const method = (options.method || 'GET').toUpperCase();

  // Client-side cache: only for GET requests
  if (method === 'GET') {
    const cached = getClientCache(endpoint);
    if (cached) return cached;
  }

  const buildHeaders = (authToken) => ({
    'Content-Type': 'application/json',
    ...((authToken && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) && { Authorization: `Bearer ${authToken}` }),
    ...options.headers
  });

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: buildHeaders(token)
  });

  // Auto-retry once on 401 with force-refreshed token
  if (response.status === 401 && firebaseAuth?.currentUser) {
    try {
      const refreshedToken = await getFreshToken(true);
      if (refreshedToken && refreshedToken !== token) {
        token = refreshedToken;
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers: buildHeaders(refreshedToken)
        });
      }
    } catch (refreshErr) {
      console.warn('apiRequest auto token refresh failed:', refreshErr);
    }
  }

  if (!response.ok) {
    // SECURITY/RELIABILITY: Handle non-JSON error responses (e.g., HTML 502 pages)
    let errorMessage = `Request failed (${response.status})`;
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      }
    } catch {
      // Response body couldn't be parsed — use generic message
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (e.g., 204 No Content)
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return {};
  }

  const data = await response.json();

  // Cache GET responses
  if (method === 'GET') {
    setClientCache(endpoint, data);
  }

  // Invalidate related cache on mutations
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    // Extract the base path (e.g., /admin/news/123 -> /news, /admin/news)
    const baseParts = endpoint.split('/');
    if (baseParts.length >= 2) {
      const resourceType = baseParts[baseParts.length - 1] === 'approve' ? baseParts[baseParts.length - 2] : baseParts[baseParts.length - 1];
      invalidateClientCache(resourceType);
    }
    // Also always invalidate common patterns
    invalidateClientCache('/news');
    invalidateClientCache('/pending');
    invalidateClientCache('/businesses');
    invalidateClientCache('/classifieds');
    invalidateClientCache('/shorts');
    invalidateClientCache('/admin/shorts');
  }

  return data;
}

export const auth = {
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: async (data) => {
    // Use Firebase Client SDK for login
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, data.email, data.password)
      const token = await userCredential.user.getIdToken()

      // Fetch full user profile from backend to get Role
      const userProfile = await apiRequest('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      return {
        token,
        user: userProfile,
        requirePasswordChange: userProfile.requirePasswordChange || false
      }
    } catch (error) {
      console.error("Firebase Login Error", error)
      throw new Error(error.code === 'auth/invalid-credential' ? 'Invalid email or password' : error.message)
    }
  },
  getMe: () => apiRequest('/auth/me'),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
}

export const news = {
  getAll: (params) => apiRequest(`/news?${new URLSearchParams(params)}`),
  getOne: (id) => apiRequest(`/news/${id}`),
  create: (data) => apiRequest('/news', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMyArticles: () => apiRequest('/news/my-articles'),
}

export const categories = {
  getAll: () => apiRequest('/categories'),
  create: (data) => apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
}

export const businesses = {
  getAll: (params) => apiRequest(`/businesses?${new URLSearchParams(params)}`),
  getOne: (id) => apiRequest(`/businesses/${id}`),
  create: (data) => apiRequest('/businesses', { method: 'POST', body: JSON.stringify(data) }),
}

export const reviews = {
  create: (data) => apiRequest('/reviews', { method: 'POST', body: JSON.stringify(data) }),
}

export const ads = {
  // fix(P2-API-02/03): Only sidebar and premium sub-routes exist.
  // /api/ads, /api/ads/impression, /api/ads/click do not exist — removed broken stubs.
  getSidebar: () => apiRequest('/ads/sidebar'),
}

// fix(P2-API-02): /api/ad-plans route does not exist in the codebase.
// Keeping as placeholder — do not call these until the route is created.
export const adPlans = {
  // getAll: () => apiRequest('/ad-plans'),  // ROUTE NOT IMPLEMENTED
  // create: (data) => apiRequest('/ad-plans', { method: 'POST', body: JSON.stringify(data) }),  // ROUTE NOT IMPLEMENTED
}

export const classifieds = {
  getAll: (params) => apiRequest(`/classifieds?${new URLSearchParams(params || {})}`),
  getOne: (id) => apiRequest(`/classifieds/${id}`),
  create: (data) => apiRequest('/classifieds', { method: 'POST', body: JSON.stringify(data) }),
  submit: (data) => apiRequest('/classifieds/submit', { method: 'POST', body: JSON.stringify(data) }),
}

export const liveTV = {
  get: () => apiRequest('/live-tv'),
  // fix(P2-API-01): /api/live-tv has no PUT handler (public, GET only).
  // Admin live TV update must go through /api/admin/live-tv PUT (use admin.updateLiveTV instead).
  // update: (data) => apiRequest('/live-tv', { method: 'PUT', ... })  — REMOVED
}

// Public endpoints
export const homeContent = {
  get: () => apiRequest('/home-content'),
}

export const enewspaper = {
  getAll: () => apiRequest('/enewspaper'),
}

export const admin = {
  getStats: () => apiRequest('/admin/stats'),
  getPending: (fresh = false) => apiRequest(`/admin/pending${fresh ? '?fresh=true' : ''}`),
  approveNews: (articleId, action, reason) => apiRequest('/admin/news/approve', { method: 'POST', body: JSON.stringify({ articleId, action, reason }) }),
  approveBusiness: (businessId, action) => apiRequest('/admin/businesses/approve', { method: 'POST', body: JSON.stringify({ businessId, action }) }),
  approveAd: (adId, action) => apiRequest('/admin/ads/approve', { method: 'POST', body: JSON.stringify({ adId, action }) }),
  approveClassified: (classifiedId, action) => apiRequest('/admin/classifieds/approve', { method: 'POST', body: JSON.stringify({ classifiedId, action }) }),
  approveUser: (userId, action) => apiRequest('/admin/users/approve', { method: 'POST', body: JSON.stringify({ userId, action }) }),

  // Breaking News
  getBreakingNews: () => apiRequest('/breaking-ticker'),
  setBreakingNews: (data) => apiRequest('/admin/pending-ticker', { method: 'POST', body: JSON.stringify(data) }),

  // Navigation
  getNavigation: () => apiRequest('/admin/navigation'),
  updateNavigation: (data) => apiRequest('/admin/navigation', { method: 'PUT', body: JSON.stringify(data) }),

  // E-Newspaper Management
  getEnewspapers: () => apiRequest('/admin/enewspaper'),
  uploadEnewspaper: (data) => apiRequest('/admin/enewspaper', { method: 'POST', body: JSON.stringify(data) }),
  deleteEnewspaper: (id) => apiRequest(`/admin/enewspaper/${id}`, { method: 'DELETE' }),
  toggleEnewspaper: (id) => apiRequest(`/admin/enewspaper/${id}/toggle`, { method: 'POST' }),

  // Business Management (Full CRUD)
  getBusinesses: () => apiRequest('/admin/businesses'),
  createBusiness: (data) => apiRequest('/admin/businesses', { method: 'POST', body: JSON.stringify(data) }),
  updateBusiness: (id, data) => apiRequest(`/admin/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBusiness: (id) => apiRequest(`/admin/businesses/${id}`, { method: 'DELETE' }),
  toggleBusiness: (id) => apiRequest(`/admin/businesses/${id}/toggle`, { method: 'POST' }),

  // Classified Management (Full CRUD)
  getClassifieds: () => apiRequest('/admin/classifieds'),
  createClassified: (data) => apiRequest('/admin/classifieds', { method: 'POST', body: JSON.stringify(data) }),
  updateClassified: (id, data) => apiRequest(`/admin/classifieds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClassified: (id) => apiRequest(`/admin/classifieds/${id}`, { method: 'DELETE' }),
  toggleClassified: (id) => apiRequest(`/admin/classifieds/${id}/toggle`, { method: 'POST' }),

  // News Management (Full CRUD)
  getNews: () => apiRequest('/admin/news'),
  createNews: (data) => apiRequest('/admin/news', { method: 'POST', body: JSON.stringify(data) }),
  updateNews: (id, data) => apiRequest(`/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNews: (id) => apiRequest(`/admin/news/${id}`, { method: 'DELETE' }),
  toggleNews: (id) => apiRequest(`/admin/news/${id}/toggle`, { method: 'POST' }),
  toggleNewsFeatured: (id) => apiRequest(`/admin/news/${id}/featured`, { method: 'POST' }),

  // Home Page Settings
  getHomeSettings: () => apiRequest('/admin/home-settings'),
  updateHomeSettings: (data) => apiRequest('/admin/home-settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Sidebar Ad with WhatsApp
  getSidebarAd: () => apiRequest('/ads/sidebar'),
  updateSidebarAd: (data) => apiRequest('/ads/sidebar', { method: 'POST', body: JSON.stringify(data) }),

  // Live TV Management
  getLiveTV: () => apiRequest('/admin/live-tv'),
  updateLiveTV: (data) => apiRequest('/admin/live-tv', { method: 'PUT', body: JSON.stringify(data) }),

  // Layout (legacy)
  getLayout: () => apiRequest('/admin/layout'),
  updateLayout: (data) => apiRequest('/admin/layout', { method: 'PUT', body: JSON.stringify(data) }),

  // Shorts / Reels Management
  getShorts: () => apiRequest('/admin/shorts'),
  createShort: (data) => apiRequest('/admin/shorts', { method: 'POST', body: JSON.stringify(data) }),
  updateShort: (id, data) => apiRequest(`/admin/shorts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShort: (id) => apiRequest(`/admin/shorts/${id}`, { method: 'DELETE' }),
  toggleShort: (id, active) => apiRequest(`/admin/shorts/${id}/toggle`, { method: 'POST', body: JSON.stringify({ active }) }),
}
