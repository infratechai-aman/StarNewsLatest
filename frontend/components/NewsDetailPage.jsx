'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, Clock, ArrowLeft, Share2, Bookmark, Facebook, Twitter, MessageCircle, Quote } from 'lucide-react'
import Image from 'next/image'
import { newsData, getLocalizedText } from '@/lib/newsData'
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
        const apiArticles = response?.articles || response || []
        // Merge static newsData to ensure translated articles appear in sidebar/related
        const articles = [...newsData, ...apiArticles]

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
        // Fallback to static data
        setLatestNews(newsData.slice(0, 5))
        setRelatedNewsFromApi(newsData.slice(0, 4))
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
  const relatedNews = relatedNewsFromApi.length > 0 ? relatedNewsFromApi : newsData
    .filter(n => n.id !== article.id && getLocalizedText(n.category, 'en') === getLocalizedText(article.category, 'en'))
    .slice(0, 4)

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
    <div className="max-w-6xl mx-auto" key={language}>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-12">
        <Button
          variant="ghost"
          onClick={handleBackToHome}
          className="group flex items-center gap-3 font-black text-xs tracking-widest uppercase hover:bg-gray-100 rounded-full px-6"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t('backToHome')}
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Article Content */}
        <article className="lg:col-span-8 space-y-6 select-none" onContextMenu={(e) => e.preventDefault()}>
          {/* Header Section */}
          <div className="space-y-8">
            <Badge className="bg-red-600 text-white px-5 py-1.5 font-black uppercase text-[10px] tracking-[0.2em] border-none shadow-xl">
              {category}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-heading font-black text-gray-900 leading-[0.9] tracking-tighter">
              {title}
            </h1>
          </div>

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-6 py-8 border-y border-gray-100">
            {(article.authorName || article.author?.name) && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm">
                  {(article.authorName || article.author?.name)?.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('writtenBy') || 'Written By'}</p>
                  <p className="font-bold text-gray-900">{article.authorName || article.author.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-6 text-xs font-bold text-gray-500 uppercase tracking-widest ml-auto">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                {formatDate(article.publishedAt || article.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-red-600" />
                {(article.views || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center gap-4 py-2">
            <span className="text-sm font-medium text-gray-600">{t('share')}</span>
            <Button variant="outline" size="sm" className="rounded-full">
              <Facebook className="h-4 w-4 text-blue-600" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <Twitter className="h-4 w-4 text-sky-500" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <MessageCircle className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-full ml-auto">
              <Bookmark className="h-4 w-4" />
            </Button>
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
              <div className="relative w-full rounded-[32px] overflow-hidden shadow-2xl border border-gray-100" style={{ paddingTop: '56.25%' }}>
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
            <div className="relative aspect-video rounded-[40px] overflow-hidden shadow-2xl border border-gray-100">
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
            <div className="relative p-10 bg-gray-50 rounded-[32px] border-l-8 border-red-600">
              <Quote className="absolute top-4 right-8 w-12 h-12 text-red-600/10" />
              <p className="text-2xl font-heading font-black text-gray-900 leading-tight tracking-tight italic">
                {getLocalizedText(article.metaDescription || article.shortDescription, language)}
              </p>
            </div>
          )}

          {/* Article Body */}
          <div className="prose prose-2xl max-w-none text-gray-800 leading-[1.6] magazine-body font-serif">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>

          {/* Gallery Sections */}
          {article.galleryImages && article.galleryImages.length > 0 && (
            <div className="mt-16 pt-16 border-t border-gray-100">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8 border-l-4 border-red-600 pl-4">
                {t('photoGallery') || 'Visual Evidence'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {article.galleryImages.map((img, idx) => (
                  <div key={idx} className="relative h-64 rounded-[24px] overflow-hidden shadow-xl hover:scale-105 transition-transform duration-700 cursor-zoom-in group">
                    <Image
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags and Author Name */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-6 border-t">
            {/* Tags on left */}
            {/* Tags section removed per user request */}


          </div>
        </article>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Related Stories */}
          <div className="bg-gray-50 rounded-[40px] p-8 border border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8">
              {t('relatedStories') || 'More on this category'}
            </h3>
            <div className="space-y-6">
              {relatedNews.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex gap-6 group cursor-pointer"
                  onClick={() => handleRelatedClick(item)}
                >
                  <div className="relative w-24 h-24 shrink-0 rounded-[20px] overflow-hidden bg-white shadow-sm">
                    <Image
                      src={item.mainImage || item.images?.[0] || '/placeholder-news.svg'}
                      alt={getLocalizedText(item.title, language)}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="flex-1 py-1">
                    <h4 className="font-heading font-black text-lg leading-tight group-hover:text-red-600 transition-colors tracking-tight line-clamp-2">
                      {getLocalizedText(item.title, language)}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Advertisement */}
          {articleAdSettings.banner?.enabled !== false && (
            <div className="premium-card rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 bg-white">
              <div className="relative aspect-[4/5]">
                {articleAdSettings.banner?.imageUrl ? (
                  <a href={articleAdSettings.banner?.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
                    <Image
                      src={articleAdSettings.banner.imageUrl}
                      alt="Ad"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-[3000ms]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8">
                      <Badge className="bg-white/20 backdrop-blur-md text-white border-none mb-4 uppercase font-black text-[10px] tracking-widest">{t('sponsored') || 'Editor\'s Choice'}</Badge>
                      <h4 className="text-white font-heading font-black text-2xl tracking-tighter italic">Exclusive Placements</h4>
                    </div>
                  </a>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-red-900 flex flex-col items-center justify-center p-12 text-center text-white relative">
                    <Badge className="absolute top-8 left-8 bg-white/10 text-white border-none font-black text-[10px] tracking-[0.2em]">{t('advertisement') || 'PREMIUM'}</Badge>
                    <p className="text-3xl font-serif italic font-bold mb-4">🎯 {t('yourAdHere') || 'Premium Space'}</p>
                    <p className="text-xs uppercase tracking-[0.2em] font-black opacity-50 mb-8">Reach Millions Locally</p>
                    <Button className="rounded-full bg-white text-black font-black hover:bg-red-600 hover:text-white transition-all px-8 h-12">
                      {t('getInTouch') || 'CONTACT US'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Stories Sidebar */}
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8 border-l-4 border-blue-600 pl-4">
              {t('topStories') || 'Hot Right Now'}
            </h3>
            <div className="space-y-8">
              {(latestNews.length > 0 ? latestNews : newsData.slice(0, 5)).map((newsItem, idx) => (
                <div
                  key={newsItem.id}
                  className="flex gap-4 cursor-pointer group"
                  onClick={() => handleRelatedClick(newsItem)}
                >
                  <span className="font-heading font-black text-4xl text-gray-100 group-hover:text-blue-600/20 transition-colors leading-none">{idx + 1}</span>
                  <p className="font-heading font-black text-md leading-tight group-hover:text-blue-600 transition-colors tracking-tight line-clamp-2 pt-1">
                    {getLocalizedText(newsItem.title, language)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical Sticky Ad */}
          {articleAdSettings.sticky?.enabled !== false && (
            <div className="sticky top-24">
              <div className="rounded-[40px] overflow-hidden shadow-2xl border-4 border-white aspect-[3/4] relative group">
                {articleAdSettings.sticky?.imageUrl ? (
                  <a href={articleAdSettings.sticky?.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
                    <Image
                      src={articleAdSettings.sticky.imageUrl}
                      alt="Ad"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-[5000ms]"
                    />
                    <Badge className="absolute top-6 right-6 bg-black/50 text-white border-none font-black text-[8px] uppercase tracking-widest backdrop-blur-md">{t('advertisement')}</Badge>
                  </a>
                ) : (
                  <div className="w-full h-full bg-blue-600 flex flex-col items-center justify-center p-8 text-center text-white relative">
                    <Badge className="absolute top-6 right-6 bg-white/20 text-white border-none font-black text-[8px] uppercase tracking-widest">{t('advertisement')}</Badge>
                    <p className="text-xl font-heading font-black italic mb-2">Premium Discovery</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">300 x 400 Editorial</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default NewsDetailPage
