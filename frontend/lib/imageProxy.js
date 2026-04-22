/**
 * Wraps external image URLs through our server-side proxy to bypass 403/hotlink blocks.
 * Local images (starting with / but not /wp-content) are returned as-is.
 */
export function proxyImageUrl(url) {
  if (!url || typeof url !== 'string') return '/placeholder-news.svg'

  // Already proxied or local asset
  if (url.startsWith('/api/image-proxy')) return url
  if (url.startsWith('/placeholder') || url.startsWith('/starnews') || url.startsWith('/images/')) return url
  if (url.startsWith('data:')) return url

  // External URLs or WordPress paths that need proxying
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/wp-content/')) {
    const fullUrl = url.startsWith('/') ? `https://www.starnewsindia.in${url}` : url
    return `/api/image-proxy?url=${encodeURIComponent(fullUrl)}`
  }

  // Firestore file references like /api/file/xxx
  if (url.startsWith('/api/file/')) {
    return url // These are served by our own API
  }

  return url
}
