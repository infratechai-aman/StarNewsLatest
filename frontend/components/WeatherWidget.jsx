'use client'

import { CloudSun, Wind, Droplets } from 'lucide-react'

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

    // Helper for AQI Color
    const getAqiColor = (aqi) => {
        if (aqi <= 50) return 'text-green-400'
        if (aqi <= 100) return 'text-yellow-400'
        return 'text-red-400'
    }

    return (
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl shadow-lg p-4 mb-6 relative overflow-hidden">
            {/* Sun decoration */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/30 rounded-full blur-xl"></div>

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h3 className="text-lg font-bold">{weather.location}</h3>
                    <p className="text-xs text-sky-100">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                </div>
                <CloudSun className="w-8 h-8 text-yellow-300" />
            </div>

            <div className="flex items-center mt-3 mb-4 relative z-10">
                <span className="text-4xl font-black tracking-tight">{weather.temp}°</span>
                <div className="ml-3">
                    <span className="block text-sm font-medium">{weather.condition}</span>
                    <span className="block text-xs text-sky-100">H: {weather.high}° L: {weather.low}°</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-white/20 pt-3 relative z-10">
                <div className="flex items-center gap-2">
                    <Wind className="w-3.5 h-3.5 text-sky-200" />
                    <span className="text-xs font-medium">12 km/h</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-white/20 px-1.5 rounded text-sky-100">AQI</span>
                    <span className={`text-xs font-bold ${getAqiColor(weather.aqi)}`}>{weather.aqi}</span>
                </div>
            </div>
        </div>
    )
}

export default WeatherWidget
