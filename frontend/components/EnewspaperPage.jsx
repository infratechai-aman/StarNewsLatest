'use client'

import { useState, useEffect, useRef, useCallback, forwardRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Download, Newspaper, FileText,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Printer, Share2,
  RotateCcw, BookOpen, Loader2
} from 'lucide-react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── PDF Page Component (rendered as canvas → image) ─────────────────────────
const PdfPageImage = forwardRef(({ pageImageUrl, pageNumber, width, height }, ref) => {
  return (
    <div ref={ref} className="page-content bg-white shadow-lg" data-page={pageNumber}>
      {pageImageUrl ? (
        <img
          src={pageImageUrl}
          alt={`Page ${pageNumber}`}
          className="w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-gray-300 animate-spin" />
            <p className="text-xs text-gray-400 font-medium">Loading page {pageNumber}...</p>
          </div>
        </div>
      )}
    </div>
  )
})
PdfPageImage.displayName = 'PdfPageImage'

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
  const [flipBookReady, setFlipBookReady] = useState(false)

  const flipBookRef = useRef(null)
  const containerRef = useRef(null)
  const [HTMLFlipBook, setHTMLFlipBook] = useState(null)

  // Dynamically import react-pageflip (client-side only)
  useEffect(() => {
    import('react-pageflip').then(mod => {
      setHTMLFlipBook(() => mod.default)
    })
  }, [])

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
      setFlipBookReady(false)

      try {
        const pdfjsLib = await import('pdfjs-dist')

        // Use local worker copied to public folder
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const loadingTask = pdfjsLib.getDocument({
          url: selectedPaper.pdfUrl,
        })

        const pdf = await loadingTask.promise
        setTotalPages(pdf.numPages)

        // Render all pages as images
        const images = []
        const scale = 2 // High resolution

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = viewport.width
          canvas.height = viewport.height

          await page.render({ canvasContext: context, viewport }).promise

          const imageUrl = canvas.toDataURL('image/jpeg', 0.92)
          images.push(imageUrl)

          // Update progressively
          setPageImages(prev => [...prev, imageUrl])
        }

        setFlipBookReady(true)
      } catch (err) {
        console.error('Failed to load PDF:', err)
      } finally {
        setPdfLoading(false)
      }
    }

    loadPdf()
  }, [selectedPaper])

  // Page flip handlers
  const nextPage = () => flipBookRef.current?.pageFlip()?.flipNext()
  const prevPage = () => flipBookRef.current?.pageFlip()?.flipPrev()
  const goToPage = (n) => flipBookRef.current?.pageFlip()?.flip(n)

  const onFlip = useCallback((e) => {
    setCurrentPage(e.data)
  }, [])

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
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, toggleFullscreen])

  // Date helpers
  const getFormattedDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getDisplayLabel = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return "Today's Edition"
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  // Compute flipbook dimensions
  const flipDimensions = useMemo(() => {
    if (isFullscreen) return { width: Math.min(600, window.innerWidth / 2 - 40), height: window.innerHeight - 140 }
    if (typeof window !== 'undefined' && window.innerWidth < 768) return { width: window.innerWidth - 32, height: (window.innerWidth - 32) * 1.4 }
    return { width: 550, height: 750 }
  }, [isFullscreen])

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12 pt-8">
        <div className="animate-pulse">
          <div className="h-14 bg-slate-100 rounded-xl mb-4" />
          <div className="h-[700px] bg-slate-100 rounded-[24px]" />
        </div>
      </div>
    )
  }

  // ─── Empty state ───
  if (newspapers.length === 0) {
    return (
      <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12 pt-8">
        <div className="text-center py-24 bg-gradient-to-br from-slate-50 to-gray-50 rounded-[32px] border border-dashed border-gray-200">
          <FileText className="h-16 w-16 mx-auto mb-6 text-gray-200" />
          <h3 className="text-xl font-heading font-black text-gray-400 mb-2">{t('noEpapers') || 'No editions available'}</h3>
          <p className="text-sm text-gray-400">{t('checkBackLater') || 'Check back later for the latest edition.'}</p>
        </div>
      </div>
    )
  }

  const dark = isFullscreen

  return (
    <div ref={containerRef} className={`${dark ? 'fixed inset-0 z-50 bg-[#0a0a0a]' : ''}`}>
      {/* ─── Top Toolbar ─── */}
      <div className={`${dark ? 'bg-[#111] border-b border-gray-800' : 'bg-white border-b border-gray-100 shadow-sm'} px-4 md:px-6 py-2.5`}>
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center">
              <Newspaper className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-sm font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                StarNews <span className="text-red-600">ePaper</span>
              </h1>
            </div>
          </div>

          {/* Center: Edition + Page */}
          <div className="flex items-center gap-3">
            <select
              className={`h-8 px-3 pr-7 rounded-lg text-xs font-semibold appearance-none cursor-pointer outline-none ${dark
                ? 'bg-gray-800 border border-gray-700 text-white'
                : 'bg-gray-50 border border-gray-200 text-gray-900'
                }`}
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

            {totalPages > 0 && (
              <div className={`hidden sm:flex items-center gap-1 text-xs font-bold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                <span>Page</span>
                <span className={dark ? 'text-white' : 'text-gray-900'}>{currentPage + 1}</span>
                <span>of {totalPages}</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button onClick={handleShare} className={`p-2 rounded-lg hidden sm:block ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={handlePrint} className={`p-2 rounded-lg hidden sm:block ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Print">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={() => selectedPaper && handleDownload(selectedPaper)} className={`p-2 rounded-lg ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} className={`p-2 rounded-lg ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title={isFullscreen ? 'Exit' : 'Fullscreen'}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Viewer Area ─── */}
      <div className={`relative flex items-center justify-center ${dark ? 'h-[calc(100vh-100px)]' : 'min-h-[700px] md:min-h-[800px]'} px-4 md:px-8 py-6`}>

        {/* Left Navigation Arrow */}
        {flipBookReady && currentPage > 0 && (
          <button
            onClick={prevPage}
            className={`absolute left-2 md:left-6 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-xl ${dark
              ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            title="Previous Page"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* FlipBook Viewer */}
        <div className="relative">
          {pdfLoading && (
            <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl ${dark ? 'bg-[#0a0a0a]/80' : 'bg-white/80'} backdrop-blur-sm`}>
              <div className="relative mb-4">
                <div className={`w-16 h-16 rounded-full border-4 ${dark ? 'border-gray-700 border-t-red-500' : 'border-gray-100 border-t-red-600'} animate-spin`} />
              </div>
              <p className={`text-sm font-bold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading {pageImages.length}/{totalPages || '...'} pages
              </p>
              {totalPages > 0 && (
                <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${(pageImages.length / totalPages) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {flipBookReady && HTMLFlipBook && pageImages.length > 0 && (
            <HTMLFlipBook
              ref={flipBookRef}
              width={flipDimensions.width}
              height={flipDimensions.height}
              size="stretch"
              minWidth={300}
              maxWidth={700}
              minHeight={400}
              maxHeight={900}
              showCover={true}
              mobileScrollSupport={false}
              onFlip={onFlip}
              className="flipbook-shadow"
              style={{}}
              startPage={0}
              drawShadow={true}
              flippingTime={800}
              usePortrait={typeof window !== 'undefined' && window.innerWidth < 768}
              startZIndex={0}
              autoSize={true}
              maxShadowOpacity={0.5}
              showPageCorners={true}
              disableFlipByClick={false}
              swipeDistance={30}
              clickEventForward={true}
              useMouseEvents={true}
            >
              {pageImages.map((imgUrl, idx) => (
                <div key={idx} className="page bg-white">
                  <div className="w-full h-full relative overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                    {/* Page number watermark */}
                    <div className={`absolute bottom-2 ${idx % 2 === 0 ? 'right-3' : 'left-3'} text-[10px] font-bold text-gray-400/60`}>
                      {idx + 1}
                    </div>
                  </div>
                </div>
              ))}
            </HTMLFlipBook>
          )}

          {/* Placeholder while loading */}
          {!flipBookReady && !pdfLoading && (
            <div className={`flex items-center justify-center rounded-2xl border-2 border-dashed ${dark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}
              style={{ width: flipDimensions.width * 2, height: flipDimensions.height, maxWidth: '100%' }}
            >
              <div className="text-center">
                <BookOpen className={`w-16 h-16 mx-auto mb-4 ${dark ? 'text-gray-600' : 'text-gray-200'}`} />
                <p className={`font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Select an edition to read</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Navigation Arrow */}
        {flipBookReady && currentPage < totalPages - 1 && (
          <button
            onClick={nextPage}
            className={`absolute right-2 md:right-6 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-xl ${dark
              ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            title="Next Page"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ─── Bottom Page Strip ─── */}
      {flipBookReady && totalPages > 0 && (
        <div className={`${dark ? 'bg-[#111] border-t border-gray-800' : 'bg-white border-t border-gray-100'} px-4 md:px-8 py-3`}>
          <div className="max-w-[1920px] mx-auto">
            {/* Page thumbnails strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {pageImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${currentPage === idx
                    ? 'border-red-500 ring-2 ring-red-200 scale-105'
                    : dark
                      ? 'border-gray-700 hover:border-gray-600 opacity-60 hover:opacity-100'
                      : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                    }`}
                  title={`Page ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Page ${idx + 1}`}
                    className="w-14 h-20 md:w-16 md:h-24 object-cover"
                    draggable={false}
                  />
                  <div className={`text-[8px] font-bold text-center py-0.5 ${currentPage === idx
                    ? 'bg-red-600 text-white'
                    : dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                    }`}>
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FlipBook shadow styles */}
      <style jsx global>{`
        .flipbook-shadow {
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15));
        }
        .page {
          background: white;
        }
        .stf__parent {
          margin: 0 auto;
        }
        /* Page corner hint animation */
        @keyframes corner-peek {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-5px, -5px); }
        }
      `}</style>
    </div>
  )
}

export default EnewspaperPage
