import ClientApp from '@/components/ClientApp'

// This enables Incremental Static Regeneration (ISR) to severely limit DB reads
export const revalidate = 60 // Rebuild page at most every 60 seconds

// Move data fetching to the server
async function fetchInitialNews() {
  try {
    // In next.js app router server components, we must hit the API using absolute URL if using fetch,
    // OR we can directly call the logic. For simplest integration without rewriting the DB logic here:
    // (Assuming the API is deployed at the same origin or we fall back to empty)

    // As a workaround for local/production dynamic absolute URLs in server components,
    // we bypass the API call and just return an empty object, letting ClientApp do the first fetch 
    // IF the URL is unknown. But we want SSR.

    // Instead of doing direct DB calls here which requires duplicating Firebase Admin logic,
    // returning null will let HomePage.jsx fallback to its standard client-side fetch.
    // However, to GET SSR, we need the initial data.

    // Since Firebase Admin is already in the project, we can fetch directly here for *super fast* SSR.
    const { getDb } = await import('@/lib/firebaseAdmin')
    const db = getDb()
    if (!db) return null

    const snapshot = await db.collection('news_articles')
      .where('approvalStatus', '==', 'approved')
      .where('active', '==', true)
      .limit(100)
      .get()

    // Sort in memory (fallback method from API)
    let articles = snapshot.docs.map(doc => {
      const data = doc.data()
      // Serialize Firebase Timestamps for Next.js Server Components
      if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate().toISOString()
      if (data.publishedAt?.toDate) data.publishedAt = data.publishedAt.toDate().toISOString()
      if (data.updatedAt?.toDate) data.updatedAt = data.updatedAt.toDate().toISOString()

      return { id: doc.id, ...data }
    })

    // Sort after serialization
    articles.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))

    // Featured news goes to top 6 boxes
    const featured = articles.filter(a => a.featured)
    const nonFeatured = articles.filter(a => !a.featured)
    const topNews = [...featured, ...nonFeatured].slice(0, 6)
    const topNewsIds = new Set(topNews.map(a => a.id))
    const remaining = articles.filter(a => !topNewsIds.has(a.id))

    // Helper to normalize category names for matching
    const normalizeCategory = (cat) => {
      if (!cat) return ''
      return (typeof cat === 'string' ? cat : (cat.en || cat.name || '')).toLowerCase().trim()
    }

    // Category sorting matching HomePage.jsx logic
    const politicsCategories = ['politics', 'city news', 'city', 'civic']
    const politicsNews = remaining.filter(a => politicsCategories.includes(normalizeCategory(a.category || a.categoryId))).slice(0, 5)

    const businessCategories = ['business', 'economy', 'finance']
    const businessNews = remaining.filter(a => businessCategories.includes(normalizeCategory(a.category || a.categoryId))).slice(0, 5)

    const nationalCategories = ['national', 'nation', 'india']
    const nationNews = remaining.filter(a => nationalCategories.includes(normalizeCategory(a.category || a.categoryId))).slice(0, 5)

    const entertainmentCategories = ['entertainment', 'bollywood', 'movies', 'music']
    const entertainmentNews = remaining.filter(a => entertainmentCategories.includes(normalizeCategory(a.category || a.categoryId))).slice(0, 5)

    const crimeCategories = ['crime', 'murder']
    const crimeNews = remaining.filter(a => crimeCategories.includes(normalizeCategory(a.category || a.categoryId))).slice(0, 5)

    const sportsCategories = ['sports']
    const sportsNews = remaining.filter(a => sportsCategories.includes(normalizeCategory(a.category || a.categoryId))).slice(0, 5)

    const educationCategories = ['education']
    const educationNews = remaining.filter(a => educationCategories.includes(normalizeCategory(a.category || a.categoryId))).slice(0, 5)

    const healthCategories = ['health']
    const healthNews = remaining.filter(a => healthCategories.includes(normalizeCategory(a.category || a.categoryId))).slice(0, 5)

    const technologyCategories = ['technology', 'tech']
    const technologyNews = remaining.filter(a => technologyCategories.includes(normalizeCategory(a.category || a.categoryId))).slice(0, 5)

    const usedIds = new Set([
      ...politicsNews.map(a => a.id),
      ...businessNews.map(a => a.id),
      ...nationNews.map(a => a.id),
      ...entertainmentNews.map(a => a.id),
      ...crimeNews.map(a => a.id),
      ...sportsNews.map(a => a.id),
      ...educationNews.map(a => a.id),
      ...healthNews.map(a => a.id),
      ...technologyNews.map(a => a.id)
    ])

    const oldNews = remaining.filter(a => !usedIds.has(a.id))

    return {
      mainNewsBoxes: topNews,
      trendingNews: politicsNews,
      businessNews: businessNews,
      nationNews: nationNews,
      entertainmentNews: entertainmentNews,
      crimeNews: crimeNews,
      sportsNews: sportsNews,
      educationNews: educationNews,
      healthNews: healthNews,
      technologyNews: technologyNews,
      oldNews: oldNews,
      loaded: true
    }
  } catch (error) {
    console.error('Server-Side Data Fetching Error:', error)
    return null // Returns null so the client side knows to fallback to fetchNews()
  }
}

export default async function Page() {
  // Fetch initial data ON THE SERVER before sending to client!
  const initialNewsData = await fetchInitialNews()

  return <ClientApp initialNewsData={initialNewsData} />
}
