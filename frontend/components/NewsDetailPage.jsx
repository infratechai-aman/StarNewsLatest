'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, Clock, ArrowLeft, Share2, Bookmark, Facebook, Twitter, MessageCircle, Quote } from 'lucide-react'
import Image from 'next/image'
import { getLocalizedText, getTranslatedCategory } from '@/lib/newsData'
import { useLanguage } from '@/contexts/LanguageContext'
import { getArticleAdSettings } from '@/lib/contentStore'
import { news } from '@/lib/api'
import DOMPurify from 'dompurify'

/**
 * SECURITY: Sanitize HTML content to prevent XSS attacks.
 * Only allows safe formatting tags — strips all scripts, event handlers, and dangerous attributes.
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'code',
    'span', 'div', 'sub', 'sup', 'hr', 'table', 'thead',
    'tbody', 'tr', 'th', 'td', 'img', 'figure', 'figcaption',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
    'class', 'style', 'title', 'colspan', 'rowspan',
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
};

function sanitizeHtml(html) {
  if (!html) return '';
  if (typeof window === 'undefined') return html; // SSR fallback
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

const NewsDetailPage = ({ article, setCurrentView, setSelectedArticle }) => {
  const { language, t } = useLanguage()
  const [fontSizeLevel, setFontSizeLevel] = useState('base') // 'sm' | 'base' | 'lg'

  // Article page ad settings state
  const [articleAdSettings, setArticleAdSettings] = useState({
    banner: { enabled: true, imageUrl: '', linkUrl: '', title: 'Advertise Your Business' },
    sticky: { enabled: true, imageUrl: '', linkUrl: '', title: 'Premium Ad Space' }
  })

  // State for latest news from API
  const [latestNews, setLatestNews] = useState([])
  const [relatedNewsFromApi, setRelatedNewsFromApi] = useState([])

  // Load article ad settings on mount
  useEffect(() => {
    const loadSettings = () => {
      const settings = getArticleAdSettings()
      if (settings) {
        setArticleAdSettings(settings)
      }
    }
    loadSettings()
    if (typeof window !== 'undefined') {
      window.addEventListener('adSettingsChanged', loadSettings)
      window.addEventListener('storage', loadSettings)
      return () => {
        window.removeEventListener('adSettingsChanged', loadSettings)
        window.removeEventListener('storage', loadSettings)
      }
    }
  }, [])

  // Fetch latest news from API
  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const response = await news.getAll({ limit: 20 })
        const articles = response?.articles || response || []

        // Ensure articles is an array
        if (!Array.isArray(articles)) {
          throw new Error('Invalid response format')
        }

        // Sort by date (newest first) and exclude current article
        const sorted = articles
          .filter(a => a && a.id !== article?.id)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

        setLatestNews(sorted.slice(0, 5))



        // Find related news by category
        const currentCategory = getLocalizedText(article?.category, 'en')?.toLowerCase() || ''
        if (currentCategory) {
          const related = sorted.filter(a => {
            const cat = getLocalizedText(a?.category, 'en')?.toLowerCase() || ''
            return cat === currentCategory
          }).slice(0, 4)
          setRelatedNewsFromApi(related.length > 0 ? related : sorted.slice(0, 4))
        } else {
          setRelatedNewsFromApi(sorted.slice(0, 4))
        }
      } catch (error) {
        console.error('Failed to fetch latest news:', error)
        setLatestNews([])
        setRelatedNewsFromApi([])
      }
    }
    if (article?.id) {
      fetchLatestNews()
    }
  }, [article?.id])

  if (!article) return null

  // Get localized content
  const title = getLocalizedText(article.title, language)
  const category = getLocalizedText(article.category, language)
  const content = getLocalizedText(article.content, language)

  // Get related news - use API data if available, otherwise fallback to static
  const relatedNews = relatedNewsFromApi
  const sidebarLatest = latestNews.slice(0, 5)

  // Format date based on language
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const locale = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle related news click
  const handleRelatedClick = (newsItem) => {
    setSelectedArticle(newsItem)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }



  // Handle back to home
  const handleBackToHome = () => {
    if (setCurrentView) {
      setCurrentView('home')
    }
    if (setSelectedArticle) {
      setSelectedArticle(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 min-w-0 overflow-x-hidden" key={language}>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] md:text-xs font-bold text-gray-500 mb-4 md:mb-6 overflow-hidden whitespace-nowrap min-w-0">
        <button onClick={handleBackToHome} className="hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 shrink-0">
          <ArrowLeft className="w-3 md:w-3.5 h-3 md:h-3.5" /> Home
        </button>
        <span className="shrink-0 text-gray-400">&gt;</span>
        <button onClick={() => {if(setCurrentView) setCurrentView('news')}} className="hover:text-red-600 transition-colors cursor-pointer shrink-0">
          News
        </button>
        <span className="shrink-0 text-gray-400">&gt;</span>
        <button className="hover:text-red-600 transition-colors cursor-pointer shrink-0">
          {category}
        </button>
        <span className="shrink-0 text-gray-400">&gt;</span>
        <span className="text-gray-900 truncate min-w-0 flex-1">{title}</span>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-12 w-full min-w-0">
        {/* Main Article Content */}
        <article className="lg:col-span-8 space-y-5 sm:space-y-6 select-none w-full min-w-0 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
          {/* Header Section */}
          <div className="space-y-3 sm:space-y-4 w-full min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Badge className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1 font-bold uppercase text-[11px] border-none rounded-full shrink-0 shadow-sm">
                {category}
              </Badge>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="flex bg-gray-100 rounded-full p-0.5 sm:p-1 border border-gray-200">
                  <button 
                    onClick={() => setFontSizeLevel('sm')} 
                    className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-full transition-all ${fontSizeLevel === 'sm' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'}`}
                    title="Small Font"
                  >
                    A-
                  </button>
                  <button 
                    onClick={() => setFontSizeLevel('base')} 
                    className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-full transition-all ${fontSizeLevel === 'base' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'}`}
                    title="Standard Font"
                  >
                    A
                  </button>
                  <button 
                    onClick={() => setFontSizeLevel('lg')} 
                    className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-full transition-all ${fontSizeLevel === 'lg' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'}`}
                    title="Large Font"
                  >
                    A+
                  </button>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-black bg-gray-100 rounded-full border border-gray-200 transition-all">
                  <Bookmark className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[38px] font-black text-gray-900 leading-[1.15] tracking-tight break-words [overflow-wrap:anywhere] w-full">
              {title}
            </h1>
            
            {(article.metaDescription || article.shortDescription) && (
              <p className="text-sm sm:text-base md:text-lg font-medium text-gray-600 leading-snug break-words [overflow-wrap:anywhere] w-full">
                {getLocalizedText(article.metaDescription || article.shortDescription, language)}
              </p>
            )}
          </div>

          {/* Author & Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 sm:py-4 border-y border-gray-200 w-full min-w-0">
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] font-bold text-gray-500 min-w-0">
              {(article.authorName || article.author?.name) && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                    {(() => {
                      const name = article.authorName || article.author?.name
                      return (name === 'Pune Majha News' ? 'StarNews Admin' : name)?.charAt(0)
                    })()}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-900 text-xs font-bold">
                      {(article.authorName || article.author?.name) === 'Pune Majha News' ? 'StarNews Admin' : (article.authorName || article.author?.name)}
                    </span>
                    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" />
                    </svg>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 border-l border-gray-300 pl-3 sm:pl-4 min-w-0">
                <span className="flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {formatDate(article.publishedAt || article.createdAt)}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  5 min read
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
              <span className="text-[11px] font-bold text-gray-500 mr-1">Share:</span>
              <button className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"><Facebook className="w-3.5 h-3.5" /></button>
              <button className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </button>
              <button className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-full bg-gray-600 text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Visual Content: Video or Image */}
          {(article.youtubeUrl || article.videoUrl) ? (() => {
            const url = article.youtubeUrl || article.videoUrl
            let videoId = ''
            if (url.includes('youtube.com/watch')) {
              videoId = url.split('v=')[1]?.split('&')[0] || ''
            } else if (url.includes('youtu.be/')) {
              videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
            } else if (url.includes('youtube.com/embed/')) {
              videoId = url.split('embed/')[1]?.split('?')[0] || ''
            }
            if (!videoId) return null
            return (
              <div className="relative w-full max-w-full rounded-xl overflow-hidden shadow-sm min-w-0" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0`}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            )
          })() : article.mainImage && (
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 w-full max-w-full min-w-0">
              <Image
                src={article.mainImage}
                alt={title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-600 text-white text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded shadow-sm">
                FILE PHOTO
              </div>
            </div>
          )}

          {/* Article Body with Inline Gallery Images */}
          <div className={`text-gray-800 leading-relaxed space-y-6 pb-6 break-words [overflow-wrap:anywhere] article-prose-content w-full min-w-0 ${
            fontSizeLevel === 'sm' ? 'text-sm sm:text-base' : fontSizeLevel === 'lg' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
          }`}>
            {(() => {
              const galleryImgs = article.galleryImages && article.galleryImages.length > 0 ? article.galleryImages : []

              if (galleryImgs.length === 0) {
                return (
                  <div
                    className="space-y-6 article-prose-content break-words [overflow-wrap:anywhere] w-full min-w-0"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                  />
                )
              }

              const parts = content ? content.split(/(<\/p>)/i) : ['']
              const paragraphs = []
              for (let i = 0; i < parts.length; i += 2) {
                const text = parts[i] + (parts[i + 1] || '')
                if (text.trim()) paragraphs.push(text)
              }

              if (paragraphs.length <= 1) {
                return (
                  <>
                    <div
                      className="space-y-6 article-prose-content break-words [overflow-wrap:anywhere] w-full min-w-0"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                    />
                    <div className="my-6 sm:my-8 space-y-6 w-full min-w-0">
                      {galleryImgs.map((img, idx) => (
                        <div key={idx} className="relative w-full max-w-full rounded-xl overflow-hidden shadow-sm" style={{ aspectRatio: '16/10' }}>
                          <Image src={img} alt={`${title} - Image ${idx + 2}`} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </>
                )
              }

              const insertAfterIdx = Math.min(1, paragraphs.length - 1)
              const firstPart = paragraphs.slice(0, insertAfterIdx + 1).join('')
              const secondPart = paragraphs.slice(insertAfterIdx + 1).join('')

              return (
                <>
                  <div
                    className="space-y-6 article-prose-content break-words [overflow-wrap:anywhere] w-full min-w-0"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(firstPart) }}
                  />
                  <div className="my-6 sm:my-8 space-y-6 w-full min-w-0">
                    {galleryImgs.map((img, idx) => (
                      <div key={idx} className="relative w-full max-w-full rounded-xl overflow-hidden shadow-sm" style={{ aspectRatio: '16/10' }}>
                        <Image src={img} alt={`${title} - Image ${idx + 2}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                  {secondPart && (
                    <div
                      className="space-y-6 article-prose-content break-words [overflow-wrap:anywhere] w-full min-w-0"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(secondPart) }}
                    />
                  )}
                </>
              )
            })()}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-5 border-t border-gray-200 w-full min-w-0">
            <span className="text-xs sm:text-sm font-bold text-gray-500 shrink-0">Tags:</span>
            {['Tablighi Jamaat', 'Delhi High Court', 'Corona', 'Judiciary', 'India News'].map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-gray-600 border-gray-300 font-medium px-3 sm:px-4 py-1 text-xs rounded-full hover:bg-gray-50 transition-colors">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Author Box */}
          <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 my-6 sm:my-8 w-full min-w-0 overflow-hidden">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-sm shrink-0">
                S
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">StarNews Admin</h4>
                  <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">News Desk</p>
              </div>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors"><Facebook className="w-4 h-4" /></button>
                <button className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                <button className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                </button>
                <button className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></button>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Trusted, Unbiased, For the People.</p>
            </div>
          </div>

          {/* Prev/Next Articles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full min-w-0">
            <button className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-gray-200 hover:border-red-600 hover:bg-red-50/50 transition-colors text-left group w-full min-w-0 overflow-hidden">
              <ArrowLeft className="w-5 h-5 text-red-500 group-hover:-translate-x-1 transition-transform shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase mb-0.5">Previous Article</p>
                <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 break-words">Nitish Kumar took oath as the Chief Minister of Bihar for the 10th time</p>
              </div>
            </button>
            <button className="flex items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-gray-200 hover:border-red-600 hover:bg-red-50/50 transition-colors text-right group w-full min-w-0 overflow-hidden">
              <div className="min-w-0 flex-1 text-left sm:text-right">
                <p className="text-[11px] font-bold text-gray-500 uppercase mb-0.5">Next Article</p>
                <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 break-words">No time limit for governors, no endless delays: Supreme Court</p>
              </div>
              <ArrowLeft className="w-5 h-5 text-red-500 rotate-180 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>
        </article>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 space-y-6 sm:space-y-8 w-full min-w-0 overflow-hidden">
          {/* Related Stories */}
          <div className="w-full min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-red-600 rounded-full shrink-0"></div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {t('relatedStories')}
              </h3>
              <button className="ml-auto text-xs font-bold text-blue-600 hover:underline shrink-0">View All +</button>
            </div>
            
            <div className="space-y-3 sm:space-y-4 w-full min-w-0">
              {relatedNews.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 sm:gap-4 group cursor-pointer bg-white p-2 rounded-xl hover:bg-gray-50 transition-colors w-full min-w-0"
                  onClick={() => handleRelatedClick(item)}
                >
                  <div className="relative w-20 sm:w-24 h-16 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={item.mainImage || item.images?.[0] || '/placeholder-news.svg'}
                      alt={getLocalizedText(item.title, language)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 py-0.5 sm:py-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-red-600 truncate">{getTranslatedCategory(item.category, language)}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug break-words">
                      {getLocalizedText(item.title, language)}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Now */}
          <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100 w-full min-w-0">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <svg className="w-5 h-5 text-red-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                Trending Now
              </h3>
            </div>
            
            <div className="space-y-4 sm:space-y-5 w-full min-w-0">
              {sidebarLatest.slice(0, 5).map((newsItem, idx) => (
                <div
                  key={newsItem.id}
                  className="flex gap-3 sm:gap-4 items-center group cursor-pointer w-full min-w-0"
                  onClick={() => handleRelatedClick(newsItem)}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-gray-400 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 border border-gray-200">
                    {idx + 1}
                  </div>
                  <div className="relative w-14 sm:w-16 h-10 sm:h-12 shrink-0 rounded-md overflow-hidden bg-gray-100">
                    <Image
                      src={newsItem.mainImage || newsItem.images?.[0] || '/placeholder-news.svg'}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug break-words flex-1 min-w-0">
                    {getLocalizedText(newsItem.title, language)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter / Stay Informed */}
          <div className="bg-red-600 rounded-2xl p-6 sm:p-8 relative overflow-hidden text-white shadow-xl w-full min-w-0">
            <div className="relative z-10 w-full min-w-0">
              <h3 className="text-xl sm:text-2xl font-black leading-tight mb-2 break-words">
                Stay Informed<br/>with StarNews
              </h3>
              <p className="text-red-100 text-xs sm:text-sm mb-5 sm:mb-6 leading-relaxed">
                Get the latest news, breaking updates and top stories delivered to you.
              </p>
              
              <form className="flex flex-col gap-3 w-full" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <Button className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl transition-colors">
                  Subscribe
                </Button>
              </form>
            </div>
            
            <div className="absolute top-4 right-4 opacity-20 transform rotate-45 pointer-events-none">
              <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default NewsDetailPage
