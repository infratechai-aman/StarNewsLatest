const DIRECT_DOMAINS = [
  'blogger.googleusercontent.com',
  'bp.blogspot.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'googleusercontent.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'images.unsplash.com',
  'picsum.photos',
  'fastly.picsum.photos',
  'i.ytimg.com',
  'img.youtube.com',
  'starnewsindia.in',
  'www.starnewsindia.in',
  'localhost',
  '127.0.0.1'
];

/**
 * Get a proxy-safe image source URL.
 * 
 * Direct CDN and trusted domains load directly via browser HTTP/2 with 0 latency.
 * Only unknown external URLs that might block hotlinking are routed through /api/image-proxy.
 */
export function getProxiedImageUrl(src) {
  if (!src) return ''

  // Data URLs, blob URLs, and internal API URLs don't need proxying
  if (
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.startsWith('/api/') ||
    src.startsWith('/placeholder') ||
    src.startsWith('/')
  ) {
    return src
  }

  // If already proxied, do not double proxy
  if (src.includes('/api/image-proxy?url=')) {
    return src
  }

  try {
    const parsed = new URL(src)
    const hostname = parsed.hostname.toLowerCase()

    // Bypass proxy completely for trusted CDNs so browser loads them in parallel from Google/Cloudflare edge
    if (DIRECT_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
      return src
    }
  } catch {
    // If not a valid URL (relative or malformed), return as-is
    return src
  }

  // External http(s) URLs from unknown/untrusted sources → route through proxy to bypass hotlink blocking
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`
  }

  return src
}

export const proxyImageUrl = getProxiedImageUrl
export default getProxiedImageUrl

