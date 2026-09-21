'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ChevronRight, Eye, Search, Flame, TrendingUp, PlaySquare, Calendar, Bookmark, MessageSquare, LayoutGrid, Newspaper } from 'lucide-react'
import Image from 'next/image'
import { news } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedText } from '@/lib/newsData'
import { POPULAR_CITIES, INDIAN_CITIES_SORTED } from '@/lib/indianCities'
import { proxyImageUrl } from '@/lib/imageProxy'
import { getLocalizedCity } from '@/lib/translations'

const CITY_ICONS = {
  Mumbai: '/city_icon_mumbai_1789524759210.jpg',
  Delhi: '/city_icon_delhi_1789524771933.jpg',
  Bangalore: '/city_icon_bangalore_1789524786395.jpg',
  Hyderabad: '/city_icon_hyderabad_1789524800666.jpg',
  Chennai: '/city_icon_chennai.jpg',
  Kolkata: '/city_icon_kolkata.jpg',
  Pune: '/city_icon_pune.jpg',
  Ahmedabad: '/city_icon_ahmedabad.jpg',
  Jaipur: '/city_icon_jaipur.jpg',
  Lucknow: '/city_icon_lucknow.jpg',
  Surat: '/city_icon_surat.jpg',
  Nagpur: '/city_icon_nagpur.jpg'
}

const CityPage = ({ setCurrentView, setSelectedArticle }) => {
    const { language, t } = useLanguage()
    const [selectedCity, setSelectedCity] = useState('Mumbai')
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
            const normalized = selectedCity.trim().toLowerCase()
            const filtered = allArticles.filter(a => a.city && a.city.trim().toLowerCase() === normalized)
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
        <div className="w-full bg-[#f8f9fa] pb-12">
            {/* Premium Hero Banner (Full Width) */}
            <div className="relative w-full h-[160px] md:h-[200px] bg-gradient-to-br from-[#1a2b4c] to-[#0a1529] overflow-hidden text-white flex items-center">
                <div className="absolute inset-0 z-0">
                    <Image 
                        src="/city_news_banner_1789524746922.jpg" 
                        alt="Cityscape" 
                        fill 
                        className="object-cover opacity-60 mix-blend-overlay"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0d1629]/90 via-[#0d1629]/70 to-[#0d1629]/80"></div>
                </div>

                <div className="relative z-10 w-full px-4 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 h-full">
                    <div className="flex-1 mt-6 md:mt-0 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 md:mb-4 text-gray-300 tracking-[0.2em] uppercase text-[9px] md:text-[10px] font-black">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {language === 'mr' ? 'भारतातील शहरे. खऱ्या कथा.' : language === 'hi' ? 'भारत के शहर। सच्ची कहानियाँ।' : "INDIA'S CITIES. REAL STORIES."}
                        </div>
                        <h1 className="text-4xl md:text-[80px] font-black leading-none tracking-tighter mb-2 md:mb-4 drop-shadow-lg">
                            {language === 'mr' ? <>शहर <span className="text-red-500">बातम्या</span></> : language === 'hi' ? <>शहर <span className="text-red-500">समाचार</span></> : <>City <span className="text-red-500">News</span></>}
                        </h1>
                        <p className="hidden md:block text-xl md:text-2xl text-white font-medium mb-4">
                            {language === 'mr' ? 'स्थानिक घडामोडी. व्यापक दृष्टिकोन.' : language === 'hi' ? 'स्थानीय अपडेट्स। व्यापक दृष्टिकोण।' : 'Local updates. Bigger perspectives.'}
                        </p>
                        <p className="text-xs md:text-base text-gray-300 font-medium max-w-lg leading-relaxed mx-auto md:mx-0">
                            {language === 'mr' ? 'तुमच्या शहरातील ताज्या बातम्या, कार्यक्रम, घडामोडी आणि कथा जाणून घ्या.' : language === 'hi' ? 'अपने शहर के ताज़ा समाचार, कार्यक्रम, विकास और कहानियाँ जानें।' : 'Explore the latest news, events, developments and stories from your city.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 md:px-12 mt-8">
                {/* Popular Cities */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-red-600" />
                            {t('popularCities') || 'Popular Cities'}
                        </h2>
                        <button className="text-red-600 text-sm font-bold flex items-center gap-1 hover:underline">
                            {t('viewAllCities') || 'View All Cities'} <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="flex overflow-x-auto pb-4 hide-scrollbar gap-4 md:gap-6 justify-between px-2">
                        {POPULAR_CITIES.map(city => {
                            const isSelected = selectedCity === city
                            return (
                                <div 
                                    key={city} 
                                    onClick={() => handleCityClick(city)}
                                    className="flex flex-col items-center gap-3 cursor-pointer group min-w-[80px]"
                                >
                                    <div className={`w-20 h-20 rounded-2xl overflow-hidden relative shadow-md transition-all duration-300 p-0.5 ${isSelected ? 'scale-110' : 'bg-transparent border border-gray-200'}`}>
                                        <div className="w-full h-full relative rounded-[14px] overflow-hidden bg-white">
                                            <Image 
                                                src={CITY_ICONS[city] || '/placeholder-news.svg'} 
                                                alt={city} 
                                                fill 
                                                className="object-cover" 
                                            />
                                        </div>
                                    </div>
                                    <span className={`text-[12px] font-black ${isSelected ? 'text-red-600' : 'text-gray-900'} transition-colors`}>
                                        {getLocalizedCity(city, language)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            className="block w-full pl-10 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-full font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-100 shadow-sm"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        >
                            <option value="">{t('chooseCity') || 'Search or select a city...'}</option>
                            {INDIAN_CITIES_SORTED.map(city => (
                                <option key={city} value={city}>{getLocalizedCity(city, language)}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <ChevronRight className="h-4 w-4 text-gray-400 rotate-90" />
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="default" className="bg-red-600 hover:bg-red-700 text-white rounded-full px-5 h-10 text-xs font-black shadow-md flex items-center gap-1.5">
                            <LayoutGrid className="w-3.5 h-3.5" /> {t('latest') || 'Latest'}
                        </Button>
                        <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-600 border-gray-200 rounded-full px-5 h-10 text-xs font-bold shadow-sm flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" /> {t('trending') || 'Trending'}
                        </Button>
                        <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-600 border-gray-200 rounded-full px-5 h-10 text-xs font-bold shadow-sm flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-orange-500" /> {t('mostRead') || 'Most Read'}
                        </Button>
                        <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-600 border-gray-200 rounded-full px-5 h-10 text-xs font-bold shadow-sm flex items-center gap-1.5">
                            <PlaySquare className="w-3.5 h-3.5" /> {t('videos') || 'Videos'}
                        </Button>
                        <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-600 border-gray-200 rounded-full px-5 h-10 text-xs font-bold shadow-sm flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> {t('events') || 'Events'}
                        </Button>
                    </div>
                </div>

                {/* News Section */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-red-600 rounded-full block"></span>
                        {selectedCity ? `${t('latestFrom') || 'Latest from'} ${getLocalizedCity(selectedCity, language)}` : (t('selectCityTitle') || 'City News')}
                    </h2>
                    {cityNews.length > 0 && (
                        <button className="text-red-600 text-sm font-bold flex items-center gap-1 hover:underline">
                            {t('viewAll') || 'View All'} {getLocalizedCity(selectedCity, language)} {t('news') || 'News'} <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {cityNews.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Main Big Article */}
                        <div 
                            className={`${cityNews.length > 1 ? 'lg:col-span-5' : 'lg:col-span-12'} relative bg-white rounded-2xl overflow-hidden shadow-md group cursor-pointer`}
                            onClick={() => handleNewsClick(cityNews[0])}
                            style={{ minHeight: '480px' }}
                        >
                            <Image 
                                src={proxyImageUrl(cityNews[0].mainImage || cityNews[0].images?.[0] || '/placeholder-news.svg')} 
                                alt={getLocalizedText(cityNews[0].title, language)}
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a]/95 via-[#0f111a]/40 to-transparent"></div>
                            
                            <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-md">
                                {getLocalizedCity(selectedCity || cityNews[0].city || 'Mumbai', language).toUpperCase()}
                            </div>
                            <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded shadow-md flex items-center gap-1">
                                {language === 'mr' ? '२ तासांपूर्वी' : language === 'hi' ? '२ घंटे पहले' : '2 hrs ago'}
                            </div>
                            
                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                <h3 className="text-white text-2xl font-black leading-tight mb-3 group-hover:text-red-100 transition-colors">
                                    {getLocalizedText(cityNews[0].title, language)}
                                </h3>
                                <p className="text-gray-300 text-sm line-clamp-3 mb-5 leading-relaxed">
                                    {getLocalizedText(cityNews[0].content, language)?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                                </p>
                                <button className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-black px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 shadow-lg">
                                    {t('readMore') || 'Read More'} <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Smaller Articles Grid */}
                        {cityNews.length > 1 && (
                            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cityNews.slice(1, 5).map((item, idx) => (
                                    <div key={item.id} onClick={() => handleNewsClick(item)} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col border border-gray-100">
                                        <div className="relative h-40 overflow-hidden bg-gray-100">
                                            <Image 
                                                src={proxyImageUrl(item.mainImage || item.images?.[0] || '/placeholder-news.svg')} 
                                                alt={getLocalizedText(item.title, language)}
                                                fill 
                                                className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                            <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                                                {getLocalizedCity(selectedCity || item.city || 'Mumbai', language).toUpperCase()}
                                            </div>
                                            <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">
                                                {idx + 1 * 4} {language === 'mr' ? (idx % 2 === 0 ? 'तासांपूर्वी' : 'दिवसांपूर्वी') : language === 'hi' ? (idx % 2 === 0 ? 'घंटे पहले' : 'दिन पहले') : (idx % 2 === 0 ? 'hrs ago' : 'days ago')}
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <h4 className="font-bold text-[15px] leading-tight text-gray-900 group-hover:text-red-600 transition-colors line-clamp-3 mb-4">
                                                {getLocalizedText(item.title, language)}
                                            </h4>
                                            <div className="flex items-center justify-between text-gray-500 text-[11px] font-semibold border-t border-gray-50 pt-3">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1.5">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        {item.views || (1200 + idx * 300)}{idx === 1 ? 'K' : ''}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                        {15 + idx * 5}
                                                    </span>
                                                </div>
                                                <Bookmark className="w-4 h-4 hover:text-red-600" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div 
                        id="city-news-empty-state" 
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-14 text-center my-2 transition-all duration-300"
                    >
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50/50 shadow-inner">
                            <Newspaper className="w-10 h-10 text-red-500" />
                        </div>
                        
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2.5">
                            {selectedCity 
                                ? (language === 'mr' 
                                    ? `${getLocalizedCity(selectedCity, language)} साठी कोणत्याही बातम्या उपलब्ध नाहीत`
                                    : language === 'hi'
                                    ? `${getLocalizedCity(selectedCity, language)} के लिए कोई समाचार उपलब्ध नहीं है`
                                    : `No News Available for ${selectedCity}`)
                                : (t('selectCityPrompt') || 'Select a city to view local news')
                            }
                        </h3>
                        
                        <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed font-medium">
                            {selectedCity 
                                ? (language === 'mr'
                                    ? `आम्हाला सध्या ${getLocalizedCity(selectedCity, language)} साठी कोणतेही लेख किंवा स्थानिक अपडेट्स सापडले नाहीत. या शहराशी संबंधित बातम्या प्रकाशित होताच येथे दिसतील.`
                                    : language === 'hi'
                                    ? `हमें फ़िलहाल ${getLocalizedCity(selectedCity, language)} के लिए कोई लेख या स्थानीय अपडेट नहीं मिले। इस शहर से जुड़े समाचार प्रकाशित होते ही यहाँ दिखाई देंगे।`
                                    : `We couldn't find any articles or local updates for ${selectedCity} right now. News articles tagged with this city will appear here as soon as they are published.`)
                                : (t('cityPromptDesc') || 'Choose from popular cities above or select from the dropdown to explore city-specific updates.')
                            }
                        </p>

                        <div className="pt-6 border-t border-gray-100 max-w-md mx-auto">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                {language === 'mr' ? 'इतर लोकप्रिय शहरे एक्सप्लोर करा' : language === 'hi' ? 'अन्य लोकप्रिय शहर देखें' : 'Explore other popular cities'}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Kolkata'].map(city => (
                                    <button
                                        key={city}
                                        type="button"
                                        onClick={() => setSelectedCity(city)}
                                        className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                                            selectedCity === city
                                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                                : 'bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 border-gray-200 hover:border-red-200'
                                        }`}
                                    >
                                        {getLocalizedCity(city, language)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CityPage
