import { siteOrigin } from '@/lib/siteOrigin'

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/reporter', '/login'] }],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  }
}
