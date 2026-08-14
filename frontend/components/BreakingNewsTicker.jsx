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
  const { t, language } = useLanguage()
  const [tickerKey, setTickerKey] = useState(0)
  const [ticker, setTicker] = useState({ enabled: true, text: DEFAULT_BREAKING_NEWS })
  const [translatedText, setTranslatedText] = useState(DEFAULT_BREAKING_NEWS)
  const [loading, setLoading] = useState(true)

  // Load breaking ticker from API
  const loadTicker = useCallback(async () => {
    try {
      const response = await fetch('/api/breaking-ticker')
      if (!response.ok) {
        setTicker({ enabled: true, text: DEFAULT_BREAKING_NEWS })
        return
      }
      const data = await response.json()

      if (data.enabled && data.text) {
        setTicker({ enabled: true, text: data.text })
      } else {
        // Use default text when API returns empty
        setTicker({ enabled: true, text: DEFAULT_BREAKING_NEWS })
      }
    } catch (error) {
      console.error('Failed to load breaking ticker:', error)
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

  // Handle dynamic translation — must be above any conditional return
  useEffect(() => {
    let isMounted = true;
    const updateTranslation = async () => {
      if (language === 'en') {
        if (isMounted) setTranslatedText(ticker.text);
        return;
      }
      try {
        const { translateText } = await import('@/lib/translation');
        const res = await translateText(ticker.text, 'en');
        if (isMounted) setTranslatedText(res[language] || ticker.text);
      } catch (err) {
        console.error('Translation failed', err);
        if (isMounted) setTranslatedText(ticker.text);
      }
    };
    updateTranslation();
    return () => { isMounted = false; };
  }, [language, ticker.text]);

  // Hide if loading or no ticker
  if (loading || !ticker.enabled || !ticker.text) {
    return null
  }

  // Duplicate text for seamless scrolling
  const tickerContent = translatedText + ' • '

  return (
    // NOTE: .ticker-wrapper and .ticker-content animation are defined in globals.css
    // (previously were in a <style jsx> tag which is NOT supported in App Router)
    <div className="overflow-hidden sticky top-0 lg:top-auto z-40 flex h-9 bg-[#1a1a1a]">
      {/* Left: Full Red BREAKING label with diagonal right edge */}
      <div className="breaking-label-container bg-[#E53935] flex items-center gap-2.5 pl-4 md:pl-5 pr-6 shrink-0 relative z-10">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
        <span className="font-black text-white text-[11px] uppercase tracking-[0.15em]">{t('breakingNews') || 'BREAKING'}</span>
      </div>
      {/* Right: Black scrolling ticker */}
      <div className="bg-[#1a1a1a] flex-1 flex items-center overflow-hidden pl-4 md:pl-5 -ml-[2px]">
        <div className="ticker-wrapper" key={`${tickerKey}-${language}`}>
          <div className="ticker-content whitespace-nowrap font-semibold text-[12px] tracking-wide text-gray-200">
            {tickerContent}{tickerContent}{tickerContent}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BreakingNewsTicker
