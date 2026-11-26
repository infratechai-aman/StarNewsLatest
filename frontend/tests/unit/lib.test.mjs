import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractYouTubeId, youtubeIdFromThumbnail } from '../../lib/youtube.js'
import { getCache, setCache, purgeCache, invalidateCache } from '../../lib/cache.js'
import { rateLimit } from '../../lib/rateLimit.js'
import { getProxiedImageUrl } from '../../lib/imageProxy.js'
import { ROLES } from '../../lib/roles.js'
import { chunkText, isLocalizedComplete, normalizeLocalized } from '../../lib/translation.js'

// ---------- YouTube ----------
test('extractYouTubeId handles all common URL shapes', () => {
  const id = 'dQw4w9WgXcQ'
  for (const u of [
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}?si=abc`,
    `https://youtube.com/shorts/${id}?si=x`,
    `https://www.youtube.com/watch?feature=share&v=${id}`,
  ]) assert.equal(extractYouTubeId(u), id, u)
})

test('extractYouTubeId rejects junk', () => {
  for (const u of [null, '', 'https://vimeo.com/123', 'https://youtube.com/@channel', 'not a url']) {
    assert.equal(extractYouTubeId(u), null, String(u))
  }
})

test('youtubeIdFromThumbnail reads both thumbnail hosts', () => {
  assert.equal(youtubeIdFromThumbnail('https://img.youtube.com/vi/GFjuqQmfVIU/hqdefault.jpg'), 'GFjuqQmfVIU')
  assert.equal(youtubeIdFromThumbnail('https://i.ytimg.com/vi/GFjuqQmfVIU/mqdefault.jpg'), 'GFjuqQmfVIU')
  assert.equal(youtubeIdFromThumbnail('https://cdn.example.com/x.jpg'), null)
})

// ---------- server cache ----------
test('cache returns value within TTL and expires after it', async () => {
  setCache('t_key', { a: 1 }, 30)
  assert.deepEqual(getCache('t_key'), { a: 1 })
  await new Promise(r => setTimeout(r, 50))
  assert.equal(getCache('t_key') ?? null, null)
})

test('purgeCache removes keys by substring; invalidateCache by exact key', () => {
  setCache('news_all_1', 1, 10_000); setCache('news_all_2', 2, 10_000); setCache('other', 3, 10_000)
  purgeCache('news_')
  assert.equal(getCache('news_all_1') ?? null, null)
  assert.equal(getCache('news_all_2') ?? null, null)
  assert.equal(getCache('other'), 3)
  invalidateCache('other')
  assert.equal(getCache('other') ?? null, null)
})

// ---------- rate limiter ----------
test('rateLimit allows max requests per window then blocks, per key', () => {
  const rl = rateLimit({ windowMs: 60_000, max: 3 })
  assert.equal(rl.check('ip1').success, true)
  assert.equal(rl.check('ip1').success, true)
  assert.equal(rl.check('ip1').success, true)
  assert.deepEqual(rl.check('ip1'), { success: false, remaining: 0 })
  assert.equal(rl.check('ip2').success, true, 'other keys are independent')
})

test('rateLimit window resets', async () => {
  const rl = rateLimit({ windowMs: 30, max: 1 })
  assert.equal(rl.check('k').success, true)
  assert.equal(rl.check('k').success, false)
  await new Promise(r => setTimeout(r, 45))
  assert.equal(rl.check('k').success, true)
})

// ---------- image proxy URL builder ----------
test('getProxiedImageUrl leaves local/data URLs alone', () => {
  for (const u of ['/api/file/abc', '/placeholder-news.svg', 'data:image/png;base64,xx', 'blob:http://x/y', '']) {
    assert.equal(getProxiedImageUrl(u), u)
  }
})

test('getProxiedImageUrl never double-proxies', () => {
  const once = getProxiedImageUrl('https://example.org/a.jpg')
  assert.equal(getProxiedImageUrl(once), once)
})

// ---------- roles ----------
test('role names are stable (server checks compare these strings)', () => {
  assert.equal(ROLES.SUPER_ADMIN, 'super_admin')
  assert.equal(ROLES.REPORTER, 'reporter')
})

// ---------- translation chunking & normalization ----------
test('chunkText keeps Devanagari Hindi/Marathi chunks under safe URI size', () => {
  const marathi = 'पुण्यातील कोंढवा परिसरात अनधिकृत बांधकामांवर महापालिकेची मोठी कारवाई करण्यात आली आहे.\n\n'.repeat(40)
  const chunks = chunkText(marathi, 900)
  assert.ok(chunks.length > 5)
  for (const c of chunks) {
    assert.ok(encodeURIComponent(c).length <= 900, `encoded length too large: ${encodeURIComponent(c).length}`)
  }
})

test('isLocalizedComplete rejects identical fallback objects and accepts translated ones', () => {
  assert.equal(isLocalizedComplete('plain text'), false)
  assert.equal(isLocalizedComplete({ en: 'Same text for every field', hi: 'Same text for every field', mr: 'Same text for every field' }), false)
  assert.equal(isLocalizedComplete({ en: 'Hello news headline', hi: 'नमस्ते समाचार शीर्षक', mr: 'नमस्कार बातम्यांचे शीर्षक' }), true)
  assert.deepEqual(normalizeLocalized('खबर'), { en: '', hi: 'खबर', mr: '' })
})
