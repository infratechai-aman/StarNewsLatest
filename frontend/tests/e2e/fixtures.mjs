// Mock API layer: every /api/* call from the browser is answered from these fixtures,
// so E2E never touches a real backend.
import { test as base, expect } from '@playwright/test'

const img = (id) => `https://images.unsplash.com/${id}?w=600&auto=format&fit=crop&q=60`
const now = new Date().toISOString()

export const ARTICLES = [
  {
    id: 'a1', title: { en: 'Kalepadal police: serious questions raised' }, category: 'Crime', categoryId: 'Crime',
    content: { en: '### Police under scrutiny\nCitizens asked **who gives the orders**.\n\nSecond paragraph text-align: center;"> here.' },
    metaDescription: { en: '### Summary with **markdown**' }, mainImage: img('photo-1504674900247-0877df9cc836'),
    galleryImages: [], approvalStatus: 'approved', active: true, createdAt: now, publishedAt: now, authorName: 'QA',
  },
  {
    id: 'a2', title: { en: 'Pune metro extension approved' }, category: 'City News', categoryId: 'City News', city: 'Pune',
    content: { en: '<p>Metro update.</p><p>More details.</p>' }, mainImage: img('photo-1519494026892-80bbd2d6fd0d'),
    approvalStatus: 'approved', active: true, createdAt: now, publishedAt: now,
  },
]

export const BUSINESSES = [
  {
    id: 'b1', name: 'QA Multi Photo Cafe', category: 'Cafe', area: 'Kondhwa', address: 'NIBM Road, Kondhwa, Pune',
    description: 'Business with three photos (BUG-001 regression).',
    coverImage: img('photo-1554118811-1e0d58224f24'),
    images: [img('photo-1554118811-1e0d58224f24'), img('photo-1517248135467-4c7edcad34c4'), img('photo-1504674900247-0877df9cc836')],
    approvalStatus: 'approved', active: true,
  },
  { id: 'b2', name: 'QA Clinic', category: 'Healthcare', area: 'Camp', address: 'MG Road, Camp, Pune', phone: '+91 90000 00000', images: [], approvalStatus: 'approved', active: true },
  { id: 'b3', name: 'QA Vineyard', category: 'Travel & Tourism', area: 'Nashik', address: 'Gangapur Road, Nashik', images: [], approvalStatus: 'approved', active: true },
]

export const CLASSIFIEDS = [
  { id: 'c1', title: 'Old sofa for sale', category: 'Furniture', price: '5000', location: 'Kondhwa, Pune', images: [img('photo-1555041469-a586c61ea9bc')], createdAt: now, condition: 'Good', phone: '9000000000' },
  { id: 'c2', title: 'Honda Activa 2019', category: 'Vehicles', price: '45000', location: 'Pune', images: [img('photo-1494976388531-d1058494cdd8')], createdAt: now, condition: 'Good', phone: '9000000000' },
]

const LIVE = {
  enabled: true, primaryStreamId: 's1',
  streams: [
    { id: 's1', title: 'QA Live', channelName: 'QA Channel', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', category: 'news', thumbAvailable: true, thumbnail: img('photo-1504674900247-0877df9cc836'), isLive: true },
    { id: 's2', title: 'Dead stream', channelName: 'Dead Channel', url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', category: 'news', thumbAvailable: false, thumbnail: null, isLive: true },
  ],
}

function apiResponse(url, method) {
  const u = new URL(url)
  const p = u.pathname
  if (method !== 'GET') return { status: 200, body: { success: true, id: 'new1', url: '/api/file/qa' } }
  if (p === '/api/news') return { body: { articles: ARTICLES, pagination: { total: ARTICLES.length } } }
  const art = p.match(/^\/api\/news\/([^/]+)$/)
  if (art) {
    const a = ARTICLES.find(x => x.id === art[1])
    return a ? { body: a } : { status: 404, body: { error: 'Article not found' } }
  }
  if (p === '/api/businesses') return { body: BUSINESSES }
  if (p === '/api/classifieds') return { body: { classifieds: CLASSIFIEDS } }
  if (p === '/api/live-tv') return { body: LIVE }
  if (p === '/api/enewspaper') return { body: { papers: [] } }
  if (p === '/api/breaking-ticker') return { body: { enabled: true, text: 'QA breaking headline', texts: ['QA breaking headline'] } }
  if (p === '/api/shorts') return { body: { shorts: [] } }
  if (p === '/api/categories') return { body: [] }
  if (p === '/api/finance') return { body: { chart: { result: [{ meta: { regularMarketPrice: 80000, chartPreviousClose: 79500 } }] } } }
  if (p.startsWith('/api/auth/me')) return { status: 401, body: { error: 'Authentication required' } }
  return { body: {} }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.route('**/api/**', async (route) => {
      const req = route.request()
      if (req.url().includes('/api/image-proxy')) return route.continue()
      const { status = 200, body } = apiResponse(req.url(), req.method())
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    })
    // keep third-party embeds out of the run (speed + determinism)
    await page.route(/youtube(-nocookie)?\.com\/embed|ytimg\.com/, r => r.fulfill({ status: 200, body: '' }))
    page.pageErrors = errors
    await use(page)
  },
})
export { expect }

export async function noHorizontalOverflow(page) {
  const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: window.innerWidth }))
  expect(scroll, `page is ${scroll}px wide in a ${width}px viewport`).toBeLessThanOrEqual(width + 1)
}
