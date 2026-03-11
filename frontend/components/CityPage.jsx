'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ChevronRight, Eye, Crosshair, Globe, Navigation, Building2 } from 'lucide-react'
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
            <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12 pt-8">
                <div className="animate-pulse">
                    {/* Hero Skeleton */}
                    <div className="w-full h-[320px] md:h-[400px] bg-slate-100 rounded-[32px] mb-12" />

                    {/* City Selection Interface Skeleton */}
                    <div className="grid lg:grid-cols-12 gap-8 mb-12">
                        <div className="lg:col-span-8">
                            <div className="bg-white border border-slate-100 rounded-[28px] p-8 md:p-10 h-full">
                                <div className="w-32 h-4 bg-slate-100 rounded mb-8" />
                                <div className="flex flex-wrap gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} className="w-24 h-12 bg-slate-100 rounded-full" />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-4">
                            <div className="bg-slate-50 border border-slate-100 rounded-[28px] p-6 lg:p-10 h-full">
                                <div className="w-24 h-4 bg-slate-200 rounded mb-6" />
                                <div className="w-full h-14 bg-white rounded-2xl border border-slate-100" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12">
            {/* Premium Hero Banner */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-gray-900 via-blue-950 to-black text-white mb-10 shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15" />
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/15 to-transparent hidden md:block" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-10 right-10 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 lg:p-16">
                    <div className="flex-1">
                        <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/30 mb-6 px-4 py-1.5 font-black uppercase text-[10px] tracking-[0.3em] backdrop-blur-md">
                            <Navigation className="w-3 h-3 mr-2" />
                            {t('hyperLocal') || 'Hyperlocal Updates'}
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-heading font-black leading-[0.9] tracking-tighter mb-6 italic">
                            {t('selectCityTitle') || 'City'} <span className="text-blue-400">News</span>
                        </h1>
                        <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-lg mb-8">
                            {t('selectCityDesc') || 'Select your city to get hyper-local news updates, stories, and events happening around you.'}
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/10 max-w-[200px]" />
                            <Crosshair className="w-5 h-5 text-blue-500 animate-pulse" />
                            <div className="h-px w-16 bg-white/10" />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-row md:flex-col gap-4">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-6 text-center min-w-[140px]">
                            <div className="text-3xl font-black text-blue-400 mb-1">{POPULAR_CITIES.length}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Popular Cities</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-6 text-center min-w-[140px]">
                            <div className="text-3xl font-black text-cyan-400 mb-1">{allArticles.length}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Stories</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* City Selection Interface */}
            <div className="grid lg:grid-cols-12 gap-8 mb-12">
                <div className="lg:col-span-8">
                    <div className="bg-white p-8 md:p-10 rounded-[28px] shadow-sm border border-gray-100 h-full">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8 flex items-center gap-3">
                            <Building2 className="w-4 h-4" /> {t('popularCities') || 'Popular Cities'}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {POPULAR_CITIES.map(city => (
                                <Button
                                    key={city}
                                    variant={selectedCity === city ? "default" : "outline"}
                                    className={`rounded-full px-7 h-12 font-black transition-all duration-300 text-sm ${selectedCity === city
                                        ? 'bg-blue-600 text-white scale-105 shadow-xl shadow-blue-200'
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
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 p-6 lg:p-10 rounded-[28px] border border-gray-100 h-full flex flex-col justify-center">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6">{t('allCities') || 'All Cities'}</h2>
                        <div className="relative">
                            <select
                                className="w-full h-14 px-6 bg-white border border-gray-100 rounded-2xl font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-blue-100 transition-all outline-none text-sm"
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                            >
                                <option value="">{t('chooseCity') || 'Choose a city...'}</option>
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
                <div className="space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
                            <MapPin className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-heading font-black tracking-tighter italic">
                                {t('newsFrom') || 'News from'} <span className="text-blue-600">{selectedCity}</span>
                            </h2>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Live from the streets</p>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-blue-100 to-transparent hidden md:block ml-6" />
                    </div>

                    {cityNews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {cityNews.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className={`group rounded-[24px] overflow-hidden cursor-pointer border border-gray-100 bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${idx === 0 ? 'md:col-span-2 md:row-span-1' : ''}`}
                                    onClick={() => handleNewsClick(item)}
                                >
                                    <div className={`relative overflow-hidden bg-gray-50 ${idx === 0 ? 'aspect-[2/1]' : 'aspect-[4/3]'}`}>
                                        <Image
                                            src={item.thumbnailUrl || item.mainImage || '/placeholder-news.svg'}
                                            alt={getLocalizedText(item.title, language)}
                                            fill
                                            className="object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, 25vw"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-blue-600 border-none font-black text-[9px] tracking-widest uppercase px-3 py-1">
                                            {selectedCity}
                                        </Badge>
                                    </div>
                                    <div className="p-5 md:p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest" suppressHydrationWarning>
                                                {new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                                            <Eye className="w-3 h-3 text-gray-300" />
                                        </div>
                                        <h4 className="font-heading font-black text-lg md:text-xl leading-tight group-hover:text-blue-600 transition-colors tracking-tight line-clamp-2 mb-3">
                                            {getLocalizedText(item.title, language)}
                                        </h4>
                                        <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed mb-4">
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
                        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-[32px] border border-dashed border-gray-200">
                            <MapPin className="h-16 w-16 mx-auto text-gray-200 mb-6 animate-bounce" />
                            <h3 className="text-xl font-heading font-black text-gray-400 mb-2 uppercase tracking-tighter">{t('noCityNews') || 'No news found'}</h3>
                            <p className="text-sm text-gray-400 max-w-sm mx-auto">{t('cityNewsTag') || 'Check back later for updates from this city.'}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-[32px] border border-blue-50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-16 md:p-24 text-center">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <MapPin className="h-16 w-16 mx-auto text-blue-200 mb-6" />
                        <h2 className="text-2xl md:text-3xl font-heading font-black text-blue-900 tracking-tighter mb-4 italic">{t('selectCityPrompt') || 'Select a city to begin'}</h2>
                        <p className="text-blue-500 font-medium max-w-md mx-auto leading-relaxed">{t('cityPromptDesc') || 'Choose from popular cities above or use the dropdown to find your city.'}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CityPage
