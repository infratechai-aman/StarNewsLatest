import { NextResponse } from 'next/server'
import { withDeadline } from '@/lib/deadline'

// Latest news videos for the Live TV page, from YouTube's free public RSS feeds
// (no API key, no quota). Each feed lists a channel's 15 newest uploads.
export const revalidate = 900

const CHANNELS = [
  { id: 'UCTCbGpQdeg4aNJN8M93WJHA', name: 'Star News India', lang: 'mr' },
  { id: 'UCH7nv1A9xIrAifZJNvt7cgA', name: 'ABP Majha', lang: 'mr' },
  { id: 'UCVbsFo8aCgvIRIO9RYwsQMA', name: 'Zee 24 Taas', lang: 'mr' },
  { id: 'UCdOSeEq9Cs2Pco7OCn2_i5w', name: 'TV9 Marathi', lang: 'mr' },
  { id: 'UC4odpbJt7pLmeqVz-iDaN7A', name: 'Saam TV', lang: 'mr' },
  { id: 'UC5MHSwQ2menwYF2DqKoJsZg', name: 'Lokmat', lang: 'mr' },
  { id: 'UCt4t-jeY85JegMlZ-E5UWtA', name: 'Aaj Tak', lang: 'hi' },
  { id: 'UC9CYT9gSNLevX5ey2_6CK0Q', name: 'NDTV India', lang: 'hi' },
]

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

async function readFeed(ch) {
  const res = await withDeadline(fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`, { next: { revalidate: 900 } }), 6000)
  if (!res.ok) throw new Error(`feed ${res.status}`)
  const xml = await res.text()
  return xml.split('<entry>').slice(1).map((e) => {
    const videoId = e.match(/<yt:videoId>([^<]+)/)?.[1]
    const title = e.match(/<title>([^<]+)/)?.[1]
    const published = e.match(/<published>([^<]+)/)?.[1]
    const isShort = /\/shorts\//.test(e.match(/<link rel="alternate" href="([^"]+)/)?.[1] || '')
    return videoId && title ? { videoId, title: decode(title), published, channel: ch.name, lang: ch.lang, isShort } : null
  }).filter(Boolean)
}

// One retry: a single slow feed shouldn't drop a whole channel for 15 minutes.
const readFeedWithRetry = (ch) => readFeed(ch).catch(() => readFeed(ch))

export async function GET() {
  const results = await Promise.allSettled(CHANNELS.map(readFeedWithRetry))
  const videos = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .slice(0, 80)
  return NextResponse.json(
    { videos, channels: CHANNELS.map((c) => c.name), updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } },
  )
}
