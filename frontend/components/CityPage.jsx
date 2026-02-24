'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ChevronRight, Eye, Crosshair } from 'lucide-react'
import Image from 'next/image'
import { news } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedText } from '@/lib/newsData'
import { POPULAR_CITIES, INDIAN_CITIES_SORTED } from '@/lib/indianCities'

const CityPage = ({ setCurrentView, setSelectedArticle }) => {
    const { language, t } = useLanguage()
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
            {/* Header / Hero */}
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white p-16 mb-12 shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="relative z-10 max-w-2xl">
                    <Badge className="bg-blue-600/30 text-blue-400 border border-blue-600/30 mb-6 px-4 py-1.5 font-black uppercase text-[10px] tracking-[0.3em] backdrop-blur-md">
                        {t('hyperLocal') || 'Hyperlocal Updates'}
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-heading font-black leading-[0.9] tracking-tighter mb-8 italic">
                        {t('selectCityTitle')}
                    </h1>
                    <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-lg mb-8">
                        {t('selectCityDesc')}
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/20" />
                        <Crosshair className="w-6 h-6 text-blue-500 animate-pulse" />
                        <div className="h-px w-20 bg-white/20" />
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/20 to-transparent hidden md:block" />
            </div>

            {/* City Selection Interface */}
            <div className="grid lg:grid-cols-12 gap-10 mb-16">
                <div className="lg:col-span-8">
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 h-full">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8 flex items-center gap-3">
                            <span className="w-8 h-px bg-gray-200" /> {t('popularCities')}
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {POPULAR_CITIES.map(city => (
                                <Button
                                    key={city}
                                    variant={selectedCity === city ? "default" : "outline"}
                                    className={`rounded-full px-8 h-14 font-black transition-all duration-300 ${selectedCity === city
                                        ? 'bg-blue-600 text-white scale-105 shadow-xl'
                                        : 'border-gray-100 hover:border-blue-500 hover:bg-blue-50 text-gray-600'
                                        }`}
                                    onClick={() => handleCityClick(city)}
                                >
                                    {city}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-gray-50 p-6 lg:p-10 rounded-3xl border border-gray-100 h-full flex flex-col justify-center">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6">{t('allCities')}</h2>
                        <div className="relative">
                            <select
                                className="w-full h-16 px-6 bg-white border border-gray-100 rounded-2xl font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                            >
                                <option value="">{t('chooseCity')}</option>
                                {INDIAN_CITIES_SORTED.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
                            </div>
                        </div>
                        {selectedCity && (
                            <Button
                                variant="ghost"
                                className="mt-4 text-xs font-black text-red-500 hover:bg-red-50"
                                onClick={() => setSelectedCity('')}
                            >
                                {t('clear') || 'RESET SELECTION'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* City News Display */}
            {selectedCity ? (
                <div className="space-y-12">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                            <MapPin className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-heading font-black tracking-tighter italic">
                                {t('newsFrom')} <span className="text-blue-600">{selectedCity}</span>
                            </h2>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Live from the streets</p>
                        </div>
                    </div>

                    {cityNews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {cityNews.map((item) => (
                                <div
                                    key={item.id}
                                    className="premium-card rounded-3xl overflow-hidden cursor-pointer group border border-gray-100 bg-white hover:-translate-y-2 transition-all duration-500 shadow-sm"
                                    onClick={() => handleNewsClick(item)}
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                                        <Image
                                            src={item.thumbnailUrl || item.mainImage || '/placeholder-news.svg'}
                                            alt={getLocalizedText(item.title, language)}
                                            fill
                                            className="object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, 25vw"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-blue-600 border-none font-black text-[10px] tracking-widest uppercase">
                                            {selectedCity}
                                        </Badge>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                                            <Eye className="w-3 h-3 text-gray-300" />
                                        </div>
                                        <h4 className="font-heading font-black text-xl leading-tight group-hover:text-blue-600 transition-colors tracking-tight line-clamp-2 mb-4">
                                            {getLocalizedText(item.title, language)}
                                        </h4>
                                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-6">
                                            {getLocalizedText(item.metaDescription || item.content, language)?.replace(/<[^>]*>/g, '')?.substring(0, 100)}
                                        </p>
                                        <div className="flex items-center text-blue-600 text-[10px] font-black tracking-widest uppercase group-hover:gap-3 transition-all">
                                            {t('read') || 'FULL STORY'} <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                            <MapPin className="h-20 w-20 mx-auto text-gray-200 mb-6 animate-bounce" />
                            <h3 className="text-2xl font-heading font-black text-gray-400 mb-2 uppercase tracking-tighter">{t('noCityNews')}</h3>
                            <p className="text-sm text-gray-400 max-w-sm mx-auto">{t('cityNewsTag')}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-[40px] border border-blue-50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-24 text-center">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <MapPin className="h-20 w-20 mx-auto text-blue-200 mb-6" />
                        <h2 className="text-3xl font-heading font-black text-blue-900 tracking-tighter mb-4 italic italic">{t('selectCityPrompt')}</h2>
                        <p className="text-blue-500 font-medium max-w-md mx-auto leading-relaxed">{t('cityPromptDesc')}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CityPage
