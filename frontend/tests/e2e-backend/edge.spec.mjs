// Phase 3 edge cases on the Firebase EMULATOR. Each test states the expected behaviour;
// a failure here is a finding, not a flaky test.
import { test, expect } from '@playwright/test'
import { idToken, bearer, uniq, USERS, rip } from './helpers.mjs'

const HUGE = 'A'.repeat(200_000) // 200 KB
const XSS = `<img src=x onerror="window.__xss=1">"><script>window.__xss=1</script>`
const WEIRD = `😀🔥 मराठी हिन्दी ' OR 1=1 -- ; DROP TABLE users; ‮\u0000 ${'​'.repeat(3)}`

test.describe('public submissions: bad input', () => {
  const endpoints = [
    ['classified', '/api/classifieds/submit', (t) => ({ title: t, category: 'Other', price: '100', phone: '9000000000', location: 'Pune', description: t })],
    ['business', '/api/businesses', (t) => ({ businessName: t, phone: '9000000000', address: 'Pune', description: t })],
    ['reporter application', '/api/reporter-applications', (t) => ({ name: t, phone: '9000000000', email: `${uniq('a')}@qa.test`, message: t })],
  ]

  for (const [name, url, body] of endpoints) {
    test(`${name}: empty body is rejected with 400`, async ({ request }) => {
      expect((await request.post(url, { data: {} })).status()).toBe(400)
    })
    test(`${name}: 200 KB text is rejected (4xx), not stored`, async ({ request }) => {
      const r = await request.post(url, { data: body(HUGE) })
      expect(r.status(), `${name} accepted a 200 KB field`).toBeGreaterThanOrEqual(400)
      expect(r.status()).toBeLessThan(500)
    })
    test(`${name}: emoji / Devanagari / SQL-ish text never causes a 5xx`, async ({ request }) => {
      expect((await request.post(url, { data: body(WEIRD) })).status()).toBeLessThan(500)
    })
  }
})

test('classified with HTML/script in title renders as text after approval (no stored XSS)', async ({ request, page }) => {
  const marker = uniq('xss')
  const r = await request.post('/api/classifieds/submit', { headers: rip(), data: { title: `${marker} ${XSS}`, category: 'Other', price: '1', phone: '9000000000', location: 'Pune', description: XSS } })
  expect(r.ok(), await r.text()).toBeTruthy()
  const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
  const list = await (await request.get(`/api/admin/classifieds?_t=${Date.now()}`, { headers: bearer(admin) })).json()
  const ad = (list.classifieds || list).find(c => String(c.title).includes(marker))
  expect(ad, 'submitted ad visible to admin').toBeTruthy()
  const ok = await request.post('/api/admin/classifieds/approve', { headers: bearer(admin), data: { id: ad.id, classifiedId: ad.id, action: 'approve', status: 'approved' } })
  expect(ok.ok(), await ok.text()).toBeTruthy()
  await page.goto('/?view=classifieds')
  await expect(page.getByText(marker).first()).toBeVisible()
  await page.getByText(marker).first().click()
  await page.waitForTimeout(1500)
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()
})

test.describe('rate limiting & abuse', () => {
  test('rapid public business submissions get throttled (429) before 15 go through', async ({ request }) => {
    const codes = []
    const one = rip()
    for (let i = 0; i < 15; i++) codes.push((await request.post('/api/businesses', { headers: one, data: { businessName: uniq('spam'), phone: '9000000000', address: 'Pune' } })).status())
    expect(codes, `codes: ${codes.join(',')}`).toContain(429)
  })

  test('forgot-password: same response for unknown and known email (no account enumeration)', async ({ request }) => {
    const a = await request.post('/api/auth/forgot-password', { headers: rip(), data: { email: USERS.reader.email } })
    const b = await request.post('/api/auth/forgot-password', { headers: rip(), data: { email: `${uniq('nobody')}@qa.test` } })
    expect(a.status()).toBe(b.status())
    expect((await a.json()).message ?? null).toEqual((await b.json()).message ?? null)
  })

  test('forgot-password is throttled after repeated requests', async ({ request }) => {
    const codes = []
    const one = rip()
    // Own address: hammering the shared reader email would rate-limit it for the
    // enumeration test above when the two run in parallel.
    const email = `${uniq('throttle')}@qa.test`
    for (let i = 0; i < 12; i++) codes.push((await request.post('/api/auth/forgot-password', { headers: one, data: { email } })).status())
    expect(codes, `codes: ${codes.join(',')}`).toContain(429)
  })

  test('double-click on submit does not create duplicate classifieds', async ({ request }) => {
    // Known open bug BUG-023 (P3): no server-side idempotency. Remove test.fail() once fixed.
    test.fail()
    const title = uniq('dup')
    const body = { title, category: 'Other', price: '5', phone: '9000000000', location: 'Pune' }
    const one = rip()
    await Promise.all([request.post('/api/classifieds/submit', { headers: one, data: body }), request.post('/api/classifieds/submit', { headers: one, data: body })])
    const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
    const list = await (await request.get(`/api/admin/classifieds?_t=${Date.now()}`, { headers: bearer(admin) })).json()
    expect((list.classifieds || list).filter(c => c.title === title).length).toBe(1)
  })
})

test.describe('uploads', () => {
  test('zero-byte file is rejected', async ({ request }) => {
    const r = await request.post('/api/upload', { headers: rip(), multipart: { file: { name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) } } })
    expect(r.status()).toBeGreaterThanOrEqual(400); expect(r.status()).toBeLessThan(500)
  })
  test('oversize image (> 700 KB) is rejected with 413/400', async ({ request }) => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(900 * 1024)])
    const r = await request.post('/api/upload', { headers: rip(), multipart: { file: { name: 'big.png', mimeType: 'image/png', buffer: png } } })
    expect([400, 413]).toContain(r.status())
  })
  test('HTML disguised as .png is rejected by magic bytes', async ({ request }) => {
    const r = await request.post('/api/upload', { headers: rip(), multipart: { file: { name: 'x.png', mimeType: 'image/png', buffer: Buffer.from('<html><script>alert(1)</script></html>') } } })
    expect([400, 415]).toContain(r.status())
  })
  test('anonymous user cannot use the 25 MB large-upload endpoint', async ({ request }) => {
    const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(1024)])
    const r = await request.post('/api/upload-large', { headers: rip(), multipart: { file: { name: 'a.pdf', mimeType: 'application/pdf', buffer: pdf } } })
    expect([401, 403]).toContain(r.status())
  })
})

test.describe('auth & session edge cases', () => {
  test('register rejects weak password, bad email and >100-char name', async ({ request }) => {
    expect((await request.post('/api/auth/register', { headers: rip(), data: { email: `${uniq('w')}@qa.test`, password: '123', name: 'x' } })).status()).toBe(400)
    expect((await request.post('/api/auth/register', { headers: rip(), data: { email: 'not-an-email', password: 'Strong#12345', name: 'x' } })).status()).toBeGreaterThanOrEqual(400)
    expect((await request.post('/api/auth/register', { headers: rip(), data: { email: `${uniq('n')}@qa.test`, password: 'Strong#12345', name: 'N'.repeat(101) } })).status()).toBe(400)
  })

  test('tampered token is rejected on every protected surface', async ({ request }) => {
    const t = await idToken(request, USERS.admin.email, USERS.admin.password)
    const bad = t.slice(0, -4) + (t.endsWith('AAAA') ? 'BBBB' : 'AAAA')
    for (const p of ['/api/admin/users', '/api/reporter/news', '/api/news/my-articles', '/api/auth/me']) {
      expect([401, 403], p).toContain((await request.get(p, { headers: bearer(bad) })).status())
    }
  })

  test('UI: wrong password shows a readable error, no crash', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.goto('/reporter')
    await page.locator('input[type="email"]').fill(USERS.reporter.email)
    await page.locator('input[type="password"]').fill('definitely-wrong')
    await page.locator('form button[type="submit"]').click()
    await expect(page.locator('text=/invalid|incorrect|wrong|credential|failed/i').first()).toBeVisible()
    expect(errors).toEqual([])
  })
})

test.describe('reporter / admin lifecycle', () => {
  test('editing an approved article sends it back to review and hides it publicly', async ({ request }) => {
    const reporter = await idToken(request, USERS.reporter.email, USERS.reporter.password)
    const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
    const id = (await (await request.post('/api/reporter/news', { headers: bearer(reporter), data: { title: uniq('edit-cycle'), content: 'v1', categoryId: 'City News' } })).json()).id
    expect((await request.post('/api/admin/news/approve', { headers: bearer(admin), data: { articleId: id, action: 'approve' } })).ok()).toBeTruthy()
    expect((await request.put(`/api/reporter/news/${id}`, { headers: bearer(reporter), data: { title: 'edited', content: 'v2', categoryId: 'City News' } })).ok()).toBeTruthy()
    const pub = await (await request.get(`/api/news?limit=200&_t=${Date.now()}`)).json()
    expect(pub.articles.some(a => a.id === id), 'edited article must leave the public list until re-approved').toBe(false)
    await request.delete(`/api/admin/news/${id}`, { headers: bearer(admin) })
  })

  test('admin reject keeps the article out of public and records the reason', async ({ request }) => {
    const reporter = await idToken(request, USERS.reporter.email, USERS.reporter.password)
    const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
    const id = (await (await request.post('/api/reporter/news', { headers: bearer(reporter), data: { title: uniq('reject-me'), content: 'x', categoryId: 'City News' } })).json()).id
    const rej = await request.post('/api/admin/news/approve', { headers: bearer(admin), data: { articleId: id, action: 'reject', reason: 'QA reason' } })
    expect(rej.ok(), await rej.text()).toBeTruthy()
    const mine = await (await request.get(`/api/reporter/news?_t=${Date.now()}`, { headers: bearer(reporter) })).json()
    const a = (mine.news || mine.articles || mine).find(x => x.id === id)
    expect(a?.approvalStatus).toBe('rejected')
    expect(JSON.stringify(a)).toContain('QA reason')
    await request.delete(`/api/admin/news/${id}`, { headers: bearer(admin) })
  })

  test('BUG-022: create-reporter refuses an admin email (no demotion / password takeover)', async ({ request }) => {
    const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
    const r = await request.post('/api/admin/users/create-reporter', { headers: bearer(admin), data: { name: 'Dup', email: USERS.admin.email, password: 'Another#12345' } })
    expect(r.status()).toBe(409)
    await expect(idToken(request, USERS.admin.email, USERS.admin.password)).resolves.toBeTruthy()
  })
})

test.describe('network & navigation resilience (UI)', () => {
  test('classified submit with the network down shows an error and keeps the form', async ({ page }) => {
    const dialogs = []; page.on('dialog', d => { dialogs.push(d.message()); d.dismiss() })
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.route('**/api/classifieds/submit', r => r.abort('internetdisconnected'))
    await page.goto('/')
    const dlg = page.getByRole('dialog')
    await expect.poll(async () => { await page.evaluate(() => window.dispatchEvent(new CustomEvent('openPostAdModal', { detail: { tab: 'classified' } }))); return dlg.isVisible() }, { timeout: 20_000 }).toBe(true)
    await dlg.locator('input').first().fill('Network test ad')
    for (const ph of ['price', 'phone', 'location']) {
      const el = dlg.locator(`input[placeholder*="${ph}" i], input[id*="${ph}" i]`).first()
      if (await el.count()) await el.fill(ph === 'phone' ? '9000000000' : ph === 'price' ? '100' : 'Pune')
    }
    await dlg.getByRole('button', { name: 'Submit Ad' }).click()
    await expect.poll(() => dialogs.length, { timeout: 10_000 }).toBeGreaterThan(0)
    expect(dialogs.join(' ')).toMatch(/wrong|try again|failed|error/i)
    await expect(dlg).toBeVisible()
    expect(errors).toEqual([])
  })

  test('slow API: news list shows content after a 4 s delay, no crash', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.route('**/api/news?**', async r => { await new Promise(res => setTimeout(res, 4000)); await r.continue() })
    await page.goto('/?view=news')
    await expect(page.getByText('Seeded approved article').first()).toBeVisible({ timeout: 20_000 })
    expect(errors.filter(e => !/auth\/network-request-failed/.test(e))).toEqual([])
  })

  for (const q of ['?view=../../etc/passwd', '?article=%00', '?article=' + 'x'.repeat(3000), '?view=admin-dashboard', '?view=reporter-dashboard']) {
    test(`weird deep link ${q.slice(0, 40)} renders safely`, async ({ page }) => {
      const errors = []; page.on('pageerror', e => errors.push(e.message))
      await page.goto('/' + q)
      await page.waitForTimeout(2500)
      expect((await page.locator('body').innerText()).length).toBeGreaterThan(50)
      // dashboards must never render for an anonymous visitor
      await expect(page.getByText('Pending Approvals')).toHaveCount(0)
      expect(errors.filter(e => !/auth\/network-request-failed/.test(e))).toEqual([])
    })
  }

  test('missing classified id in detail view does not crash', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.goto('/?view=classified-detail')
    await page.waitForTimeout(2000)
    expect(errors.filter(e => !/auth\/network-request-failed/.test(e))).toEqual([])
  })
})
