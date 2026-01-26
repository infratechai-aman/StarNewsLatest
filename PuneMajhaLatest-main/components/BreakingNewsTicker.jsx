'use client'

import { useState, useEffect, useCallback } from 'react'
import { Radio } from 'lucide-react'
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
    <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white py-2 overflow-hidden sticky top-0 z-50 shadow-lg">
      <div className="container flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full shrink-0 backdrop-blur-sm">
          <Radio className="h-4 w-4 animate-pulse" />
          <span className="font-bold text-sm uppercase tracking-wider">{t('breakingNews')}</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-wrapper" key={tickerKey}>
            <div className="ticker-content animate-ticker whitespace-nowrap">
              {tickerText}{tickerText}{tickerText}
            </div>
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
