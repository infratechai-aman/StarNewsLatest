import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { translations, getTranslation } from '../../lib/translations.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return ['api', 'node_modules', 'ui'].includes(e.name) ? [] : sourceFiles(p)
    return /\.(js|jsx)$/.test(e.name) ? [p] : []
  })
}

test('getTranslation falls back to English, then to the key', () => {
  const someKey = Object.keys(translations.en)[0]
  assert.equal(getTranslation('xx', someKey), translations.en[someKey])
  assert.equal(getTranslation('en', '__definitely_missing__'), '__definitely_missing__')
})

// Regression guard: a missing key renders the raw key on the page (seen: "relatedStories"),
// and `t(key) || 'Fallback'` never falls back because the key string is truthy.
test("every t('key') used in components/app exists in English translations", () => {
  const used = new Set()
  for (const f of [...sourceFiles(path.join(root, 'components')), ...sourceFiles(path.join(root, 'app'))]) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bt\('([a-zA-Z0-9_]+)'\)/g)) used.add(m[1])
  }
  const missing = [...used].filter(k => !(k in translations.en))
  assert.deepEqual(missing, [], `missing English keys: ${missing.join(', ')}`)
})

test('Hindi and Marathi cover every English key (report)', () => {
  const en = Object.keys(translations.en)
  const gaps = Object.fromEntries(['hi', 'mr'].map(l => [l, en.filter(k => !(k in translations[l]))]))
  // Missing hi/mr keys fall back to English, so this is reported, not fatal.
  console.log(`  hi missing ${gaps.hi.length}, mr missing ${gaps.mr.length} of ${en.length} keys`)
  assert.ok(gaps.hi.length < en.length && gaps.mr.length < en.length)
})
