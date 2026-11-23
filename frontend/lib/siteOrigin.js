import { headers } from 'next/headers'

// The site's own origin from the incoming request, so links and sitemaps are
// right on any domain or preview deploy.
export function siteOrigin() {
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
