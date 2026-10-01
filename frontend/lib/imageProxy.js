/**
 * Get a proxy-safe image source URL.
 * 
 * When displaying images from external URLs in <img> tags,
 * the browser may be blocked by CORS or hotlink protection.
 * This utility routes external URLs through our /api/image-proxy
 * to ensure they always load.
 * 
 * Internal URLs (data:, blob:, /api/file/) are returned as-is.
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

  // External http(s) URLs → route through proxy
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`
  }

  return src
}

export const proxyImageUrl = getProxiedImageUrl
export default getProxiedImageUrl
