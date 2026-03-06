'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { liveTV } from '@/lib/api'

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url) => {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

const LiveTVPage = ({ setCurrentView }) => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeStreamId, setActiveStreamId] = useState(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const data = await liveTV.get()
      setConfig(data)
      if (data?.primaryStreamId) {
        setActiveStreamId(data.primaryStreamId)
      } else if (data?.streams?.length > 0) {
        setActiveStreamId(data.streams[0].id)
      }
    } catch (error) {
      console.error('Failed to load Live TV:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchStream = useCallback((streamId) => {
    setActiveStreamId(streamId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-600/30 rounded-full animate-spin mx-auto" />
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto absolute inset-0" />
          </div>
          <p className="text-white/60 font-medium mt-6 text-sm tracking-wider uppercase">Loading Live TV...</p>
        </div>
      </div>
    )
  }

  // Disabled / no streams state
  if (!config || !config.enabled || !config.streams || config.streams.length === 0) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-lg mx-auto">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">

      {/* ====== TOP BRANDING BAR ====== */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <span className="text-white font-black text-sm tracking-widest uppercase">Star News Live</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hasLiveStreams && (
              <Badge className="bg-white/20 text-white border-none text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                🔴 On Air
              </Badge>
            )}
            <span className="text-white/70 text-xs hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ====== MAIN PLAYER SECTION ====== */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* Video Player */}
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black shadow-[0_0_60px_rgba(220,38,38,0.15)]">
              {/* Live Badge Overlay */}
              {activeStream?.isLive && (
                <div className="absolute top-4 left-4 z-20">
                  <span className="flex items-center gap-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-lg shadow-lg">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                    LIVE
                  </span>
                </div>
              )}

              {/* YouTube Embed */}
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
                    <div className="text-center text-white/40">
                      <p className="text-lg font-medium">Unable to load stream</p>
                      <p className="text-sm mt-1">Invalid or unsupported URL format</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stream Info Bar */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {activeStream?.isLive && (
                      <Badge className="bg-red-600 text-white border-none text-[10px] font-black uppercase tracking-wider px-2 py-0">
                        LIVE
                      </Badge>
                    )}
                    {!activeStream?.isLive && (
                      <Badge className="bg-white/10 text-white/60 border-white/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0">
                        REPLAY
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-white font-bold text-lg md:text-xl leading-tight">
                    {activeStream?.title || 'Star News Live'}
                  </h2>
                  <p className="text-white/40 text-xs mt-1.5">
                    {activeStream?.isLive ? 'Streaming live now' : `Added ${new Date(activeStream?.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
                <a
                  href={activeStream?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-red-600/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff" />
                  </svg>
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>

          {/* ====== SIDEBAR: Stream Playlist ====== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-white/80 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {config.streams.length > 1 ? 'All Streams' : 'Now Playing'}
              </h3>
              <span className="text-white/30 text-xs font-medium">{config.streams.length} {config.streams.length === 1 ? 'stream' : 'streams'}</span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-260px)] lg:max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {config.streams.map((stream) => {
                const thumbId = extractYouTubeId(stream.url)
                const isActive = stream.id === activeStreamId
                return (
                  <div
                    key={stream.id}
                    className={`group cursor-pointer rounded-xl p-2.5 transition-all duration-200 flex gap-3 items-start ${isActive
                        ? 'bg-red-600/15 border border-red-500/30 shadow-lg shadow-red-600/5'
                        : 'bg-white/5 border border-transparent hover:bg-white/8 hover:border-white/10'
                      }`}
                    onClick={() => switchStream(stream.id)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-32 sm:w-36 lg:w-[140px] shrink-0 rounded-lg overflow-hidden aspect-video bg-gray-800">
                      {thumbId ? (
                        <img
                          src={`https://img.youtube.com/vi/${thumbId}/mqdefault.jpg`}
                          alt={stream.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                        </div>
                      )}
                      {/* Play overlay */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-9 h-9 bg-red-600/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100 shadow-xl">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      {/* Now Playing indicator */}
                      {isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                            <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                            <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                            <div className="w-1 h-5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                          </div>
                        </div>
                      )}
                      {/* Live dot */}
                      {stream.isLive && (
                        <div className="absolute top-1.5 left-1.5">
                          <span className="flex items-center gap-1 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded">
                            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                            LIVE
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stream Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <h4 className={`font-semibold text-sm leading-snug line-clamp-2 mb-1 ${isActive ? 'text-red-400' : 'text-white/80 group-hover:text-white'}`}>
                        {stream.title}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        {stream.isLive ? (
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Streaming Now</span>
                        ) : (
                          <span className="text-[10px] text-white/30">
                            {new Date(stream.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <span className="text-[10px] text-red-400/60 font-medium mt-1 block">▶ Now Playing</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ====== BOTTOM TICKER BAR ====== */}
      <div className="mt-10 border-t border-white/5 bg-black/40 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Star News Live TV — Your trusted source for breaking news and live coverage</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://youtube.com/@starnewsindialive" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveTVPage
