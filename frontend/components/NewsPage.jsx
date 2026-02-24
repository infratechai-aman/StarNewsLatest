'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Newspaper, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { news, categories } from '@/lib/api'

import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedText } from '@/lib/newsData'

const NewsPage = ({ setSelectedArticle, setCurrentView, newsPageState, setNewsPageState }) => {
  const { t, language } = useLanguage()
  // Use props if available, else local state (fallback)
  const [newsArticles, setLocalNewsArticles] = useState([])
  const [categoryList, setLocalCategoryList] = useState([])
  const [selectedCategory, setLocalSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  // Derived state
  const articles = newsPageState?.articles?.length > 0 ? newsPageState.articles : newsArticles
  const categoriesData = newsPageState?.categories?.length > 0 ? newsPageState.categories : categoryList
  const currentCategory = newsPageState?.selectedCategory || selectedCategory

  // Setters
  const setArticles = (data) => setNewsPageState ? setNewsPageState(prev => ({ ...prev, articles: data })) : setLocalNewsArticles(data)
  const setCategories = (data) => setNewsPageState ? setNewsPageState(prev => ({ ...prev, categories: data })) : setLocalCategoryList(data)
  const setSelectedCategory = (cat) => setNewsPageState ? setNewsPageState(prev => ({ ...prev, selectedCategory: cat })) : setLocalSelectedCategory(cat)
  const setLoaded = (status) => setNewsPageState && setNewsPageState(prev => ({ ...prev, loaded: status }))

  useEffect(() => {
    const storedCategory = localStorage.getItem('selectedCategory')
    if (storedCategory) {
      setSelectedCategory(storedCategory)
      localStorage.removeItem('selectedCategory')
    }
    const handleCategoryChange = () => {
      const newCategory = localStorage.getItem('selectedCategory')
      if (newCategory) {
        setSelectedCategory(newCategory)
        localStorage.removeItem('selectedCategory')
      }
    }
    window.addEventListener('categoryChange', handleCategoryChange)
    return () => window.removeEventListener('categoryChange', handleCategoryChange)
  }, [])

  useEffect(() => {
    // If loaded and category hasn't changed from what's in state, skip fetch
    if (newsPageState?.loaded && newsPageState.selectedCategory === currentCategory) {
      setLoading(false)
      return
    }

    // If not loaded or category changed, fetch
    const fetchData = async () => {
      setLoading(true)
      await loadCategories()
      await loadNews()
      setLoading(false)
      if (setNewsPageState) setLoaded(true)
    }
    fetchData()
  }, [currentCategory]) // Trigger on category change

  const loadCategories = async () => {
    try {
      if (newsPageState?.categories?.length > 0) return // Skip if already loaded
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
        const cat = cats.find(c => c.slug === currentCategory)
        if (cat) params.category = cat.id
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

  const viewArticle = (article) => {
    setSelectedArticle(article)
    setCurrentView('news-detail')
  }

  if (loading) return <div className="text-center py-12">Loading news...</div>

  return (
    <div className="space-y-6">
      <div className="mag-section-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
        <h1 className="text-5xl font-heading font-black tracking-tighter italic">
          {t('allNews')}
        </h1>
        <Select value={currentCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-56 h-12 bg-white/50 backdrop-blur-sm border-gray-200 rounded-full px-6 font-bold shadow-sm">
            <SelectValue placeholder={t('allCategories')} />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
            <SelectItem value="all" className="font-bold">{t('allCategories')}</SelectItem>
            {categoriesData.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug} className="font-bold">{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <div
            key={article.id}
            className="premium-card rounded-3xl overflow-hidden cursor-pointer group shadow-lg border border-gray-100 flex flex-col bg-white transition-all duration-500 hover:-translate-y-2 h-full"
            onClick={() => viewArticle(article)}
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={
                  (article.thumbnails && article.thumbnails[0]) ||
                  article.thumbnailUrl ||
                  article.mainImage ||
                  '/placeholder-news.svg'
                }
                alt={(article && article.title) ? (getLocalizedText(article.title, language) || article.title) : 'News Article'}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {article.genre && (
                <Badge className="absolute top-4 left-4 bg-red-600 text-white border-none px-3 py-1 font-black uppercase text-[10px] tracking-widest shadow-xl">
                  {article.genre}
                </Badge>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-gray-100 text-red-600 border-none font-black text-[10px] tracking-widest px-3">
                  {getLocalizedText(article.category, language) || t('news')}
                </Badge>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Eye className="w-3 h-3" /> {article.views || 0}
                </div>
              </div>

              <h3 className="font-heading font-black text-2xl mb-4 leading-tight group-hover:text-red-700 transition-colors tracking-tight line-clamp-2">
                {getLocalizedText(article.title, language) || article.title}
              </h3>

              <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                {getLocalizedText(article.content, language)?.replace(/<[^>]*>/g, '').substring(0, 150) || article.metaDescription || 'Read the full story on StarNews...'}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                  {new Date(article.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="font-black text-red-600 text-xs flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                  {t('read') || 'READ MORE'} <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <Card><CardContent className="py-12 text-center"><Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">{t('noResults')}</p></CardContent></Card>
      )}
    </div>
  )
}

export default NewsPage