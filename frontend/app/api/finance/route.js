import { NextResponse } from 'next/server'
import { getCache, setCache } from '@/lib/cache'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // opt(PERF-01): Cache stock data server-side for 60 seconds.
    // Client polls every 60s, so without cache each tab generates 2 Vercel
    // invocations/min/user. Stock prices from Yahoo Finance are already
    // delayed by 15-60s from exchanges — a 60s cache has zero information loss.
    const cacheKey = `finance_${symbol}`
    const cached = getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
      })
    }

    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    const data = await response.json()

    // Cache for 60 seconds
    setCache(cacheKey, data, 60 * 1000)

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
