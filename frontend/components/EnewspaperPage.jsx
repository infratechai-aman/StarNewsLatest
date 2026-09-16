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

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const docParams = {
          url: selectedPaper.pdfUrl,
          isEvalSupported: false,
        }
        if (token) {
          docParams.httpHeaders = { Authorization: `Bearer ${token}` }
        }

        const loadingTask = pdfjsLib.getDocument(docParams)

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
        // If first paper fails, fallback to second paper if available
        if (newspapers.length > 1 && selectedPaper?.id === newspapers[0]?.id) {
          console.log('Falling back to next available edition...')
          setSelectedPaper(newspapers[1])
        }
      } finally {
        setPdfLoading(false)
      }
    }

    loadPdf()
  }, [selectedPaper, newspapers])

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
    <div ref={containerRef} className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-white min-h-screen flex flex-col`}>

      {/* ═══════ HERO BANNER ═══════ */}
      {!isFullscreen && (
        <div className="relative w-full overflow-hidden h-[160px] md:h-[200px]">
          <Image src="/enewspaper_banner_1789519347864.jpg" alt="E-Newspaper" fill className="absolute inset-0 object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
          <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col justify-center h-full">
            <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-3">E-Newspaper</p>
            <h1 className="text-white text-3xl md:text-4xl font-black leading-tight mb-2">
              Read the Latest <span className="text-red-500 italic">Edition</span>
            </h1>
            <p className="text-gray-300 text-xs md:text-sm max-w-md mb-3 md:mb-5 hidden sm:block">Your trusted source for in-depth news, analysis and stories from across India.</p>
            <div className="hidden md:flex flex-wrap gap-6">
              {[
                { icon: '📖', title: 'Daily Editions', sub: 'Read anytime, anywhere' },
                { icon: '📱', title: 'Multi-Device', sub: 'Desktop, tablet, mobile' },
                { icon: '⬇️', title: 'Download', sub: 'Save for offline reading' },
              ].map(item => (
                <div key={item.title} className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg border border-white/20 bg-white/10 flex items-center justify-center text-lg">{item.icon}</div>
                  <div>
                    <p className="text-white text-xs font-black">{item.title}</p>
                    <p className="text-gray-400 text-[10px]">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MAIN 3-COLUMN LAYOUT ═══════ */}
      <div className={`flex-1 ${isFullscreen ? 'h-screen fixed inset-0 z-50 bg-[#f8f9fa]' : 'max-w-[1400px] mx-auto w-full px-4 lg:px-6 py-8'} flex flex-col md:flex-row gap-6`}>
        
        {/* LEFT SIDEBAR: Calendar & Quick Access (Hidden in fullscreen) */}
        {!isFullscreen && (
          <div className="hidden md:flex flex-col w-[260px] shrink-0 gap-6">
            {/* Calendar Widget */}
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <span className="text-gray-500">📅</span>
                <h3 className="font-black text-sm text-gray-900">Select Edition</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <button className="text-gray-400 hover:text-gray-900"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="font-bold text-sm text-gray-900">September 2026</span>
                  <button className="text-gray-400 hover:text-gray-900"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-gray-400 font-bold">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                  {Array.from({length: 30}, (_,i) => i+1).map(d => (
                    <button key={d} className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors ${d === 16 ? 'bg-red-600 text-white font-bold' : d > 16 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Access List */}
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <span className="text-gray-500">📄</span>
                <h3 className="font-black text-sm text-gray-900">Quick Access</h3>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { name: 'Front Page', pages: 'Page 1', active: true },
                  { name: 'National', pages: 'Pages 2-4' },
                  { name: 'Maharashtra', pages: 'Pages 5-7' },
                  { name: 'City News', pages: 'Pages 8-10' },
                  { name: 'Business & Economy', pages: 'Pages 11-12' },
                  { name: 'Sports', pages: 'Pages 13-14' },
                  { name: 'Entertainment', pages: 'Pages 15-16' },
                  { name: 'Editorial & Opinion', pages: 'Pages 17-18' },
                ].map(item => (
                  <button key={item.name} className={`w-full text-left px-3 py-2 rounded-lg flex flex-col transition-colors ${item.active ? 'bg-red-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className={`text-[10px] ${item.active ? 'text-red-200' : 'text-gray-500'}`}>{item.pages}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CENTER VIEWER: The main EPaper reading experience */}
        <div className="flex-1 flex flex-col min-w-0 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white h-[calc(100vh-140px)] md:h-[800px]">
          
          {/* Black Toolbar (Inside Viewer) */}
          <div className="bg-[#1a1a1a] px-4 py-3 flex items-center justify-between shrink-0">
            {/* Left */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-red-600 flex items-center justify-center shrink-0">
                <Newspaper className="h-4 w-4 text-white" />
              </div>
              <h2 className="hidden sm:block text-sm font-black text-white">StarNews <span className="text-red-500">ePaper</span></h2>
            </div>
            
            {/* Center (Title/Edition) */}
            <div className="hidden lg:flex items-center gap-3 bg-[#2a2a2a] px-5 py-1.5 rounded-full border border-gray-700">
              <span className="text-[10px] font-black text-gray-400 tracking-wider">COURT ORDER</span>
              <span className="text-[11px] font-bold text-white">Thu, 9 Apr, 2026</span>
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-1.5">
              <button onClick={handleZoomOut} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-[11px] font-bold text-gray-400 min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><ZoomIn className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-gray-700 mx-2" />
              <button onClick={handleShare} className="hidden sm:block p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><Share2 className="w-4 h-4" /></button>
              <button onClick={handlePrint} className="hidden sm:block p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><Printer className="w-4 h-4" /></button>
              <button onClick={() => selectedPaper && handleDownload(selectedPaper)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"><Download className="w-4 h-4" /></button>
              <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sub-toolbar: Pages Strip */}
          <div className="bg-[#111] border-t border-[#2a2a2a] px-4 py-2 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden sm:block w-[50px]">PAGES</span>
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-thin px-4 max-w-xl mx-auto">
              {Array.from({ length: totalPages || 1 }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`shrink-0 w-8 h-8 rounded-full text-[11px] font-bold transition-all ${
                    currentPage === idx
                      ? 'bg-red-600 text-white'
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
            <span className="text-[11px] font-bold text-gray-500 shrink-0 w-[50px] text-right">{currentPage + 1}/{totalPages || 1}</span>
          </div>

          {/* White Canvas Viewer */}
          <div className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            
            {/* Loading Overlay */}
            {pdfLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gray-100/90 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin mb-3" />
                <p className="text-sm font-bold text-gray-800">Loading {pageImages.length}/{totalPages || '...'} pages</p>
              </div>
            )}

            {/* The PDF Image */}
            <div className="epaper-viewer flex-1 overflow-auto bg-[#e5e5e5] relative w-full h-full p-4 md:p-8">
              {hasPages && pageImages[currentPage] ? (
                <div className="w-full flex justify-center">
                  <div style={{ transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: 'top center', transition: 'transform 0.2s ease' }} className="shadow-2xl">
                    <img
                      src={pageImages[currentPage]}
                      alt={`Page ${currentPage + 1}`}
                      className="max-w-[1000px] w-full object-contain bg-white"
                      draggable={false}
                    />
                  </div>
                </div>
              ) : !pdfLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 font-bold">Select an edition to read</p>
                </div>
              ) : null}
            </div>

            {/* Floating Navigation Arrows */}
            {hasPages && currentPage > 0 && (
              <button onClick={prevPage} className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center bg-black/60 hover:bg-black/80 text-white backdrop-blur shadow-xl flex">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {hasPages && currentPage < totalPages - 1 && (
              <button onClick={nextPage} className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center bg-black/60 hover:bg-black/80 text-white backdrop-blur shadow-xl flex">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: Today's Edition & Others (Hidden in fullscreen) */}
        {!isFullscreen && (
          <div className="hidden xl:flex flex-col w-[320px] shrink-0 gap-6">
            {/* Today's Edition */}
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-5">
              <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <h3 className="font-black text-sm text-gray-900">Today's Edition</h3>
              </div>
              <p className="text-xs font-bold text-gray-800 mb-1">Wednesday, 16 September 2026</p>
              <p className="text-[11px] text-gray-500 mb-1">Pune Edition</p>
              <p className="text-[11px] text-gray-400 mb-5">12 Pages | ₹5</p>
              
              <button className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors mb-3">
                <BookOpen className="w-4 h-4" /> Read Now
              </button>
              <button onClick={() => selectedPaper && handleDownload(selectedPaper)} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold py-2.5 rounded-lg transition-colors">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>

            {/* Other Editions */}
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-5">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">📅</span>
                  <h3 className="font-black text-sm text-gray-900">Other Editions</h3>
                </div>
                <button className="text-[10px] font-bold text-red-600">View All →</button>
              </div>
              
              <div className="space-y-4">
                {[
                  { day: 'Tuesday', date: '15 September 2026', img: '/epaper-thumb-1.jpg' },
                  { day: 'Monday', date: '14 September 2026', img: '/epaper-thumb-2.jpg' },
                  { day: 'Sunday', date: '13 September 2026', img: '/epaper-thumb-3.jpg' },
                  { day: 'Saturday', date: '12 September 2026', img: '/epaper-thumb-4.jpg' },
                  { day: 'Friday', date: '11 September 2026', img: '/epaper-thumb-5.jpg' },
                ].map(ed => (
                  <div key={ed.day} className="flex gap-3 cursor-pointer group">
                    <div className="w-12 h-16 bg-gray-100 border border-gray-200 rounded overflow-hidden shadow-sm group-hover:border-red-400 transition-colors shrink-0 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="flex-1 py-1">
                      <h4 className="font-black text-xs text-gray-900 group-hover:text-red-600 transition-colors">{ed.day}</h4>
                      <p className="text-[10px] text-gray-500">{ed.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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
