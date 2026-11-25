'use client'

import { useState, useEffect } from 'react'
import { Sun, CloudSun, Cloud, CloudRain, CloudLightning } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const CITY_OPTIONS = [
  { key: 'pune', label: { en: 'Pune', hi: 'पुणे', mr: 'पुणे' }, title: { en: 'Pune, MH', hi: 'पुणे, महाराष्ट्र', mr: 'पुणे, महाराष्ट्र' } },
  { key: 'mumbai', label: { en: 'Mumbai', hi: 'मुंबई', mr: 'मुंबई' }, title: { en: 'Mumbai, MH', hi: 'मुंबई, महाराष्ट्र', mr: 'मुंबई, महाराष्ट्र' } },
  { key: 'delhi', label: { en: 'Delhi', hi: 'दिल्ली', mr: 'दिल्ली' }, title: { en: 'Delhi, DL', hi: 'दिल्ली, भारत', mr: 'दिल्ली, भारत' } },
]

const CONDITION_LABELS = {
  clear: { en: 'Clear Sky', hi: 'साफ आसमान', mr: 'निरभ्र आकाश' },
  partlyCloudy: { en: 'Partly Cloudy', hi: 'आंशिक रूप से बादल', mr: 'अंशतः ढगाळ' },
  cloudy: { en: 'Cloudy', hi: 'बादल छाए हुए', mr: 'ढगाळ' },
  foggy: { en: 'Mist & Fog', hi: 'कोहरा', mr: 'धुके' },
  rainy: { en: 'Rain Showers', hi: 'बारिश', mr: 'पाऊस' },
  stormy: { en: 'Thunderstorm', hi: 'आंधी-तूफान', mr: 'वादळी पाऊस' },
}

const DEFAULT_CITY_DATA = {
  pune: {
    temp: 28,
    high: 32,
    low: 22,
    wind: 12,
    humidity: 54,
    aqi: 45,
    conditionKey: 'partlyCloudy',
    forecast: [
      { dayOffset: 1, tempMax: 29, conditionKey: 'partlyCloudy' },
      { dayOffset: 2, tempMax: 27, conditionKey: 'cloudy' },
      { dayOffset: 3, tempMax: 30, conditionKey: 'partlyCloudy' },
    ],
  },
  mumbai: {
    temp: 30,
    high: 33,
    low: 25,
    wind: 16,
    humidity: 68,
    aqi: 62,
    conditionKey: 'partlyCloudy',
    forecast: [
      { dayOffset: 1, tempMax: 32, conditionKey: 'partlyCloudy' },
      { dayOffset: 2, tempMax: 31, conditionKey: 'cloudy' },
      { dayOffset: 3, tempMax: 33, conditionKey: 'clear' },
    ],
  },
  delhi: {
    temp: 24,
    high: 28,
    low: 15,
    wind: 9,
    humidity: 48,
    aqi: 135,
    conditionKey: 'foggy',
    forecast: [
      { dayOffset: 1, tempMax: 27, conditionKey: 'partlyCloudy' },
      { dayOffset: 2, tempMax: 26, conditionKey: 'cloudy' },
      { dayOffset: 3, tempMax: 28, conditionKey: 'clear' },
    ],
  },
}

const UI_TEXT = {
  liveWeather: { en: 'LIVE WEATHER', hi: 'लाइव मौसम', mr: 'लाइव्ह हवामान' },
  wind: { en: 'Wind', hi: 'हवा', mr: 'वारा' },
  humidity: { en: 'Humidity', hi: 'नमी', mr: 'आर्द्रता' },
  aqi: { en: 'AQI', hi: 'AQI', mr: 'AQI' },
  forecastTitle: { en: '3-DAY FORECAST', hi: '3-दिन का पूर्वानुमान', mr: '३ दिवसांचा अंदाज' },
  aqiGood: { en: 'Good', hi: 'अच्छा', mr: 'चांगला' },
  aqiMod: { en: 'Mod', hi: 'मध्यम', mr: 'मध्यम' },
  aqiPoor: { en: 'Poor', hi: 'खराब', mr: 'वाईट' },
}

function renderWeatherIcon(conditionKey, className) {
  switch (conditionKey) {
    case 'clear':
      return <Sun className={className} />
    case 'cloudy':
    case 'foggy':
      return <Cloud className={className} />
    case 'rainy':
      return <CloudRain className={className} />
    case 'stormy':
      return <CloudLightning className={className} />
    case 'partlyCloudy':
    default:
      return <CloudSun className={className} />
  }
}

const WeatherWidget = ({ className = '', compact = false }) => {
  const { language } = useLanguage()
  const lang = language === 'hi' || language === 'mr' ? language : 'en'
  const locale = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'

  const [selectedCity, setSelectedCity] = useState('pune')
  const [mounted, setMounted] = useState(false)
  const [weatherByCity, setWeatherByCity] = useState(DEFAULT_CITY_DATA)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadWeather = async () => {
      try {
        const res = await fetch(`/api/weather?city=${selectedCity}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data && typeof data.temp === 'number') {
          setWeatherByCity((prev) => ({
            ...prev,
            [selectedCity]: data,
          }))
        }
      } catch {
        // Keep fallback values seamlessly
      }
    }
    loadWeather()
    return () => {
      cancelled = true
    }
  }, [selectedCity])

  const cityMeta = CITY_OPTIONS.find((c) => c.key === selectedCity) || CITY_OPTIONS[0]
  const current = weatherByCity[selectedCity] || DEFAULT_CITY_DATA.pune
  const conditionLabel =
    CONDITION_LABELS[current.conditionKey]?.[lang] || CONDITION_LABELS.partlyCloudy.en

  const getAqiStyle = (aqi) => {
    if (aqi <= 50) {
      return {
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        label: UI_TEXT.aqiGood[lang],
      }
    }
    if (aqi <= 100) {
      return {
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        label: UI_TEXT.aqiMod[lang],
      }
    }
    return {
      badge: 'bg-red-500/20 text-red-400 border-red-500/30',
      label: UI_TEXT.aqiPoor[lang],
    }
  }

  const aqiStyle = getAqiStyle(current.aqi)

  const getForecastDayLabel = (item, idx) => {
    if (!mounted) return ''
    const dateObj = item.date
      ? new Date(`${item.date}T00:00:00`)
      : (() => {
          const d = new Date()
          d.setDate(d.getDate() + (item.dayOffset || idx + 1))
          return d
        })()
    return dateObj.toLocaleDateString(locale, { weekday: 'short' })
  }

  return (
    <div
      className={`bg-gradient-to-b from-[#111622] via-[#0d111a] to-[#080b11] text-white border border-white/10 relative overflow-hidden flex flex-col justify-between ${
        className || 'rounded-xl shadow-lg p-5 w-full'
      }`}
    >
      {/* Subtle ambient newsroom red glow */}
      <div className="absolute -top-10 -left-10 w-36 h-36 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: LIVE WEATHER + City Switcher Pills */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
          <span className="text-[9px] xl:text-[10px] font-extrabold tracking-[0.12em] text-gray-300 uppercase whitespace-nowrap">
            {UI_TEXT.liveWeather[lang]}
          </span>
        </div>

        <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-full p-0.5 shrink-0">
          {CITY_OPTIONS.map((city) => {
            const isActive = city.key === selectedCity
            return (
              <button
                key={city.key}
                type="button"
                onClick={() => setSelectedCity(city.key)}
                className={`px-2 py-0.5 rounded-full text-[10px] transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-red-600 text-white font-bold shadow-sm'
                    : 'text-gray-400 hover:text-white font-semibold'
                }`}
              >
                {city.label[lang]}
              </button>
            )
          })}
        </div>
      </div>

      {compact ? (
        <>
          {/* Compact Main Row: Location + Condition on left, Icon + Big Temp on right */}
          <div className="flex items-center justify-between gap-2 relative z-10 my-2">
            <div className="min-w-0">
              <h3 className="text-base font-extrabold tracking-tight text-white leading-tight truncate">
                {cityMeta.title[lang]}
              </h3>
              <p className="text-[11px] text-gray-300 font-semibold mt-0.5 truncate">
                {conditionLabel}
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                {lang === 'mr'
                  ? `कमाल: ${current.high}° · किमान: ${current.low}°`
                  : lang === 'hi'
                  ? `अधिकतम: ${current.high}° · न्यूनतम: ${current.low}°`
                  : `H: ${current.high}° · L: ${current.low}°`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {renderWeatherIcon(
                current.conditionKey,
                'w-8 h-8 text-amber-400 shrink-0 drop-shadow-[0_2px_8px_rgba(251,191,36,0.25)]'
              )}
              <span className="text-4xl font-black tracking-tighter leading-none text-white">
                {current.temp}°
              </span>
            </div>
          </div>

          {/* Compact 3-Column Metrics Grid: Wind | Humidity | AQI */}
          <div className="grid grid-cols-3 gap-1.5 relative z-10">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5">
              <span className="block text-[9px] text-gray-400 font-medium leading-none mb-1">
                {UI_TEXT.wind[lang]}
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs font-bold text-white leading-none">{current.wind}</span>
                <span className="text-[9px] text-gray-400 font-medium">km/h</span>
              </div>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5">
              <span className="block text-[9px] text-gray-400 font-medium leading-none mb-1">
                {UI_TEXT.humidity[lang]}
              </span>
              <span className="block text-xs font-bold text-white leading-none">
                {current.humidity}%
              </span>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5">
              <span className="block text-[9px] text-gray-400 font-medium leading-none mb-1">
                {UI_TEXT.aqi[lang]}
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-bold text-white leading-none">{current.aqi}</span>
                <span
                  className={`text-[8px] font-bold px-1 py-0.5 rounded border leading-none ${aqiStyle.badge}`}
                >
                  {aqiStyle.label}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Location + Date + Weather Icon */}
          <div className="flex items-start justify-between gap-3 relative z-10 mt-4">
            <div className="min-w-0">
              <h3 className="text-lg font-extrabold tracking-tight text-white leading-tight truncate">
                {cityMeta.title[lang]}
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5 min-h-[16px]">
                {mounted
                  ? new Date().toLocaleDateString(locale, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })
                  : ''}
              </p>
            </div>
            {renderWeatherIcon(
              current.conditionKey,
              'w-10 h-10 text-amber-400 shrink-0 drop-shadow-[0_2px_10px_rgba(251,191,36,0.25)]'
            )}
          </div>

          {/* Main Temperature Display */}
          <div className="flex items-center my-4 relative z-10">
            <span className="text-5xl xl:text-[54px] font-black tracking-tighter leading-none text-white">
              {current.temp}°
            </span>
            <div className="ml-4 min-w-0">
              <span className="block text-sm font-bold text-white leading-snug truncate">
                {conditionLabel}
              </span>
              <span className="block text-xs text-gray-400 font-semibold mt-0.5">
                {lang === 'mr'
                  ? `कमाल: ${current.high}°  किमान: ${current.low}°`
                  : lang === 'hi'
                  ? `अधिकतम: ${current.high}°  न्यूनतम: ${current.low}°`
                  : `H: ${current.high}°  L: ${current.low}°`}
              </span>
            </div>
          </div>

          {/* 3-Column Metrics Grid: Wind | Humidity | AQI */}
          <div className="grid grid-cols-3 gap-2 relative z-10 mb-3">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2">
              <span className="block text-[10px] text-gray-400 font-medium leading-none mb-1.5">
                {UI_TEXT.wind[lang]}
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-white leading-none">{current.wind}</span>
                <span className="text-[10px] text-gray-400 font-medium">km/h</span>
              </div>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2">
              <span className="block text-[10px] text-gray-400 font-medium leading-none mb-1.5">
                {UI_TEXT.humidity[lang]}
              </span>
              <span className="block text-sm font-bold text-white leading-none">
                {current.humidity}%
              </span>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-2">
              <span className="block text-[10px] text-gray-400 font-medium leading-none mb-1.5">
                {UI_TEXT.aqi[lang]}
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm font-bold text-white leading-none">{current.aqi}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${aqiStyle.badge}`}
                >
                  {aqiStyle.label}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom 3-Day Forecast Box */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-2 py-2.5 relative z-10">
            <p className="text-[9px] font-bold tracking-[0.14em] text-gray-400 uppercase text-center mb-2">
              {UI_TEXT.forecastTitle[lang]}
            </p>
            <div className="grid grid-cols-3 divide-x divide-white/[0.08]">
              {(current.forecast || DEFAULT_CITY_DATA.pune.forecast).slice(0, 3).map((day, idx) => (
                <div key={day.date || idx} className="flex flex-col items-center gap-1 px-1">
                  <span className="text-[11px] font-semibold text-gray-400 min-h-[16px]">
                    {getForecastDayLabel(day, idx)}
                  </span>
                  {renderWeatherIcon(day.conditionKey, 'w-4 h-4 text-gray-300')}
                  <span className="text-sm font-bold text-white leading-none">{day.tempMax}°</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default WeatherWidget
