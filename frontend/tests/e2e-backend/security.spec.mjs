import { test, expect } from '@playwright/test'
import { idToken, bearer, uniq, USERS, rip } from './helpers.mjs'

test.describe('authorization boundaries (emulator)', () => {
  test('SEC-001: registering an allow-listed admin email does NOT grant admin', async ({ request }) => {
    // Pick an allow-listed address; if a previous run already registered it, just sign in.
    const email = 'riyaz@starnews.com'
    const password = 'Attacker#12345'
    await request.post('/api/auth/register', { headers: rip(), data: { email, password, name: 'Mallory' } })
    const t = await idToken(request, email, password)
    for (const p of ['/api/admin/users', '/api/admin/stats', '/api/admin/debug', '/api/admin/pending']) {
      expect((await request.get(p, { headers: bearer(t) })).status(), p).toBe(403)
    }
  })

  test('SEC-002: self-registration cannot create a reporter', async ({ request }) => {
    const email = `${uniq('eve')}@qa.test`
    const reg = await request.post('/api/auth/register', { headers: rip(), data: { email, password: 'Attacker#12345', name: 'Eve', role: 'reporter' } })
    expect(reg.ok()).toBeTruthy()
    expect((await reg.json()).user.role).toBe('registered')
    const t = await idToken(request, email, 'Attacker#12345')
    const post = await request.post('/api/reporter/news', { headers: bearer(t), data: { title: 'x', content: 'x', categoryId: 'City News' } })
    expect(post.status()).toBe(403)
  })

  test('role matrix: reader / reporter / admin', async ({ request }) => {
    const reader = await idToken(request, USERS.reader.email, USERS.reader.password)
    const reporter = await idToken(request, USERS.reporter.email, USERS.reporter.password)
    const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
    expect((await request.get('/api/reporter/news', { headers: bearer(reader) })).status()).toBe(403)
    expect((await request.get('/api/admin/users', { headers: bearer(reader) })).status()).toBe(403)
    expect((await request.get('/api/reporter/news', { headers: bearer(reporter) })).status()).toBe(200)
    expect((await request.get('/api/admin/users', { headers: bearer(reporter) })).status()).toBe(403)
    expect((await request.get('/api/admin/users', { headers: bearer(admin) })).status()).toBe(200)
  })

  test('a reporter cannot use the admin Shorts / E-Paper endpoints (publish without approval)', async ({ request }) => {
    const reporter = await idToken(request, USERS.reporter.email, USERS.reporter.password)
    const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
    const shortBody = { title: uniq('short'), mediaUrl: 'https://www.youtube.com/shorts/abc123def45', mediaType: 'youtube' }
    expect((await request.post('/api/admin/shorts', { headers: bearer(reporter), data: shortBody })).status()).toBe(403)
    expect((await request.get('/api/admin/shorts', { headers: bearer(reporter) })).status()).toBe(403)
    expect((await request.put('/api/admin/shorts/any-id', { headers: bearer(reporter), data: shortBody })).status()).toBe(403)
    expect((await request.delete('/api/admin/shorts/any-id', { headers: bearer(reporter) })).status()).toBe(403)
    expect((await request.post('/api/admin/shorts/any-id/toggle', { headers: bearer(reporter) })).status()).toBe(403)
    expect((await request.post('/api/admin/enewspaper', { headers: bearer(reporter), data: { title: uniq('ep'), pdfUrl: 'https://example.com/a.pdf' } })).status()).toBe(403)
    expect((await request.get('/api/admin/enewspaper', { headers: bearer(reporter) })).status()).toBe(403)
    // Admin keeps access
    expect((await request.get('/api/admin/shorts', { headers: bearer(admin) })).status()).toBe(200)
    expect((await request.get('/api/admin/enewspaper', { headers: bearer(admin) })).status()).toBe(200)
  })

  test('a reporter cannot delete an admin-uploaded e-paper (no author field)', async ({ request }) => {
    const reporter = await idToken(request, USERS.reporter.email, USERS.reporter.password)
    expect((await request.delete('/api/reporter/enewspaper/seed-paper-2', { headers: bearer(reporter) })).status()).toBe(403)
  })

  test('no token / garbage token is rejected', async ({ request }) => {
    expect((await request.get('/api/admin/users')).status()).toBe(401)
    expect([401, 403]).toContain((await request.get('/api/admin/users', { headers: bearer('not-a-jwt') })).status())
  })

  test('a reporter cannot edit or delete another user\'s article (IDOR)', async ({ request }) => {
    const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
    const created = await request.post('/api/reporter/news', { headers: bearer(admin), data: { title: uniq('admin-owned'), content: 'body', categoryId: 'City News' } })
    expect(created.ok()).toBeTruthy()
    const id = (await created.json()).id
    const reporter = await idToken(request, USERS.reporter.email, USERS.reporter.password)
    expect((await request.put(`/api/reporter/news/${id}`, { headers: bearer(reporter), data: { title: 'hijacked', content: 'x' } })).status()).toBe(403)
    expect((await request.delete(`/api/reporter/news/${id}`, { headers: bearer(reporter) })).status()).toBe(403)
  })

  test('BUG-003: admin delete removes the Firebase Auth login too', async ({ request }) => {
    const email = `${uniq('tobedeleted')}@qa.test`
    const reg = await request.post('/api/auth/register', { headers: rip(), data: { email, password: 'Delete#12345', name: 'Temp' } })
    const uid = (await reg.json()).user.id
    const admin = await idToken(request, USERS.admin.email, USERS.admin.password)
    expect((await request.delete(`/api/admin/users/${uid}`, { headers: bearer(admin) })).status()).toBe(200)
    await expect(idToken(request, email, 'Delete#12345')).rejects.toThrow(/sign-in failed/)
  })
})
