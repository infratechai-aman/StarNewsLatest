'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Calendar, Download, Newspaper, FileText,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Printer, Share2,
  RotateCcw, BookOpen, Loader2
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

  const containerRef = useRef(null)
  const imageContainerRef = useRef(null)
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

      try {
        // Load pdfjs from CDN to avoid webpack/ESM conflicts with pdfjs-dist v5.x
        const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168'
        
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = `${PDFJS_CDN}/pdf.min.mjs`
            script.type = 'module'
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
          // Fallback: try the UMD build if module didn't expose pdfjsLib
          if (!window.pdfjsLib) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script')
              script.src = `${PDFJS_CDN}/pdf.min.js`
              script.onload = resolve
              script.onerror = reject
              document.head.appendChild(script)
            })
          }
        }

        const pdfjsLib = window.pdfjsLib
        if (!pdfjsLib) throw new Error('Failed to load PDF.js library')
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.mjs`

        const loadingTask = pdfjsLib.getDocument({
          url: selectedPaper.pdfUrl,
          isEvalSupported: false,
        })

        const pdf = await loadingTask.promise
        setTotalPages(pdf.numPages)

        const scale = 2.5 // High resolution for zoom
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: context, viewport }).promise
          const imageUrl = canvas.toDataURL('image/jpeg', 0.92)
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
    if (n >= 0 && n < totalPages) {
      setCurrentPage(n)
      setZoom(1)
    }
  }, [totalPages])

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])

  // Zoom
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

  // Touch/Swipe handling for mobile page navigation
  const handleTouchStart = useCallback((e) => {
    if (zoom > 1) return // Don't swipe when zoomed in
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [zoom])

  const handleTouchEnd = useCallback((e) => {
    if (zoom > 1 || touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    // Only trigger if horizontal swipe is dominant
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
      <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12 pt-8 bg-[#0a0a0a] min-h-screen">
        <div className="animate-pulse">
          <div className="h-14 bg-gray-800 rounded-xl mb-4" />
          <div className="h-[700px] bg-gray-800/50 rounded-[24px]" />
        </div>
      </div>
    )
  }

  // ─── Empty state ───
  if (newspapers.length === 0) {
    return (
      <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12 pt-8 bg-[#0a0a0a] min-h-screen">
        <div className="text-center py-24 bg-gray-900 rounded-[32px] border border-dashed border-gray-700">
          <FileText className="h-16 w-16 mx-auto mb-6 text-gray-600" />
          <h3 className="text-xl font-heading font-black text-gray-400 mb-2">{t('noEpapers') || 'No E-Newspapers Available'}</h3>
          <p className="text-sm text-gray-500">{t('checkBackLater') || 'Check back later for new editions'}</p>
        </div>
      </div>
    )
  }

  const hasPages = pageImages.length > 0

  return (
    <div ref={containerRef} className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-[#0d0d0d] min-h-screen flex flex-col`}>

      {/* ─── Top Toolbar ─── */}
      <div className="bg-[#141414] border-b border-gray-800 px-3 md:px-6 py-2 shrink-0">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto gap-2">
          {/* Left: Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-red-600 flex items-center justify-center">
              <Newspaper className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black tracking-tight text-white">
                StarNews <span className="text-red-500">ePaper</span>
              </h1>
            </div>
          </div>

          {/* Center: Edition Selector */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
            <select
              className="h-8 px-2 md:px-3 pr-6 md:pr-7 rounded-lg text-[11px] md:text-xs font-semibold appearance-none cursor-pointer outline-none bg-gray-800 border border-gray-700 text-white max-w-[200px] md:max-w-none truncate"
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
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={handleZoomOut} className="p-1.5 md:p-2 rounded-lg hover:bg-gray-800 text-gray-400" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-gray-500 min-w-[32px] text-center hidden sm:block">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 md:p-2 rounded-lg hover:bg-gray-800 text-gray-400" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom !== 1 && (
              <button onClick={resetZoom} className="p-1.5 md:p-2 rounded-lg hover:bg-gray-800 text-gray-400" title="Reset Zoom">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <div className="w-px h-5 bg-gray-700 mx-1 hidden sm:block" />
            <button onClick={handleShare} className="p-1.5 md:p-2 rounded-lg hidden sm:block hover:bg-gray-800 text-gray-400" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={handlePrint} className="p-1.5 md:p-2 rounded-lg hidden sm:block hover:bg-gray-800 text-gray-400" title="Print">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={() => selectedPaper && handleDownload(selectedPaper)} className="p-1.5 md:p-2 rounded-lg hover:bg-gray-800 text-gray-400" title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} className="p-1.5 md:p-2 rounded-lg hover:bg-gray-800 text-gray-400" title={isFullscreen ? 'Exit' : 'Fullscreen'}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Page Number Strip ─── */}
      {totalPages > 0 && (
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-3 md:px-6 py-2 shrink-0">
          <div className="max-w-[1920px] mx-auto flex items-center gap-2">
            {/* Page label */}
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 hidden sm:block">Pages</span>
            {/* Numbered page strip */}
            <div ref={pageStripRef} className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin flex-1 py-1">
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  data-page={idx}
                  onClick={() => goToPage(idx)}
                  className={`shrink-0 min-w-[32px] h-8 md:min-w-[36px] md:h-9 rounded-lg text-xs font-bold transition-all duration-200 ${
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
            {/* Page counter */}
            <span className="text-[11px] font-bold text-gray-500 shrink-0">
              {currentPage + 1}/{totalPages}
            </span>
          </div>
        </div>
      )}

      {/* ─── Main Viewer Area ─── */}
      <div className="flex-1 relative overflow-hidden flex items-start justify-center">

        {/* Loading overlay */}
        {pdfLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d0d0d]/90 backdrop-blur-sm">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-red-500 animate-spin" />
            </div>
            <p className="text-sm font-bold text-gray-400">
              Loading {pageImages.length}/{totalPages || '...'} pages
            </p>
            {totalPages > 0 && (
              <div className="w-48 h-1.5 bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full transition-all duration-300"
                  style={{ width: `${(pageImages.length / totalPages) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Left Navigation Arrow */}
        {hasPages && currentPage > 0 && (
          <button
            onClick={prevPage}
            className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all shadow-xl border border-white/10"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {/* Newspaper Page Image */}
        <div
          ref={imageContainerRef}
          className="w-full h-full overflow-auto flex items-start justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: zoom > 1 ? 'pan-x pan-y' : 'manipulation' }}
        >
          {hasPages && pageImages[currentPage] ? (
            <div
              className="transition-transform duration-200 ease-out py-4 px-2 md:px-4"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
              }}
            >
              <img
                src={pageImages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="max-w-full md:max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px] w-full h-auto shadow-2xl rounded-sm select-none"
                draggable={false}
                style={{ 
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                }}
              />
              {/* Page number watermark */}
              <div className="text-center mt-2 text-[11px] font-bold text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </div>
            </div>
          ) : !pdfLoading ? (
            <div className="flex items-center justify-center min-h-[60vh] w-full">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                <p className="font-medium text-gray-500">Select an edition to read</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Navigation Arrow */}
        {hasPages && currentPage < totalPages - 1 && (
          <button
            onClick={nextPage}
            className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all shadow-xl border border-white/10"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
      </div>

      {/* ─── Bottom Thumbnail Strip (Desktop only) ─── */}
      {hasPages && totalPages > 0 && (
        <div className="bg-[#111] border-t border-gray-800 px-3 md:px-6 py-2 shrink-0 hidden md:block">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {pageImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${currentPage === idx
                    ? 'border-red-500 ring-2 ring-red-500/30 scale-105'
                    : 'border-gray-700 hover:border-gray-600 opacity-60 hover:opacity-100'
                  }`}
                  title={`Page ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Page ${idx + 1}`}
                    className="w-12 h-16 md:w-14 md:h-20 object-cover"
                    draggable={false}
                  />
                  <div className={`text-[8px] font-bold text-center py-0.5 ${currentPage === idx
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  )
}

export default EnewspaperPage
