'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Clock, Youtube, User } from 'lucide-react'
import { news } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedText } from '@/lib/newsData'
import {
  getPremiumAdSettings,
  getSidebarAdSettings,
  getTrendingSettings,
  getArticleAdSettings,
  getBusinessAdSettings,
  getBusinessAdSettings,
} from '@/lib/contentStore'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Store } from 'lucide-react'


// Right side advertisement images
const adImages = [
  '/placeholder-news.svg',
  '/placeholder-news.svg',
  '/placeholder-news.svg',
]

// News Box Component - Language Aware with API data support
const NewsBox = ({ item, onClick, language }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // getLocalizedText handles both string and {en,hi,mr} object formats
  const title = getLocalizedText(item.title, language) || item.title || ''
  const category = getLocalizedText(item.category, language) || ''

  useEffect(() => {
    if (item.images && item.images.length > 1) {
      const timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % item.images.length)
      }, 2000)
      return () => clearInterval(timer)
    }
  }, [item.images])

  const getValidImages = () => {
    const imgList = []

    // Helper to validate check both http and data URIs
    const isValidUrl = (url) => {
      if (!url) return false
      return url.startsWith('http') || url.startsWith('data:image')
    }

    // Priority 1: Thumbnails array (from new admin feature)
    if (item.thumbnails && item.thumbnails.length > 0) {
      item.thumbnails.forEach(t => {
        if (isValidUrl(t) && !imgList.includes(t)) imgList.push(t)
      })
    }

    // Priority 2: Legacy images array if no thumbnails found
    if (imgList.length === 0 && item.images && item.images.length > 0) {
      item.images.forEach(img => {
        if (isValidUrl(img) && !imgList.includes(img)) imgList.push(img)
      })
    }

    // Priority 3: Single Thumbnail URL or Main Image
    if (imgList.length === 0) {
      if (isValidUrl(item.thumbnailUrl)) imgList.push(item.thumbnailUrl)
      else if (isValidUrl(item.mainImage)) imgList.push(item.mainImage)
    }

    // Fallback
    if (imgList.length === 0) {
      imgList.push('/placeholder-news.svg')
    }
    return imgList
  }

  const images = getValidImages()

  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-red-500"
      onClick={() => onClick(item)}
    >
      <div className="relative h-40 md:h-48 overflow-hidden bg-gray-100">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={title}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${index === currentImageIndex ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
            style={{ transform: index === currentImageIndex ? 'translateX(0)' : index < currentImageIndex ? 'translateX(-100%)' : 'translateX(100%)' }}
            onError={(e) => { e.target.src = '/placeholder-news.svg' }}
          />
        ))}
        {category && <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs z-10">{category}</Badge>}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1 z-10">
            {images.map((_, index) => (
              <span key={index} className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-red-600 transition-colors">{title}</h3>

      </CardContent>
    </Card>
  )
}

// News Card Component - Language Aware with API data support
const NewsCard = ({ item, onClick, accentColor = 'red', language }) => {
  // getLocalizedText handles both string and {en,hi,mr} object formats
  const title = getLocalizedText(item.title, language) || item.title || ''
  const category = getLocalizedText(item.category, language) || ''

  return (
    <Card
      className={`overflow-hidden hover:shadow-xl transition-all cursor-pointer group border hover:border-${accentColor}-500`}
      onClick={() => onClick(item)}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={item.mainImage || item.images?.[0] || 'https://picsum.photos/600/400?random=' + item.id}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {category && <Badge className={`absolute top-2 left-2 bg-${accentColor}-600 text-white text-xs font-bold`}>{category}</Badge>}
      </div>
      <CardContent className="p-3">
        <h4 className={`font-bold text-sm line-clamp-2 group-hover:text-${accentColor}-600 transition-colors leading-tight`}>{title}</h4>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2 flex-wrap pb-1 leading-snug">

          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}</span>
          <span className="ml-auto flex items-center gap-1"><Eye className="h-3 w-3" />{item.views || 0}</span>
        </p>
      </CardContent>
    </Card>
  )
}


// --- REUSABLE AD WIDGETS ---

const BusinessAdWidget = ({ settings, t, onClick }) => {
  if (!settings?.enabled) return null
  return (
    <Card
      className="overflow-hidden border-2 border-gray-200 shadow-lg bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 cursor-pointer transition-transform hover:scale-[1.02] mb-4"
      onClick={onClick}
    >
      <CardContent className="p-0 h-64 relative flex flex-col items-center justify-center text-center">
        <Badge className="absolute top-2 right-2 bg-white/30 text-white text-xs">{t('advertisement')}</Badge>
        {settings?.imageUrl ? (
          <img src={settings.imageUrl} alt="Business Ad" className="w-full h-full object-cover" />
        ) : (
          <div className="text-white p-4">
            <p className="text-2xl font-bold mb-2">🏢 {settings?.title || 'BUSINESS'}</p>
            <p className="text-lg font-semibold">{settings?.subtitle || t('advertisement')}</p>
            <div className="mt-4 border-t border-white/30 pt-4">
              <p className="text-sm">{t('advertiseYourBusiness')}</p>
              <Button size="sm" className="mt-3 bg-white text-orange-600 hover:bg-gray-100 font-bold">{settings?.buttonText || t('postYourAd')}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const SubscribeWidget = () => (
  <Card className="overflow-hidden border-2 border-red-100 shadow-lg bg-white mb-4">
    <CardContent className="p-4 flex flex-col items-center text-center space-y-4">
      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg mb-2 cursor-pointer hover:scale-110 transition-transform">
        <Youtube className="w-8 h-8 text-white" />
      </div>
      <div>
        <h3 className="font-bold text-xl text-gray-900">Subscribe Now!</h3>
        <p className="text-sm text-gray-600 mt-1">
          Join our YouTube channel for breaking news and live updates.
        </p>
      </div>
      <a
        href="https://www.youtube.com/@starnewsindialive?sub_confirmation=1"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full"
      >
        <Button className="w-full bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-lg h-12 shadow-md transition-transform hover:scale-105">
          <Youtube className="mr-2 h-5 w-5" />
          Subscribe
        </Button>
      </a>
    </CardContent>
  </Card>
)

const ContactWidget = ({ t }) => (
  <Card className="overflow-hidden border-2 border-gray-200 shadow-lg bg-gradient-to-br from-gray-800 via-gray-900 to-black mb-4">
    <CardContent className="p-0 h-56 relative flex flex-col items-center justify-center text-center">
      <Badge className="absolute top-2 right-2 bg-white/30 text-white text-xs">{t('contactUs')}</Badge>
      <div className="text-white p-4">
        <p className="text-2xl font-bold mb-2">📞 StarNews</p>
        <p className="text-lg font-semibold">{t('getInTouch')}</p>
        <div className="mt-4 border-t border-white/30 pt-4">
          <p className="text-sm">{t('whatsAppUs')}</p>
          <p className="text-lg font-bold">+91 70208 73300</p>
          <a href="https://wa.me/917020873300" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="mt-3 bg-green-500 text-white hover:bg-green-600 font-bold">{t('chatNow')}</Button>
          </a>
        </div>
      </div>
    </CardContent>
  </Card>
)

const StickyAdWidget = ({ settings, t, onClick }) => {
  if (!settings?.sticky?.enabled) return null
  return (
    <Card className="overflow-hidden border-2 border-gray-200 shadow-lg cursor-pointer transition-transform hover:scale-[1.02] mb-4"
      onClick={onClick}
    >
      <CardContent className="p-0 min-h-[400px] relative bg-gray-100 flex items-center justify-center">
        {settings.sticky?.imageUrl ? (
          <img
            src={settings.sticky.imageUrl}
            alt={settings.sticky.title || 'Advertisement'}
            className="w-full h-auto object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-end p-4 text-white text-center">
            <p className="font-bold text-lg">{t('yourAdHere')}</p>
            <p className="text-sm opacity-80">300 x 400 px</p>
          </div>
        )}
        <Badge className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5">{t('advertisement')}</Badge>
      </CardContent>
    </Card>
  )
}

const HomePage = ({ setCurrentView, setSelectedArticle }) => {
  const { t, language } = useLanguage()
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [newsKey, setNewsKey] = useState(0)

  // Admin content settings
  const [premiumAdSettings, setPremiumAdSettings] = useState({ enabled: true, imageUrl: '', linkUrl: '', title: '' })
  const [sidebarAdSettings, setSidebarAdSettings] = useState({ enabled: true, imageUrl: '', linkUrl: '' })
  const [articleAdSettings, setArticleAdSettings] = useState({ sticky: { enabled: true, imageUrl: '', linkUrl: '', title: 'Premium Ad Space' } })
  const [businessAdSettings, setBusinessAdSettings] = useState({ enabled: true, imageUrl: '', linkUrl: '', title: 'BUSINESS', subtitle: 'Advertisement', buttonText: 'POST YOUR AD' })
  const [trendingSettings, setTrendingSettings] = useState({ enabled: true, newsIds: [] })

  // News data
  const [mainNewsBoxes, setMainNewsBoxes] = useState([])
  const [trendingNews, setTrendingNews] = useState([])
  const [businessNews, setBusinessNews] = useState([])
  const [sportsNews, setSportsNews] = useState([])
  const [nationNews, setNationNews] = useState([])
  const [entertainmentNews, setEntertainmentNews] = useState([])
  const [oldNews, setOldNews] = useState([]) // Archive for items beyond 6 per category
  const [visibleMoreStories, setVisibleMoreStories] = useState(15) // Show 15 initially
  const [loadingMoreStories, setLoadingMoreStories] = useState(false)

  // Promotion Form State
  const [promotionOpen, setPromotionOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [promotionData, setPromotionData] = useState({
    businessName: '', ownerName: '', phone: '', email: '', address: '', description: ''
  })

  const handlePromotionSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Use the same endpoint as Business Directory to centralize requests
      const res = await fetch('/api/business-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionData)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Ad Request Submitted!", {
          description: "Our team will contact you shortly."
        })
        setPromotionOpen(false)
        setPromotionData({ businessName: '', ownerName: '', phone: '', email: '', address: '', description: '' })
      } else {
        toast.error("Submission Failed", {
          description: data.error || "Please try again later."
        })
      }
    } catch (error) {
      console.error('Promotion submit error:', error)
      toast.error("Error", {
        description: "Something went wrong. Please check your connection."
      })
    } finally {
      setIsSubmitting(false)
    }
  }



  // Fetch news - re-run when language changes
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true)
      const response = await news.getAll({ limit: 100 })
      let articles = response.articles || []

      // If no articles from API, use static newsData as fallback
      if (articles.length === 0) {
        const { newsData } = await import('@/lib/newsData')
        articles = newsData || []
      }

      // Sort articles by date (newest first)
      articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      // Featured news goes to top 6 boxes
      const featured = articles.filter(a => a.featured)
      const nonFeatured = articles.filter(a => !a.featured)
      const topNews = [...featured, ...nonFeatured].slice(0, 6)
      setMainNewsBoxes(topNews)

      // Get remaining articles (not in top 6)
      const topNewsIds = new Set(topNews.map(a => a.id))
      const remaining = articles.filter(a => !topNewsIds.has(a.id))

      // Helper to normalize category names for matching
      const normalizeCategory = (cat) => {
        if (!cat) return ''
        const catStr = typeof cat === 'string' ? cat : (cat.en || cat.name || '')
        // Debug log (would require console access) or just be very broad
        return catStr.toLowerCase().trim()
      }

      // Category-based filtering
      // Politics / City News -> Politics section
      const politicsCategories = ['politics', 'city news', 'city', 'civic']
      const politicsNews = remaining.filter(a =>
        politicsCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // Business -> Business section
      const businessCategories = ['business', 'economy', 'finance']
      const businessNewsFiltered = remaining.filter(a =>
        businessCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // National -> National section
      const nationalCategories = ['national', 'nation', 'india']
      const nationNewsFiltered = remaining.filter(a =>
        nationalCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // Entertainment / Sports -> Entertainment section
      const entertainmentCategories = ['entertainment', 'sports', 'bollywood', 'movies', 'music']
      const entertainmentFiltered = remaining.filter(a =>
        entertainmentCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // Old News: All remaining articles not in category sections
      const usedIds = new Set([
        ...politicsNews.map(a => a.id),
        ...businessNewsFiltered.map(a => a.id),
        ...nationNewsFiltered.map(a => a.id),
        ...entertainmentFiltered.map(a => a.id)
      ])
      const oldNewsFiltered = remaining.filter(a => !usedIds.has(a.id))

      setTrendingNews(politicsNews) // Politics/City News
      setBusinessNews(businessNewsFiltered)
      setSportsNews([])
      setNationNews(nationNewsFiltered)
      setEntertainmentNews(entertainmentFiltered)
      setOldNews(oldNewsFiltered) // No random sort, keeps date order
      setOldNews(oldNewsFiltered) // No random sort, keeps date order
    } catch (error) {
      console.error('Failed to fetch news:', error)
      // On error, load static data 
      try {
        const { newsData } = await import('@/lib/newsData')
        const articles = newsData || []
        setMainNewsBoxes(articles.slice(0, 6))
        setTrendingNews([])
        setBusinessNews([])
        setNationNews([])
        setEntertainmentNews([])
        setOldNews(articles.slice(6))
      } catch (e) {
        console.error('Failed to load static news:', e)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Load news on mount and when language changes
  useEffect(() => {
    fetchNews()
    // Force re-render of news components
    setNewsKey(prev => prev + 1)
  }, [language, fetchNews])

  // Load admin content settings (Premium Ad from API, others from localStorage)
  useEffect(() => {
    const loadSettings = async () => {
      const premiumAd = await getPremiumAdSettings()
      setPremiumAdSettings(premiumAd)
      setSidebarAdSettings(getSidebarAdSettings())
      setArticleAdSettings(getArticleAdSettings())
      setBusinessAdSettings(getBusinessAdSettings())
      setTrendingSettings(getTrendingSettings())
    }
    loadSettings()
    // Refresh premium ad every 30 seconds for live updates
    const interval = setInterval(loadSettings, 30000)
    return () => clearInterval(interval)
  }, [])

  // Advertisement rotation
  useEffect(() => {
    if (adImages.length > 1) {
      const adTimer = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adImages.length)
      }, 5000)
      return () => clearInterval(adTimer)
    }
  }, [])

  // Click handler for news items - push browser history for back button support
  const handleNewsClick = (article) => {
    window.history.pushState({ view: 'news-detail', article: article }, '', `?article=${article.id}`)
    setSelectedArticle(article)
    setCurrentView('news-detail')
  }

  return (
    <div className="space-y-4" key={newsKey}>

      {/* PREMIUM AD BANNER */}
      {premiumAdSettings.enabled && (
        <div className="sticky top-12 z-40 relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg premium-ad-banner">
          {premiumAdSettings.imageUrl ? (
            <div className="relative h-full group">
              <a href={premiumAdSettings.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block h-full">
                <img src={premiumAdSettings.imageUrl} alt={premiumAdSettings.title || 'Advertisement'} className="w-full h-full object-cover object-center" />

              </a>
            </div>
          ) : (
            <div className="flex items-center justify-center h-28 md:h-36">
              <div className="text-center text-white">
                <p className="text-lg md:text-2xl font-bold">🎯 {premiumAdSettings.title || t('premiumAdSpace')}</p>
                <p className="text-sm opacity-80">970 x 150 pixels • {t('contactForBooking')}</p>
              </div>
            </div>
          )}
          <Badge className="absolute top-2 right-2 bg-white/20 text-white text-xs">{t('advertisement')}</Badge>
        </div>
      )}

      {/* MAIN NEWS GRID */}
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mainNewsBoxes.map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
            ))}
          </div>
        </div>

        {/* SIDEBAR AD - Square Images with Individual Destinations */}
        {sidebarAdSettings.enabled && (
          <div className="lg:col-span-3">
            <Card className="overflow-hidden border-2 border-gray-200 shadow-lg h-full bg-gray-50 sidebar-ad-container">
              <CardContent className="p-0 h-full min-h-[420px] relative">
                <Badge className="absolute top-2 right-2 z-10 bg-gray-800/70 text-white text-xs">{t('advertisement')}</Badge>
                {(() => {
                  // Get items from new structure, fallback to legacy format
                  const items = sidebarAdSettings.items?.filter(item => item?.imageUrl) || []

                  // Legacy fallback: convert old images array to items format
                  const legacyItems = sidebarAdSettings.images?.map(img => ({
                    imageUrl: img,
                    destinationUrl: sidebarAdSettings.linkUrl || '#'
                  })) || []

                  const displayItems = items.length > 0 ? items : legacyItems

                  if (displayItems.length === 0) {
                    // No images configured - show placeholder
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="aspect-square w-full max-w-[280px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex flex-col items-center justify-center">
                          <p className="text-gray-500 font-medium">{t('yourBusinessAdHere')}</p>
                          <p className="text-xs text-gray-400 mt-1">Square Ad Space</p>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      className="relative h-full overflow-hidden group"
                      onMouseEnter={() => {
                        // Pause carousel on hover
                        const el = document.querySelector('.sidebar-carousel')
                        if (el) el.dataset.paused = 'true'
                      }}
                      onMouseLeave={() => {
                        const el = document.querySelector('.sidebar-carousel')
                        if (el) el.dataset.paused = 'false'
                      }}
                    >
                      {/* Square Carousel Container */}
                      <div className="sidebar-carousel w-full h-full flex flex-col items-center justify-center p-2">
                        {displayItems.map((item, index) => (
                          <a
                            key={index}
                            href={item.destinationUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 w-full h-full flex items-center justify-center p-2 transition-all duration-700"
                            style={{
                              transform: index === currentAdIndex % displayItems.length ? 'translateX(0)' : index < currentAdIndex % displayItems.length ? 'translateX(-100%)' : 'translateX(100%)',
                              opacity: index === currentAdIndex % displayItems.length ? 1 : 0,
                              pointerEvents: index === currentAdIndex % displayItems.length ? 'auto' : 'none'
                            }}
                          >
                            <div className="aspect-square w-full max-w-full h-auto rounded-lg overflow-hidden shadow-md">
                              <img
                                src={item.imageUrl}
                                alt={`Advertisement ${index + 1}`}
                                className="w-full h-full object-cover object-center"
                              />
                            </div>
                          </a>
                        ))}
                      </div>

                      {/* Carousel Indicators */}
                      {displayItems.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                          {displayItems.map((_, index) => (
                            <span
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all ${index === currentAdIndex % displayItems.length ? 'bg-white scale-125 shadow-md' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>



      {/* POLITICS / CITY NEWS Section - Dynamic from API */}
      {trendingSettings.enabled && (
        <div className="mb-8">
          <div className="border-b-4 border-red-600 pb-1 mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="bg-red-600 text-white px-3 py-1 text-sm">॥</span>
              Politics / City News
            </h2>
          </div>
          {trendingNews.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-4">
              {trendingNews.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border hover:border-red-500 w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] lg:w-[calc(20%-13px)] h-[280px] flex flex-col"
                  onClick={() => handleNewsClick(item)}
                >
                  <div className="relative h-[160px] flex-shrink-0 overflow-hidden bg-gray-100 rounded-t-lg">
                    {(item.youtubeUrl || item.videoUrl) ? (
                      <iframe
                        src={`${(item.youtubeUrl || item.videoUrl).replace('watch?v=', 'embed/')}?autoplay=1&mute=1&loop=1&playlist=${(item.youtubeUrl || item.videoUrl).split('v=')[1]?.split('&')[0] || ''}`}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full relative">
                        {(() => {
                          const getImages = (itm) => {
                            const list = []
                            const isValid = u => u && (u.startsWith('http') || u.startsWith('data:image'))
                            if (itm.thumbnails && itm.thumbnails.length) itm.thumbnails.forEach(t => isValid(t) && list.push(t))
                            if (!list.length && itm.images && itm.images.length) itm.images.forEach(i => isValid(i) && list.push(i))
                            if (!list.length && isValid(itm.thumbnailUrl)) list.push(itm.thumbnailUrl)
                            if (!list.length && isValid(itm.mainImage)) list.push(itm.mainImage)
                            if (!list.length) list.push('/placeholder-news.svg')
                            return list
                          }
                          const images = getImages(item)
                          // Simple carousel logic or just first image
                          return (
                            <img
                              src={images[0]}
                              alt={getLocalizedText(item.title, language)}
                              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => { e.target.src = '/placeholder-news.svg' }}
                            />
                          )
                        })()}
                        {(getLocalizedText(item.category, language)) && (
                          <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs">{getLocalizedText(item.category, language)}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                      {getLocalizedText(item.title, language)}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {getLocalizedText(item.metaDescription || item.content, language)?.substring(0, 100)}
                    </p>

                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No Politics/City News articles available</p>
          )}
        </div>
      )
      }

      {/* MOBILE AD INJECTION 1: Business Promo (After Politics) */}
      <div className="block lg:hidden">
        <BusinessAdWidget
          settings={businessAdSettings}
          t={t}
          onClick={() => setPromotionOpen(true)}
        />
      </div>

      {/* Promotion/Ad Request Dialog */}
      <Dialog open={promotionOpen} onOpenChange={setPromotionOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Your Ad</DialogTitle>
            <DialogDescription>
              Submit your ad details. Our team will contact you for verification and pricing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePromotionSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business/Ad Name *</Label>
              <Input
                id="businessName"
                value={promotionData.businessName}
                onChange={(e) => setPromotionData({ ...promotionData, businessName: e.target.value })}
                placeholder="e.g. Star Electronics / Sale"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Your Name *</Label>
                <Input
                  id="ownerName"
                  value={promotionData.ownerName}
                  onChange={(e) => setPromotionData({ ...promotionData, ownerName: e.target.value })}
                  placeholder="Your Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={promotionData.phone}
                  onChange={(e) => setPromotionData({ ...promotionData, phone: e.target.value })}
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={promotionData.email}
                onChange={(e) => setPromotionData({ ...promotionData, email: e.target.value })}
                placeholder="contact@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address / Location *</Label>
              <Textarea
                id="address"
                value={promotionData.address}
                onChange={(e) => setPromotionData({ ...promotionData, address: e.target.value })}
                placeholder="Shop No, Building, Area, City"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Ad Description / Message (Optional)</Label>
              <Textarea
                id="description"
                value={promotionData.description}
                onChange={(e) => setPromotionData({ ...promotionData, description: e.target.value })}
                placeholder="Briefly describe what you want to advertise..."
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setPromotionOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* NEWS SECTIONS WITH SIDEBAR */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-8">

          {/* BUSINESS Section - 1 Big Card + Smaller Cards Bento Layout */}
          <div>
            <div className="border-b-4 border-orange-500 pb-1 mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-orange-500 text-white px-3 py-1 text-sm">॥</span>
                Business
              </h2>
            </div>
            {businessNews.length > 0 ? (
              <div className="grid grid-cols-12 gap-4">
                {/* Big Card - Left Side (First News) */}
                {businessNews[0] && (
                  <div className="col-span-12 md:col-span-6 lg:col-span-7 h-full">
                    <Card
                      className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group border hover:border-orange-500 h-full flex flex-col"
                      onClick={() => handleNewsClick(businessNews[0])}
                    >
                      <div className="relative h-[65%] flex-shrink-0 overflow-hidden bg-gray-100 rounded-t-lg">
                        <img
                          src={businessNews[0].thumbnailUrl || businessNews[0].mainImage || '/placeholder-news.svg'}
                          alt={getLocalizedText(businessNews[0].title, language)}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => { e.target.src = '/placeholder-news.svg' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <Badge className="absolute top-3 left-3 bg-orange-500 text-white text-sm px-3 py-1">Business</Badge>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-bold text-xl text-white line-clamp-2 drop-shadow-lg">
                            {getLocalizedText(businessNews[0].title, language)}
                          </h3>
                        </div>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col justify-between bg-gradient-to-r from-orange-50 to-white">
                        <p className="text-sm text-gray-700 line-clamp-3 mb-2">
                          {getLocalizedText(businessNews[0].metaDescription || businessNews[0].content, language)?.substring(0, 150)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto">

                          <Clock className="h-3 w-3" /> {new Date(businessNews[0].createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Smaller Cards - Right Side (2x2 Grid of Square Cards) */}
                <div className="col-span-12 md:col-span-6 lg:col-span-5 grid grid-cols-2 gap-3">
                  {businessNews.slice(1, 5).map((item, idx) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border hover:border-orange-500 aspect-square flex flex-col"
                      onClick={() => handleNewsClick(item)}
                    >
                      <div className="relative h-[60%] w-full flex-shrink-0 overflow-hidden bg-gray-100">
                        <img
                          src={item.thumbnailUrl || item.mainImage || '/placeholder-news.svg'}
                          alt={getLocalizedText(item.title, language)}
                          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { e.target.src = '/placeholder-news.svg' }}
                        />
                        <Badge className="absolute top-1 left-1 bg-orange-500/90 text-white text-[9px] px-1.5 py-0.5">Business</Badge>
                      </div>
                      <CardContent className="p-2 flex-1 flex flex-col justify-between bg-white overflow-hidden">
                        <h3 className="font-semibold text-xs line-clamp-3 group-hover:text-orange-600 transition-colors leading-tight">
                          {getLocalizedText(item.title, language)}
                        </h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No Business news available</p>
            )}
          </div>

          {/* MOBILE AD INJECTION 2: Subscribe (After Business) */}
          <div className="block lg:hidden">
            <SubscribeWidget />
          </div>

          {/* NATIONAL Section - 8 Cards with Varied Bento Grid Layout */}
          <div>
            <div className="border-b-4 border-gray-900 pb-1 mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-gray-900 text-white px-3 py-1 text-sm">॥</span>
                National
              </h2>
            </div>
            {nationNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nationNews.slice(0, 8).map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-red-500 bg-white h-[140px] flex flex-row"
                    onClick={() => handleNewsClick(item)}
                  >
                    <div className="relative w-[180px] h-full flex-shrink-0 overflow-hidden bg-gray-100">
                      <img
                        src={item.thumbnailUrl || item.mainImage || '/placeholder-news.svg'}
                        alt={getLocalizedText(item.title, language)}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.target.src = '/placeholder-news.svg' }}
                      />
                      <Badge className="absolute top-1 left-1 bg-red-600 text-white text-[10px]">National</Badge>
                    </div>
                    <CardContent className="p-3 flex-1 flex flex-col justify-center bg-white">
                      <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 group-hover:text-red-600 transition-colors mb-2">
                        {getLocalizedText(item.title, language)}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {getLocalizedText(item.metaDescription || item.content, language)?.substring(0, 80)}...
                      </p>
                    </CardContent>
                    <div className="px-3 pb-2 bg-white border-t border-gray-100 pt-2 flex items-center justify-between text-xs text-gray-500">

                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {item.views || 0}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No National news available</p>
            )}
          </div>

          {/* MOBILE AD INJECTION 3: Contact (After National) */}
          <div className="block lg:hidden">
            <ContactWidget t={t} />
          </div>

          {/* ENTERTAINMENT Section - 4 Cards Attractive Layout */}
          <div>
            <div className="border-b-4 border-purple-600 pb-1 mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-purple-600 text-white px-3 py-1 text-sm">॥</span>
                Entertainment
              </h2>
            </div>
            {entertainmentNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entertainmentNews.slice(0, 4).map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-purple-500 bg-white h-[140px] flex flex-row"
                    onClick={() => handleNewsClick(item)}
                  >
                    <div className="relative w-[180px] h-full flex-shrink-0 overflow-hidden bg-gray-100">
                      {(item.youtubeUrl || item.videoUrl) ? (
                        <div className="w-full h-full bg-purple-900 flex items-center justify-center">
                          <span className="text-4xl text-white opacity-80 group-hover:opacity-100 transition-opacity">▶</span>
                        </div>
                      ) : (
                        <img
                          src={item.thumbnailUrl || item.mainImage || '/placeholder-news.svg'}
                          alt={getLocalizedText(item.title, language)}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { e.target.src = '/placeholder-news.svg' }}
                        />
                      )}
                      <Badge className="absolute top-1 left-1 bg-purple-600 text-white text-[10px]">Entertainment</Badge>
                    </div>
                    <CardContent className="p-3 flex-1 flex flex-col justify-center bg-white">
                      <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 group-hover:text-purple-600 transition-colors mb-2">
                        {getLocalizedText(item.title, language)}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {getLocalizedText(item.metaDescription || item.content, language)?.substring(0, 80)}...
                      </p>
                    </CardContent>
                    <div className="px-3 pb-2 bg-white border-t border-gray-100 pt-2 flex items-center justify-between text-xs text-gray-500">

                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {item.views || 0}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No Entertainment news available</p>
            )}
          </div>

          {/* MOBILE AD INJECTION 4: Sticky Ad (After Entertainment) */}
          <div className="block lg:hidden">
            <StickyAdWidget
              settings={articleAdSettings}
              t={t}
              onClick={() => articleAdSettings.sticky?.linkUrl && window.open(articleAdSettings.sticky.linkUrl, '_blank')}
            />
          </div>
          {/* OLD NEWS Section - Dynamic from API (Uncategorized/Other articles) */}
          <div>
            <div className="border-b-4 border-gray-500 pb-1 mb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                More Stories
              </h2>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Discover What's Happening</p>
            </div>
            {
              oldNews.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[220px]">
                    {oldNews.slice(0, visibleMoreStories).map((item, index) => {
                      // Bento Grid Logic (repeats every 15 items):
                      // Index 0, 15, 30...: Big Box (2x2)
                      // Index 7, 22, 37...: Wide Box (2x1)
                      // Others: Standard (1x1)
                      const localIndex = index % 15
                      const isBig = localIndex === 0
                      const isWide = localIndex === 7

                      return (
                        <Card
                          key={item.id}
                          className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border hover:border-gray-600 bg-gray-100 flex flex-col ${isBig ? 'col-span-2 row-span-2' : isWide ? 'col-span-2' : 'col-span-1'
                            }`}
                          onClick={() => handleNewsClick(item)}
                        >
                          <div className={`relative flex-shrink-0 overflow-hidden bg-gray-200 ${isBig ? 'h-[65%]' : 'h-[60%]'} rounded-t-lg`}>
                            <div className="w-full h-full relative">
                              {(() => {
                                const getImages = (itm) => {
                                  const list = []
                                  const isValid = u => u && (u.startsWith('http') || u.startsWith('data:image'))
                                  if (itm.thumbnails && itm.thumbnails.length) itm.thumbnails.forEach(t => isValid(t) && list.push(t))
                                  if (!list.length && itm.images && itm.images.length) itm.images.forEach(i => isValid(i) && list.push(i))
                                  if (!list.length && isValid(itm.thumbnailUrl)) list.push(itm.thumbnailUrl)
                                  if (!list.length && isValid(itm.mainImage)) list.push(itm.mainImage)
                                  if (!list.length) list.push('/placeholder-news.svg')
                                  return list
                                }
                                const images = getImages(item)
                                return (
                                  <img
                                    src={images[0]}
                                    alt={getLocalizedText(item.title, language)}
                                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 opacity-90"
                                    onError={(e) => { e.target.src = '/placeholder-news.svg' }}
                                  />
                                )
                              })()}
                              {(getLocalizedText(item.category, language)) && (
                                <Badge className="absolute top-2 left-2 bg-gray-600 text-white text-xs px-2 py-0.5">
                                  {getLocalizedText(item.category, language)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardContent className="p-3 bg-gray-100 flex-1 flex flex-col justify-center">
                            <h3 className={`font-bold text-gray-800 group-hover:text-black transition-colors leading-tight ${isBig ? 'text-lg line-clamp-3' : 'text-sm line-clamp-2'}`}>
                              {getLocalizedText(item.title, language)}
                            </h3>
                            {isBig && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                {getLocalizedText(item.metaDescription || item.content, language)?.substring(0, 100)}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 pb-1 leading-snug">

                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                    }
                  </div>

                  {/* Show More / Show Less Buttons */}
                  <div className="flex justify-center gap-4 mt-6">
                    {visibleMoreStories > 15 && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="px-8 py-3 border-2 border-gray-400 hover:border-gray-600 hover:bg-gray-100 font-semibold"
                        onClick={() => {
                          setVisibleMoreStories(15)
                          // Scroll to the More Stories section
                          window.scrollTo({ top: document.querySelector('.border-gray-500')?.offsetTop - 100, behavior: 'smooth' })
                        }}
                      >
                        Show Less
                      </Button>
                    )}
                    {visibleMoreStories < oldNews.length && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="px-8 py-3 border-2 border-gray-400 hover:border-gray-600 hover:bg-gray-100 font-semibold"
                        disabled={loadingMoreStories}
                        onClick={() => {
                          setLoadingMoreStories(true)
                          setTimeout(() => {
                            setVisibleMoreStories(prev => prev + 15)
                            setLoadingMoreStories(false)
                          }, 300)
                        }}
                      >
                        {loadingMoreStories ? 'Loading...' : 'Show More'}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">No other news available</p>
              )
            }
          </div>
        </div>

        {/* RIGHT SIDEBAR ADS (DESKTOP ONLY) */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <BusinessAdWidget
            settings={businessAdSettings}
            t={t}
            onClick={() => setPromotionOpen(true)}
          />
          <SubscribeWidget />
          <ContactWidget t={t} />
          <div className="sticky top-20">
            <StickyAdWidget
              settings={articleAdSettings}
              t={t}
              onClick={() => articleAdSettings.sticky?.linkUrl && window.open(articleAdSettings.sticky.linkUrl, '_blank')}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div >
  )
}

export default HomePage