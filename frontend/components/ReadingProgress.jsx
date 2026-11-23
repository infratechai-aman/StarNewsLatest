'use client'

import { useEffect, useRef } from 'react'

// Thin red bar at the top of the screen showing how far the reader is through
// the article. Writes the transform directly (no re-renders) inside rAF.
export default function ReadingProgress() {
  const bar = useRef(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
      if (bar.current) bar.current.style.transform = `scaleX(${p})`
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div aria-hidden="true" className="fixed top-0 inset-x-0 h-[3px] z-[60] pointer-events-none">
      <div ref={bar} className="h-full bg-red-600 origin-left will-change-transform" style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}
