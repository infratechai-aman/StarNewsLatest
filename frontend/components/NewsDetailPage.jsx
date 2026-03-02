'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, Clock, ArrowLeft, Share2, Bookmark, Facebook, Twitter, MessageCircle, Quote } from 'lucide-react'
import Image from 'next/image'
import { getLocalizedText, getTranslatedCategory } from '@/lib/newsData'
import { useLanguage } from '@/contexts/LanguageContext'
import { getArticleAdSettings } from '@/lib/contentStore'
import { news } from '@/lib/api'

const NewsDetailPage = ({ article, setCurrentView, setSelectedArticle }) => {
  const { language, t } = useLanguage()

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
    const settings = getArticleAdSettings()
    if (settings) {
      setArticleAdSettings(settings)
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
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10" key={language}>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-16">
        <Button
          variant="ghost"
          onClick={handleBackToHome}
          className="group flex items-center gap-4 font-black text-xs tracking-[0.3em] uppercase hover:bg-gray-100 rounded-full px-8 h-12 border-2 border-transparent hover:border-gray-200 transition-all"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-2 transition-transform text-red-600" />
          {t('backToHome')}
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-16">
        {/* Main Article Content */}
        <article className="lg:col-span-8 space-y-10 select-none" onContextMenu={(e) => e.preventDefault()}>
          {/* Header Section */}
          <div className="space-y-8">
            <Badge className="bg-red-600 text-white px-6 py-2 font-black uppercase text-[10px] tracking-[0.4em] border-none shadow-[0_10px_30px_-5px_rgba(220,38,38,0.5)]">
              {category}
            </Badge>

            <h1 className="text-4xl md:text-7xl font-heading font-black text-gray-900 leading-[0.9] tracking-tighter drop-shadow-sm">
              {title}
            </h1>
          </div>

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-8 py-10 border-y border-gray-100">
            {(article.authorName || article.author?.name) && (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-red-50/50">
                  {(article.authorName || article.author?.name)?.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{t('writtenBy') || 'Correspondent'}</p>
                  <p className="font-heading font-black text-xl text-gray-900 tracking-tight">{article.authorName || article.author.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-10 text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-auto">
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-red-600" />
                </div>
                {formatDate(article.publishedAt || article.createdAt)}
              </span>
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-red-600" />
                </div>
                {(article.views || 0).toLocaleString()}
              </span>
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
              <div className="relative w-full rounded-[48px] overflow-hidden shadow-2xl border-8 border-white ring-1 ring-gray-100" style={{ paddingTop: '56.25%' }}>
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
            <div className="relative aspect-video rounded-[48px] overflow-hidden shadow-2xl border-8 border-white ring-1 ring-gray-100">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
              <Image
                src={article.mainImage}
                alt={title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Lead/Short Description */}
          {(article.metaDescription || article.shortDescription) && (
            <div className="relative p-12 bg-gray-50 rounded-[40px] border-l-[12px] border-red-600 shadow-sm overflow-hidden">
              <Quote className="absolute top-8 right-10 w-20 h-20 text-red-600/5 rotate-12" />
              <p className="text-2xl font-heading font-black text-gray-900 leading-tight tracking-tight italic relative z-10">
                {getLocalizedText(article.metaDescription || article.shortDescription, language)}
              </p>
            </div>
          )}

          {/* Article Body with Inline Gallery Images */}
          <div className="prose prose-2xl max-w-none text-gray-800 leading-[1.8] magazine-body font-serif selection:bg-red-100">
            {(() => {
              const galleryImgs = article.galleryImages && article.galleryImages.length > 0 ? article.galleryImages : []

              if (galleryImgs.length === 0) {
                // No gallery images — render content normally
                return (
                  <div
                    className="text-2xl md:text-3xl text-gray-800 space-y-8 font-serif-premium subpixel-antialiased"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )
              }

              // Split content into paragraphs to insert images inline
              // Split on </p> tags while keeping the tags
              const parts = content ? content.split(/(<\/p>)/i) : ['']
              const paragraphs = []
              for (let i = 0; i < parts.length; i += 2) {
                const text = parts[i] + (parts[i + 1] || '')
                if (text.trim()) paragraphs.push(text)
              }

              // If we can't split meaningfully, just put images after first chunk
              if (paragraphs.length <= 1) {
                return (
                  <>
                    <div
                      className="text-2xl md:text-3xl text-gray-800 space-y-8 font-serif-premium subpixel-antialiased"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                    <div className="my-12 space-y-8">
                      {galleryImgs.map((img, idx) => (
                        <div key={idx} className="relative w-full rounded-[32px] overflow-hidden shadow-xl border-4 border-white" style={{ aspectRatio: '16/10' }}>
                          <Image
                            src={img}
                            alt={`${title} - Image ${idx + 2}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )
              }

              // Insert gallery images after the first paragraph
              const insertAfterIdx = Math.min(0, paragraphs.length - 1)
              const firstPart = paragraphs.slice(0, insertAfterIdx + 1).join('')
              const secondPart = paragraphs.slice(insertAfterIdx + 1).join('')

              return (
                <>
                  {/* First part of the article */}
                  <div
                    className="text-2xl md:text-3xl text-gray-800 space-y-8 font-serif-premium subpixel-antialiased"
                    dangerouslySetInnerHTML={{ __html: firstPart }}
                  />

                  {/* Inline Gallery Images */}
                  <div className="my-12 space-y-8">
                    {galleryImgs.map((img, idx) => (
                      <div key={idx} className="relative w-full rounded-[32px] overflow-hidden shadow-xl border-4 border-white" style={{ aspectRatio: '16/10' }}>
                        <Image
                          src={img}
                          alt={`${title} - Image ${idx + 2}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Rest of the article */}
                  {secondPart && (
                    <div
                      className="text-2xl md:text-3xl text-gray-800 space-y-8 font-serif-premium subpixel-antialiased"
                      dangerouslySetInnerHTML={{ __html: secondPart }}
                    />
                  )}
                </>
              )
            })()}
          </div>
        </article>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 space-y-12">
          {/* Related Stories */}
          <div className="bg-gray-50 rounded-[48px] p-10 border border-gray-100">
            <div className="flex items-center gap-4 mb-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 shrink-0">
                {t('relatedStories')}
              </h3>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>
            <div className="space-y-10">
              {relatedNews.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex gap-6 group cursor-pointer"
                  onClick={() => handleRelatedClick(item)}
                >
                  <div className="relative w-28 h-28 shrink-0 rounded-[28px] overflow-hidden bg-white shadow-md ring-4 ring-white transition-transform group-hover:scale-105 duration-500">
                    <Image
                      src={item.mainImage || item.images?.[0] || '/placeholder-news.svg'}
                      alt={getLocalizedText(item.title, language)}
                      fill
                      className="object-cover border-none"
                    />
                  </div>
                  <div className="flex-1 py-1 flex flex-col justify-center">
                    <h4 className="font-heading font-black text-lg leading-tight group-hover:text-red-600 transition-colors tracking-tight line-clamp-2">
                      {getLocalizedText(item.title, language)}
                    </h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-red-500" /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Advertisement */}
          {articleAdSettings.banner?.enabled !== false && (
            <div className="premium-card rounded-[48px] overflow-hidden shadow-2xl border-8 border-white bg-white ring-1 ring-gray-100">
              <div className="relative aspect-[4/5]">
                {articleAdSettings.banner?.imageUrl ? (
                  <a href={articleAdSettings.banner?.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
                    <Image
                      src={articleAdSettings.banner.imageUrl}
                      alt="Ad"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-[4000ms]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10">
                      <Badge className="bg-red-600 text-white border-none mb-4 uppercase font-black text-[10px] tracking-widest shadow-lg px-4 py-1.5">{t('sponsored') || 'Editor\'s Choice'}</Badge>
                      <h4 className="text-white font-heading font-black text-3xl leading-[1.1] tracking-tighter italic">Experience Peak Influence</h4>
                    </div>
                  </a>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex flex-col items-center justify-center p-14 text-center text-white relative">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <Badge className="absolute top-10 left-10 bg-white/10 backdrop-blur-md text-white border border-white/20 font-black text-[10px] tracking-[0.3em] px-5 py-2">PREMIUM</Badge>
                    <p className="text-4xl font-serif italic font-bold mb-6 drop-shadow-lg">🎯 {t('yourAdHere') || 'Exclusive Reach'}</p>
                    <p className="text-xs uppercase tracking-[0.4em] font-black opacity-40 mb-10 leading-relaxed">Reach Millions • Dominate Your Market</p>
                    <Button className="rounded-full bg-red-600 text-white font-black hover:bg-white hover:text-red-600 transition-all px-12 h-14 shadow-xl text-xs tracking-widest">
                      {t('getInTouch') || 'CONTACT US'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Stories Sidebar */}
          <div className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="flex items-center gap-4 mb-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 shrink-0">
                {t('topStories') || 'Hot Right Now'}
              </h3>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
            <div className="space-y-10">
              {sidebarLatest.map((newsItem, idx) => (
                <div
                  key={newsItem.id}
                  className="flex gap-6 cursor-pointer group"
                  onClick={() => handleRelatedClick(newsItem)}
                >
                  <span className="font-heading font-black text-5xl text-gray-100 group-hover:text-blue-600/30 transition-all leading-none shrink-0 italic transform -rotate-6">0{idx + 1}</span>
                  <div className="pt-1">
                    <p className="font-heading font-black text-xl leading-[1.2] group-hover:text-blue-600 transition-colors tracking-tight line-clamp-3">
                      {getLocalizedText(newsItem.title, language)}
                    </p>
                    <Badge className="mt-3 bg-blue-50 text-blue-600 border-none font-black text-[8px] tracking-widest px-3 py-1 uppercase">{getTranslatedCategory(newsItem.category, language)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical Sticky Ad */}
          {articleAdSettings.sticky?.enabled !== false && (
            <div className="sticky top-24">
              <div className="rounded-[48px] overflow-hidden shadow-2xl border-8 border-white ring-1 ring-gray-100 aspect-[3/4.5] relative group">
                {articleAdSettings.sticky?.imageUrl ? (
                  <a href={articleAdSettings.sticky?.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
                    <Image
                      src={articleAdSettings.sticky.imageUrl}
                      alt="Ad"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-[6000ms]"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    <Badge className="absolute top-8 right-8 bg-black/60 backdrop-blur-md text-white border-none font-black text-[9px] uppercase tracking-[0.2em] px-4 py-2 opacity-80">{t('advertisement')}</Badge>
                  </a>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-700 to-blue-900 flex flex-col items-center justify-center p-12 text-center text-white relative">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <Badge className="absolute top-10 right-10 bg-white/20 text-white border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 backdrop-blur-sm">EDITORIAL</Badge>
                    <p className="text-3xl font-heading font-black italic mb-4 leading-none tracking-tighter transform -rotate-2">Premium Discovery</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-4 whitespace-nowrap">High-Impact Vertical</p>
                    <div className="w-16 h-1 bg-white/30 rounded-full mt-4"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
        <style jsx>{`
        .font-serif-premium {
          font-family: var(--font-playfair), serif;
        }
        .magazine-body :global(p) {
          margin-bottom: 2rem;
        }
        .magazine-body :global(p:first-of-type::first-letter) {
          float: left;
          font-size: 5.5rem;
          line-height: 1;
          padding: 0.5rem 0.75rem 0.25rem 0;
          font-family: var(--font-playfair), serif;
          font-weight: 900;
          color: #dc2626;
        }
      `}</style>
      </div>
    </div>
  )
}

export default NewsDetailPage
