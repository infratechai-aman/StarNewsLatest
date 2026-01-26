// API utility functions

export const API_BASE = '/api'

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...((token && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) && { Authorization: `Bearer ${token}` }),
    ...options.headers
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const auth = {
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
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
  create: (data) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) }),
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
  getAll: (params) => apiRequest(`/ads?${new URLSearchParams(params)}`),
  create: (data) => apiRequest('/ads', { method: 'POST', body: JSON.stringify(data) }),
  trackImpression: (adId) => apiRequest('/ads/impression', { method: 'POST', body: JSON.stringify({ adId }) }),
  trackClick: (adId) => apiRequest('/ads/click', { method: 'POST', body: JSON.stringify({ adId }) }),
}

export const adPlans = {
  getAll: () => apiRequest('/ad-plans'),
  create: (data) => apiRequest('/ad-plans', { method: 'POST', body: JSON.stringify(data) }),
}

export const classifieds = {
  getAll: (params) => apiRequest(`/classifieds?${new URLSearchParams(params || {})}`),
  getOne: (id) => apiRequest(`/classifieds/${id}`),
  create: (data) => apiRequest('/classifieds', { method: 'POST', body: JSON.stringify(data) }),
  submit: (data) => apiRequest('/classifieds/submit', { method: 'POST', body: JSON.stringify(data) }),
}

export const liveTV = {
  get: () => apiRequest('/live-tv'),
  update: (data) => apiRequest('/live-tv', { method: 'PUT', body: JSON.stringify(data) }),
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
  getPending: () => apiRequest('/admin/pending'),
  approveNews: (articleId, action, reason) => apiRequest('/admin/news/approve', { method: 'POST', body: JSON.stringify({ articleId, action, reason }) }),
  approveBusiness: (businessId, action) => apiRequest('/admin/businesses/approve', { method: 'POST', body: JSON.stringify({ businessId, action }) }),
  approveAd: (adId, action) => apiRequest('/admin/ads/approve', { method: 'POST', body: JSON.stringify({ adId, action }) }),
  approveClassified: (classifiedId, action) => apiRequest('/admin/classifieds/approve', { method: 'POST', body: JSON.stringify({ classifiedId, action }) }),
  approveUser: (userId, action) => apiRequest('/admin/users/approve', { method: 'POST', body: JSON.stringify({ userId, action }) }),

  // Breaking News
  getBreakingNews: () => apiRequest('/admin/breaking-news'),
  setBreakingNews: (data) => apiRequest('/admin/breaking-news', { method: 'POST', body: JSON.stringify(data) }),

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
  getSidebarAd: () => apiRequest('/admin/sidebar-ad'),
  updateSidebarAd: (data) => apiRequest('/admin/sidebar-ad', { method: 'PUT', body: JSON.stringify(data) }),

  // Layout (legacy)
  getLayout: () => apiRequest('/admin/layout'),
  updateLayout: (data) => apiRequest('/admin/layout', { method: 'PUT', body: JSON.stringify(data) }),
}
