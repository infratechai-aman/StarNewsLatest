'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      // Set the primary stream as active, or the first stream
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading Live TV...</p>
        </div>
      </div>
    )
  }

  if (!config || !config.enabled || !config.streams || config.streams.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Live TV Coming Soon</h2>
          <p className="text-gray-500">Stay tuned! Our live streaming service will be available shortly.</p>
        </div>
      </div>
    )
  }

  const activeStream = config.streams.find(s => s.id === activeStreamId) || config.streams[0]
  const otherStreams = config.streams.filter(s => s.id !== activeStream?.id)
  const youtubeId = extractYouTubeId(activeStream?.url)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
            Live TV
          </h1>
        </div>
        {activeStream?.isLive && (
          <Badge className="bg-red-600 text-white border-none text-xs font-black uppercase tracking-wider px-3 py-1 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            LIVE NOW
          </Badge>
        )}
      </div>

      {/* Hero Player */}
      <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
        {/* Stream Title Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 md:p-6">
          <div className="flex items-center gap-3">
            {activeStream?.isLive && (
              <span className="flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
            <h2 className="text-white font-bold text-lg md:text-xl drop-shadow-lg truncate">
              {activeStream?.title || 'Star News Live'}
            </h2>
          </div>
        </div>

        {/* YouTube Embed */}
        <div className="aspect-video w-full">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1`}
              title={activeStream?.title || 'Live TV'}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ border: 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-white/60">
                <p className="text-lg font-medium">Unable to load video</p>
                <p className="text-sm mt-1">Invalid or unsupported URL</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other Streams Grid */}
      {otherStreams.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            More Streams & Replays
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherStreams.map((stream) => {
              const thumbId = extractYouTubeId(stream.url)
              return (
                <Card
                  key={stream.id}
                  className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-200"
                  onClick={() => setActiveStreamId(stream.id)}
                >
                  <div className="relative aspect-video bg-gray-100">
                    {thumbId ? (
                      <img
                        src={`https://img.youtube.com/vi/${thumbId}/maxresdefault.jpg`}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = `https://img.youtube.com/vi/${thumbId}/hqdefault.jpg`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 shadow-xl">
                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    {/* Live badge */}
                    {stream.isLive && (
                      <Badge className="absolute top-2 left-2 bg-red-600 text-white border-none text-[10px] font-black uppercase flex items-center gap-1 px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                      {stream.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      {stream.isLive ? (
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">🔴 Streaming Now</span>
                      ) : (
                        <span className="text-[10px] text-gray-500">
                          Added {new Date(stream.addedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveTVPage
