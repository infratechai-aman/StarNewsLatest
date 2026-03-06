'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { liveTV } from '@/lib/api'
import { getSidebarAdSettings } from '@/lib/contentStore'

// Extract YouTube video ID
const extractYouTubeId = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

const LiveTVPage = ({ setCurrentView }) => {
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
      fetch('/api/news').then(r => r.json()).catch(() => [])
    ]).then(([tvData, newsData]) => {
      // Live TV config
      if (tvData) {
        setConfig(tvData)
        setActiveStreamId(tvData.primaryStreamId || tvData.streams?.[0]?.id || null)
      }
      // News articles
      const articles = Array.isArray(newsData) ? newsData : (newsData?.articles || newsData?.news || [])
      setNewsArticles(articles.filter(a => a.status === 'approved' || !a.status).slice(0, 12))
      // Sidebar ads from localStorage
      const adSettings = getSidebarAdSettings()
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
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            <div className="space-y-4">
              <div className="aspect-video bg-white/5 rounded-xl animate-pulse" />
              <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Disabled state
  if (!config?.enabled || !config?.streams?.length) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Live TV</h2>
          <p className="text-white/40 text-lg">No live broadcasts at the moment. Check back soon!</p>
        </div>
      </div>
    )
  }

  const activeStream = config.streams.find(s => s.id === activeStreamId) || config.streams[0]
  const otherStreams = config.streams.filter(s => s.id !== activeStream?.id)
  const youtubeId = extractYouTubeId(activeStream?.url)
  const hasLiveStreams = config.streams.some(s => s.isLive)
  const currentAd = sidebarAds[adIndex]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">

      {/* ====== TOP BRANDING BAR ====== */}
      <div className="bg-gradient-to-r from-red-800 via-red-600 to-red-800 py-3 px-4 shadow-lg shadow-red-900/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <span className="text-white font-black text-sm tracking-[0.2em] uppercase">Star News Live</span>
            {hasLiveStreams && (
              <Badge className="bg-white/20 text-white border-none text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ml-2">
                ON AIR
              </Badge>
            )}
          </div>
          <span className="text-white/60 text-xs hidden sm:block font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* ====== LEFT COLUMN: Player + News ====== */}
          <div className="space-y-6">

            {/* Video Player */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-[0_0_80px_rgba(220,38,38,0.12)] ring-1 ring-white/10">
              {activeStream?.isLive && (
                <div className="absolute top-4 left-4 z-20">
                  <span className="flex items-center gap-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-lg shadow-lg shadow-red-600/40">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    LIVE
                  </span>
                </div>
              )}
              <div className="aspect-video w-full">
                {youtubeId ? (
                  <iframe
                    key={youtubeId}
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`}
                    title={activeStream?.title || 'Live TV'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ border: 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 aspect-video">
                    <p className="text-white/40">Unable to load stream</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stream Info */}
            <div className="bg-gradient-to-r from-white/[0.06] to-white/[0.03] border border-white/10 rounded-xl p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {activeStream?.isLive ? (
                      <Badge className="bg-red-600 text-white border-none text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
                      </Badge>
                    ) : (
                      <Badge className="bg-white/10 text-white/60 border-white/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">REPLAY</Badge>
                    )}
                  </div>
                  <h2 className="text-white font-bold text-xl md:text-2xl leading-tight">{activeStream?.title}</h2>
                  <p className="text-white/30 text-sm mt-1.5">
                    {activeStream?.isLive ? '🔴 Streaming live now' : `Added ${new Date(activeStream?.addedAt).toLocaleDateString('en-IN')}`}
                  </p>
                </div>
                <a href={activeStream?.url} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-red-600/20 flex items-center gap-2 whitespace-nowrap">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" /><path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff" /></svg>
                  YouTube
                </a>
              </div>
            </div>

            {/* ====== ADVERTISEMENT BANNER ====== */}
            {sidebarAds.length > 0 && currentAd && (
              <div className="relative overflow-hidden rounded-xl">
                <a href={currentAd.destinationUrl || '#'} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="relative bg-gradient-to-r from-red-900/40 to-gray-900/40 border border-white/10 rounded-xl overflow-hidden">
                    <div className="absolute top-2 right-2 z-10">
                      <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">Ad</span>
                    </div>
                    <img
                      src={currentAd.imageUrl}
                      alt="Advertisement"
                      className="w-full h-auto max-h-[200px] object-contain mx-auto transition-transform hover:scale-[1.02]"
                    />
                  </div>
                </a>
                {/* Ad dots indicator */}
                {sidebarAds.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-2">
                    {sidebarAds.map((_, i) => (
                      <button key={i} onClick={() => setAdIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === adIndex ? 'bg-red-500 w-4' : 'bg-white/20 hover:bg-white/40'}`} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ====== LATEST NEWS SECTION ====== */}
            {newsArticles.length > 0 && (
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-7 bg-red-600 rounded-full" />
                  <h3 className="text-white font-black text-lg uppercase tracking-wider">Latest News</h3>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {newsArticles.slice(0, 6).map((article, idx) => (
                    <div
                      key={article.id || idx}
                      className="group cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-xl overflow-hidden transition-all duration-300"
                      onClick={() => {
                        if (setCurrentView) {
                          window.history.pushState({ view: 'news-detail', article }, '', `?article=${article.id}`)
                          setCurrentView('news-detail')
                        }
                      }}
                    >
                      <div className="flex gap-3 p-3">
                        {(article.imageUrl || article.image) && (
                          <div className="shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-white/5">
                            <img
                              src={article.imageUrl || article.image}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            {article.category && (
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                {typeof article.category === 'string' ? article.category : (article.category?.name || 'News')}
                              </span>
                            )}
                          </div>
                          <h4 className="text-white/80 group-hover:text-white font-semibold text-sm line-clamp-2 leading-snug transition-colors">
                            {typeof article.title === 'string' ? article.title : (article.title?.en || article.title?.hi || 'News Article')}
                          </h4>
                          <p className="text-white/25 text-[10px] mt-1.5">
                            {article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* More news CTA */}
                <div className="text-center pt-2">
                  <button
                    onClick={() => { if (setCurrentView) { window.history.pushState({ view: 'news' }, '', '?view=news'); setCurrentView('news') } }}
                    className="text-red-400 hover:text-red-300 text-sm font-bold hover:underline transition-colors inline-flex items-center gap-1.5"
                  >
                    View All News
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ====== RIGHT SIDEBAR ====== */}
          <div className="space-y-5">

            {/* Stream Playlist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-white/80 font-bold text-xs uppercase tracking-[0.15em] flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  {config.streams.length > 1 ? 'All Streams' : 'Now Playing'}
                </h3>
                <span className="text-white/20 text-[10px] font-semibold">{config.streams.length}</span>
              </div>

              <div className="space-y-2">
                {config.streams.map((stream) => {
                  const thumbId = extractYouTubeId(stream.url)
                  const isActive = stream.id === activeStreamId
                  return (
                    <div
                      key={stream.id}
                      className={`group cursor-pointer rounded-xl p-2.5 transition-all duration-200 flex gap-3 items-start ${isActive
                        ? 'bg-red-600/20 border border-red-500/40 shadow-lg shadow-red-900/10'
                        : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.07] hover:border-white/10'
                        }`}
                      onClick={() => switchStream(stream.id)}
                    >
                      <div className="relative w-[120px] shrink-0 rounded-lg overflow-hidden aspect-video bg-gray-800">
                        {thumbId ? (
                          <img src={`https://img.youtube.com/vi/${thumbId}/mqdefault.jpg`} alt={stream.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                          </div>
                        )}
                        {!isActive && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <div className="w-8 h-8 bg-red-600/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100">
                              <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="flex items-center gap-0.5">
                              {[0, 150, 300, 450].map(d => (
                                <div key={d} className="w-0.5 bg-red-500 rounded-full animate-pulse" style={{ height: `${12 + Math.random() * 10}px`, animationDelay: `${d}ms` }} />
                              ))}
                            </div>
                          </div>
                        )}
                        {stream.isLive && (
                          <div className="absolute top-1 left-1">
                            <span className="flex items-center gap-0.5 bg-red-600 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded">
                              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />LIVE
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h4 className={`font-semibold text-[13px] leading-snug line-clamp-2 ${isActive ? 'text-red-400' : 'text-white/70 group-hover:text-white/90'}`}>
                          {stream.title}
                        </h4>
                        {stream.isLive ? (
                          <span className="text-[10px] font-bold text-red-400 mt-1 block">Streaming Now</span>
                        ) : (
                          <span className="text-[10px] text-white/25 mt-1 block">{new Date(stream.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        )}
                        {isActive && <span className="text-[9px] text-red-500/50 font-semibold mt-0.5 block">▶ Now Playing</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ====== SIDEBAR ADS (same 4 scrolling ads) ====== */}
            {sidebarAds.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-white/20 text-[10px] font-bold uppercase tracking-wider">Sponsored</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="space-y-3">
                  {sidebarAds.map((ad, i) => (
                    <a key={i} href={ad.destinationUrl || '#'} target="_blank" rel="noopener noreferrer"
                      className="block bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] rounded-xl overflow-hidden transition-all duration-300 group">
                      <div className="relative">
                        <img src={ad.imageUrl} alt="Advertisement" className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                        <span className="absolute top-1.5 right-1.5 text-[8px] text-white/25 font-bold uppercase tracking-widest bg-black/30 px-1.5 py-0.5 rounded">Ad</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ====== MORE NEWS IN SIDEBAR ====== */}
            {newsArticles.length > 6 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-5 bg-red-600 rounded-full" />
                  <span className="text-white/60 text-xs font-bold uppercase tracking-wider">More Stories</span>
                </div>
                <div className="space-y-2">
                  {newsArticles.slice(6, 12).map((article, idx) => (
                    <div
                      key={article.id || idx}
                      className="group cursor-pointer p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.1] rounded-lg transition-all"
                      onClick={() => {
                        if (setCurrentView) {
                          window.history.pushState({ view: 'news-detail', article }, '', `?article=${article.id}`)
                          setCurrentView('news-detail')
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-red-600/60 font-black text-lg leading-none shrink-0 mt-0.5">{idx + 1}.</span>
                        <div className="min-w-0">
                          <h5 className="text-white/60 group-hover:text-white/90 font-medium text-[13px] line-clamp-2 leading-snug transition-colors">
                            {typeof article.title === 'string' ? article.title : (article.title?.en || article.title?.hi || 'News Article')}
                          </h5>
                          <span className="text-[10px] text-white/20 mt-1 block">
                            {typeof article.category === 'string' ? article.category : (article.category?.name || 'News')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== BOTTOM BAR ====== */}
      <div className="border-t border-white/5 bg-black/40 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="text-white/25 text-xs flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Star News Live TV — Your trusted source for breaking news
          </span>
          <a href="https://youtube.com/@starnewsindialive" target="_blank" rel="noopener noreferrer"
            className="text-white/25 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" /></svg>
          </a>
        </div>
      </div>
    </div>
  )
}

export default LiveTVPage
