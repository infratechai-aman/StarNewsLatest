import { siteOrigin } from '@/lib/siteOrigin'
import { withDeadline } from '@/lib/deadline'

export const revalidate = 900

const toDate = (v) => (v?.toDate ? v.toDate() : v?._seconds ? new Date(v._seconds * 1000) : v ? new Date(v) : new Date())

export default async function sitemap() {
  const base = siteOrigin()
  const pages = ['', '/?view=news', '/?view=enewspaper', '/?view=live-tv', '/?view=businesses', '/?view=classifieds', '/?view=about']
    .map((p) => ({ url: `${base}${p || '/'}`, changeFrequency: 'hourly', priority: p ? 0.6 : 1 }))
  try {
    const { getDb } = await import('@/lib/firebaseAdmin')
    const db = getDb()
    if (!db) return pages
    const snap = await withDeadline(
      db.collection('news_articles').where('approvalStatus', '==', 'approved').where('active', '==', true).limit(1000).get(),
      8000,
    )
    const articles = snap.docs.map((d) => {
      const a = d.data()
      return { url: `${base}/news/${d.id}`, lastModified: toDate(a.updatedAt || a.publishedAt || a.createdAt), changeFrequency: 'daily', priority: 0.8 }
    })
    return [...pages, ...articles]
  } catch {
    return pages
  }
}
