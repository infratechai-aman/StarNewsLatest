// Server-side checks that run BEFORE any database access, so they are safe on the isolated server.
import { test, expect } from '@playwright/test'

test.describe('API input validation (no database involved)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'server checks run once')

  test('finance rejects path-injection symbols', async ({ request }) => {
    const r = await request.get('/api/finance?symbol=..%2Fx')
    expect(r.status()).toBe(400)
  })

  test('image proxy blocks internal / metadata hosts (SSRF)', async ({ request }) => {
    for (const target of ['http://169.254.169.254/latest/meta-data/', 'http://127.0.0.1:22/', 'file:///etc/passwd']) {
      const r = await request.get(`/api/image-proxy?url=${encodeURIComponent(target)}`, { maxRedirects: 0 })
      expect([400, 403], target).toContain(r.status())
    }
  })

  test('admin endpoints require authentication', async ({ request }) => {
    for (const p of ['/api/admin/stats', '/api/admin/users', '/api/admin/debug', '/api/admin/pending', '/api/news/my-articles']) {
      const r = await request.get(p)
      expect([401, 403, 503], p).toContain(r.status())
    }
  })

  test('upload rejects non-image files by magic bytes', async ({ request }) => {
    const r = await request.post('/api/upload', {
      multipart: { file: { name: 'evil.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('<?php echo 1; ?>') } },
    })
    expect([400, 415, 503]).toContain(r.status())
  })
})
