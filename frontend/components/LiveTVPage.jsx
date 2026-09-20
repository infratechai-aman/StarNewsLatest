'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { liveTV } from '@/lib/api'
import { getSidebarAdSettings } from '@/lib/contentStore'
import { useLanguage } from '@/contexts/LanguageContext'

// Extract YouTube video ID
const extractYouTubeId = (url) => {
  if (!url) return null
  const str = String(url).trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/)
  if (match) return match[1]
  const vMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (vMatch) return vMatch[1]
  return null
}

const LiveTVPage = ({ setCurrentView }) => {
  const { t } = useLanguage()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeStreamId, setActiveStreamId] = useState(null)
  const [newsArticles, setNewsArticles] = useState([])
  const [sidebarAds, setSidebarAds] = useState([])
  const [adIndex, setAdIndex] = useState(0)

  useEffect(() => {
    // Parallel fetch for speed
    Promise.all([
      liveTV.get().catch(() => null),
      fetch('/api/news').then(r => r.json()).catch(() => []),
      getSidebarAdSettings().catch(() => ({ items: [] }))
    ]).then(([tvData, newsData, adSettings]) => {
      // Live TV config
      if (tvData) {
        setConfig(tvData)
        setActiveStreamId(tvData.primaryStreamId || tvData.streams?.[0]?.id || null)
      }
      // News articles
      const articles = Array.isArray(newsData) ? newsData : (newsData?.articles || newsData?.news || [])
      setNewsArticles(articles.filter(a => a.status === 'approved' || !a.status).slice(0, 12))
      // Sidebar ads from API
      setSidebarAds(adSettings?.items || [])
      setLoading(false)
    })
  }, [])

  // Rotate sidebar ads every 4 seconds
  useEffect(() => {
    if (sidebarAds.length <= 1) return
    const timer = setInterval(() => setAdIndex(i => (i + 1) % sidebarAds.length), 4000)
    return () => clearInterval(timer)
  }, [sidebarAds])

  const switchStream = useCallback((id) => {
    setActiveStreamId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="bg-red-600 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="h-4 w-40 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-0 lg:px-4 pt-0 lg:pt-6">
          <div className="space-y-4">
            <div className="aspect-video bg-white/5 rounded-none lg:rounded-xl animate-pulse" />
            <div className="h-20 bg-white/5 rounded-none lg:rounded-xl animate-pulse mx-0 lg:mx-0" />
          </div>
        </div>
      </div>
    )
  }

  const DEFAULT_STREAM = {
    id: 'default-starnews',
    title: 'Star News Live 24/7',
    url: 'https://www.youtube.com/live/GFjuqQmfVIU',
    description: 'Top stories. Ground reports. Expert analysis 24/7 from across India.',
    isLive: true
  }

  const streams = (config?.streams && config.streams.length > 0) ? config.streams : [DEFAULT_STREAM]
  const activeStream = streams.find(s => s.id === activeStreamId) || streams[0]
  const otherStreams = streams.filter(s => s.id !== activeStream?.id)
  const youtubeId = extractYouTubeId(activeStream?.url) || 'GFjuqQmfVIU'
  const hasLiveStreams = streams.some(s => s.isLive)
  const currentAd = sidebarAds[adIndex]

  const programSchedule = [
    { time: '12:00 PM – 01:06 PM', show: 'Star News Live', desc: 'Top stories. Ground reports. Expert analysis.', live: true },
    { time: '01:00 PM – 02:00 PM', show: 'News Bulletin', desc: '', live: false },
    { time: '02:00 PM – 03:00 PM', show: 'Maharashtra Today', desc: '', live: false },
    { time: '03:00 PM – 04:30 PM', show: 'Nation First', desc: '', live: false },
    { time: '04:00 PM – 10:00 PM', show: 'Business Roundup', desc: '', live: false },
  ]

  return (
    <div className="min-h-screen bg-[#0f111a] pb-12">

      {/* ====== MAIN CONTENT: Player + Schedule Sidebar ====== */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 lg:gap-8">

          {/* LEFT: Video Player */}
          <div>
            {/* Player */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5 ring-1 ring-white/10">
              {activeStream?.isLive && (
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <span className="flex items-center gap-1.5 bg-red-600/90 backdrop-blur-md text-white text-[11px] font-black tracking-wide px-3 py-1.5 rounded shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    ((•)) {t('live') || 'LIVE'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-bold tracking-wide px-3 py-1.5 rounded shadow-lg">
                    2.4K {t('watchingLive') || 'watching'}
                  </span>
                </div>
              )}
              <div className="aspect-video w-full relative bg-black">
                {youtubeId ? (
                  <iframe
                    key={youtubeId}
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0`}
                    title={activeStream?.title || 'Live TV'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ border: 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <p className="text-white/40">Stream unavailable</p>
                  </div>
                )}
              </div>
            </div>

            {/* Breaking News Ticker (Broadcast TV style below player) */}
            <div className="mt-3 flex items-center bg-[#141724] border border-white/10 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-red-600 text-white text-xs font-black uppercase tracking-wider px-4 py-3 shrink-0 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {t('breakingNews') || 'BREAKING NEWS'}
              </div>
              <div className="px-4 py-2.5 overflow-hidden flex-1">
                <p className="text-white text-sm font-bold truncate">
                  {newsArticles[0] ? (typeof newsArticles[0].title === 'string' ? newsArticles[0].title : newsArticles[0].title?.en || '') : 'StarNews Live: Top breaking stories and live coverage across India'}
                </p>
              </div>
            </div>

            {/* Now Playing Info Bar */}
            <div className="mt-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex gap-4 items-start">
                {/* Thumbnail */}
                <div className="relative w-[140px] h-[85px] rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-white/10 shadow-lg">
                  {youtubeId && <img src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover opacity-80" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="text-white text-sm font-black text-center leading-tight drop-shadow-md">STAR NEWS<br/>LIVE</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-white font-bold text-2xl leading-tight mb-1">{activeStream?.title || 'Star News Live'}</h2>
                  <p className="text-gray-300 text-sm mb-3">{activeStream?.description || 'Top stories. Ground reports. Expert analysis.'}</p>
                  <p className="text-gray-400 text-xs max-w-xl leading-relaxed mb-4">Stay updated with the latest news from across India and around the world with our live coverage, expert discussions and on-ground reporting.</p>
                  <div className="flex gap-2">
                    {['News','Live','Hindi','English'].map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-gray-400 border border-gray-700/50 bg-white/5 px-2.5 py-1 rounded-full uppercase tracking-wider">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Stats */}
              <div className="flex flex-col gap-3 min-w-[140px] shrink-0 border-l border-white/10 pl-6 hidden md:flex">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <div><p className="text-sm font-bold text-white">2.4K</p><p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Watching Live</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div><p className="text-sm font-bold text-white">HD</p><p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Streaming in HD</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div><p className="text-sm font-bold text-white">24/7</p><p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">News Coverage</p></div>
                </div>
              </div>
            </div>

            {/* Latest from Star News */}
            {newsArticles.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[16px] font-black text-white flex items-center gap-2">
                    <span className="w-1 h-5 bg-red-600 rounded-full block" />
                    {t('latestFrom') ? `${t('latestFrom')} Star News` : 'Latest from Star News'}
                  </h2>
                  <button onClick={() => setCurrentView && setCurrentView('news')} className="text-white/60 text-xs font-bold hover:text-white flex items-center gap-1 transition-colors">
                    {t('viewAll') || 'View All'} →
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {newsArticles.slice(0, 4).map((article, idx) => {
                    const thumb = article.thumbnails?.[0] || article.thumbnailUrl || article.mainImage || article.imageUrl
                    const title = typeof article.title === 'string' ? article.title : (article.title?.en || article.title?.hi || '')
                    return (
                      <div key={article.id || idx} className="cursor-pointer group flex flex-col h-full" onClick={() => { if (setCurrentView) { window.history.pushState({}, '', `?article=${article.id}`); setCurrentView('news-detail') } }}>
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-3 shadow-md border border-white/5">
                          {thumb ? <img src={thumb} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => e.target.style.display='none'} /> : <div className="w-full h-full bg-gray-800" />}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                          
                          {/* Play button overlay */}
                          <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <svg className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                          
                          {/* Duration Badge */}
                          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm tracking-wide">
                            {idx === 0 ? '3:34' : idx === 1 ? '3:12' : idx === 2 ? '2:56' : '3:20'}
                          </div>
                        </div>
                        <h4 className="text-[13px] font-bold text-white/90 line-clamp-2 group-hover:text-white transition-colors leading-snug mb-1.5 flex-1">{title}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/40 mt-auto">
                          <span>{article.createdAt ? Math.max(1, Math.round((Date.now() - new Date(article.createdAt)) / 3600000)) + ' hours ago' : `${2 * (idx + 1)} hours ago`}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{article.views || Math.floor(Math.random() * 50 + 10)}K views</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Program Schedule Sidebar */}
          <div className="space-y-6">
            {/* Live Now / Program Schedule tabs */}
            <div className="border border-white/5 bg-[#141724] rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/5">
              <div className="grid grid-cols-2">
                <div className="bg-red-600 text-white text-[11px] font-black text-center py-3.5 tracking-wider uppercase">{t('liveNow') || 'Live Now'}</div>
                <div className="bg-[#0f111a] text-white/50 border-b border-white/5 text-[11px] font-bold text-center py-3.5 hover:text-white/80 transition-colors cursor-pointer">{t('programSchedule') || 'Program Schedule'}</div>
              </div>
              <div className="divide-y divide-white/5">
                {programSchedule.map((prog, idx) => (
                  <div key={idx} className={`flex gap-4 p-4 items-center ${prog.live ? 'bg-white/5' : 'hover:bg-white/[0.02]'} transition-colors cursor-pointer`}>
                    <div className="min-w-0 flex-1">
                      {prog.live && (
                        <span className="inline-block text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm mb-1.5">ON AIR</span>
                      )}
                      <p className={`text-[10px] font-bold ${prog.live ? 'text-white/50' : 'text-white/40'} tracking-wide mb-0.5`}>{prog.time}</p>
                      <p className={`text-[13px] font-bold ${prog.live ? 'text-white' : 'text-white/80'} leading-tight`}>{prog.show}</p>
                      {prog.desc && <p className="text-[10px] text-white/40 mt-1 leading-relaxed">{prog.desc}</p>}
                    </div>
                    {prog.live && (
                      <div className="relative w-[75px] h-[45px] rounded-md shrink-0 overflow-hidden shadow-lg border border-white/10">
                        {youtubeId && <img src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover opacity-80" />}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                          <span className="text-white text-[8px] font-black text-center leading-tight drop-shadow-md">STAR NEWS<br/>LIVE</span>
                        </div>
                      </div>
                    )}
                    {!prog.live && (
                      <div className={`relative w-[75px] h-[45px] rounded-md shrink-0 overflow-hidden shadow-md border border-white/10 ${
                        idx === 1 ? 'bg-blue-900/60' : idx === 2 ? 'bg-orange-900/60' : idx === 3 ? 'bg-indigo-900/60' : 'bg-blue-800/60'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center p-1">
                          <span className="text-white text-[8px] font-black text-center leading-tight uppercase drop-shadow-md break-words">{prog.show}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/5 bg-black/20">
                <button className="w-full text-center text-white/60 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1">
                  {t('viewFullSchedule') || 'View Full Schedule'} →
                </button>
              </div>
            </div>

            {/* Real Stories CTA */}
            <div className="bg-[#141724] rounded-2xl p-6 relative overflow-hidden border border-white/5 ring-1 ring-white/5 shadow-xl">
              {newsArticles[1] && (() => {
                const thumb = newsArticles[1].thumbnails?.[0] || newsArticles[1].mainImage
                return thumb ? <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" onError={e => e.target.style.display='none'} /> : null
              })()}
              <div className="relative z-10">
                <h3 className="text-white font-black text-2xl leading-tight mb-2 drop-shadow-md">Real Stories.<br/>Real Impact.</h3>
                <p className="text-white/60 text-xs mb-5 max-w-[200px] leading-relaxed font-semibold">Journalism that keeps you informed, empowered and ahead.</p>
                <button onClick={() => setCurrentView && setCurrentView('reporter')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1 shadow-lg shadow-red-900/50">
                  Join as Reporter →
                </button>
              </div>
            </div>

            {/* Stream Switcher if multiple */}
            {config.streams.length > 1 && (
              <div className="border border-white/5 bg-[#141724] rounded-2xl p-5 shadow-xl">
                <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-4">Other Streams</p>
                <div className="space-y-3">
                  {otherStreams.slice(0, 3).map(stream => {
                    const tid = extractYouTubeId(stream.url)
                    return (
                      <div key={stream.id} onClick={() => switchStream(stream.id)} className="flex gap-4 cursor-pointer group hover:bg-white/5 rounded-xl p-2 -mx-2 transition-colors items-center">
                        <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-gray-900 shrink-0 shadow-md">
                          {tid && <img src={`https://img.youtube.com/vi/${tid}/mqdefault.jpg`} alt={stream.title} className="w-full h-full object-cover opacity-80" />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-[13px] font-bold text-white/90 line-clamp-2 group-hover:text-white leading-tight mb-1">{stream.title}</h5>
                          {stream.isLive && <span className="text-[9px] text-red-500 font-bold uppercase tracking-wide">● LIVE</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 bg-[#141724] py-6 px-6 mt-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <span className="text-white/40 text-[11px] font-bold tracking-wide">Star News Live TV — Your trusted source for breaking news</span>
          <a href="https://youtube.com/@starnewsindialive" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" /><path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#0f111a" /></svg>
          </a>
        </div>
      </div>
    </div>
  )
}

export default LiveTVPage
