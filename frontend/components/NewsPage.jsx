'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Newspaper, ChevronRight, Loader2, Flame, TrendingUp, Clock } from 'lucide-react'
import Image from 'next/image'
import { news, categories } from '@/lib/api'

import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedText } from '@/lib/newsData'

const ARTICLES_PER_PAGE = 30

const NewsPage = ({ setSelectedArticle, setCurrentView, newsPageState, setNewsPageState }) => {
  const { t, language } = useLanguage()
  const [newsArticles, setLocalNewsArticles] = useState([])
  const [categoryList, setLocalCategoryList] = useState([])
  const [selectedCategory, setLocalSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE)
  const [loadingMore, setLoadingMore] = useState(false)

  // Track the last fetched category to know when to re-fetch
  const lastFetchedCategory = useRef(null)

  // Derived state
  const articles = newsPageState?.articles?.length > 0 ? newsPageState.articles : newsArticles
  const categoriesData = newsPageState?.categories?.length > 0 ? newsPageState.categories : categoryList
  const currentCategory = newsPageState?.selectedCategory || selectedCategory

  // Setters
  const setArticles = (data) => setNewsPageState ? setNewsPageState(prev => ({ ...prev, articles: data })) : setLocalNewsArticles(data)
  const setCategories = (data) => setNewsPageState ? setNewsPageState(prev => ({ ...prev, categories: data })) : setLocalCategoryList(data)
  const setSelectedCategoryState = (cat) => setNewsPageState ? setNewsPageState(prev => ({ ...prev, selectedCategory: cat })) : setLocalSelectedCategory(cat)
  const setLoaded = (status) => setNewsPageState && setNewsPageState(prev => ({ ...prev, loaded: status }))

  useEffect(() => {
    const storedCategory = localStorage.getItem('selectedCategory')
    if (storedCategory) {
      setSelectedCategoryState(storedCategory)
      localStorage.removeItem('selectedCategory')
    }
    const handleCategoryChange = () => {
      const newCategory = localStorage.getItem('selectedCategory')
      if (newCategory) {
        setSelectedCategoryState(newCategory)
        localStorage.removeItem('selectedCategory')
      }
    }
    window.addEventListener('categoryChange', handleCategoryChange)
    return () => window.removeEventListener('categoryChange', handleCategoryChange)
  }, [])

  useEffect(() => {
    // Only skip fetch if we already fetched this exact category
    if (newsPageState?.loaded && lastFetchedCategory.current === currentCategory) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setVisibleCount(ARTICLES_PER_PAGE) // Reset pagination on category change
      await loadCategories()
      await loadNews()
      setLoading(false)
      lastFetchedCategory.current = currentCategory
      if (setNewsPageState) setLoaded(true)
    }
    fetchData()
  }, [currentCategory])

  const loadCategories = async () => {
    try {
      if (newsPageState?.categories?.length > 0) return
      const data = await categories.getAll()
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadNews = async () => {
    try {
      const cats = newsPageState?.categories?.length > 0 ? newsPageState.categories : await categories.getAll()
      let params = {}
      if (currentCategory !== 'all' && currentCategory !== 'trending' && currentCategory !== 'special') {
        // Send slug directly — the API supports slug-based lookup
        params.category = currentCategory
      } else if (currentCategory === 'trending') {
        params.featured = true
      }
      const data = await news.getAll(params)
      const dbArticles = data.articles || []
      setArticles(dbArticles)
    } catch (error) {
      console.error('Error loading news:', error)
    }
  }

  const handleCategoryChange = (cat) => {
    setSelectedCategoryState(cat)
    setVisibleCount(ARTICLES_PER_PAGE)
  }

  const handleShowMore = () => {
    setLoadingMore(true)
    // Small delay for smooth UX
    setTimeout(() => {
      setVisibleCount(prev => prev + ARTICLES_PER_PAGE)
      setLoadingMore(false)
    }, 300)
  }

  const viewArticle = (article) => {
    setSelectedArticle(article)
    setCurrentView('news-detail')
  }

  if (loading) return (
    <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12 pt-8">
      <div className="animate-pulse">
        {/* Hero Skeleton */}
        <div className="w-full h-[400px] md:h-[480px] bg-slate-100 rounded-[32px] mb-10" />
        {/* Stats Bar Skeleton */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="w-32 h-4 bg-slate-100 rounded" />
          <div className="h-px flex-1 mx-6 bg-slate-50" />
          <div className="w-24 h-4 bg-slate-100 rounded" />
        </div>
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className={`flex flex-col h-full border border-slate-100 rounded-[24px] overflow-hidden ${i === 1 ? 'sm:col-span-2 sm:row-span-1' : ''}`}>
              <div className={`w-full bg-slate-100 ${i === 1 ? 'aspect-[2/1]' : 'aspect-[16/10]'}`} />
              <div className="p-5 md:p-6 bg-white">
                <div className="w-16 h-4 bg-slate-100 rounded mb-4" />
                <div className="w-full h-6 bg-slate-100 rounded mb-2" />
                <div className="w-3/4 h-6 bg-slate-100 rounded mb-6" />
                <div className="w-full h-3 bg-slate-100 rounded mb-2" />
                <div className="w-5/6 h-3 bg-slate-100 rounded mb-6" />
                <div className="flex justify-between">
                  <div className="w-16 h-3 bg-slate-100 rounded" />
                  <div className="w-12 h-3 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const visibleArticles = articles.slice(0, visibleCount)
  const hasMore = visibleCount < articles.length

  // Featured article for hero (first article)
  const heroArticle = articles.length > 0 ? articles[0] : null
  const gridArticles = visibleArticles.slice(1)

  return (
    <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-gray-900 via-red-950 to-black text-white mb-10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-600/15 to-transparent hidden md:block" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 p-8 md:p-12 lg:p-16">
          <div className="flex-1 min-w-0">
            <Badge className="bg-red-600/20 text-red-400 border border-red-600/30 mb-6 px-4 py-1.5 font-black uppercase text-[10px] tracking-[0.3em] backdrop-blur-md">
              <Flame className="w-3 h-3 mr-2" />
              {t('allNews') || 'All News'}
            </Badge>
            <h1 className="text-5xl md:text-7xl font-heading font-black leading-[0.9] tracking-tighter mb-6 italic">
              {t('allNews') || 'Latest'} <span className="text-red-500">Stories</span>
            </h1>
            <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-lg mb-8">
              {language === 'hi' ? 'भारत और विश्व से ताज़ा ख़बरें' : language === 'mr' ? 'भारत आणि जगातील ताज्या बातम्या' : 'Breaking news, in-depth analysis, and stories that matter from across India and the world.'}
            </p>

            {/* Category Filter Pills inside hero */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={currentCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-60 h-12 bg-white/10 backdrop-blur-md border-white/20 rounded-full px-6 font-bold text-white shadow-lg hover:bg-white/20 transition-all">
                  <SelectValue placeholder={t('allCategories')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                  <SelectItem value="all" className="font-bold">{t('allCategories')}</SelectItem>
                  {categoriesData.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug} className="font-bold">{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold">{articles.length} {t('news') || 'articles'}</span>
              </div>
            </div>
          </div>

          {/* Hero Featured Article */}
          {heroArticle && (
            <div
              className="w-full lg:w-[480px] flex-shrink-0 cursor-pointer group"
              onClick={() => viewArticle(heroArticle)}
            >
              <div className="relative rounded-[24px] overflow-hidden shadow-2xl border border-white/10">
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-800">
                  <Image
                    src={
                      (heroArticle.thumbnails && heroArticle.thumbnails[0]) ||
                      heroArticle.thumbnailUrl ||
                      heroArticle.mainImage ||
                      '/placeholder-news.svg'
                    }
                    alt={getLocalizedText(heroArticle.title, language) || 'Featured'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
                    sizes="480px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <Badge className="bg-red-600 text-white border-none px-3 py-1 font-black uppercase text-[10px] tracking-widest shadow-xl mb-3">
                      {heroArticle.genre || t('featured') || 'Featured'}
                    </Badge>
                    <h3 className="font-heading font-black text-xl md:text-2xl text-white leading-tight tracking-tight line-clamp-2 group-hover:text-red-300 transition-colors">
                      {getLocalizedText(heroArticle.title, language) || heroArticle.title}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
            <Clock className="w-4 h-4" />
            <span suppressHydrationWarning>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="h-px flex-1 mx-6 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{currentCategory === 'all' ? (t('allCategories') || 'All Categories') : currentCategory}</span>
      </div>

      {/* Premium News Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {gridArticles.map((article, idx) => (
          <div
            key={article.id}
            className={`group rounded-[24px] overflow-hidden cursor-pointer border border-gray-100 bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full ${idx === 0 ? 'sm:col-span-2 sm:row-span-1' : ''}`}
            onClick={() => viewArticle(article)}
          >
            <div className={`relative overflow-hidden bg-gray-50 ${idx === 0 ? 'aspect-[2/1]' : 'aspect-[16/10]'}`}>
              <Image
                src={
                  (article.thumbnails && article.thumbnails[0]) ||
                  article.thumbnailUrl ||
                  article.mainImage ||
                  '/placeholder-news.svg'
                }
                alt={(article && article.title) ? (getLocalizedText(article.title, language) || article.title) : 'News Article'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-news.svg';
                  e.currentTarget.srcset = '';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Category Badge */}
              <div className="absolute top-4 left-0 flex items-center gap-2 z-10">
                {article.genre && (
                  <Badge className="bg-[#cd4a4c] text-white text-[13px] font-bold px-3 py-1 rounded-l-none rounded-r-md shadow-md border-none tracking-normal capitalize">
                    {article.genre}
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-5 md:p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-red-50 text-red-600 border-none font-black text-[9px] tracking-widest px-2.5 py-0.5">
                  {getLocalizedText(article.category, language) || t('news')}
                </Badge>
                <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Eye className="w-3 h-3" /> {article.views || 0}
                </div>
              </div>

              <h3 className="font-heading font-black text-lg md:text-xl mb-3 leading-tight group-hover:text-red-700 transition-colors tracking-tight line-clamp-2">
                {getLocalizedText(article.title, language) || article.title}
              </h3>

              <p className="text-gray-400 text-xs line-clamp-2 mb-4 flex-1 leading-relaxed">
                {getLocalizedText(article.content, language)?.replace(/<[^>]*>/g, '').substring(0, 120) || article.metaDescription || 'Read the full story on StarNews...'}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest" suppressHydrationWarning>
                  {article.publishedAt || article.createdAt ? new Date(article.publishedAt || article.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                </span>
                <span className="font-black text-red-600 text-[10px] flex items-center gap-1.5 group-hover:translate-x-1 transition-transform uppercase tracking-widest">
                  {t('read') || 'Read'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <div className="flex justify-center pt-12 pb-4">
          <Button
            onClick={handleShowMore}
            disabled={loadingMore}
            className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-sm px-12 py-7 rounded-full shadow-xl shadow-red-200 hover:shadow-2xl hover:shadow-red-300 transition-all hover:-translate-y-1 disabled:opacity-60"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Show More News
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      )}

      {articles.length === 0 && (
        <div className="text-center py-24 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
          <Newspaper className="h-16 w-16 mx-auto mb-6 text-gray-200" />
          <h3 className="text-xl font-heading font-black text-gray-400 mb-2">{t('noResults') || 'No articles found'}</h3>
          <p className="text-sm text-gray-400">Try selecting a different category</p>
        </div>
      )}
    </div>
  )
}

export default NewsPage