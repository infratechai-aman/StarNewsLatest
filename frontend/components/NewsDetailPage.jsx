'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, Clock, ArrowLeft, Share2, Bookmark, Facebook, Twitter, MessageCircle } from 'lucide-react'
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

  // Translations for static text
  const texts = {
    backToHome: { en: 'Back to Home', hi: 'होम पर वापस जाएं', mr: 'मुख्यपृष्ठावर परत जा' },
    views: { en: 'views', hi: 'व्यूज', mr: 'व्हिव्स' },
    share: { en: 'Share:', hi: 'शेयर करें:', mr: 'शेअर करा:' },
    photoGallery: { en: '📸 Photo Gallery', hi: '📸 फोटो गैलरी', mr: '📸 फोटो गॅलरी' },
    tags: { en: 'Tags:', hi: 'टैग्स:', mr: 'टॅग्स:' },
    relatedNews: { en: 'Related News', hi: 'संबंधित समाचार', mr: 'संबंधित बातम्या' },
    noRelatedNews: { en: 'No related news found', hi: 'कोई संबंधित समाचार नहीं', mr: 'कोणत्याही संबंधित बातम्या नाहीत' },
    latestNews: { en: 'Latest News', hi: 'ताज़ा खबरें', mr: 'ताज्या बातम्या' },
    advertise: { en: 'Advertise', hi: 'विज्ञापन दें', mr: 'जाहिरात द्या' },
    yourBusiness: { en: 'Your Business', hi: 'अपना व्यापार', mr: 'तुमचा व्यवसाय' },
    premiumPlacement: { en: 'Premium Placement', hi: 'प्रीमियम प्लेसमेंट', mr: 'प्रीमियम प्लेसमेंट' },
    contactUs: { en: 'Contact Us!', hi: 'संपर्क करें!', mr: 'संपर्क साधा!' },
    bookNow: { en: 'BOOK NOW', hi: 'अभी बुक करें', mr: 'आता बुक करा' },
    premiumAdSpace: { en: 'Premium Ad Space', hi: 'प्रीमियम विज्ञापन स्थान', mr: 'प्रीमियम जाहिरात जागा' },
    advertisement: { en: 'Advertisement', hi: 'विज्ञापन', mr: 'जाहिरात' },
    by: { en: 'By', hi: 'द्वारा', mr: 'लेखक' }
  }

  const getText = (key) => texts[key]?.[language] || texts[key]?.en || key

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
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={handleBackToHome}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {getText('backToHome')}
      </Button>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Article Content */}
        <article className="lg:col-span-8 space-y-6 select-none" onContextMenu={(e) => e.preventDefault()}>
          {/* Category Badge */}
          <Badge className="bg-red-600 text-white px-4 py-1 text-sm font-bold">
            {category}
          </Badge>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 border-b pb-4">
            {/* Author Name - Top Priority */}
            {(article.authorName || article.author?.name) && (
              <>
                <span className="font-bold text-red-600 flex items-center gap-1">
                  {getText('by')} {article.authorName || article.author.name}
                </span>
                <span className="text-gray-300">|</span>
              </>
            )}

            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(article.publishedAt || article.createdAt)}
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {(article.views || 0).toLocaleString()} {getText('views')}
            </span>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center gap-4 py-2">
            <span className="text-sm font-medium text-gray-600">{getText('share')}</span>
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


          {/* 1. YouTube Video at TOP (or Main Image if no video) */}
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
              <div className="relative w-full rounded-xl overflow-hidden shadow-lg" style={{ paddingTop: '56.25%' }}>
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
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <img src={article.mainImage} alt={title} className="w-full h-auto md:h-96 object-cover" />
            </div>
          )}

          {/* 2. Short Description */}
          {(article.metaDescription || article.shortDescription) && (
            <div className="bg-gray-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-lg text-gray-900 font-bold leading-relaxed">
                {getLocalizedText(article.metaDescription || article.shortDescription, language)}
              </p>
            </div>
          )}

          {/* 3. Main Image (if video exists, show image here) */}
          {(article.youtubeUrl || article.videoUrl) && article.mainImage && (
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <img src={article.mainImage} alt={title} className="w-full h-auto md:h-96 object-cover" />
            </div>
          )}

          {/* 4. Full Article Content */}
          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>

          {/* Gallery Images */}
          {article.galleryImages && article.galleryImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                {getText('photoGallery')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {article.galleryImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-48 object-cover rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                  />
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
          {/* Related News */}
          <div className="bg-white rounded-xl shadow-lg p-4 border">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-red-600 pb-2">
              {getText('relatedNews')}
            </h3>
            <div className="space-y-4">
              {relatedNews.length > 0 ? relatedNews.map((news) => (
                <Card
                  key={news.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => handleRelatedClick(news)}
                >
                  <div className="flex gap-3 p-2">
                    <img
                      src={news.mainImage || news.images?.[0]}
                      alt={getLocalizedText(news.title, language)}
                      className="w-24 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold line-clamp-2 group-hover:text-red-600 transition-colors">
                        {getLocalizedText(news.title, language)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(news.publishedAt).toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN')}
                      </p>
                    </div>
                  </div>
                </Card>
              )) : (
                <p className="text-sm text-gray-500">{getText('noRelatedNews')}</p>
              )}
            </div>
          </div>

          {/* Advertisement - Admin Controlled Article Ad Banner */}
          {articleAdSettings.banner?.enabled !== false && (
            <Card className="overflow-hidden border-2 shadow-lg">
              <CardContent className="p-0 relative">
                {articleAdSettings.banner?.imageUrl ? (
                  // Custom admin image
                  <a
                    href={articleAdSettings.banner?.linkUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={articleAdSettings.banner.imageUrl}
                      alt="Advertisement"
                      className="w-full h-64 object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-black/50 text-white text-xs">{getText('advertisement')}</Badge>
                  </a>
                ) : (
                  // Default placeholder banner
                  <div className="h-64 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex flex-col items-center justify-center text-center">
                    <Badge className="absolute top-2 right-2 bg-white/30 text-white text-xs">{getText('advertisement')}</Badge>
                    <div className="text-white p-4">
                      <p className="text-2xl font-bold mb-2">📢 {getText('advertise')}</p>
                      <p className="text-lg font-semibold">{getText('yourBusiness')}</p>
                      <div className="mt-4 border-t border-white/30 pt-4">
                        <p className="text-sm">{getText('premiumPlacement')}</p>
                        <p className="text-lg font-bold">{getText('contactUs')}</p>
                        <Button size="sm" className="mt-3 bg-white text-purple-600 hover:bg-gray-100 font-bold">
                          {getText('bookNow')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* More Latest News */}
          <div className="bg-white rounded-xl shadow-lg p-4 border">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">
              {getText('latestNews')}
            </h3>
            <div className="space-y-3">
              {(latestNews.length > 0 ? latestNews : newsData.slice(0, 5)).map((newsItem, idx) => (
                <div
                  key={newsItem.id}
                  className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                  onClick={() => handleRelatedClick(newsItem)}
                >
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">{idx + 1}</span>
                  <p className="text-sm font-medium line-clamp-2 hover:text-red-600 transition-colors">
                    {getLocalizedText(newsItem.title, language)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Ad - Admin Controlled Article Sticky Ad */}
          {articleAdSettings.sticky?.enabled !== false && (
            <div className="sticky top-20">
              <Card className="overflow-hidden border-2 shadow-lg">
                <CardContent className="p-0 h-72 relative">
                  {articleAdSettings.sticky?.imageUrl ? (
                    // Custom admin image
                    <a
                      href={articleAdSettings.sticky?.linkUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full"
                    >
                      <img
                        src={articleAdSettings.sticky.imageUrl}
                        alt="Advertisement"
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-black/50 text-white text-xs">{getText('advertisement')}</Badge>
                    </a>
                  ) : (
                    // Default placeholder
                    <>
                      <img
                        src="https://picsum.photos/300/400?random=detailad"
                        alt="Advertisement"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-end p-4 text-white text-center">
                        <p className="font-bold text-lg">{getText('premiumAdSpace')}</p>
                        <p className="text-sm opacity-80">300 x 400 px</p>
                        <Badge className="mt-2 bg-white/20">{getText('advertisement')}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default NewsDetailPage
