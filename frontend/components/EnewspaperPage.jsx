'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Download, FileText, CalendarDays,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Printer, Share2,
  RotateCcw, Loader2, LayoutGrid, AlertCircle, Check
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { MONTH_NAMES, DAY_NAMES, CALENDAR_DAY_HEADERS, getLocalizedCity } from '@/lib/translations'

// ─── Main Component ──────────────────────────────────────────────────────────
const EnewspaperPage = () => {
  const { t, language } = useLanguage()
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
  const [calMonth, setCalMonth] = useState(null) // { y, m } shown in the edition calendar
  const [pdfError, setPdfError] = useState(false)
  const [shareDone, setShareDone] = useState(false)

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
      setPdfError(false)

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
        setPdfError(true)
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
      return
    }
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareDone(true)
      setTimeout(() => setShareDone(false), 1800)
    } catch { /* clipboard blocked */ }
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
    const loc = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN'
    return new Date(date).toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Edition date helpers (real data, no hard-coded dates)
  const paperDate = (p) => {
    const raw = p?.editionDate || p?.publishDate || p?.createdAt
    const d = raw ? new Date(raw) : null
    return d && !isNaN(d) ? d : null
  }
  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const editionsByDay = new Map()
  newspapers.forEach((p) => { const d = paperDate(p); if (d && !editionsByDay.has(dayKey(d))) editionsByDay.set(dayKey(d), p) })
  const selDate = paperDate(selectedPaper)
  const viewMonth = calMonth || (selDate ? { y: selDate.getFullYear(), m: selDate.getMonth() } : { y: new Date().getFullYear(), m: new Date().getMonth() })
  const monthLabel = `${(MONTH_NAMES[language] || MONTH_NAMES.en)[viewMonth.m]} ${viewMonth.y}`
  const firstWeekday = new Date(viewMonth.y, viewMonth.m, 1).getDay()
  const daysInMonth = new Date(viewMonth.y, viewMonth.m + 1, 0).getDate()
  const today = new Date()
  const shiftMonth = (delta) => {
    const d = new Date(viewMonth.y, viewMonth.m + delta, 1)
    setCalMonth({ y: d.getFullYear(), m: d.getMonth() })
  }
  const longDate = (d) => d
    ? `${(DAY_NAMES[language] || DAY_NAMES.en)[d.getDay()]}, ${d.getDate()} ${(MONTH_NAMES[language] || MONTH_NAMES.en)[d.getMonth()]} ${d.getFullYear()}`
    : ''
  const openPaper = (p) => {
    if (!p) return
    setSelectedPaper(p)
    setCurrentPage(0)
    const d = paperDate(p)
    if (d) setCalMonth({ y: d.getFullYear(), m: d.getMonth() })
  }
  const pagesWord = (n) => language === 'mr' ? 'पृष्ठे' : language === 'hi' ? 'पृष्ठ' : (n === 1 ? 'Page' : 'Pages')
  const noOtherText = language === 'mr' ? 'इतर आवृत्त्या नाहीत' : language === 'hi' ? 'कोई अन्य संस्करण नहीं' : 'No other editions yet'

  const L = (en, mr, hi) => (language === 'mr' ? mr : language === 'hi' ? hi : en)
  const coverOf = (p) => (p?.id === selectedPaper?.id && pageImages[0]) || p?.thumbnailUrl || null

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="bg-[#f6f3ee] min-h-[70vh]">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-10 animate-pulse">
          <div className="h-3 w-24 bg-black/10 rounded mb-4" />
          <div className="h-10 w-72 bg-black/10 rounded mb-8" />
          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            <div className="hidden lg:block h-[520px] bg-black/[0.06] rounded-2xl" />
            <div className="h-[520px] bg-black/[0.06] rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Empty state ───
  if (newspapers.length === 0) {
    return (
      <div className="bg-[#f6f3ee] min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-5"><FileText className="h-7 w-7 text-gray-400" /></div>
          <h3 className="font-serif text-2xl text-gray-900 mb-2">{t('noEpapers') || 'No E-Newspapers Available'}</h3>
          <p className="text-sm text-gray-500">{t('checkBackLater') || 'Check back later for new editions'}</p>
        </div>
      </div>
    )
  }

  const hasPages = pageImages.length > 0
  const pageCount = totalPages || pageImages.length
  const loadPct = totalPages ? Math.round((pageImages.length / totalPages) * 100) : 0

  const ActionButtons = ({ compact = false }) => (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => handleDownload(selectedPaper)} className={`inline-flex items-center gap-2 rounded-full bg-[#B71C1C] text-white font-semibold shadow-sm hover:bg-[#9f1818] active:scale-95 transition ${compact ? 'h-9 px-3.5 text-[13px]' : 'h-10 px-5 text-sm'}`}>
        <Download className="w-4 h-4" /> {L('Download', 'डाउनलोड', 'डाउनलोड')}
      </button>
      <button type="button" onClick={handlePrint} aria-label="Print" className={`hidden sm:inline-flex items-center justify-center rounded-full bg-white border border-black/10 text-gray-800 hover:bg-gray-50 active:scale-95 transition ${compact ? 'h-9 w-9' : 'h-10 w-10'}`}>
        <Printer className="w-4 h-4" />
      </button>
      <button type="button" onClick={handleShare} aria-label="Share" className={`inline-flex items-center justify-center rounded-full bg-white border border-black/10 text-gray-800 hover:bg-gray-50 active:scale-95 transition ${compact ? 'h-9 w-9' : 'h-10 w-10'}`}>
        {shareDone ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
      </button>
    </div>
  )

  const ToolbarButton = ({ onClick, disabled, label, children }) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className="h-9 w-9 inline-flex items-center justify-center rounded-full text-gray-200 hover:bg-white/10 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition">
      {children}
    </button>
  )

  return (
    <div className="bg-[#f6f3ee] min-h-screen text-gray-900">
      {/* ═══════ MASTHEAD ═══════ */}
      {!isFullscreen && (
        <header className="border-b border-black/[0.08] bg-[linear-gradient(180deg,#fbf9f5_0%,#f6f3ee_100%)]">
          <div className="max-w-[1320px] mx-auto px-4 md:px-8 pt-6 pb-5 md:pt-10 md:pb-8">
            <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.18em] uppercase text-[#B71C1C]">
              <span>{t('eNewspaper') || 'E-Paper'}</span>
              <span className="h-px w-10 bg-[#B71C1C]/40" />
              <span className="text-gray-500 tracking-[0.14em]">{getLocalizedCity('Pune', language)} {t('edition') || 'Edition'}</span>
            </div>
            <div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="font-serif text-[34px] leading-[1.05] md:text-6xl tracking-tight text-gray-950">Star News India</h1>
                <p className="mt-2 text-sm md:text-base text-gray-600">
                  <span className="font-semibold text-gray-900">{selectedPaper?.title}</span>
                  {selDate && <span> · {longDate(selDate)}</span>}
                  {pageCount > 0 && <span> · {pageCount} {pagesWord(pageCount)}</span>}
                </p>
              </div>
              <ActionButtons />
            </div>
            {/* double rule, like a printed masthead */}
            <div className="mt-6 md:mt-8 border-t-2 border-gray-900" />
            <div className="mt-[3px] border-t border-gray-900/60" />
          </div>
        </header>
      )}

      {/* ═══════ EDITIONS STRIP (phones / tablets) ═══════ */}
      {!isFullscreen && (
        <div className="lg:hidden max-w-[1320px] mx-auto px-4 pt-4">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-gray-500 mb-2.5">{L('Editions', 'आवृत्त्या', 'संस्करण')}</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-hide">
            {newspapers.map((p) => {
              const d = paperDate(p); const active = p.id === selectedPaper?.id; const cover = coverOf(p)
              return (
                <button key={p.id} type="button" onClick={() => openPaper(p)}
                  className={`snap-start shrink-0 w-[132px] text-left rounded-xl overflow-hidden bg-white transition active:scale-95 ${active ? 'ring-2 ring-[#B71C1C] shadow-md' : 'ring-1 ring-black/[0.08]'}`}>
                  <div className="aspect-[3/4] bg-[#ece8e1] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {cover ? <img src={cover} alt="" className="w-full h-full object-cover object-top" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="w-6 h-6 text-gray-400" /></div>}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-[12px] font-bold text-gray-900 line-clamp-1">{d ? `${d.getDate()} ${(MONTH_NAMES[language] || MONTH_NAMES.en)[d.getMonth()].slice(0, 3)}` : p.title}</p>
                    <p className="text-[10.5px] text-gray-500 line-clamp-1">{p.title}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════ BODY ═══════ */}
      <div className={`${isFullscreen ? '' : 'max-w-[1320px] mx-auto px-4 md:px-8 py-4 md:py-8'} grid lg:grid-cols-[300px_minmax(0,1fr)] gap-8`}>

        {/* ── Sidebar: calendar + editions (desktop) ── */}
        {!isFullscreen && (
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-5">
              <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
                  <p className="text-sm font-bold flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-[#B71C1C]" />{monthLabel}</p>
                  <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-1">
                  {(CALENDAR_DAY_HEADERS[language] || CALENDAR_DAY_HEADERS.en).map((d) => <span key={d} className="py-1">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: firstWeekday }).map((_, i) => <span key={`b${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const date = new Date(viewMonth.y, viewMonth.m, day)
                    const paper = editionsByDay.get(dayKey(date))
                    const isSel = selDate && dayKey(selDate) === dayKey(date)
                    const isToday = dayKey(today) === dayKey(date)
                    return (
                      <button key={day} type="button" disabled={!paper} onClick={() => openPaper(paper)}
                        className={`h-8 rounded-lg text-[12.5px] font-semibold transition ${isSel ? 'bg-[#B71C1C] text-white shadow-sm' : paper ? 'bg-[#B71C1C]/[0.08] text-[#B71C1C] hover:bg-[#B71C1C]/15' : 'text-gray-300'} ${isToday && !isSel ? 'ring-1 ring-gray-900/40' : ''}`}>
                        {day}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 text-[11px] text-gray-500 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#B71C1C]/15 inline-block" />{L('Edition available', 'आवृत्ती उपलब्ध', 'संस्करण उपलब्ध')}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-gray-500 mb-3">{L('Recent editions', 'अलीकडील आवृत्त्या', 'हाल के संस्करण')}</p>
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {newspapers.length <= 1 && <p className="text-xs text-gray-400">{noOtherText}</p>}
                  {newspapers.map((p) => {
                    const d = paperDate(p); const active = p.id === selectedPaper?.id; const cover = coverOf(p)
                    return (
                      <button key={p.id} type="button" onClick={() => openPaper(p)}
                        className={`w-full flex gap-3 p-2 rounded-xl text-left transition ${active ? 'bg-white ring-1 ring-[#B71C1C]/40 shadow-sm' : 'hover:bg-white/70'}`}>
                        <div className="w-12 h-16 rounded-md overflow-hidden bg-[#ece8e1] shrink-0 ring-1 ring-black/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {cover ? <img src={cover} alt="" className="w-full h-full object-cover object-top" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="w-4 h-4 text-gray-400" /></div>}
                        </div>
                        <div className="min-w-0 py-0.5">
                          <p className={`text-[13px] font-bold line-clamp-1 ${active ? 'text-[#B71C1C]' : 'text-gray-900'}`}>{p.title}</p>
                          <p className="text-[11.5px] text-gray-500 mt-0.5">{d ? getFormattedDate(d) : ''}</p>
                          {active && <p className="text-[10px] font-bold uppercase tracking-wider text-[#B71C1C] mt-1">{L('Reading now', 'आता वाचत आहात', 'अभी पढ़ रहे हैं')}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ── Reader ── */}
        <section ref={containerRef} className={`min-w-0 ${isFullscreen ? 'bg-[#1c1c1e] min-h-screen flex flex-col' : ''}`}>
          {/* Toolbar */}
          <div className={`${isFullscreen ? '' : 'sticky top-[104px] lg:top-28 z-20 rounded-2xl'} bg-[#1c1c1e]/95 backdrop-blur text-white flex items-center justify-between gap-2 px-2 md:px-3 h-12 shadow-[0_8px_24px_rgba(0,0,0,0.18)]`}>
            <div className="flex items-center gap-0.5">
              <ToolbarButton onClick={prevPage} disabled={currentPage === 0} label={L('Previous page', 'मागील पृष्ठ', 'पिछला पृष्ठ')}><ChevronLeft className="w-5 h-5" /></ToolbarButton>
              <span className="text-[13px] font-semibold tabular-nums min-w-[64px] text-center">
                {hasPages ? `${currentPage + 1} / ${pageCount || '…'}` : '— / —'}
              </span>
              <ToolbarButton onClick={nextPage} disabled={!hasPages || currentPage >= pageImages.length - 1} label={L('Next page', 'पुढील पृष्ठ', 'अगला पृष्ठ')}><ChevronRight className="w-5 h-5" /></ToolbarButton>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="hidden md:flex items-center gap-0.5 mr-1 pr-1 border-r border-white/10">
                <ToolbarButton onClick={handleZoomOut} disabled={!hasPages || zoom <= 0.5} label="Zoom out"><ZoomOut className="w-4 h-4" /></ToolbarButton>
                <button type="button" onClick={resetZoom} className="text-[12px] font-semibold tabular-nums w-12 h-9 rounded-full hover:bg-white/10" title="Reset zoom">{Math.round(zoom * 100)}%</button>
                <ToolbarButton onClick={handleZoomIn} disabled={!hasPages || zoom >= 3} label="Zoom in"><ZoomIn className="w-4 h-4" /></ToolbarButton>
              </div>
              <ToolbarButton onClick={() => setShowThumbnails((v) => !v)} disabled={!hasPages} label={L('All pages', 'सर्व पृष्ठे', 'सभी पृष्ठ')}><LayoutGrid className={`w-4 h-4 ${showThumbnails ? 'text-red-400' : ''}`} /></ToolbarButton>
              <ToolbarButton onClick={toggleFullscreen} label={isFullscreen ? 'Exit full screen' : 'Full screen'}>{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</ToolbarButton>
            </div>
          </div>

          {/* Loading progress */}
          {pdfLoading && (
            <div className={`${isFullscreen ? 'mx-4' : ''} mt-3 h-1 rounded-full bg-black/10 overflow-hidden`}>
              <div className="h-full bg-[#B71C1C] transition-[width] duration-300" style={{ width: `${Math.max(loadPct, 6)}%` }} />
            </div>
          )}

          {/* Thumbnail grid */}
          {showThumbnails && hasPages && (
            <div className={`${isFullscreen ? 'mx-4' : ''} mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 rounded-2xl bg-white ring-1 ring-black/[0.06]`}>
              {pageImages.map((src, i) => (
                <button key={i} type="button" onClick={() => goToPage(i)} className={`group text-center ${i === currentPage ? '' : 'opacity-80 hover:opacity-100'}`}>
                  <div className={`aspect-[3/4] rounded-md overflow-hidden bg-white ring-1 transition ${i === currentPage ? 'ring-2 ring-[#B71C1C]' : 'ring-black/10 group-hover:ring-black/30'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Page ${i + 1}`} className="w-full h-full object-cover object-top" />
                  </div>
                  <span className={`block mt-1 text-[11px] font-bold ${i === currentPage ? 'text-[#B71C1C]' : 'text-gray-500'}`}>{i + 1}</span>
                </button>
              ))}
            </div>
          )}

          {/* Page */}
          <div
            className={`epaper-viewer relative overflow-auto ${isFullscreen ? 'flex-1 p-4 md:p-8' : 'mt-4 rounded-2xl bg-[#e9e6e0] p-3 sm:p-6 md:p-10 min-h-[60vh]'}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {hasPages && pageImages[currentPage] ? (
              <div className="flex justify-center">
                <div style={{ transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}
                  className="bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08),0_24px_48px_-12px_rgba(0,0,0,0.28)] ring-1 ring-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img key={currentPage} src={pageImages[currentPage]} alt={`Page ${currentPage + 1}`} className="block max-w-[980px] w-full animate-in fade-in duration-300" draggable={false} />
                </div>
              </div>
            ) : pdfLoading ? (
              <div className="flex justify-center">
                <div className="w-full max-w-[680px] aspect-[3/4] bg-white/80 shadow-lg rounded-sm p-6 sm:p-10 animate-pulse">
                  <div className="h-8 w-2/3 mx-auto bg-gray-200 rounded mb-6" />
                  <div className="h-px bg-gray-300 mb-6" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 h-40 bg-gray-200 rounded" />
                    <div className="space-y-2">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-3 bg-gray-200 rounded" />)}</div>
                  </div>
                  <div className="mt-6 space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-3 bg-gray-200 rounded" />)}</div>
                  <p className="mt-8 text-center text-xs font-semibold text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {L(`Preparing pages ${pageImages.length}/${totalPages || '…'}`, `पृष्ठे तयार होत आहेत ${pageImages.length}/${totalPages || '…'}`, `पृष्ठ तैयार हो रहे हैं ${pageImages.length}/${totalPages || '…'}`)}
                  </p>
                </div>
              </div>
            ) : pdfError && selectedPaper?.pdfUrl ? (
              <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center max-w-sm bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
                  <AlertCircle className="w-8 h-8 text-[#B71C1C] mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 mb-1">{L("This edition couldn't be opened here.", 'ही आवृत्ती येथे उघडता आली नाही.', 'यह संस्करण यहाँ नहीं खुल सका।')}</p>
                  <p className="text-sm text-gray-500 mb-5">{L('You can still open or download the PDF.', 'तुम्ही PDF उघडू किंवा डाउनलोड करू शकता.', 'आप PDF खोल या डाउनलोड कर सकते हैं।')}</p>
                  <a href={selectedPaper.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#B71C1C] text-white text-sm font-semibold active:scale-95 transition">
                    <FileText className="w-4 h-4" /> {L('Open PDF', 'PDF उघडा', 'PDF खोलें')}
                  </a>
                </div>
              </div>
            ) : (
              <div className="min-h-[50vh] flex items-center justify-center text-gray-500 font-semibold">{t('selectEditionToRead') || 'Select an edition to read'}</div>
            )}

            {/* Side arrows on large screens */}
            {hasPages && (
              <>
                <button type="button" onClick={prevPage} disabled={currentPage === 0} aria-label="Previous page"
                  className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/90 shadow-md items-center justify-center hover:bg-white disabled:opacity-0 transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button type="button" onClick={nextPage} disabled={currentPage >= pageImages.length - 1} aria-label="Next page"
                  className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/90 shadow-md items-center justify-center hover:bg-white disabled:opacity-0 transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Page strip */}
          {hasPages && pageImages.length > 1 && (
            <div ref={pageStripRef} className={`${isFullscreen ? 'px-4 pb-4' : ''} mt-4 flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide`}>
              {pageImages.map((src, i) => (
                <button key={i} data-page={i} type="button" onClick={() => goToPage(i)}
                  className={`shrink-0 w-14 md:w-16 rounded-md overflow-hidden transition ${i === currentPage ? 'ring-2 ring-[#B71C1C] opacity-100' : 'ring-1 ring-black/10 opacity-70 hover:opacity-100'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Page ${i + 1}`} className="w-full aspect-[3/4] object-cover object-top bg-white" />
                </button>
              ))}
            </div>
          )}

          {!isFullscreen && hasPages && (
            <p className="md:hidden mt-2 text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3 h-3" /> {L('Swipe left or right to turn pages', 'पृष्ठ बदलण्यासाठी डावीकडे/उजवीकडे स्वाइप करा', 'पृष्ठ बदलने के लिए बाएँ/दाएँ स्वाइप करें')}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default EnewspaperPage
