'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Download, Eye, Newspaper, FileText, ChevronRight,
  ChevronLeft, ZoomIn, ZoomOut, Maximize2, Minimize2, X,
  BookOpen, Printer, Share2, RotateCcw
} from 'lucide-react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

const EnewspaperPage = () => {
  const { t } = useLanguage()
  const [newspapers, setNewspapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const viewerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const fetchNewspapers = async () => {
      try {
        const res = await fetch('/api/enewspaper')
        const data = await res.json()
        const papers = data.papers || []
        setNewspapers(papers)
        // Auto-select the latest (today's) edition
        if (papers.length > 0) {
          setSelectedPaper(papers[0])
        }
      } catch (err) {
        console.error('Failed to fetch e-newspapers:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNewspapers()
  }, [])

  const handleDownload = (newspaper) => {
    const link = document.createElement('a')
    link.href = newspaper.pdfUrl
    link.download = `StarNews-${getFormattedDate(newspaper.publishDate || newspaper.editionDate)}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    if (selectedPaper?.pdfUrl) {
      const printWindow = window.open(selectedPaper.pdfUrl, '_blank')
      if (printWindow) {
        printWindow.addEventListener('load', () => printWindow.print())
      }
    }
  }

  const handleShare = async () => {
    if (navigator.share && selectedPaper) {
      try {
        await navigator.share({
          title: `StarNews - ${selectedPaper.title}`,
          text: `Read today's edition of StarNews E-Paper`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    }
  }

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
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 20, 200))
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 20, 50))
  const resetZoom = () => setZoomLevel(100)

  const getFormattedDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getDisplayLabel = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return "Today's Edition"
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday's Edition"
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12 pt-8">
        <div className="animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl mb-6" />
          <div className="flex gap-6">
            <div className="flex-1 h-[700px] bg-slate-100 rounded-[24px]" />
            <div className="w-72 hidden lg:block space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-slate-100 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
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

  return (
    <div ref={containerRef} className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-950' : ''} max-w-[1920px] mx-auto`}>
      {/* Top Toolbar - Professional Newspaper Header */}
      <div className={`${isFullscreen ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-100 shadow-sm'} px-4 md:px-8 py-3`}>
        <div className="flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFullscreen ? 'bg-red-600' : 'bg-red-600'}`}>
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-lg font-heading font-black tracking-tight ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                StarNews <span className="text-red-600">ePaper</span>
              </h1>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isFullscreen ? 'text-gray-400' : 'text-gray-400'}`}>
                {selectedPaper ? getDisplayLabel(selectedPaper.publishDate || selectedPaper.editionDate) : 'Digital Edition'}
              </p>
            </div>
          </div>

          {/* Center: Edition Selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                className={`h-9 px-4 pr-8 rounded-lg text-sm font-semibold appearance-none cursor-pointer outline-none transition-all ${isFullscreen
                  ? 'bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-red-500'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-red-100'
                  }`}
                value={selectedPaper?.id || ''}
                onChange={(e) => {
                  const paper = newspapers.find(p => p.id === e.target.value)
                  if (paper) setSelectedPaper(paper)
                }}
              >
                {newspapers.map(paper => (
                  <option key={paper.id} value={paper.id}>
                    {paper.title} — {getFormattedDate(paper.publishDate || paper.editionDate)}
                  </option>
                ))}
              </select>
              <Calendar className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isFullscreen ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <div className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-lg ${isFullscreen ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <button
                onClick={zoomOut}
                className={`p-1.5 rounded-md transition-colors ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className={`text-xs font-bold min-w-[40px] text-center ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                {zoomLevel}%
              </span>
              <button
                onClick={zoomIn}
                className={`p-1.5 rounded-md transition-colors ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={resetZoom}
                className={`p-1.5 rounded-md transition-colors ${isFullscreen ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleShare}
              className={`p-2 rounded-lg transition-colors hidden sm:block ${isFullscreen ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className={`p-2 rounded-lg transition-colors hidden sm:block ${isFullscreen ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => selectedPaper && handleDownload(selectedPaper)}
              className={`p-2 rounded-lg transition-colors ${isFullscreen ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg transition-colors ${isFullscreen ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex ${isFullscreen ? 'h-[calc(100vh-60px)]' : ''} px-4 md:px-8 py-4 gap-4 max-w-[1920px] mx-auto`}>
        {/* PDF Viewer - Main Area */}
        <div className={`flex-1 ${isFullscreen ? 'bg-gray-900' : 'bg-gray-50 border border-gray-100'} rounded-xl overflow-hidden relative`}>
          {selectedPaper ? (
            <div ref={viewerRef} className="w-full h-full overflow-auto">
              <div
                className="w-full transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  minHeight: isFullscreen ? 'calc(100vh - 60px)' : '800px'
                }}
              >
                <iframe
                  src={`${selectedPaper.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full border-none"
                  style={{ height: isFullscreen ? 'calc(100vh - 60px)' : '800px' }}
                  title="StarNews E-Paper Viewer"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[600px]">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 font-medium">Select an edition to read</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Editions Strip */}
        <div className={`w-72 hidden lg:flex flex-col ${isFullscreen ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'} rounded-xl overflow-hidden`}>
          <div className={`p-4 border-b ${isFullscreen ? 'border-gray-800' : 'border-gray-100'}`}>
            <h3 className={`text-xs font-black uppercase tracking-widest ${isFullscreen ? 'text-gray-400' : 'text-gray-400'}`}>
              All Editions
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {newspapers.map((paper) => {
              const isSelected = selectedPaper?.id === paper.id
              const dateStr = paper.publishDate || paper.editionDate
              return (
                <div
                  key={paper.id}
                  className={`rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border group ${isSelected
                    ? isFullscreen
                      ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500/30'
                      : 'border-red-200 bg-red-50 ring-2 ring-red-100'
                    : isFullscreen
                      ? 'border-gray-800 bg-gray-800/50 hover:border-gray-700 hover:bg-gray-800'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'
                    }`}
                  onClick={() => setSelectedPaper(paper)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                    <Image
                      src={paper.thumbnailUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300'}
                      alt={paper.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="280px"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                        <Badge className="bg-red-600 text-white border-none font-black text-[9px] tracking-widest uppercase shadow-lg">
                          Reading
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className={`${isSelected ? 'bg-red-600' : 'bg-black/60 backdrop-blur-sm'} text-white border-none font-bold text-[8px] tracking-wider uppercase px-2 py-0.5`}>
                        {getDisplayLabel(dateStr)}
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h4 className={`font-bold text-sm leading-tight line-clamp-1 mb-1 ${isFullscreen
                      ? isSelected ? 'text-red-400' : 'text-gray-200'
                      : isSelected ? 'text-red-700' : 'text-gray-800'
                      }`}>
                      {paper.title}
                    </h4>
                    <p className={`text-[10px] font-semibold ${isFullscreen ? 'text-gray-500' : 'text-gray-400'}`}>
                      {getFormattedDate(dateStr)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(paper)
                        }}
                        className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${isFullscreen
                          ? 'text-gray-500 hover:text-gray-300'
                          : 'text-gray-400 hover:text-gray-700'
                          }`}
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPaper(paper)
                        }}
                        className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${isSelected
                          ? 'text-red-600'
                          : isFullscreen ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-red-600'
                          }`}
                      >
                        <Eye className="w-3 h-3" /> Read
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Edition Strip (Horizontal scroll) */}
      <div className={`lg:hidden px-4 pb-4 ${isFullscreen ? 'bg-gray-950' : ''}`}>
        <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${isFullscreen ? 'text-gray-400' : 'text-gray-400'}`}>
          Other Editions
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {newspapers.map((paper) => {
            const isSelected = selectedPaper?.id === paper.id
            const dateStr = paper.publishDate || paper.editionDate
            return (
              <div
                key={paper.id}
                className={`flex-shrink-0 w-36 rounded-xl overflow-hidden cursor-pointer transition-all border ${isSelected
                  ? 'border-red-300 bg-red-50 ring-2 ring-red-100'
                  : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                onClick={() => setSelectedPaper(paper)}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                  <Image
                    src={paper.thumbnailUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300'}
                    alt={paper.title}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                  <div className="absolute top-1.5 left-1.5">
                    <Badge className={`${isSelected ? 'bg-red-600' : 'bg-black/60'} text-white border-none font-bold text-[7px] tracking-wider uppercase px-1.5 py-0.5`}>
                      {getDisplayLabel(dateStr)}
                    </Badge>
                  </div>
                </div>
                <div className="p-2">
                  <h4 className={`font-bold text-xs leading-tight line-clamp-1 ${isSelected ? 'text-red-700' : 'text-gray-800'}`}>
                    {paper.title}
                  </h4>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default EnewspaperPage
