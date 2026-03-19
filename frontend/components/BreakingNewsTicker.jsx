'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

// Default breaking news headlines (shown when no API data)
const DEFAULT_BREAKING_NEWS = [
  "Welcome to Star News - Your trusted source for 24x7 breaking news",
  "Stay updated with the latest news from Pune and across India",
  "Download our app for instant news alerts and updates"
].join(' • ')

const BreakingNewsTicker = () => {
  const { t } = useLanguage()
  const [tickerKey, setTickerKey] = useState(0)
  const [ticker, setTicker] = useState({ enabled: true, text: DEFAULT_BREAKING_NEWS })
  const [loading, setLoading] = useState(true)

  // Load breaking ticker from API
  const loadTicker = useCallback(async () => {
    try {
      const response = await fetch('/api/breaking-ticker')
      const data = await response.json()

      if (data.enabled && data.text) {
        setTicker({ enabled: true, text: data.text })
      } else {
        // Use default text when API returns empty
        setTicker({ enabled: true, text: DEFAULT_BREAKING_NEWS })
      }
    } catch (error) {
      console.error('Failed to load breaking ticker:', error)
      // Use default text on error
      setTicker({ enabled: true, text: DEFAULT_BREAKING_NEWS })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTicker()
    setTickerKey(prev => prev + 1)

    // Refresh every 30 seconds for live updates
    const interval = setInterval(loadTicker, 30000)
    return () => clearInterval(interval)
  }, [loadTicker])

  // Hide if loading or no ticker
  if (loading || !ticker.enabled || !ticker.text) {
    return null
  }

  // Duplicate text for seamless scrolling
  const tickerText = ticker.text + ' • '

  return (
    <div className="overflow-hidden sticky top-0 lg:top-auto z-40 flex h-9">
      {/* Left: Full Red BREAKING label */}
      <div className="bg-[#E53935] flex items-center gap-2.5 px-5 shrink-0 relative">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
        <span className="font-black text-white text-[11px] uppercase tracking-[0.15em]">{t('breakingNews') || 'BREAKING'}</span>
        {/* Slant edge */}
        <div className="absolute -right-[10px] top-0 bottom-0 w-4 bg-[#E53935]" style={{ clipPath: 'polygon(0 0, 100% 0, 0% 100%, 0 100%)' }} />
      </div>
      {/* Right: Black scrolling ticker */}
      <div className="bg-[#1a1a1a] flex-1 flex items-center overflow-hidden pl-5">
        <div className="ticker-wrapper" key={tickerKey}>
          <div className="ticker-content animate-ticker whitespace-nowrap font-semibold text-[12px] tracking-wide text-gray-200">
            {tickerText}{tickerText}{tickerText}
          </div>
        </div>
      </div>
      <style jsx>{`
        .ticker-wrapper {
          display: inline-block;
          width: 100%;
        }
        .ticker-content {
          display: inline-block;
          animation: ticker 40s linear infinite;
        }
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .ticker-content:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

export default BreakingNewsTicker
