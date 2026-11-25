import { test, expect } from '@playwright/test'
import { idToken, bearer, uniq, USERS, rip } from './helpers.mjs'

const titleOf = (a) => (typeof a.title === 'object' ? a.title.en || Object.values(a.title)[0] : a.title)

test('core news flow: reporter submits -> admin sees pending -> approves -> public', async ({ request }) => {
  const title = uniq('QA flow article')
  const reporter = await idToken(request, USERS.reporter.email, USERS.reporter.password)
  const sub = await request.post('/api/reporter/news', { headers: bearer(reporter), data: { title, content: '### Heading\nBody **bold**', categoryId: 'City News', city: 'Pune' } })
  expect(sub.ok(), await sub.text()).toBeTruthy()
  const id = (await sub.json()).id

  // not public yet
  const before = await (await request.get(`/api/news?limit=200&_t=${Date.now()}`)).json()
  expect(before.articles.some(a => a.id === id)).toBe(false)

  // admin pending queue shows it immediately (cache purge on submit)
  const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
  const pending = await (await request.get(`/api/admin/pending?_t=${Date.now()}`, { headers: bearer(admin) })).json()
  expect(JSON.stringify(pending)).toContain(id)

  const appr = await request.post('/api/admin/news/approve', { headers: bearer(admin), data: { id, articleId: id, newsId: id, status: 'approved', action: 'approve' } })
  expect(appr.ok(), await appr.text()).toBeTruthy()

  const after = await (await request.get(`/api/news?limit=200&_t=${Date.now()}`)).json()
  const pub = after.articles.find(a => a.id === id)
  expect(pub, 'approved article is public').toBeTruthy()
  expect(titleOf(pub)).toBe(title)

  // clean up
  expect((await request.delete(`/api/admin/news/${id}`, { headers: bearer(admin) })).ok()).toBeTruthy()
})

test('public business submission keeps gallery images and lands in pending', async ({ request }) => {
  const name = uniq('QA Business')
  const r = await request.post('/api/businesses', { headers: rip(), data: {
    businessName: name, phone: '+91 90000 00000', address: 'Kondhwa, Pune', category: 'Services',
    coverImage: '/api/file/cover', images: ['/api/file/g1', '/api/file/g2', 'javascript:alert(1)', '//evil.example/x.png'],
  } })
  expect(r.ok(), await r.text()).toBeTruthy()
  const body = await r.json()
  expect(body.approvalStatus).toBe('pending')
  expect(body.images).toEqual(['/api/file/cover', '/api/file/g1', '/api/file/g2'])
})

test('public classified submission is pending, never auto-published', async ({ request }) => {
  const title = uniq('QA classified')
  const r = await request.post('/api/classifieds/submit', { headers: rip(), data: { title, category: 'Other', price: '100', phone: '9000000000', location: 'Pune' } })
  expect(r.ok(), await r.text()).toBeTruthy()
  const pub = await (await request.get(`/api/classifieds?_t=${Date.now()}`)).json()
  expect(JSON.stringify(pub)).not.toContain(title)
})

test('UI: reporter logs in on /reporter and sees the dashboard', async ({ page }) => {
  await page.goto('/reporter')
  await page.locator('input[type="email"]').fill(USERS.reporter.email)
  await page.locator('input[type="password"]').fill(USERS.reporter.password)
  await page.locator('form button[type="submit"]').click()
  await expect(page.getByText('Submit News').first()).toBeVisible({ timeout: 20_000 })
})

test('UI: admin logs in and the dashboard loads', async ({ page }) => {
  await page.goto('/admin')
  await page.locator('input[type="email"], input[type="text"]').first().fill(USERS.admin.email)
  await page.locator('input[type="password"]').fill(USERS.admin.password)
  await page.locator('form button[type="submit"]').click()
  await expect(page.getByText('Pending Approvals').first()).toBeVisible({ timeout: 20_000 })
})

test('BUG-001 with real data: multi-photo business detail renders and navigates', async ({ page }) => {
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/?view=businesses')
  await page.getByText('Seed Multi Photo Bakery').first().click()
  await expect(page.getByText('1 / 3')).toBeVisible()
  await page.locator('main button:has(svg.lucide-chevron-right)').first().click({ force: true })
  await expect(page.getByText('2 / 3')).toBeVisible()
  expect(errors.filter(e => !/auth\/network-request-failed/.test(e))).toEqual([])
})
