'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import { news } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedText } from '@/lib/newsData'
import { POPULAR_CITIES, INDIAN_CITIES_SORTED } from '@/lib/indianCities'

const CityPage = ({ setCurrentView, setSelectedArticle }) => {
    const { language } = useLanguage()
    const [selectedCity, setSelectedCity] = useState('')
    const [cityNews, setCityNews] = useState([])
    const [allArticles, setAllArticles] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch all news on mount
    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true)
                const response = await news.getAll({ limit: 100 })
                setAllArticles(response.articles || [])
            } catch (error) {
                console.error('Failed to fetch news:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchNews()
    }, [])

    // Filter news by city
    useEffect(() => {
        if (selectedCity && allArticles.length > 0) {
            const filtered = allArticles.filter(a => a.city === selectedCity)
            setCityNews(filtered)
        } else {
            setCityNews([])
        }
    }, [selectedCity, allArticles])

    const handleCityClick = (city) => {
        setSelectedCity(city === selectedCity ? '' : city)
    }

    const handleNewsClick = (article) => {
        window.history.pushState({ view: 'news-detail', article }, '', `?article=${article.id}`)
        setSelectedArticle(article)
        setCurrentView('news-detail')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center py-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white">
                <MapPin className="h-12 w-12 mx-auto mb-3" />
                <h1 className="text-3xl font-bold">City News</h1>
                <p className="text-blue-100 mt-2">Select a city to view local news and updates</p>
            </div>

            {/* Popular Cities */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Popular Cities</h2>
                <div className="flex flex-wrap gap-2">
                    {POPULAR_CITIES.map(city => (
                        <Button
                            key={city}
                            variant={selectedCity === city ? "default" : "outline"}
                            size="sm"
                            className={`${selectedCity === city ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 hover:border-blue-300'}`}
                            onClick={() => handleCityClick(city)}
                        >
                            {city}
                        </Button>
                    ))}
                </div>
            </div>

            {/* All Cities Dropdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">All Cities</h2>
                <div className="flex items-center gap-4">
                    <select
                        className="flex-1 px-4 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        <option value="">Choose a city...</option>
                        {INDIAN_CITIES_SORTED.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                    {selectedCity && (
                        <Button variant="outline" onClick={() => setSelectedCity('')}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* City News Display */}
            {selectedCity ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        News from {selectedCity}
                    </h2>
                    {cityNews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {cityNews.map((item) => (
                                <Card
                                    key={item.id}
                                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border hover:border-blue-500"
                                    onClick={() => handleNewsClick(item)}
                                >
                                    <div className="relative h-40 overflow-hidden bg-gray-100">
                                        <img
                                            src={item.thumbnailUrl || item.mainImage || '/placeholder-news.svg'}
                                            alt={getLocalizedText(item.title, language)}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onError={(e) => { e.target.src = '/placeholder-news.svg' }}
                                        />
                                        <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">{selectedCity}</Badge>
                                    </div>
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {getLocalizedText(item.title, language)}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                            {getLocalizedText(item.metaDescription || item.content, language)?.substring(0, 80)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">No news available from {selectedCity} yet.</p>
                            <p className="text-sm text-gray-400 mt-2">News articles tagged with this city will appear here.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <MapPin className="h-16 w-16 mx-auto text-blue-400 mb-4" />
                    <p className="text-blue-700 font-medium text-lg">Select a city above to view local news</p>
                    <p className="text-blue-500 text-sm mt-2">Choose from popular cities or use the dropdown</p>
                </div>
            )}
        </div>
    )
}

export default CityPage
