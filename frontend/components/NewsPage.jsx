'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Newspaper } from 'lucide-react'
import { news, categories } from '@/lib/api'

import { useLanguage } from '@/contexts/LanguageContext'

const NewsPage = ({ setSelectedArticle, setCurrentView, newsPageState, setNewsPageState }) => {
  const { t } = useLanguage()
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
  const setSelectedCat = (cat) => setNewsPageState ? setNewsPageState(prev => ({ ...prev, selectedCategory: cat })) : setLocalSelectedCategory(cat)
  const setLoaded = (status) => setNewsPageState && setNewsPageState(prev => ({ ...prev, loaded: status }))

  useEffect(() => {
    const storedCategory = localStorage.getItem('selectedCategory')
    if (storedCategory) {
      setSelectedCat(storedCategory)
      localStorage.removeItem('selectedCategory')
    }
    const handleCategoryChange = () => {
      const newCategory = localStorage.getItem('selectedCategory')
      if (newCategory) {
        setSelectedCat(newCategory)
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
      setArticles(data.articles || [])
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t('allNews')}</h1>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t('allCategories')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {categoriesData.map((cat) => (<SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full" onClick={() => viewArticle(article)}>
            <div className="relative h-48 overflow-hidden">
              {/* Updated image logic to match HomePage (thumbnails/placeholders) */}
              <img
                src={
                  (article.thumbnails && article.thumbnails[0]) ||
                  article.thumbnailUrl ||
                  article.mainImage ||
                  '/placeholder-news.svg'
                }
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => { e.target.src = '/placeholder-news.svg' }}
              />
              {article.genre && <Badge className="absolute top-2 left-2 bg-blue-600">{article.genre}</Badge>}
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">{t('news')}</Badge>
                {article.featured && <Badge variant="default" className="text-xs">{t('featured')}</Badge>}
              </div>
              <h2 className="text-lg font-bold mb-2 line-clamp-2 hover:text-primary">{article.title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{article.metaDescription || 'Read the full article...'}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views || 0}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2">{t('read')}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <Card><CardContent className="py-12 text-center"><Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">{t('noResults')}</p></CardContent></Card>
      )}
    </div>
  )
}

export default NewsPage