'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Download, Newspaper, FileText,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Printer, Share2,
  RotateCcw, BookOpen, Loader2, Grid3X3
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Main Component ──────────────────────────────────────────────────────────
const EnewspaperPage = () => {
  const { t } = useLanguage()
  const [newspapers, setNewspapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [pageImages, setPageImages] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [showThumbnails, setShowThumbnails] = useState(false)

  const containerRef = useRef(null)
  const pageStripRef = useRef(null)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  // Fetch newspapers list
  useEffect(() => {
    const fetchNewspapers = async () => {
      try {
        const res = await fetch('/api/enewspaper')
        const data = await res.json()
        const papers = data.papers || []
        setNewspapers(papers)
        if (papers.length > 0) setSelectedPaper(papers[0])
      } catch (err) {
        console.error('Failed to fetch e-newspapers:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNewspapers()
  }, [])

  // Load PDF pages when a paper is selected
  useEffect(() => {
    if (!selectedPaper?.pdfUrl) return

    const loadPdf = async () => {
      setPdfLoading(true)
      setPageImages([])
      setCurrentPage(0)
      setZoom(1)
      setShowThumbnails(false)

      try {
        // Load pdfjs v3 from jsdelivr — v3 has proper UMD builds that set window.pdfjsLib
        // v4+ only ships ESM which doesn't work with Next.js webpack
        const PDFJS_VER = '3.11.174'
        const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VER}/build`
        
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = `${PDFJS_CDN}/pdf.min.js`
            script.onload = () => {
              // Small delay to ensure window.pdfjsLib is registered
              setTimeout(resolve, 100)
            }
            script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'))
            document.head.appendChild(script)
          })
        }

        const pdfjsLib = window.pdfjsLib
        if (!pdfjsLib) throw new Error('PDF.js library not available on window')
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`

        const loadingTask = pdfjsLib.getDocument({
          url: selectedPaper.pdfUrl,
          isEvalSupported: false,
        })

        const pdf = await loadingTask.promise
        setTotalPages(pdf.numPages)

        // Use higher scale for desktop, lower for mobile to save memory
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
        const scale = isMobile ? 2 : 2.5

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: context, viewport }).promise
          const imageUrl = canvas.toDataURL('image/jpeg', 0.90)
          setPageImages(prev => [...prev, imageUrl])
        }
      } catch (err) {
        console.error('Failed to load PDF:', err)
      } finally {
        setPdfLoading(false)
      }
    }

    loadPdf()
  }, [selectedPaper])

  // Page navigation
  const goToPage = useCallback((n) => {
    if (n >= 0 && n < totalPages && n < pageImages.length) {
      setCurrentPage(n)
      setZoom(1)
      setShowThumbnails(false)
      // Scroll to top of page viewer
      if (containerRef.current) {
        const viewer = containerRef.current.querySelector('.epaper-viewer')
        if (viewer) viewer.scrollTop = 0
      }
    }
  }, [totalPages, pageImages.length])

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])

  // Zoom (desktop only)
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.3, 3))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.3, 0.5))
  const resetZoom = () => setZoom(1)

  // Download
  const handleDownload = (newspaper) => {
    const link = document.createElement('a')
    link.href = newspaper.pdfUrl
    link.download = `StarNews-${getFormattedDate(newspaper.publishDate || newspaper.editionDate)}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print
  const handlePrint = () => {
    if (selectedPaper?.pdfUrl) {
      const printWindow = window.open(selectedPaper.pdfUrl, '_blank')
      if (printWindow) printWindow.addEventListener('load', () => printWindow.print())
    }
  }

  // Share
  const handleShare = async () => {
    if (navigator.share && selectedPaper) {
      try {
        await navigator.share({
          title: `StarNews - ${selectedPaper.title}`,
          text: `Read today's edition of StarNews E-Paper`,
          url: window.location.href,
        })
      } catch (err) { /* cancelled */ }
    }
  }

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }, [isFullscreen])

  useEffect(() => {
    const handleFSChange = () => { if (!document.fullscreenElement) setIsFullscreen(false) }
    document.addEventListener('fullscreenchange', handleFSChange)
    return () => document.removeEventListener('fullscreenchange', handleFSChange)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage()
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen()
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-') handleZoomOut()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, toggleFullscreen, nextPage, prevPage])

  // Touch/Swipe for mobile page navigation
  const handleTouchStart = useCallback((e) => {
    if (zoom > 1) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [zoom])

  const handleTouchEnd = useCallback((e) => {
    if (zoom > 1 || touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) nextPage()
      else prevPage()
    }
    touchStartX.current = null
    touchStartY.current = null
  }, [zoom, nextPage, prevPage])

  // Auto-scroll page strip to active page
  useEffect(() => {
    if (pageStripRef.current) {
      const activeBtn = pageStripRef.current.querySelector(`[data-page="${currentPage}"]`)
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentPage])

  // Date helpers
  const getFormattedDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-medium">Loading editions...</p>
        </div>
      </div>
    )
  }

  // ─── Empty state ───
  if (newspapers.length === 0) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center px-4">
        <div className="text-center py-16">
          <FileText className="h-16 w-16 mx-auto mb-6 text-gray-600" />
          <h3 className="text-xl font-black text-gray-400 mb-2">{t('noEpapers') || 'No E-Newspapers Available'}</h3>
          <p className="text-sm text-gray-500">{t('checkBackLater') || 'Check back later for new editions'}</p>
        </div>
      </div>
    )
  }

  const hasPages = pageImages.length > 0

  return (
    <div ref={containerRef} className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-[#0d0d0d] min-h-screen flex flex-col`}>

      {/* ═══════ DESKTOP TOOLBAR (hidden on mobile) ═══════ */}
      <div className="hidden md:block bg-[#141414] border-b border-gray-800 px-6 py-2 shrink-0">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto gap-3">
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center">
              <Newspaper className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm font-black tracking-tight text-white">
              StarNews <span className="text-red-500">ePaper</span>
            </h1>
          </div>

          {/* Center: Edition Selector */}
          <select
            className="h-9 px-3 pr-8 rounded-lg text-xs font-semibold appearance-none cursor-pointer outline-none bg-gray-800 border border-gray-700 text-white"
            value={selectedPaper?.id || ''}
            onChange={(e) => {
              const paper = newspapers.find(p => p.id === e.target.value)
              if (paper) setSelectedPaper(paper)
            }}
          >
            {newspapers.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} — {getFormattedDate(p.publishDate || p.editionDate)}
              </option>
            ))}
          </select>

          {/* Right: Zoom + Actions */}
          <div className="flex items-center gap-1">
            <button onClick={handleZoomOut} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-[10px] font-bold text-gray-500 min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><ZoomIn className="w-4 h-4" /></button>
            {zoom !== 1 && <button onClick={resetZoom} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><RotateCcw className="w-4 h-4" /></button>}
            <div className="w-px h-5 bg-gray-700 mx-1" />
            <button onClick={handleShare} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><Share2 className="w-4 h-4" /></button>
            <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><Printer className="w-4 h-4" /></button>
            <button onClick={() => selectedPaper && handleDownload(selectedPaper)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><Download className="w-4 h-4" /></button>
            <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ MOBILE TOP BAR (edition + download) ═══════ */}
      <div className="md:hidden bg-[#141414] border-b border-gray-800 px-3 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-red-600 flex items-center justify-center shrink-0">
            <Newspaper className="h-3.5 w-3.5 text-white" />
          </div>
          <select
            className="flex-1 h-8 px-2 pr-6 rounded-lg text-[11px] font-semibold appearance-none outline-none bg-gray-800 border border-gray-700 text-white truncate"
            value={selectedPaper?.id || ''}
            onChange={(e) => {
              const paper = newspapers.find(p => p.id === e.target.value)
              if (paper) setSelectedPaper(paper)
            }}
          >
            {newspapers.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} — {getFormattedDate(p.publishDate || p.editionDate)}
              </option>
            ))}
          </select>
          <button onClick={() => selectedPaper && handleDownload(selectedPaper)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 shrink-0">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleShare} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 shrink-0">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════ PAGE NUMBER STRIP (desktop) ═══════ */}
      {totalPages > 0 && (
        <div className="hidden md:block bg-[#1a1a1a] border-b border-gray-800 px-6 py-2 shrink-0">
          <div className="max-w-[1400px] mx-auto flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Pages</span>
            <div ref={pageStripRef} className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin flex-1 py-1">
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  data-page={idx}
                  onClick={() => goToPage(idx)}
                  className={`shrink-0 min-w-[36px] h-9 rounded-lg text-xs font-bold transition-all duration-200 ${
                    currentPage === idx
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105'
                      : idx < pageImages.length
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={idx >= pageImages.length}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-bold text-gray-500 shrink-0">{currentPage + 1}/{totalPages}</span>
          </div>
        </div>
      )}

      {/* ═══════ MAIN VIEWER AREA ═══════ */}
      <div className="flex-1 relative overflow-hidden flex flex-col">

        {/* Loading overlay */}
        {pdfLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d0d0d]/90 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-full border-4 border-gray-700 border-t-red-500 animate-spin mb-4" />
            <p className="text-sm font-bold text-gray-400">
              Loading {pageImages.length}/{totalPages || '...'} pages
            </p>
            {totalPages > 0 && (
              <div className="w-48 h-1.5 bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${(pageImages.length / totalPages) * 100}%` }} />
              </div>
            )}
          </div>
        )}

        {/* Thumbnail Grid Overlay (mobile) */}
        {showThumbnails && hasPages && (
          <div className="absolute inset-0 z-40 bg-[#0d0d0d] overflow-auto p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">All Pages</h3>
              <button onClick={() => setShowThumbnails(false)} className="text-gray-400 text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-800">Close</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {pageImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`rounded-lg overflow-hidden border-2 ${currentPage === idx ? 'border-red-500' : 'border-gray-700'}`}
                >
                  <img src={img} alt={`Page ${idx + 1}`} className="w-full aspect-[3/4] object-cover" draggable={false} />
                  <div className={`text-[10px] font-bold text-center py-1 ${currentPage === idx ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    Page {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Desktop: Left Arrow */}
        {hasPages && currentPage > 0 && (
          <button
            onClick={prevPage}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-xl border border-white/10 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Newspaper Page Image — EDGE-TO-EDGE on mobile, centered on desktop */}
        <div
          className="epaper-viewer flex-1 overflow-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {hasPages && pageImages[currentPage] ? (
            <div className="md:flex md:justify-center md:py-4 md:px-4">
              <div style={{ transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: 'top center' }}>
                <img
                  src={pageImages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="w-full md:w-auto md:max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px] md:max-h-[calc(100vh-180px)] md:object-contain select-none block"
                  draggable={false}
                  style={{ boxShadow: zoom === 1 ? undefined : '0 8px 40px rgba(0,0,0,0.6)' }}
                />
              </div>
            </div>
          ) : !pdfLoading ? (
            <div className="flex items-center justify-center min-h-[60vh] w-full">
              <div className="text-center">
                <BookOpen className="w-14 h-14 mx-auto mb-3 text-gray-700" />
                <p className="font-medium text-gray-500 text-sm">Select an edition to read</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Desktop: Right Arrow */}
        {hasPages && currentPage < totalPages - 1 && (
          <button
            onClick={nextPage}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-xl border border-white/10 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ═══════ MOBILE BOTTOM NAV BAR (Lokmat-style) ═══════ */}
      {hasPages && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 shrink-0 safe-bottom">
          {/* Page counter + mini strip */}
          <div className="flex items-center gap-1 px-2 pt-2 pb-1 overflow-x-auto scrollbar-thin">
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className={`shrink-0 min-w-[28px] h-6 rounded text-[10px] font-bold ${
                  currentPage === idx
                    ? 'bg-red-600 text-white'
                    : idx < pageImages.length
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-800/40 text-gray-600'
                }`}
                disabled={idx >= pageImages.length}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          {/* Prev / Grid / Next */}
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={prevPage}
              disabled={currentPage <= 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                currentPage > 0 ? 'bg-gray-800 text-white active:bg-gray-700' : 'text-gray-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="p-2.5 rounded-lg bg-gray-800 text-gray-300 active:bg-gray-700"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                currentPage < totalPages - 1 ? 'bg-gray-800 text-white active:bg-gray-700' : 'text-gray-600'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════ DESKTOP BOTTOM THUMBNAIL STRIP ═══════ */}
      {hasPages && totalPages > 0 && (
        <div className="hidden md:block bg-[#111] border-t border-gray-800 px-6 py-2 shrink-0">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {pageImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${currentPage === idx
                    ? 'border-red-500 ring-2 ring-red-500/30 scale-105'
                    : 'border-gray-700 hover:border-gray-600 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Page ${idx + 1}`} className="w-14 h-20 object-cover" draggable={false} />
                  <div className={`text-[8px] font-bold text-center py-0.5 ${currentPage === idx ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scrollbar + safe area styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar { height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #4b5563; }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>
    </div>
  )
}

export default EnewspaperPage
