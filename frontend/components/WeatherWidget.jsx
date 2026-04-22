'use client'

import { useState, useEffect } from 'react'
import { CloudSun, Wind, Droplets } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const WeatherWidget = () => {
    // Mock Data for Pune (Default)
    const weather = {
        location: 'Pune, MH',
        temp: 28,
        condition: 'Partly Cloudy',
        high: 32,
        low: 22,
        aqi: 45 // Good
    }

    const { language } = useLanguage()
    const [mounted, setMounted] = useState(false)
    const [translatedData, setTranslatedData] = useState({
        location: weather.location,
        condition: weather.condition
    })

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        let isMounted = true;
        const updateTranslation = async () => {
            if (language === 'en') {
                if (isMounted) setTranslatedData({ location: weather.location, condition: weather.condition });
                return;
            }
            try {
                const { translateText } = await import('@/lib/translation');
                const locRes = await translateText(weather.location, 'en');
                const condRes = await translateText(weather.condition, 'en');
                if (isMounted) setTranslatedData({
                    location: locRes[language] || weather.location,
                    condition: condRes[language] || weather.condition
                });
            } catch (err) {
                console.error('Translation failed', err);
            }
        };
        updateTranslation();
        return () => { isMounted = false; };
    }, [language]);

    // Helper for AQI Color
    const getAqiColor = (aqi) => {
        if (aqi <= 50) return 'text-green-400'
        if (aqi <= 100) return 'text-yellow-400'
        return 'text-red-400'
    }

    return (
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-[32px] shadow-2xl p-8 mb-6 relative overflow-hidden w-full max-w-md mx-auto">
            {/* Sun decoration */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-yellow-400/30 rounded-full blur-3xl"></div>

            <div className="flex justify-between items-start relative z-10 mb-6">
                <div>
                    <h3 className="text-2xl font-black tracking-tight">{translatedData.location}</h3>
                    <p className="text-sm text-sky-100 font-medium opacity-80 min-h-[20px]">
                        {mounted ? new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                    </p>
                </div>
                <CloudSun className="w-12 h-12 text-yellow-300 drop-shadow-lg" />
            </div>

            <div className="flex items-center mt-6 mb-8 relative z-10">
                <span className="text-7xl font-black tracking-tighter drop-shadow-xl">{weather.temp}°</span>
                <div className="ml-6">
                    <span className="block text-xl font-black leading-none">{translatedData.condition}</span>
                    <span className="block text-sm text-sky-100 font-bold opacity-80 mt-1">H: {weather.high}° L: {weather.low}°</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6 relative z-10 mt-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Wind className="w-5 h-5 text-sky-200" />
                    </div>
                    <span className="text-sm font-black tracking-wide">12 km/h</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <span className="text-[10px] font-black text-sky-100">AQI</span>
                    </div>
                    <span className={`text-sm font-black ${getAqiColor(weather.aqi)}`}>{weather.aqi}</span>
                </div>
            </div>
        </div>
    )
}

export default WeatherWidget
