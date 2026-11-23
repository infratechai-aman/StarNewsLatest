// Pure helpers for article text (no React, no DOM) so they can be unit-tested.

/**
 * Articles arrive as a mix of HTML, plain text and markdown pasted from other tools
 * (e.g. "### heading", "**bold**", and broken fragments like `text-align: center;">`).
 * Normalise to clean HTML before sanitising so readers never see raw syntax.
 */
export const escapeHtml = (s) => s.replace(/&(?!(?:[a-z]+|#\d+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export function formatArticleHtml(raw) {
  let s = String(raw)
  // Broken attribute leftovers in the TEXT (never inside a real tag):
  // `text-align: center;">` and stray `/>`
  const insideTag = (str, offset) => str.lastIndexOf('<', offset) > str.lastIndexOf('>', offset - 1)
  s = s.replace(/[a-z-]+\s*:\s*[a-z0-9#%.,\s-]+;?\s*"\s*\/?>/gi, (m, offset, str) => insideTag(str, offset) ? m : '')
  s = s.replace(/\/>/g, (m, offset, str) => insideTag(str, offset) ? m : '')
  const hasBlockHtml = /<(p|div|h[1-6]|ul|ol|li|blockquote|table|figure|br)\b/i.test(s)
  const inline = (t) => t
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)#{2,6}\s*/g, '$1') // stray inline ### markers
    .replace(/\*\*/g, '')
  if (hasBlockHtml) {
    // HTML article: only fix markdown that leaked into the text
    return s
      .replace(/<p[^>]*>\s*#{1,6}\s+([^<]+)<\/p>/gi, '<h3>$1</h3>')
      .replace(/(^|>)\s*#{1,6}\s+([^<\n]+)/g, '$1<h3>$2</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*\*/g, '')
  }
  // Plain text / markdown article: build paragraphs and headings
  const blocks = s.split(/\n{2,}|\r\n\r\n|(?=\n#{1,6}\s)/).map(b => b.trim()).filter(Boolean)
  return blocks.map((b) => {
    const h = b.match(/^(#{1,6})\s+([^\n]+)\n?([\s\S]*)$/)
    if (h) {
      const tag = h[1].length <= 2 ? 'h2' : 'h3'
      const rest = h[3].trim()
      return `<${tag}>${inline(escapeHtml(h[2].trim()))}</${tag}>` +
        (rest ? `<p>${inline(escapeHtml(rest)).replace(/\n/g, '<br/>')}</p>` : '')
    }
    return `<p>${inline(escapeHtml(b)).replace(/\n/g, '<br/>')}</p>`
  }).join('')
}

/** Plain-text version for summaries/excerpts (no markdown symbols). */
export function stripMarkdown(text) {
  if (!text) return ''
  return String(text)
    .replace(/[a-z-]+\s*:\s*[a-z0-9#%.,\s-]+;?\s*"\s*\/?>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
