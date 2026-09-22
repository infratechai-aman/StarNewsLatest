'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Clock, Youtube, User, Shield, TrendingUp, TrendingDown, Play, Users, BookOpen, MapPin, Newspaper } from 'lucide-react'
import { news } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedText } from '@/lib/newsData'
import { proxyImageUrl } from '@/lib/imageProxy'
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


// Comprehensive mapping of all category variants (English, Marathi, Hindi)
const CATEGORY_TRANSLATION_MAP = {
  // English
  'business': 'business',
  'national': 'nation',
  'nation': 'nation',
  'politics': 'politics',
  'entertainment': 'entertainment',
  'sports': 'sports',
  'technology': 'technology',
  'tech': 'technology',
  'health': 'health',
  'education': 'education',
  'crime': 'crime',
  'city news': 'cityNews',
  'citynews': 'cityNews',
  'city': 'cityNews',
  'jobs': 'jobs',
  'trending': 'trending',
  'murder': 'crime',
  'general': 'general',

  // Marathi & Hindi variants (scraped from old Star News / regional portals)
  'व्यापार': 'business',
  'व्यवसाय': 'business',
  'उद्योग': 'business',
  'गुन्हा': 'crime',
  'अपराध': 'crime',
  'क्राईम': 'crime',
  'खून': 'crime',
  'हत्या': 'crime',
  'राजकारण': 'politics',
  'राजनीति': 'politics',
  'खेळ': 'sports',
  'खेल': 'sports',
  'क्रीडा': 'sports',
  'मनोरंजन': 'entertainment',
  'सिनेमा': 'entertainment',
  'बॉलीवूड': 'entertainment',
  'शिक्षण': 'education',
  'शिक्षा': 'education',
  'आरोग्य': 'health',
  'स्वास्थ्य': 'health',
  'तंत्रज्ञान': 'technology',
  'टेक्नॉलॉजी': 'technology',
  'देश': 'nation',
  'राष्ट्रीय': 'nation',
  'राष्ट्र': 'nation',
  'शहर': 'cityNews',
  'शहर वार्ता': 'cityNews',
  'स्थानिक': 'cityNews',
  'पुणे': 'cityNews',
  'पुणे शहर': 'cityNews',
  'महाराष्ट्र': 'nation',
  'सामान्य': 'general',
  'रोजगार': 'jobs',
  'नोकरी': 'jobs'
};

// Helper to map DB category names to translation keys
const getTranslatedCategory = (cat, t, language) => {
  if (!cat) return ''
  // If it's already an object, use getLocalizedText
  if (typeof cat === 'object') return getLocalizedText(cat, language)

  const catStr = String(cat).trim()
  const key = CATEGORY_TRANSLATION_MAP[catStr.toLowerCase()] || CATEGORY_TRANSLATION_MAP[catStr]
  if (key) {
    const translated = t(key)
    if (translated && translated !== key) return translated
    if (language === 'en') {
      const enLabels = {
        business: 'Business', crime: 'Crime', politics: 'Politics',
        entertainment: 'Entertainment', sports: 'Sports', technology: 'Technology',
        health: 'Health', education: 'Education', nation: 'Nation',
        cityNews: 'City News', jobs: 'Jobs', trending: 'Trending', general: 'General'
      }
      if (enLabels[key]) return enLabels[key]
    }
  }

  const fallbackKey = catStr.toLowerCase()
  const translated = t(fallbackKey)
  return translated !== fallbackKey ? translated : catStr
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
    const isValidUrl = (url) => url && (url.startsWith('http') || url.startsWith('data:image') || url.startsWith('/api/') || url.startsWith('/wp-content/'))

    // Priority: mainImage first (most reliable from API), then thumbnailUrl, galleryImages, then legacy fields
    if (isValidUrl(item.mainImage)) imgList.push(proxyImageUrl(item.mainImage))
    if (isValidUrl(item.thumbnailUrl) && !imgList.includes(proxyImageUrl(item.thumbnailUrl))) imgList.push(proxyImageUrl(item.thumbnailUrl))
    if (item.galleryImages?.length) item.galleryImages.forEach(img => isValidUrl(img) && !imgList.includes(proxyImageUrl(img)) && imgList.push(proxyImageUrl(img)))
    if (item.thumbnails?.length) item.thumbnails.forEach(t => isValidUrl(t) && !imgList.includes(proxyImageUrl(t)) && imgList.push(proxyImageUrl(t)))
    if (item.images?.length) item.images.forEach(img => isValidUrl(img) && !imgList.includes(proxyImageUrl(img)) && imgList.push(proxyImageUrl(img)))
    if (!imgList.length) imgList.push('/placeholder-news.svg')
    return imgList
  }

  const images = getValidImages()

  return (
    <div
      className="premium-card group cursor-pointer overflow-hidden bg-white border border-gray-200/60 shadow-sm hover:shadow-md rounded-xl md:rounded-2xl transition-all duration-300 mb-4 md:mb-0"
      onClick={() => onClick(item)}
    >
      <div className="relative aspect-[4/3] md:aspect-[16/10] overflow-hidden bg-gray-100">
        {images.map((img, index) => (
          <Image
            key={index}
            src={img}
            alt={title}
            fill
            className={`object-contain transition-all duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={true}
            referrerPolicy="no-referrer"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {category && (
          <Badge className="absolute top-4 left-0 bg-[#cd4a4c] text-white text-[13px] md:text-[14px] font-bold px-3 py-1 md:py-1.5 rounded-l-none rounded-r-md shadow-md z-10 border-none tracking-normal capitalize">
            {category}
          </Badge>
        )}
      </div>
      <div className="p-5 md:p-4">
        <h3 className="font-heading font-black text-2xl md:text-lg md:font-extrabold leading-[1.2] line-clamp-3 md:line-clamp-2 group-hover:text-red-600 transition-colors tracking-tight text-gray-900">
          {title}
        </h3>
        <div className="mt-4 md:mt-3 flex items-center justify-between">
          <span className="text-[11px] md:text-[10px] font-bold text-gray-500 flex items-center gap-1.5" suppressHydrationWarning>
            <Clock className="w-3.5 h-3.5" /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
          </span>
          <span className="text-[11px] md:text-[10px] font-black text-red-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">{t('readFullStory') || 'Read Full Story →'}</span>
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
  const [imgSrc, setImgSrc] = useState(proxyImageUrl(item.mainImage || item.images?.[0] || '/placeholder-news.svg'))

  useEffect(() => {
    setImgSrc(proxyImageUrl(item.mainImage || item.images?.[0] || '/placeholder-news.svg'))
  }, [item])

  const accentBorderHover = {
    red: 'group-hover:text-red-600',
    green: 'group-hover:text-green-600',
    blue: 'group-hover:text-blue-600',
    emerald: 'group-hover:text-emerald-600',
    purple: 'group-hover:text-purple-600',
  }[accentColor] || 'group-hover:text-red-600'

  const badgeBg = {
    red: 'bg-red-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    purple: 'bg-purple-600',
  }[accentColor] || 'bg-red-600'

  return (
    <div
      className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col h-full"
      onClick={() => onClick(item)}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <Image
          src={imgSrc}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgSrc('/placeholder-news.svg')}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          unoptimized={true}
          referrerPolicy="no-referrer"
        />
        {category && (
          <span className={`absolute bottom-2 left-2 ${badgeBg} text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow`}>
            {category}
          </span>
        )}
      </div>
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <h4 className={`font-bold text-[13px] line-clamp-2 ${accentBorderHover} transition-colors leading-snug text-gray-900`}>
          {title}
        </h4>
        <div className="text-[10px] text-gray-400 mt-2.5 flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="flex items-center gap-1" suppressHydrationWarning>
            <Clock className="h-3 w-3" />
            {item.publishedAt || item.createdAt ? new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {item.views || 0}
          </span>
        </div>
      </div>
    </div>
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
              <Button
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('openPostAdModal'))}
                className="mt-3 bg-white text-orange-600 hover:bg-gray-100 font-bold cursor-pointer shadow-sm active:scale-95 transition-transform"
              >
                {settings?.buttonText || t('postYourAd')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const SubscribeWidget = () => {
  const { t } = useLanguage()
  return (
    <Card className="overflow-hidden border-2 border-red-100 shadow-lg bg-white mb-4">
      <CardContent className="p-4 flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg mb-2 cursor-pointer hover:scale-110 transition-transform">
          <Youtube className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900">{t('subscribeNow') || 'Subscribe Now!'}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {t('subscribeDesc') || 'Join our YouTube channel for breaking news and live updates.'}
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
            {t('subscribe') || 'Subscribe'}
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}

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

  // Stock ticker state
  const [stockData, setStockData] = useState({
    sensex: { value: '81,523.12', change: '+620.18', pct: '+0.77%', up: true },
    nifty: { value: '24,972.40', change: '+182.35', pct: '+0.74%', up: true }
  })

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

  // Derived collections for specific sections - dynamic latest news
  const latestNews = newsData?.latestNews || newsData?.mainNewsBoxes?.slice(0, 8) || oldNews.slice(0, 8)

  const setMainNewsBoxes = (data) => setNewsData && setNewsData(prev => ({ ...prev, mainNewsBoxes: data }))
  const setLatestNews = (data) => setNewsData && setNewsData(prev => ({ ...prev, latestNews: data }))
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
      const response = await news.getAll({ limit: 50 }) // fix(DEFECT-04): Reduced from 100 — page only shows ~50 articles
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
        const trimmed = catStr.toLowerCase().trim()
        return CATEGORY_TRANSLATION_MAP[trimmed] || CATEGORY_TRANSLATION_MAP[catStr.trim()] || trimmed
      }

      // Category-based filtering
      // Politics / City News -> Politics section
      const politicsCategories = ['politics', 'citynews', 'city news', 'city', 'civic']
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

      // Dynamic Latest News: most recent articles (excluding the lead hero)
      const heroId = topNews[0]?.id
      const latestNewsFiltered = articles.filter(a => a.id !== heroId).slice(0, 10)

      // Batch update the parent state
      if (setNewsData) {
        setNewsData(prev => ({
          ...prev,
          mainNewsBoxes: topNews,
          latestNews: latestNewsFiltered,
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
        setLatestNews(latestNewsFiltered)
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
      setSidebarAdSettings(await getSidebarAdSettings())
      setArticleAdSettings(getArticleAdSettings())
      setBusinessAdSettings(getBusinessAdSettings())
      setTrendingSettings(getTrendingSettings())
    }
    loadSettings()

    const handleSettingsChange = () => {
      loadSettings()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('adSettingsChanged', handleSettingsChange)
      window.addEventListener('storage', handleSettingsChange)
    }

    // Refresh ad settings periodically
    const interval = setInterval(loadSettings, 300000)
    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('adSettingsChanged', handleSettingsChange)
        window.removeEventListener('storage', handleSettingsChange)
      }
    }
  }, [])

  // Fetch real-time stock data (NSE via Yahoo Finance public endpoint)
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        // Use Yahoo Finance v7 (no key needed, CORS ok via our own API proxy pattern)
        const [sensexRes, niftyRes] = await Promise.all([
          fetch('/api/finance?symbol=%5EBSESN'),
          fetch('/api/finance?symbol=%5ENSEI')
        ])
        const [sensexJson, niftyJson] = await Promise.all([sensexRes.json(), niftyRes.json()])
        const toIndian = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 })
        const fmt = (n) => (n >= 0 ? '+' : '') + toIndian(n)
        const sensexMeta = sensexJson?.chart?.result?.[0]?.meta
        const niftyMeta = niftyJson?.chart?.result?.[0]?.meta
        if (sensexMeta && niftyMeta) {
          const sChange = sensexMeta.regularMarketPrice - sensexMeta.previousClose
          const sPct = (sChange / sensexMeta.previousClose) * 100
          const nChange = niftyMeta.regularMarketPrice - niftyMeta.previousClose
          const nPct = (nChange / niftyMeta.previousClose) * 100
          setStockData({
            sensex: { value: toIndian(sensexMeta.regularMarketPrice), change: fmt(sChange), pct: fmt(sPct) + '%', up: sChange >= 0 },
            nifty: { value: toIndian(niftyMeta.regularMarketPrice), change: fmt(nChange), pct: fmt(nPct) + '%', up: nChange >= 0 }
          })
        }
      } catch (e) {
        // Silently fail — keep default placeholder values
      }
    }
    fetchStocks()
    const stockTimer = setInterval(fetchStocks, 60000) // Refresh every 1 min
    return () => clearInterval(stockTimer)
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
                  <div className="mt-4 flex items-center gap-2 text-gray-300 text-xs font-bold" suppressHydrationWarning>
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    {item.publishedAt || item.createdAt ? new Date(item.publishedAt || item.createdAt).toLocaleDateString() : ''}
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
                      <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-2" suppressHydrationWarning>
                        <Clock className="w-3 h-3 text-gray-400" /> {item.publishedAt || item.createdAt ? new Date(item.publishedAt || item.createdAt).toLocaleDateString() : ''}
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

      {/* --- DESKTOP VIEW (News Portal Style) --- */}
      <div className="hidden lg:block max-w-[1340px] mx-auto px-6 mb-8">

        {/* HERO ROW: Left big story + right sidebar */}
        <div className="grid grid-cols-12 gap-5">

          {/* LEFT: Big hero */}
          <div className="col-span-6 flex">
            {/* Hero image */}
            {cleanMainNews[0] && (
              <div
                onClick={() => handleNewsClick(cleanMainNews[0])}
                className="relative w-full flex-shrink-0 overflow-hidden cursor-pointer group bg-gray-100 rounded-xl shadow-md"
                style={{ minHeight: '460px' }}
              >
                <Image
                  src={cleanMainNews[0].mainImage || cleanMainNews[0].images?.[0] || '/placeholder-news.svg'}
                  alt={getLocalizedText(cleanMainNews[0].title, language)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent rounded-xl"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <div className="flex gap-2 mb-3">
                    <Badge className="bg-red-600 text-white border-none text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-sm">{t('topStory') || 'Top Story'}</Badge>
                    {cleanMainNews[0].category && (
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-none text-[10px] font-bold uppercase px-3 py-1 rounded-sm">{getTranslatedCategory(cleanMainNews[0].category, t, language)}</Badge>
                    )}
                  </div>
                  <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] mb-3 group-hover:text-red-100 transition-colors drop-shadow-xl">
                    {getLocalizedText(cleanMainNews[0].title, language)}
                  </h1>
                  <p className="text-gray-300 text-[13px] md:text-sm line-clamp-2 mb-4 leading-relaxed max-w-2xl">
                    {getLocalizedText(cleanMainNews[0].content, language)?.substring(0, 180)}...
                  </p>
                  <button className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-[12px] font-black px-5 py-2.5 rounded-full transition-colors shadow-lg">
                    {t('readFullStory') || t('readMore') || 'Read Full Story'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* MIDDLE: 3 stacked sub-articles */}
          <div className="col-span-3 flex flex-col gap-4">
            {cleanMainNews.slice(1, 4).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleNewsClick(item)}
                className="flex flex-col flex-1 cursor-pointer group bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
              >
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-white/90 backdrop-blur text-gray-900 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">{getTranslatedCategory(item.category, t, language) || t('news') || 'News'}</span>
                </div>
                <div className="relative w-full h-[120px] flex-shrink-0 overflow-hidden bg-gray-100">
                  <Image
                    src={proxyImageUrl(item.mainImage || item.images?.[0] || '/placeholder-news.svg')}
                    alt={getLocalizedText(item.title, language)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 p-3.5 flex flex-col justify-between">
                  <h3 className="text-[14px] font-bold leading-[1.3] text-gray-900 group-hover:text-red-600 transition-colors line-clamp-3">{getLocalizedText(item.title, language)}</h3>
                  <span className="text-[10px] text-gray-400 mt-2 block flex items-center gap-1 font-semibold" suppressHydrationWarning>
                    <Clock className="w-3 h-3 text-gray-300" />
                    {item.publishedAt || item.createdAt ? new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT SIDEBAR: Weather + E-Paper */}
          <div className="col-span-3 flex flex-col gap-4">
            {/* Weather widget */}
            <WeatherWidget className="rounded-xl shadow-lg p-5 mb-0 w-full" />

            {/* Today's E-Paper widget */}
            <div className="border border-gray-100 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setCurrentView('enewspaper')}>
              <div className="p-4 pb-2 relative z-10 bg-white">
                <h3 className="font-black text-base text-gray-900">{t('todaysEpaper') || "Today's E-Paper"}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{t('readLatestEdition') || 'Read the latest edition'}</p>
              </div>
              <div className="relative w-full overflow-hidden flex justify-center items-center" style={{ height: '280px' }}>
                <Image 
                  src="/star_news_epaper.jpg" 
                  alt="Star News India E-Paper" 
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500 p-2" 
                />
              </div>
              <button
                className="w-full mt-0 bg-[#0f111a] hover:bg-red-600 text-white text-sm font-bold py-3.5 px-4 transition-colors flex items-center justify-between relative z-10 shadow-lg rounded-b-xl"
              >
                {t('readEpaper') || 'Read E-Paper'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rotating sidebar ad */}
            {sidebarAdSettings?.enabled && sidebarAdSettings?.items?.length > 0 && (
              <div
                className="relative overflow-hidden cursor-pointer bg-gray-100 aspect-[4/3] rounded-xl shadow-sm"
                onClick={() => {
                  const url = sidebarAdSettings.items[currentAdIndex % sidebarAdSettings.items.length]?.destinationUrl;
                  if (url) window.open(url, '_blank')
                }}
              >
                <Image src={proxyImageUrl(sidebarAdSettings.items[currentAdIndex % sidebarAdSettings.items.length]?.imageUrl || '/placeholder-news.svg')} alt="Advertisement" fill className="object-cover transition-opacity duration-1000" />
                <Badge className="absolute top-2 right-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 border-none rounded-sm">Ad</Badge>
              </div>
            )}
          </div>
        </div>

        {/* LATEST NEWS + MUST READ ROW */}
        <div className="grid grid-cols-12 gap-5 mt-8 border-t border-gray-200 pt-6">
          {/* Latest News - horizontal cards */}
          <div className="col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-red-600 rounded-full block"></span>
                {t('latestNews') || 'Latest News'}
              </h2>
              <button onClick={() => setCurrentView('news')} className="text-red-600 text-xs font-black hover:underline flex items-center gap-1">{t('viewAll') || 'View All'} <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {cleanLatestNews.slice(0, 4).map((item, idx) => (
                <div key={item.id} onClick={() => handleNewsClick(item)} className="cursor-pointer group flex flex-col h-full">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 mb-3 rounded-lg shadow-sm">
                    <Image
                      src={proxyImageUrl(item.mainImage || item.images?.[0] || '/placeholder-news.svg')}
                      alt={getLocalizedText(item.title, language)}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {item.category && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-600 mb-1.5 block">
                      {getTranslatedCategory(item.category, t, language)}
                    </span>
                  )}
                  <h4 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-red-600 transition-colors mb-2">{getLocalizedText(item.title, language)}</h4>
                  <div className="mt-auto flex items-center gap-1.5 text-[10px] font-semibold text-gray-400" suppressHydrationWarning>
                    <Clock className="w-3 h-3 text-gray-300" />
                    {item.publishedAt || item.createdAt ? new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
                    {(() => {
                      const dateStr = item.publishedAt || item.createdAt;
                      if (!dateStr) return null;
                      const diffMs = Date.now() - new Date(dateStr).getTime();
                      if (isNaN(diffMs) || diffMs < 0) return null;
                      const diffMins = Math.floor(diffMs / (1000 * 60));
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      let rel = '';
                      if (diffMins < 60) rel = `${Math.max(1, diffMins)}m ago`;
                      else if (diffHours < 24) rel = `${diffHours}h ago`;
                      else if (diffDays < 7) rel = `${diffDays}d ago`;
                      if (!rel) return null;
                      return (
                        <>
                          <span className="text-gray-300 mx-0.5">•</span>
                          <span>{rel}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Must Read list */}
          <div className="col-span-4 border-l border-gray-200 pl-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-red-600 rounded-full block"></span>
                {t('mustRead') || 'Must Read'}
              </h2>
              <div className="flex gap-1">
                <button className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-500 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors text-sm">&#8249;</button>
                <button className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-500 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors text-sm">&#8250;</button>
              </div>
            </div>
            <div className="space-y-4">
              {cleanMainNews.slice(4, 8).map((item, idx) => (
                <div key={item.id} onClick={() => handleNewsClick(item)} className="flex gap-3 cursor-pointer group border-b border-gray-100 pb-3.5 last:border-b-0 last:pb-0">
                  <span className="text-[28px] font-black text-gray-200 group-hover:text-red-600 transition-colors shrink-0 leading-none w-8">0{idx + 1}</span>
                  <div className="min-w-0">
                    <h4 className="text-[12px] font-bold text-gray-900 leading-[1.4] line-clamp-2 group-hover:text-red-600 transition-colors">{getLocalizedText(item.title, language)}</h4>
                    <span className="text-[10px] text-gray-400 mt-1 block" suppressHydrationWarning>
                      {item.publishedAt || item.createdAt ? new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LATEST NEWS SECTION — Mobile only (desktop covered above) */}
      {cleanLatestNews.length > 0 && (
        <section className="mb-10 w-full lg:container lg:mx-auto px-0 md:px-6 lg:hidden">
          <div className="mag-section-header mb-6 md:mb-8 px-4 md:px-0 flex items-center justify-between">
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tighter">
              <span className="text-red-600">{t('latestNews') || 'Latest'}</span> {t('update') || 'Update'}
            </h2>
            <div className="h-px flex-1 bg-gray-100 mx-4 md:mx-8"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-10">
            {cleanLatestNews.slice(0, 4).map((item) => (
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

          <section className="mb-10 w-full lg:max-w-[1340px] lg:mx-auto px-0 lg:px-6">
            {/* Business & Economy section with BSE background image */}
            <div className="relative text-white py-10 px-5 lg:px-10 overflow-hidden shadow-2xl rounded-xl lg:rounded-2xl">
              {/* Background image */}
              <div className="absolute inset-0 z-0">
                <Image src="/business-economy-bg.jpg" alt="" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/85 to-[#0a1628]/70"></div>
              </div>

              {/* Header row */}
              <div className="flex items-end justify-between mb-6 relative z-10">
                <div>
                  <h2 className="font-black text-3xl lg:text-4xl leading-tight">
                    {t('business') || 'Business'} &amp; <span className="text-green-400 italic font-serif">{t('economy') || 'Economy'}</span>
                  </h2>
                  <p className="text-[12px] text-gray-400 mt-1">{t('businessTagline') || 'Markets. Policy. Business. Your edge in a changing economy.'}</p>
                </div>
                <Button variant="outline" size="sm" className="text-white border-white/20 bg-white/5 hover:bg-green-600 hover:border-green-500 hover:text-white font-black text-xs px-5 h-9 rounded-lg transition-all backdrop-blur-sm" onClick={() => handleCategoryClick('business')}>
                  {t('viewAll') || 'View All'} <ChevronRight className="ml-1 w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Stock ticker bar */}
              <div className="flex gap-8 bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-3.5 mb-7 relative z-10 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">SENSEX</span>
                  <span className="text-xl font-black text-white">{stockData.sensex.value}</span>
                  <span className={`flex items-center gap-1 text-sm font-bold ${stockData.sensex.up ? 'text-green-400' : 'text-red-400'}`}>
                    {stockData.sensex.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {stockData.sensex.change} ({stockData.sensex.pct})
                  </span>
                </div>
                <div className="w-px bg-white/15"></div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">NIFTY 50</span>
                  <span className="text-xl font-black text-white">{stockData.nifty.value}</span>
                  <span className={`flex items-center gap-1 text-sm font-bold ${stockData.nifty.up ? 'text-green-400' : 'text-red-400'}`}>
                    {stockData.nifty.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {stockData.nifty.change} ({stockData.nifty.pct})
                  </span>
                </div>
              </div>

              {/* Business news cards */}
              <div className="grid grid-cols-3 gap-5 relative z-10">
                {cleanBusinessNews.slice(0, 3).map((item, idx) => {
                  const labels = [t('markets') || 'Markets', t('economy') || 'Economy', t('corporate') || 'Corporate']
                  const labelColors = ['bg-red-600', 'bg-green-600', 'bg-blue-600']
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNewsClick(item)}
                      className="cursor-pointer group overflow-hidden relative bg-white/5 border border-white/10 hover:border-green-400/40 transition-all rounded-xl hover:bg-white/10"
                    >
                      <div className="relative h-40 overflow-hidden bg-gray-900 rounded-t-xl">
                        <Image
                          src={proxyImageUrl(item.mainImage || item.images?.[0] || '/placeholder-news.svg')}
                          alt={getLocalizedText(item.title, language)}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <span className={`absolute top-3 left-3 ${labelColors[idx]} text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-wider rounded-sm shadow-lg`}>{labels[idx]}</span>
                      </div>
                      <div className="p-3.5">
                        <h4 className="text-[13px] font-bold text-white leading-[1.4] line-clamp-2 group-hover:text-green-300 transition-colors">{getLocalizedText(item.title, language)}</h4>
                        <span className="text-[10px] text-gray-500 mt-1.5 block" suppressHydrationWarning>
                          {item.publishedAt || item.createdAt ? new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
          <div className="lg:hidden px-4 mb-10 space-y-4">
            {articleAdSettings?.banner?.enabled && articleAdSettings.banner.imageUrl && (
              <Card className="overflow-hidden border border-gray-100 shadow-md rounded-2xl cursor-pointer" onClick={() => articleAdSettings.banner.linkUrl && window.open(articleAdSettings.banner.linkUrl, '_blank')}>
                <CardContent className="p-0 aspect-[21/9] relative">
                  <Image src={proxyImageUrl(articleAdSettings.banner.imageUrl)} alt="Banner Ad" fill className="object-cover" />
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

      {/* NATIONAL POLITICS + CRIME & JUSTICE — Side by Side (desktop) + LIVE TV */}
      <section className="mb-10 w-full lg:max-w-[1340px] lg:mx-auto px-0 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6">

          {/* National Politics — left col */}
          {cleanPoliticsNews.length > 0 && (
            <div className="lg:col-span-4 pt-4 px-4 lg:px-0">
              <div className="flex items-center justify-between mb-3 border-b-2 border-red-600 pb-2">
                <h2 className="text-lg font-black text-gray-900">{t('nationalPolitics') || 'National Politics'}</h2>
                <button onClick={() => handleCategoryClick('politics')} className="text-red-600 text-xs font-bold hover:underline flex items-center gap-0.5">{t('viewAll') || 'View All'} <ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
              {cleanPoliticsNews[0] && (
                <div onClick={() => handleNewsClick(cleanPoliticsNews[0])} className="cursor-pointer group mb-3">
                  <div className="relative aspect-video overflow-hidden bg-gray-100 mb-2 rounded-lg">
                    <Image src={proxyImageUrl(cleanPoliticsNews[0].mainImage || '/placeholder-news.svg')} alt="Politics" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white border-none text-[9px] font-black uppercase px-2 py-0.5 tracking-wider rounded-sm">{t('politics') || 'Politics'}</Badge>
                  </div>
                  <h3 className="font-bold text-[14px] leading-tight group-hover:text-red-600 transition-colors mb-1">{getLocalizedText(cleanPoliticsNews[0].title, language)}</h3>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1" suppressHydrationWarning><Clock className="w-3 h-3" />{cleanPoliticsNews[0].publishedAt ? new Date(cleanPoliticsNews[0].publishedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}</span>
                </div>
              )}
              <div className="space-y-0">
                {cleanPoliticsNews.slice(1, 3).map((item, idx) => (
                  <div key={item.id} onClick={() => handleNewsClick(item)} className={`flex gap-3 cursor-pointer group py-3 ${idx < 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden bg-gray-100 rounded-md">
                      <Image src={proxyImageUrl(item.mainImage || item.images?.[0] || '/placeholder-news.svg')} alt={getLocalizedText(item.title, language)} fill className="object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-bold text-gray-900 leading-[1.4] line-clamp-2 group-hover:text-red-600 transition-colors">{getLocalizedText(item.title, language)}</h4>
                      <span className="text-[10px] text-gray-400 mt-1 block" suppressHydrationWarning>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Crime & Justice — center col */}
          {cleanCrimeNews.length > 0 && (
            <div className="lg:col-span-4 pt-4 px-4 lg:px-0 lg:border-l lg:border-l-gray-200 lg:pl-6">
              <div className="flex items-center justify-between mb-3 border-b-2 border-gray-800 pb-2">
                <h2 className="text-lg font-black text-gray-900">{t('crimeAndJustice') || 'Crime & Justice'}</h2>
                <button onClick={() => handleCategoryClick('crime')} className="text-red-600 text-xs font-bold hover:underline flex items-center gap-0.5">{t('viewAll') || 'View All'} <ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
              {cleanCrimeNews[0] && (
                <div onClick={() => handleNewsClick(cleanCrimeNews[0])} className="cursor-pointer group mb-3">
                  <div className="relative aspect-video overflow-hidden bg-gray-100 mb-2 rounded-lg">
                    <Image src={proxyImageUrl(cleanCrimeNews[0].mainImage || '/placeholder-news.svg')} alt="Crime" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <Badge className="absolute top-2 left-2 bg-gray-900 text-white border-none text-[9px] font-black uppercase px-2 py-0.5 tracking-wider rounded-sm">{t('crime') || 'Crime'}</Badge>
                  </div>
                  <h3 className="font-bold text-[14px] leading-tight group-hover:text-red-600 transition-colors mb-1">{getLocalizedText(cleanCrimeNews[0].title, language)}</h3>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1" suppressHydrationWarning><Clock className="w-3 h-3" />{cleanCrimeNews[0].publishedAt ? new Date(cleanCrimeNews[0].publishedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}</span>
                </div>
              )}
              <div className="space-y-0">
                {cleanCrimeNews.slice(1, 3).map((item, idx) => (
                  <div key={item.id} onClick={() => handleNewsClick(item)} className={`flex gap-3 cursor-pointer group py-3 ${idx < 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden bg-gray-100 rounded-md">
                      <Image src={proxyImageUrl(item.mainImage || item.images?.[0] || '/placeholder-news.svg')} alt={getLocalizedText(item.title, language)} fill className="object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-bold text-gray-900 leading-[1.4] line-clamp-2 group-hover:text-red-600 transition-colors">{getLocalizedText(item.title, language)}</h4>
                      <span className="text-[10px] text-gray-400 mt-1 block" suppressHydrationWarning>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live TV — right col (desktop) */}
          <div className="lg:col-span-4 pt-4 px-4 lg:px-0 lg:border-l lg:border-l-gray-200 lg:pl-6 hidden lg:block">
            <div className="flex items-center justify-between mb-4 border-b-2 border-red-600 pb-2">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-red-600 rounded-full block"></span>
                {t('liveTv') || 'Live TV'}
              </h2>
              <button onClick={() => setCurrentView('live-tv')} className="text-red-600 text-[11px] font-black uppercase tracking-wider hover:underline flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-full">{t('watchNow') || 'Watch Now'} <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
            <div
              className="block relative aspect-video bg-gray-900 overflow-hidden group cursor-pointer rounded-lg shadow-sm"
            >
              <iframe
                src="https://www.youtube-nocookie.com/embed/GFjuqQmfVIU?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1"
                title="StarNews Live"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 'none' }}
              />
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 uppercase rounded flex items-center gap-1.5 shadow-md pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                {t('live') || 'LIVE'}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600"></span>
              <div>
                <h3 className="font-black text-gray-900 leading-none">StarNews Live</h3>
                <p className="text-[11px] text-gray-500 font-medium mt-1">{t('realNewsRealTime') || 'Real News. Real Time.'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BE A PART OF THE STORY — Premium iOS-Style CTA Banner */}
      <section className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-5 mb-10 hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(220,38,38,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(220,38,38,0.05),transparent_50%)]"></div>
        <div className="max-w-[1440px] mx-auto px-4 flex items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-900/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">{t('beAPartOfTheStory') || 'Be a Part of the Story'}</h3>
              <p className="text-gray-400 text-xs">{t('beAPartDesc') || 'Share news, photos or video from your area. Because every story matters.'}</p>
            </div>
          </div>
          <button
            onClick={() => { window.open('/reporter', '_self') }}
            className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-black text-sm px-7 py-3 rounded-full transition-all flex-shrink-0 shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            {t('joinAsReporter') || 'Join as Reporter'} <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex gap-3 flex-shrink-0">
            {[
              { icon: '🛡️', label: t('verifiedPlatform') || 'Verified Platform' },
              { icon: '📱', label: t('instantPublishing') || 'Instant Publishing' },
              { icon: '🌍', label: t('panIndiaReach') || 'Pan-India Reach' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile-only Politics section */}
      {cleanPoliticsNews.length > 0 && (
        <section className="mb-10 w-full lg:hidden px-4">
          <div className="mag-section-header mb-4">
            <h2 className="text-3xl font-heading font-black tracking-tighter">{t('nationalPolitics') || 'National Politics'}</h2>
          </div>
          <div className="space-y-0">
            {cleanPoliticsNews.slice(0, 2).map(item => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
            ))}
          </div>
        </section>
      )}

      {/* CRIME SECTION — Mobile only (desktop is inside Politics/Crime side-by-side above) */}
      {cleanCrimeNews.length > 0 && (
        <section className="mb-10 w-full px-4 lg:hidden">
          <div className="mag-section-header mb-4">
            <h2 className="text-3xl font-heading font-black tracking-tighter">
              <span className="text-red-700">{t('crime') || 'Crime'}</span> &amp; {t('justice') || 'Justice'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-10">
            {cleanCrimeNews.slice(0, 2).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
            ))}
          </div>
        </section>
      )}

      {/* SPORTS SECTION */}
      {cleanSportsNews.length > 0 && (
        <section className="mb-12 w-full max-w-[1340px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-green-600 rounded-full block" />
              {t('sportsNews') || 'Sports News'}
            </h2>
            <button
              onClick={() => handleCategoryClick('sports')}
              className="text-green-600 hover:text-green-700 text-xs font-bold flex items-center gap-1 hover:underline"
            >
              {t('viewAll') || 'View All'} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cleanSportsNews.slice(0, 4).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} accentColor="green" />
            ))}
          </div>
        </section>
      )}

      {/* EDUCATION SECTION */}
      {cleanEducationNews.length > 0 && (
        <section className="mb-12 w-full max-w-[1340px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full block" />
              {t('educationAndLearning') || 'Education & Learning'}
            </h2>
            <button
              onClick={() => handleCategoryClick('education')}
              className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1 hover:underline"
            >
              {t('viewAll') || 'View All'} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cleanEducationNews.slice(0, 4).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} accentColor="blue" />
            ))}
          </div>
        </section>
      )}

      {/* HEALTH SECTION */}
      {cleanHealthNews.length > 0 && (
        <section className="mb-12 w-full max-w-[1340px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-emerald-600 rounded-full block" />
              {t('healthAndWellness') || 'Health & Wellness'}
            </h2>
            <button
              onClick={() => handleCategoryClick('health')}
              className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1 hover:underline"
            >
              {t('viewAll') || 'View All'} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cleanHealthNews.slice(0, 4).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} accentColor="emerald" />
            ))}
          </div>
        </section>
      )}

      {/* TECHNOLOGY SECTION */}
      {cleanTechnologyNews.length > 0 && (
        <section className="mb-12 w-full max-w-[1340px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-purple-600 rounded-full block" />
              {t('technologyAndInnovation') || 'Technology & Innovation'}
            </h2>
            <button
              onClick={() => handleCategoryClick('technology')}
              className="text-purple-600 hover:text-purple-700 text-xs font-bold flex items-center gap-1 hover:underline"
            >
              {t('viewAll') || 'View All'} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cleanTechnologyNews.slice(0, 4).map((item) => (
              <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} accentColor="purple" />
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
          {t('needHelpChat') || 'Need help? Chat with us'}
        </div>
        <div className="bg-[#25D366] p-4 rounded-full shadow-[0_10px_40px_-10px_rgba(37,211,102,0.6)] hover:bg-[#128C7E] transition-all hover:scale-110 flex items-center justify-center">
          <WhatsAppIcon className="w-7 h-7 text-white fill-current" />
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 border-2 border-white rounded-full animate-ping opacity-75"></span>
      </a>

      {/* MORE STORIES SECTION - Full Width Editorial Grid */}
      <section className="mb-16 w-full max-w-[1340px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-3">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-red-600 rounded-full block" />
            {t('moreStories') || 'More Stories'}
          </h2>
          <span className="text-xs text-gray-400 font-medium">{t('exploreAllCategories') || 'Explore all categories & archives'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {oldNews.slice(6, visibleMoreStories + 6).map((item) => (
            <NewsBox key={item.id} item={item} onClick={handleNewsClick} language={language} />
          ))}
        </div>
        {oldNews.length > visibleMoreStories + 6 && (
          <div className="flex justify-center pt-10">
            <button
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider px-8 py-3 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95"
              onClick={() => setVisibleMoreStories(prev => prev + 12)}
            >
              {t('loadMore') || 'LOAD MORE STORIES'} ↓
            </button>
          </div>
        )}
      </section>
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