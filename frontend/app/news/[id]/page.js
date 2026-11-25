// Shareable article URL: /news/<id>
// WhatsApp, Facebook, X and Google read the Open Graph tags from this server
// response (they don't run JavaScript), so shared links show the headline and
// photo. The page itself is the full article, rendered on the server.
import { cache } from 'react'
import { siteOrigin } from '@/lib/siteOrigin'
import { redirect } from 'next/navigation'
import ClientApp from '@/components/ClientApp'
import { withDeadline } from '@/lib/deadline'

export const revalidate = 300

const text = (v) => {
  if (!v) return ''
  if (typeof v === 'string') return v
  return v.en || v.mr || v.hi || Object.values(v).find((x) => typeof x === 'string') || ''
}
const plain = (html, n = 180) => text(html).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n)
const absolute = (SITE, u) => (!u ? `${SITE}/starnews-favicon.png` : /^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`)

// cache(): metadata and page share one Firestore read per request.
const getArticle = cache(async (id) => {
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return null
  try {
    const { getDb } = await import('@/lib/firebaseAdmin')
    const db = getDb()
    if (!db) return null
    const doc = await withDeadline(db.collection('news_articles').doc(id).get(), 4000)
    if (!doc.exists) return null
    const a = doc.data()
    if (a.approvalStatus !== 'approved' || a.active === false) return null
    return a
  } catch {
    return null
  }
})

export async function generateMetadata({ params }) {
  const a = await getArticle(params.id)
  if (!a) return { title: 'Star News India', robots: { index: false } }
  const title = text(a.title) || 'Star News India'
  const description = text(a.excerpt) || text(a.summary) || plain(a.content)
  const SITE = siteOrigin()
  const image = absolute(SITE, a.mainImage || a.thumbnailUrl || a.images?.[0])
  const url = `${SITE}/news/${params.id}`
  return {
    title: `${title} | Star News India`,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, title, description, siteName: 'Star News India', images: [{ url: image }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

// Full server render of the article inside the normal site shell: crawlers and
// slow phones get the headline and text in the first response, readers keep
// the same app (navigation, header, footer) as everywhere else.
export default async function ArticlePage({ params }) {
  const a = await getArticle(params.id)
  if (!a) redirect('/')
  // Same JSON shape the client gets from /api/news/<id> (Timestamps → {_seconds,_nanoseconds}).
  const article = JSON.parse(JSON.stringify({ id: params.id, ...a }))
  return <ClientApp initialNewsData={null} initialArticle={article} />
}
