'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Clock, Youtube, User, Shield } from 'lucide-react'
import { news } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedText } from '@/lib/newsData'
import {
  getPremiumAdSettings,
  getSidebarAdSettings,
  getTrendingSettings,
  getArticleAdSettings,
  getBusinessAdSettings,
} from '@/lib/contentStore'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Store, ChevronRight } from 'lucide-react'
import WeatherWidget from './WeatherWidget'

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
)


// Helper to map DB category names to translation keys
const getTranslatedCategory = (cat, t, language) => {
  if (!cat) return ''
  // If it's already an object, use getLocalizedText
  if (typeof cat === 'object') return getLocalizedText(cat, language)

  // Map common DB strings to translation keys
  const map = {
    'Business': 'business',
    'National': 'nation',
    'Nation': 'nation',
    'Politics': 'politics',
    'Entertainment': 'entertainment',
    'Sports': 'sports',
    'Technology': 'technology',
    'Health': 'health',
    'Education': 'education',
    'Crime': 'crime',
    'City News': 'cityNews',
    'Jobs': 'jobs',
    'Trending': 'trending',
    'Murder': 'crime',
    'General': 'general'
  }

  const key = map[cat] || cat.toLowerCase()
  // Try to translate, fallback to original string
  const translated = t(key)
  return translated !== key ? translated : cat
}

// News Box Component - Language Aware with API data support
const NewsBox = ({ item, onClick, language }) => {
  const { t } = useLanguage()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const title = getLocalizedText(item.title, language) || item.title || ''
  const category = getTranslatedCategory(item.category, t, language)

  useEffect(() => {
    if (item.images && item.images.length > 1) {
      const timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % item.images.length)
      }, 3000)
      return () => clearInterval(timer)
    }
  }, [item.images])

  const getValidImages = () => {
    const imgList = []
    const isValidUrl = (url) => url && (url.startsWith('http') || url.startsWith('data:image') || url.startsWith('/api/'))

    // Priority: mainImage first (most reliable from API), then thumbnailUrl, galleryImages, then legacy fields
    if (isValidUrl(item.mainImage)) imgList.push(item.mainImage)
    if (isValidUrl(item.thumbnailUrl) && !imgList.includes(item.thumbnailUrl)) imgList.push(item.thumbnailUrl)
    if (item.galleryImages?.length) item.galleryImages.forEach(img => isValidUrl(img) && !imgList.includes(img) && imgList.push(img))
    if (item.thumbnails?.length) item.thumbnails.forEach(t => isValidUrl(t) && !imgList.includes(t) && imgList.push(t))
    if (item.images?.length) item.images.forEach(img => isValidUrl(img) && !imgList.includes(img) && imgList.push(img))
    if (!imgList.length) imgList.push('/placeholder-news.svg')
    return imgList
  }

  const images = getValidImages()

  return (
    <div
      className="premium-card group cursor-pointer overflow-hidden bg-white border border-gray-200/60 shadow-sm hover:shadow-md rounded-xl md:rounded-2xl transition-all duration-300 mb-4 md:mb-0"
      onClick={() => onClick(item)}
    >
      <div className="relative aspect-[4/3] md:aspect-[16/10] overflow-hidden bg-gray-50">
        {images.map((img, index) => (
          <Image
            key={index}
            src={img}
            alt={title}
            fill
            className={`object-cover transition-all duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {category && (
          <Badge className="absolute top-4 left-4 md:top-3 md:left-3 bg-red-600 text-[10px] font-black uppercase tracking-wider text-white border-none px-3 md:px-2 py-1 md:py-0.5 shadow-sm">
            {category}
          </Badge>
        )}
      </div>
      <div className="p-5 md:p-4">
        <h3 className="font-heading font-black text-2xl md:text-lg md:font-extrabold leading-[1.2] line-clamp-3 md:line-clamp-2 group-hover:text-red-600 transition-colors tracking-tight text-gray-900">
          {title}
        </h3>
        <div className="mt-4 md:mt-3 flex items-center justify-between">
          <span className="text-[11px] md:text-[10px] font-bold text-gray-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
          </span>
          <span className="text-[11px] md:text-[10px] font-black text-red-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Read Full Story →</span>
        </div>
      </div>
    </div>
  )
}

// News Card Component - Language Aware with API data support
const NewsCard = ({ item, onClick, accentColor = 'red', language }) => {
  const { t } = useLanguage()
  // getLocalizedText handles both string and {en,hi,mr} object formats
  const title = getLocalizedText(item.title, language) || item.title || ''
  const category = getTranslatedCategory(item.category, t, language)
  const [imgSrc, setImgSrc] = useState(item.mainImage || item.images?.[0] || `https://picsum.photos/600/400?random=${item.id}`)

  useEffect(() => {
    setImgSrc(item.mainImage || item.images?.[0] || `https://picsum.photos/600/400?random=${item.id}`)
  }, [item])

  return (
    <Card
      className={`overflow-hidden hover:shadow-xl transition-all cursor-pointer group border border-gray-200/60 rounded-xl md:rounded-2xl hover:border-${accentColor}-500 shadow-sm mb-4 md:mb-0`}
      onClick={() => onClick(item)}
    >
      <div className="relative h-40 overflow-hidden">
        <Image
          src={imgSrc}
          alt={title}
          fill
          className="group-hover:scale-105 transition-transform duration-300"
          style={{ objectFit: 'cover' }}
          onError={() => setImgSrc('/placeholder-news.svg')}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {category && <Badge className={`absolute top-2 left-2 bg-${accentColor}-600 text-white text-xs font-bold z-10`}>{category}</Badge>}
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
          <div className="relative w-full h-full">
            <Image
              src={settings.imageUrl}
              alt="Business Ad"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
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
          <div className="relative w-full h-full">
            <Image
              src={settings.sticky.imageUrl}
              alt={settings.sticky.title || 'Advertisement'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
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

const HomePage = ({ setCurrentView, setSelectedArticle, newsData, setNewsData }) => {
  const { t, language } = useLanguage()
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [loading, setLoading] = useState(!newsData?.loaded)
  const [newsKey, setNewsKey] = useState(0)

  // Admin content settings
  // Admin content settings
  const [premiumAdSettings, setPremiumAdSettings] = useState({ enabled: true, imageUrl: '', linkUrl: '', title: '' })
  const [sidebarAdSettings, setSidebarAdSettings] = useState({ enabled: true, items: [] })
  const [articleAdSettings, setArticleAdSettings] = useState({
    banner: { enabled: true, imageUrl: '', linkUrl: '', title: 'Advertise Your Business' },
    sticky: { enabled: true, imageUrl: '', linkUrl: '', title: 'Premium Ad Space' }
  })
  const [businessAdSettings, setBusinessAdSettings] = useState({ enabled: true, imageUrl: '', linkUrl: '', title: 'BUSINESS', subtitle: 'Advertisement', buttonText: 'POST YOUR AD' })
  const [trendingSettings, setTrendingSettings] = useState({ enabled: true, newsIds: [] })

  // Promotion popup state
  const [promotionOpen, setPromotionOpen] = useState(false)

  // -- STATE LIFTING: Use props if available, otherwise fallback to local (though page.js always passes them now) --
  const mainNewsBoxes = newsData?.mainNewsBoxes || []
  const politicsNews = newsData?.trendingNews || []
  const businessNews = newsData?.businessNews || []
  const nationNews = newsData?.nationNews || []
  const entertainmentNews = newsData?.entertainmentNews || []
  const crimeNews = newsData?.crimeNews || []
  const sportsNews = newsData?.sportsNews || []
  const educationNews = newsData?.educationNews || []
  const healthNews = newsData?.healthNews || []
  const technologyNews = newsData?.technologyNews || []
  const oldNews = newsData?.oldNews || []

  // Derived collections for specific sections
  const latestNews = oldNews.slice(0, 10)

  const setMainNewsBoxes = (data) => setNewsData && setNewsData(prev => ({ ...prev, mainNewsBoxes: data }))
  const setTrendingNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, trendingNews: data }))
  const setBusinessNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, businessNews: data }))
  const setNationNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, nationNews: data }))
  const setEntertainmentNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, entertainmentNews: data }))
  const setOldNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, oldNews: data }))
  const setCrimeNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, crimeNews: data }))
  const setSportsNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, sportsNews: data }))
  const setEducationNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, educationNews: data }))
  const setHealthNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, healthNews: data }))
  const setTechnologyNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, technologyNews: data }))

  // Local UI state
  const [visibleMoreStories, setVisibleMoreStories] = useState(18) // Show 18 initially (divisible by 2, 3, 6)
  const [loadingMoreStories, setLoadingMoreStories] = useState(false)

  // Promotion Form State

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
    // Optimization: If data is already loaded in parent, start with that.
    if (newsData?.loaded) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await news.getAll({ limit: 100 })
      let articles = response.articles || []

      // Sort articles by date (newest first, prefer publishedAt)
      articles.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt)
        const dateB = new Date(b.publishedAt || b.createdAt)
        return dateB - dateA
      })

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

      // Entertainment -> Entertainment section (separated from Sports)
      const entertainmentCategories = ['entertainment', 'bollywood', 'movies', 'music']
      const entertainmentFiltered = remaining.filter(a =>
        entertainmentCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // Crime / Murder -> Crime section
      const crimeCategories = ['crime', 'murder']
      const crimeFiltered = remaining.filter(a =>
        crimeCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // Sports -> Sports section
      const sportsCategories = ['sports']
      const sportsFiltered = remaining.filter(a =>
        sportsCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // Education -> Education section
      const educationCategories = ['education']
      const educationFiltered = remaining.filter(a =>
        educationCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // Health -> Health section
      const healthCategories = ['health']
      const healthFiltered = remaining.filter(a =>
        healthCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // Technology -> Technology section
      const technologyCategories = ['technology', 'tech']
      const technologyFiltered = remaining.filter(a =>
        technologyCategories.includes(normalizeCategory(a.category || a.categoryId))
      ).slice(0, 5)

      // Old News: All remaining articles not in any category section
      const usedIds = new Set([
        ...politicsNews.map(a => a.id),
        ...businessNewsFiltered.map(a => a.id),
        ...nationNewsFiltered.map(a => a.id),
        ...entertainmentFiltered.map(a => a.id),
        ...crimeFiltered.map(a => a.id),
        ...sportsFiltered.map(a => a.id),
        ...educationFiltered.map(a => a.id),
        ...healthFiltered.map(a => a.id),
        ...technologyFiltered.map(a => a.id)
      ])
      const oldNewsFiltered = remaining.filter(a => !usedIds.has(a.id))

      // Batch update the parent state
      if (setNewsData) {
        setNewsData(prev => ({
          ...prev,
          mainNewsBoxes: topNews,
          trendingNews: politicsNews,
          businessNews: businessNewsFiltered,
          nationNews: nationNewsFiltered,
          entertainmentNews: entertainmentFiltered,
          crimeNews: crimeFiltered,
          sportsNews: sportsFiltered,
          educationNews: educationFiltered,
          healthNews: healthFiltered,
          technologyNews: technologyFiltered,
          oldNews: oldNewsFiltered,
          loaded: true
        }))
      } else {
        // Fallback for local state only (should not happen with new page.js)
        setMainNewsBoxes(topNews)
        setTrendingNews(politicsNews)
        setBusinessNews(businessNewsFiltered)
        setNationNews(nationNewsFiltered)
        setEntertainmentNews(entertainmentFiltered)
        setCrimeNews(crimeFiltered)
        setSportsNews(sportsFiltered)
        setEducationNews(educationFiltered)
        setHealthNews(healthFiltered)
        setTechnologyNews(technologyFiltered)
        setOldNews(oldNewsFiltered)
      }

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
    // Refresh premium ad every 5 minutes for live updates to save database reads
    const interval = setInterval(loadSettings, 300000)
    return () => clearInterval(interval)
  }, [])

  // Advertisement rotation
  useEffect(() => {
    const items = sidebarAdSettings?.items || []
    if (items.length > 1) {
      const adTimer = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % items.length)
      }, 5000)
      return () => clearInterval(adTimer)
    }
  }, [sidebarAdSettings])

  // Click handler for news items - push browser history for back button support
  const handleNewsClick = (article) => {
    window.history.pushState({ view: 'news-detail', article: article }, '', `?article=${article.id}`)
    setSelectedArticle(article)
    setCurrentView('news-detail')
  }

  // Handle category clicks to navigate to news page
  const handleCategoryClick = (category) => {
    window.history.pushState({ view: 'news' }, '', `?category=${category}`)
    setCurrentView('news')
  }

  // Data Cleanup: Filter out placeholder articles
  const filterNews = (newsArray) => {
    return (newsArray || []).filter(item => {
      const title = getLocalizedText(item.title, language) || ''
      return !title.toLowerCase().includes('test article') && title.trim() !== ''
    })
  }

  const cleanMainNews = filterNews(mainNewsBoxes)
  const cleanPoliticsNews = filterNews(politicsNews)
  const cleanBusinessNews = filterNews(businessNews)
  const cleanNationNews = filterNews(nationNews)
  const cleanEntertainmentNews = filterNews(entertainmentNews)
  const cleanCrimeNews = filterNews(crimeNews)
  const cleanSportsNews = filterNews(sportsNews)
  const cleanEducationNews = filterNews(educationNews)
  const cleanHealthNews = filterNews(healthNews)
  const cleanTechnologyNews = filterNews(technologyNews)
  const cleanLatestNews = filterNews(latestNews)

  return (
    <div className="space-y-0 md:space-y-4" key={newsKey}>

      {/* PREMIUM AD BANNER - ABSOLUTE TOP */}
      {premiumAdSettings?.enabled && (
        <div className="z-40 relative bg-gradient-to-r from-gray-900 via-red-900 to-gray-900 shadow-xl premium-ad-banner mt-3 md:mt-4 md:mb-8 mb-4 w-full min-h-[50px] md:h-40 rounded-none md:rounded-2xl md:mx-auto md:max-w-7xl flex flex-col justify-center">
          {premiumAdSettings.imageUrl ? (
            <div className="relative h-full group w-full flex-grow flex items-center">
              <a href={premiumAdSettings.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
                <img
                  src={premiumAdSettings.imageUrl}
                  alt={premiumAdSettings.title || 'Advertisement'}
                  className="w-full h-auto object-contain max-h-[150px] md:max-h-full group-hover:scale-105 transition-transform duration-[2000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none" />
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full border-y md:border border-white/10">
              <div className="text-center text-white/80">
                <p className="text-lg md:text-2xl font-serif italic font-bold">🎯 {premiumAdSettings.title || t('premiumAdSpace')}</p>
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black opacity-50 mt-1 md:mt-2">{t('contactForPlacements') || 'Reach Millions • Contact for Placements'}</p>
              </div>
            </div>
          )}
          <Badge className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/10 backdrop-blur-md text-white border-white/20 text-[8px] md:text-[10px] uppercase font-black tracking-widest">{t('advertisement')}</Badge>
        </div>
      )}

      {/* --- PREMIUM MOBILE VIEW (Top of DOM) --- */}
      <div className="lg:hidden space-y-6 mb-10 mt-0">
        {/* Mobile Featured Carousel / Hero */}
        <div className="px-4">
          <div className="mag-section-header mb-4">
            <h2 className="text-3xl font-heading font-black tracking-tighter flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              {t('featured') || 'Featured News'}
            </h2>
          </div>

          <div className="flex overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-0">
            {cleanMainNews.slice(0, 5).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleNewsClick(item)}
                className="relative w-full flex-shrink-0 min-w-full sm:min-w-[340px] h-[75dvh] sm:h-auto sm:aspect-square rounded-none sm:rounded-[32px] overflow-hidden cursor-pointer snap-center shadow-lg border-y sm:border border-gray-100"
              >
                <Image
                  src={item.mainImage || item.images?.[0] || '/placeholder-news.svg'}
                  alt={getLocalizedText(item.title, language) || 'News Image'}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <Badge className="bg-red-600 text-white border-none mb-4 px-4 py-1.5 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">
                    {idx === 0 ? (t('topStory') || 'Top Story') : (getTranslatedCategory(item.category, t, language) || 'Featured')}
                  </Badge>
                  <h3 className="text-2xl font-heading font-black text-white leading-tight drop-shadow-2xl">
                    {getLocalizedText(item.title, language)}
                  </h3>
                  <div className="mt-4 flex items-center gap-2 text-gray-300 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Ads Block 1 - Rotating Sidebar Ads */}
        <div className="px-4">
          {sidebarAdSettings?.enabled && sidebarAdSettings.items?.length > 0 ? (
            <Card className="overflow-hidden border border-gray-100 shadow-md cursor-pointer rounded-2xl" onClick={() => { if (sidebarAdSettings.items[currentAdIndex % sidebarAdSettings.items.length]?.destinationUrl) window.open(sidebarAdSettings.items[currentAdIndex % sidebarAdSettings.items.length].destinationUrl, '_blank') }}>
              <CardContent className="p-0 aspect-[16/9] relative bg-gray-100">
                <Image
                  src={sidebarAdSettings.items[currentAdIndex % sidebarAdSettings.items.length]?.imageUrl || '/placeholder-news.svg'}
                  alt="Advertisement"
                  fill
                  className="object-cover transition-opacity duration-1000"
                />
                <Badge className="absolute top-3 right-3 bg-black/50 text-white text-[9px] px-2 py-1 backdrop-blur-sm border-none uppercase tracking-wider">{t('advertisement') || 'Advertisement'}</Badge>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {sidebarAdSettings.items.map((_, idx) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === (currentAdIndex % sidebarAdSettings.items.length) ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="mt-8 mb-6">
          <div className="mag-section-header mb-4 px-4 border-l-4 border-red-600">
            <h2 className="text-2xl font-heading font-black tracking-tighter italic pl-2">{t('todaysHeadlines') || "Today's Headlines"}</h2>
          </div>
          <div className="flex flex-col border-y border-gray-100">
            {cleanMainNews.slice(5, 15).map((item, index) => {
              const title = getLocalizedText(item.title, language)
              const category = getTranslatedCategory(item.category, t, language)
              const isAdPosition = false; // Disabled inline ad for cleaner mobile UI

              return (
                <div key={item.id} className="flex flex-col">
                  {isAdPosition && businessAdSettings?.enabled && (
                    <div className="py-3 px-4 bg-gray-50 border-b border-gray-100">
                      <BusinessAdWidget settings={businessAdSettings} t={t} onClick={() => { }} />
                    </div>
                  )}
                  <div onClick={() => handleNewsClick(item)} className="p-4 bg-white flex gap-4 items-stretch active:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0">
                    <div className="relative w-32 h-[90px] shrink-0 overflow-hidden bg-gray-100 rounded-sm">
                      <Image
                        src={item.thumbnailUrl || item.mainImage || item.images?.[0] || '/placeholder-news.svg'}
                        alt={title || 'Thumbnail'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">{category}</span>
                        <h3 className="font-heading font-bold text-[15px] leading-[1.3] text-gray-900 line-clamp-2">
                          {title}
                        </h3>
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* (Mobile Ads Block 2 was here - now moved to sandwich the Business & Economy block) */}
      </div>

      {/* PREMIUM AD BANNER WAS HERE */}

      {/* --- DESKTOP VIEW (Magazine Style Hero) --- */}
      <div className="hidden lg:block max-w-[1440px] mx-auto px-6 mb-10">
        <div className="grid grid-cols-12 gap-8">
          {/* HERO LEAD STORY */}
          <div className="col-span-12 lg:col-span-8">
            {cleanMainNews[0] && (
              <div
                onClick={() => handleNewsClick(cleanMainNews[0])}
                className="relative h-[650px] w-full rounded-[32px] overflow-hidden cursor-pointer group shadow-2xl premium-card"
              >
                <Image
                  src={cleanMainNews[0].mainImage || cleanMainNews[0].images?.[0] || '/placeholder-news.svg'}
                  alt={getLocalizedText(cleanMainNews[0].title, language)}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-[3000ms] ease-out"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-12 w-full max-w-3xl">
                  <Badge className="mb-6 bg-red-600 hover:bg-red-700 text-white border-none text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 shadow-xl">
                    Lead Story
                  </Badge>
                  <h1 className="hero-title text-white text-5xl md:text-7xl mb-8 group-hover:text-red-100 transition-colors drop-shadow-2xl font-heading font-black leading-[1.05] tracking-tighter">
                    {getLocalizedText(cleanMainNews[0].title, language)}
                  </h1>
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Clock className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="text-white text-sm font-black uppercase tracking-widest">
                        {new Date(cleanMainNews[0].publishedAt || cleanMainNews[0].createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <Button className="bg-white text-black hover:bg-red-600 hover:text-white font-black rounded-full px-10 h-14 transition-all shadow-2xl transform active:scale-95">
                      EXPLORE NOW <ChevronRight className="ml-2 w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-FEATURED GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {cleanMainNews.slice(1, 5).map((item) => (
                <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
              ))}
            </div>
          </div>

          {/* HERO SIDEBAR */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <div className="flex justify-center">
                <WeatherWidget />
              </div>
            </div>

            {/* Sliding Ads / Banner */}
            {sidebarAdSettings?.enabled && sidebarAdSettings?.items?.length > 0 && (
              <Card
                className="overflow-hidden border border-gray-100 shadow-xl cursor-pointer rounded-[32px]"
                onClick={() => {
                  const url = sidebarAdSettings.items[currentAdIndex % sidebarAdSettings.items.length]?.destinationUrl;
                  if (url) window.open(url, '_blank')
                }}
              >
                <CardContent className="p-0 aspect-[4/3] relative bg-gray-100">
                  <Image src={sidebarAdSettings.items[currentAdIndex % sidebarAdSettings.items.length]?.imageUrl || '/placeholder-news.svg'} alt="Advertisement" fill className="object-cover transition-opacity duration-1000" />
                  <Badge className="absolute top-4 right-4 bg-black/50 text-white text-[10px] px-3 py-1.5 backdrop-blur-sm border-none uppercase tracking-widest">{t('advertisement') || 'Advertisement'}</Badge>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {sidebarAdSettings.items.map((_, idx) => (
                      <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === (currentAdIndex % sidebarAdSettings.items.length) ? 'bg-white w-6' : 'bg-white/50 w-2'}`} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="premium-card bg-white rounded-[32px] border border-gray-100 p-8 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-red-400"></div>
              <h3 className="font-heading font-black text-3xl mb-8 flex items-center gap-4">
                Must Read
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
              </h3>
              <div className="space-y-8">
                {cleanMainNews.slice(5, 10).map((item, idx) => (
                  <div key={item.id} onClick={() => handleNewsClick(item)} className="group flex gap-6 cursor-pointer items-start border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                    <span className="text-5xl font-heading font-black text-gray-100 group-hover:text-red-600 transition-all shrink-0 leading-none">0{idx + 1}</span>
                    <div className="space-y-2">
                      <h4 className="font-heading font-black text-lg text-gray-900 leading-[1.2] line-clamp-3 group-hover:text-red-700 transition-colors tracking-tight">
                        {getLocalizedText(item.title, language)}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{getTranslatedCategory(item.category, t, language)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LATEST NEWS SECTION */}
      {cleanLatestNews.length > 0 && (
        <section className="mb-10 w-full lg:container lg:mx-auto px-0 md:px-6">
          <div className="mag-section-header mb-6 md:mb-8 px-4 md:px-0 flex items-center justify-between">
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tighter">
              <span className="text-red-600">Latest</span> Update
            </h2>
            <div className="h-px flex-1 bg-gray-100 mx-4 md:mx-8"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-10">
            {cleanLatestNews.slice(0, 6).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
            ))}
          </div>
        </section>
      )}

      {/* BUSINESS SECTION - Restored Vibrant Blue Aesthetic */}
      {cleanBusinessNews.length > 0 && (
        <>
          {/* Mobile Ad Block: Right Before Business Section */}
          <div className="lg:hidden px-4 mb-6">
            {businessAdSettings?.enabled && (
              <BusinessAdWidget settings={businessAdSettings} t={t} onClick={() => { }} />
            )}
          </div>

          <section className="mb-10 w-full lg:container lg:mx-auto px-0 lg:px-6">
            <div className="relative bg-gradient-to-br from-[#0a1525] to-[#050810] text-white py-10 px-0 md:px-6 lg:p-12 rounded-none lg:rounded-[48px] overflow-hidden shadow-2xl border-y lg:border-x border-blue-900/20">
              <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

              <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-10 gap-6 md:gap-8 relative z-10 text-center md:text-left px-5 md:px-0">
                <div className="max-w-2xl flex flex-col items-center md:items-start">
                  <Badge className="bg-blue-600/30 text-blue-300 border border-blue-500/50 mb-6 px-5 py-2 font-black uppercase tracking-[0.3em] text-[10px] backdrop-blur-md shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                    {t('marketIntelligence') || 'Market Intelligence'}
                  </Badge>
                  <h2 className="font-heading font-black text-5xl md:text-8xl leading-[0.9] tracking-tighter">
                    {t('business') || 'Business'} & <br />
                    <span className="text-blue-400 italic font-serif glow-text-blue">{t('economy') || 'Economy'}</span>
                  </h2>
                </div>
                <Button
                  variant="outline"
                  className="text-white border-blue-500/30 bg-blue-600/10 hover:bg-blue-600 hover:border-blue-500 hover:text-white font-black rounded-full px-10 h-16 transition-all backdrop-blur-xl group shadow-lg shadow-blue-900/20"
                  onClick={() => handleCategoryClick('business')}
                >
                  {t('fullDirectory') || 'FULL DIRECTORY'} <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="bento-magazine relative z-10 gap-4 md:gap-8 mx-0 md:mx-0 pt-6 md:pt-0 pb-4">
                {cleanBusinessNews.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleNewsClick(item)}
                    className={`premium-card cursor-pointer rounded-2xl md:rounded-[32px] overflow-hidden relative group transition-all duration-700 h-[calc(100dvh-104px)] md:h-[300px] border border-white/20 shadow-lg ${idx === 0 ? 'lg:bento-item-large md:h-[632px]' : idx === 1 ? 'lg:bento-item-wide' : ''}`}
                  >
                    <Image
                      src={item.mainImage || item.images?.[0] || '/placeholder-news.svg'}
                      alt={getLocalizedText(item.title, language)}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-[3000ms]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                      <h3 className={`font-heading font-black leading-tight group-hover:text-blue-300 transition-colors tracking-tight ${idx === 0 ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>
                        {getLocalizedText(item.title, language)}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <div className="lg:hidden px-4 mb-10 space-y-4">
            {articleAdSettings?.banner?.enabled && articleAdSettings.banner.imageUrl && (
              <Card className="overflow-hidden border border-gray-100 shadow-md rounded-2xl cursor-pointer" onClick={() => articleAdSettings.banner.linkUrl && window.open(articleAdSettings.banner.linkUrl, '_blank')}>
                <CardContent className="p-0 aspect-[21/9] relative">
                  <Image src={articleAdSettings.banner.imageUrl} alt="Banner Ad" fill className="object-cover" />
                  <Badge className="absolute top-2 right-2 bg-black/50 text-white text-[8px] px-1.5 py-0.5">{t('advertisement') || 'Advertisement'}</Badge>
                </CardContent>
              </Card>
            )}
            {articleAdSettings?.sticky?.enabled && (
              <StickyAdWidget settings={articleAdSettings} t={t} onClick={() => articleAdSettings.sticky.linkUrl && window.open(articleAdSettings.sticky.linkUrl, '_blank')} />
            )}
            <SubscribeWidget />
          </div>
        </>
      )}

      {/* POLITICS & NATIONAL */}
      {cleanPoliticsNews.length > 0 && (
        <section className="mb-10 w-full lg:container lg:mx-auto px-0 md:px-6 grid lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="mag-section-header mb-6 md:mb-8 px-4 md:px-0">
              <h2 className="text-4xl font-heading font-black tracking-tighter">{t('nationalPolitics') || 'National Politics'}</h2>
            </div>
            <div className="space-y-0 md:space-y-8">
              {cleanPoliticsNews[0] && (
                <div onClick={() => handleNewsClick(cleanPoliticsNews[0])} className="premium-card rounded-none md:rounded-[32px] overflow-hidden cursor-pointer group shadow-none md:shadow-lg border-y md:border border-gray-100 mb-6 md:mb-0">
                  <div className="relative aspect-[21/9] mb-6 md:mb-8 overflow-hidden">
                    <Image src={cleanPoliticsNews[0].mainImage || '/placeholder-news.svg'} alt="Hero" fill className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" />
                    <Badge className="absolute top-4 left-4 md:top-6 md:left-6 bg-red-600 text-white border-none px-3 md:px-4 py-1 md:py-2 font-black uppercase text-[10px] tracking-widest shadow-2xl">{t('breakingNews') || 'Breaking News'}</Badge>
                  </div>
                  <div className="px-5 md:px-6 pb-6">
                    <h3 className="font-heading font-black text-2xl md:text-4xl mb-4 md:mb-6 leading-[1.15] group-hover:text-red-600 transition-colors tracking-tight">{getLocalizedText(cleanPoliticsNews[0].title, language)}</h3>
                    <p className="text-gray-600 line-clamp-3 md:line-clamp-2 mb-6 md:mb-8 text-base md:text-xl leading-relaxed">{getLocalizedText(cleanPoliticsNews[0].content, language)?.substring(0, 200)}...</p>
                    <span className="text-xs md:text-sm font-black text-red-600 flex items-center gap-2 group-hover:translate-x-2 transition-transform">{t('viewFullReport') || 'VIEW FULL REPORT'} <ChevronRight className="w-5 h-5" /></span>
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-0 md:gap-10">
                {cleanPoliticsNews.slice(1, 3).map(item => (
                  <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div>
              <div className="mag-section-header text-2xl mb-8">{t('dailyDigest') || 'The Daily Digest'}</div>
              <div className="space-y-10">
                {cleanEducationNews.slice(0, 4).map(item => (
                  <div key={item.id} onClick={() => handleNewsClick(item)} className="group cursor-pointer border-l-4 border-red-600 pl-8 transition-all hover:bg-gray-50 py-2">
                    <span className="text-sm font-black text-red-600 mb-2 block">{t('quickBrief') || 'Quick Brief'}</span>
                    <h4 className="font-heading font-black text-xl leading-tight group-hover:text-red-700 transition-colors tracking-tight">{getLocalizedText(item.title, language)}</h4>
                  </div>
                ))}
              </div>
            </div>

            <div className="sponsored-card bg-gray-50 rounded-[40px] p-8 border border-gray-100 flex flex-col items-center text-center mb-8">
              <Badge className="bg-gray-200 text-gray-500 border-none mb-8 px-4 py-1 text-[10px] uppercase font-black tracking-widest">{t('sponsored') || 'Sponsored'}</Badge>
              <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-heading font-black text-2xl mb-4">{t('premiumBusinessPlacements') || 'Premium Business Placements'}</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">{t('premiumPlacementDesc') || 'Reach our exclusive audience of millions with high-impact editorial placements.'}</p>
              <Button className="w-full bg-black text-white rounded-full h-14 font-black hover:bg-red-600 transition-colors" onClick={() => setPromotionOpen(true)}>{t('getInTouch') || 'GET IN TOUCH'}</Button>
            </div>

            {businessAdSettings?.enabled && (
              <BusinessAdWidget settings={businessAdSettings} t={t} onClick={() => { }} />
            )}

            <SubscribeWidget />
          </div>
        </section>
      )}

      {/* CRIME SECTION */}
      {cleanCrimeNews.length > 0 && (
        <section className="mb-10 w-full lg:container lg:mx-auto px-0 md:px-6">
          <div className="mag-section-header mb-6 md:mb-8 px-4 md:px-0 flex items-center justify-between">
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tighter">
              <span className="text-red-700">Crime</span> & Justice
            </h2>
            <div className="hidden md:block h-px flex-1 bg-gray-100 mx-8"></div>
            <Button variant="outline" className="rounded-full font-black hidden md:flex" onClick={() => handleCategoryClick('crime')}>
              View All <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-10">
            {cleanCrimeNews.slice(0, 3).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
            ))}
          </div>
        </section>
      )}

      {/* SPORTS SECTION */}
      {cleanSportsNews.length > 0 && (
        <section className="mb-10 w-full lg:container lg:mx-auto px-0 lg:px-6">
          <div className="relative bg-gradient-to-br from-[#0d3320] to-[#061a10] text-white py-10 md:py-12 px-0 md:px-6 lg:p-12 rounded-none lg:rounded-[48px] overflow-hidden shadow-2xl border-y lg:border-x border-green-900/20">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-10 gap-6 md:gap-8 relative z-10 text-center md:text-left px-5 md:px-0">
              <div className="max-w-2xl flex flex-col items-center md:items-start">
                <Badge className="bg-green-600/30 text-green-300 border border-green-500/50 mb-6 px-5 py-2 font-black uppercase tracking-[0.3em] text-[10px] backdrop-blur-md">
                  Live Updates
                </Badge>
                <h2 className="font-heading font-black text-6xl md:text-8xl leading-[0.9] tracking-tighter">
                  Sports <br />
                  <span className="text-green-400 italic font-serif">Arena</span>
                </h2>
              </div>
              <Button
                variant="outline"
                className="text-white border-green-500/30 bg-green-600/10 hover:bg-green-600 hover:border-green-500 hover:text-white font-black rounded-full px-10 h-16 transition-all backdrop-blur-xl group"
                onClick={() => handleCategoryClick('sports')}
              >
                ALL SPORTS <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 relative z-10 mx-0 md:mx-0 pt-6 md:pt-0 pb-4">
              {cleanSportsNews.slice(0, 3).map((item) => (
                <div key={item.id} onClick={() => handleNewsClick(item)} className="premium-card cursor-pointer rounded-2xl md:rounded-[24px] overflow-hidden relative group h-[calc(100dvh-104px)] md:h-[280px] border border-white/20 shadow-lg">
                  <Image src={item.mainImage || item.images?.[0] || '/placeholder-news.svg'} alt={getLocalizedText(item.title, language)} fill className="object-cover group-hover:scale-110 transition-transform duration-[3000ms]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-5 w-full">
                    <h3 className="font-heading font-black text-xl leading-tight group-hover:text-green-300 transition-colors tracking-tight text-white">{getLocalizedText(item.title, language)}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EDUCATION SECTION */}
      {cleanEducationNews.length > 0 && (
        <section className="mb-10 w-full lg:container lg:mx-auto px-0 md:px-6">
          <div className="mag-section-header mb-6 md:mb-8 px-4 md:px-0 flex items-center justify-between">
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tighter">
              <span className="text-blue-600">Education</span> & Learning
            </h2>
            <div className="hidden md:block h-px flex-1 bg-gray-100 mx-8"></div>
            <Button variant="outline" className="rounded-full font-black hidden md:flex" onClick={() => handleCategoryClick('education')}>
              View All <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-10">
            {cleanEducationNews.slice(0, 3).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
            ))}
          </div>
        </section>
      )}

      {/* HEALTH SECTION */}
      {cleanHealthNews.length > 0 && (
        <section className="mb-10 w-full lg:container lg:mx-auto px-0 md:px-6">
          <div className="mag-section-header mb-6 md:mb-8 px-4 md:px-0 flex items-center justify-between">
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tighter">
              <span className="text-emerald-600">Health</span> & Wellness
            </h2>
            <div className="hidden md:block h-px flex-1 bg-gray-100 mx-8"></div>
            <Button variant="outline" className="rounded-full font-black hidden md:flex" onClick={() => handleCategoryClick('health')}>
              View All <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-10">
            {cleanHealthNews.slice(0, 3).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
            ))}
          </div>
        </section>
      )}

      {/* TECHNOLOGY SECTION */}
      {cleanTechnologyNews.length > 0 && (
        <section className="mb-10 container mx-auto px-6">
          <div className="mag-section-header mb-8 flex items-center justify-between">
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tighter">
              <span className="text-purple-600">Technology</span> & Innovation
            </h2>
            <div className="h-px flex-1 bg-gray-100 mx-8"></div>
            <Button variant="outline" className="rounded-full font-black" onClick={() => handleCategoryClick('technology')}>
              View All <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {cleanTechnologyNews.slice(0, 3).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
            ))}
          </div>
        </section>
      )}

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/917020873300"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group active:scale-90 transition-transform hidden lg:block"
      >
        <div className="absolute right-16 bg-white text-gray-900 text-[10px] font-black px-4 py-2 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block border border-gray-100 italic">
          Need help? <span className="text-green-600 underline">Chat with us</span>
        </div>
        <div className="bg-[#25D366] p-4 rounded-full shadow-[0_10px_40px_-10px_rgba(37,211,102,0.6)] hover:bg-[#128C7E] transition-all hover:scale-110 flex items-center justify-center">
          <WhatsAppIcon className="w-7 h-7 text-white fill-current" />
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 border-2 border-white rounded-full animate-ping opacity-75"></span>
      </a>

      {/* Bottom News Grid - Full Width, No Sidebar */}
      <div className="container mx-auto px-4 mt-20">
        <div className="space-y-12">
          <div className="mag-section-header mb-8 flex items-center justify-between">
            <h2 className="text-4xl font-heading font-black tracking-tighter">
              {t('moreStories') || 'More Stories'}
            </h2>
            <div className="h-px flex-1 bg-gray-100 mx-8"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {oldNews.slice(6, visibleMoreStories + 6).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
            ))}
          </div>
          {oldNews.length > visibleMoreStories + 6 && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                className="rounded-full px-12 h-14 font-black border-2 border-gray-200 hover:border-red-600 hover:text-red-600 transition-all"
                onClick={() => setVisibleMoreStories(prev => prev + 12)}
              >
                {t('loadMore') || 'LOAD MORE STORIES'}
              </Button>
            </div>
          )}
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
    </div>
  );
}

export default HomePage;