'use client'

import { useEffect, useRef, useState } from 'react'

// Loads the YouTube player only when it is actually on screen (and visible: a
// `display:none` iframe still downloads ~1 MB of player JS). Until then a light
// thumbnail is shown; tapping it loads the player immediately.
export default function LazyYouTube({ videoId, title, params = 'autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1', className = '' }) {
  const ref = useRef(null)
  const [load, setLoad] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || load || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting && e.target.offsetParent !== null)) {
        setLoad(true)
        io.disconnect()
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [load])

  return (
    <div ref={ref} className={`relative w-full h-full ${className}`}>
      {load ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          style={{ border: 'none' }}
        />
      ) : (
        <button type="button" onClick={() => setLoad(true)} aria-label={`Play ${title}`} className="absolute inset-0 w-full h-full group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white ml-0.5"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
