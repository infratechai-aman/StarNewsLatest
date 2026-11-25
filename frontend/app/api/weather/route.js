import { NextResponse } from 'next/server'
import { getCache, setCache } from '@/lib/cache'

const CITIES = {
  pune: { key: 'pune', name: 'Pune, MH', lat: 18.5204, lon: 73.8567, fallbackTemp: 28, fallbackHigh: 32, fallbackLow: 22, fallbackWind: 12, fallbackHumidity: 54, fallbackAqi: 45 },
  mumbai: { key: 'mumbai', name: 'Mumbai, MH', lat: 19.076, lon: 72.8777, fallbackTemp: 30, fallbackHigh: 33, fallbackLow: 25, fallbackWind: 16, fallbackHumidity: 68, fallbackAqi: 62 },
  delhi: { key: 'delhi', name: 'Delhi, DL', lat: 28.6139, lon: 77.209, fallbackTemp: 24, fallbackHigh: 28, fallbackLow: 15, fallbackWind: 9, fallbackHumidity: 48, fallbackAqi: 135 },
}

function mapWeatherCode(code) {
  if (code === 0) return 'clear'
  if (code === 1 || code === 2) return 'partlyCloudy'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'foggy'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy'
  if (code >= 95) return 'stormy'
  return 'partlyCloudy'
}

function buildFallbackPayload(cityCfg) {
  const today = new Date()
  const forecast = [1, 2, 3].map((offset) => {
    const d = new Date(today)
    d.setDate(today.getDate() + offset)
    return {
      date: d.toISOString().slice(0, 10),
      tempMax: cityCfg.fallbackHigh - (offset % 2 === 1 ? 3 : 2),
      conditionKey: offset === 2 ? 'cloudy' : 'partlyCloudy',
    }
  })

  return {
    city: cityCfg.key,
    temp: cityCfg.fallbackTemp,
    high: cityCfg.fallbackHigh,
    low: cityCfg.fallbackLow,
    wind: cityCfg.fallbackWind,
    humidity: cityCfg.fallbackHumidity,
    aqi: cityCfg.fallbackAqi,
    conditionKey: 'partlyCloudy',
    forecast,
    fallback: true,
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const rawCity = (searchParams.get('city') || 'pune').toLowerCase().trim()
  const cityCfg = CITIES[rawCity] || CITIES.pune

  const cacheKey = `weather_${cityCfg.key}`
  const cached = getCache(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300' },
    })
  }

  try {
    const timeoutOpt =
      typeof AbortSignal !== 'undefined' && AbortSignal.timeout
        ? { signal: AbortSignal.timeout(5000) }
        : {}

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${cityCfg.lat}&longitude=${cityCfg.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata&forecast_days=4`
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${cityCfg.lat}&longitude=${cityCfg.lon}&current=us_aqi&timezone=Asia%2FKolkata`

    const [forecastRes, aqiRes] = await Promise.allSettled([
      fetch(forecastUrl, timeoutOpt),
      fetch(aqiUrl, timeoutOpt),
    ])

    let forecastJson = null
    if (forecastRes.status === 'fulfilled' && forecastRes.value.ok) {
      forecastJson = await forecastRes.value.json()
    }

    let aqiJson = null
    if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
      aqiJson = await aqiRes.value.json()
    }

    if (!forecastJson?.current || !forecastJson?.daily) {
      const fallback = buildFallbackPayload(cityCfg)
      setCache(cacheKey, fallback, 60 * 1000)
      return NextResponse.json(fallback)
    }

    const dailyTimes = forecastJson.daily.time || []
    const dailyMax = forecastJson.daily.temperature_2m_max || []
    const dailyMin = forecastJson.daily.temperature_2m_min || []
    const dailyCodes = forecastJson.daily.weather_code || []

    const forecast = [1, 2, 3]
      .filter((i) => dailyTimes[i] !== undefined)
      .map((i) => ({
        date: dailyTimes[i],
        tempMax: Math.round(dailyMax[i] ?? cityCfg.fallbackHigh),
        conditionKey: mapWeatherCode(dailyCodes[i]),
      }))

    const payload = {
      city: cityCfg.key,
      temp: Math.round(forecastJson.current.temperature_2m ?? cityCfg.fallbackTemp),
      high: Math.round(dailyMax[0] ?? cityCfg.fallbackHigh),
      low: Math.round(dailyMin[0] ?? cityCfg.fallbackLow),
      wind: Math.round(forecastJson.current.wind_speed_10m ?? cityCfg.fallbackWind),
      humidity: Math.round(forecastJson.current.relative_humidity_2m ?? cityCfg.fallbackHumidity),
      aqi: Math.round(aqiJson?.current?.us_aqi ?? cityCfg.fallbackAqi),
      conditionKey: mapWeatherCode(forecastJson.current.weather_code),
      forecast: forecast.length === 3 ? forecast : buildFallbackPayload(cityCfg).forecast,
      fallback: false,
    }

    // Cache live weather for 15 minutes
    setCache(cacheKey, payload, 15 * 60 * 1000)

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300' },
    })
  } catch {
    const fallback = buildFallbackPayload(cityCfg)
    setCache(cacheKey, fallback, 60 * 1000)
    return NextResponse.json(fallback)
  }
}
