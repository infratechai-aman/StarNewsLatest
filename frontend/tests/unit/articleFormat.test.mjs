import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatArticleHtml, stripMarkdown, escapeHtml } from '../../lib/articleFormat.js'

test('markdown heading + bold become HTML', () => {
  const out = formatArticleHtml('### Big news\nSome **bold** text')
  assert.equal(out, '<h3>Big news</h3><p>Some <strong>bold</strong> text</p>')
})

test('plain text paragraphs are split on blank lines', () => {
  assert.equal(formatArticleHtml('One.\n\nTwo.'), '<p>One.</p><p>Two.</p>')
})

test('script tags in plain-text articles are escaped, not executed', () => {
  const out = formatArticleHtml('Hello <script>alert(1)</script>')
  assert.ok(!out.includes('<script>'), out)
  assert.ok(out.includes('&lt;script&gt;'), out)
})

test('img onerror payload in plain text stays inert', () => {
  const out = formatArticleHtml('x <img src=x onerror=alert(1)> y')
  assert.ok(!/<img/i.test(out), out)
})

test('broken attribute fragments in text are removed', () => {
  const out = formatArticleHtml('Intro text-align: center;"> Tipu />The citizens')
  assert.ok(!out.includes('text-align'), out)
  assert.ok(!out.includes('/>'), out)
})

test('real HTML tags with inline styles are preserved', () => {
  const html = '<p style="color: red; text-align: center;">Hi</p><img src="a.jpg" /><br/>'
  assert.equal(formatArticleHtml(html), html)
})

test('### inside an HTML paragraph becomes a heading, not nested in <p>', () => {
  assert.equal(formatArticleHtml('<p>### Title</p><p>x</p>'), '<h3>Title</h3><p>x</p>')
})

test('stripMarkdown gives clean plain text for summaries', () => {
  assert.equal(stripMarkdown('### **Hello** <b>world</b>'), 'Hello world')
  assert.equal(stripMarkdown(''), '')
  assert.equal(stripMarkdown(null), '')
})

test('escapeHtml keeps existing entities', () => {
  assert.equal(escapeHtml('a & b &amp; <c>'), 'a &amp; b &amp; &lt;c&gt;')
})

test('emoji, Devanagari and very long input survive', () => {
  const long = 'अ'.repeat(20000) + ' 🚀'
  const out = formatArticleHtml(long)
  assert.ok(out.startsWith('<p>अ') && out.endsWith('🚀</p>'))
})
