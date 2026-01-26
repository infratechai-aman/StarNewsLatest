// Content Store - localStorage-based admin content settings
// Allows admin to control what appears on frontend without backend changes

const STORAGE_KEY = 'starnews_content_settings'

// Default settings
const defaultSettings = {
    // Premium Ad Banner (Top)
    premiumAd: {
        enabled: true,
        imageUrl: '',
        linkUrl: '',
        title: 'Premium Advertisement Space',
        altText: 'Advertisement'
    },

    // Sidebar Ad - Each item has its own image and destination URL
    sidebarAd: {
        enabled: true,
        items: [] // Array of { imageUrl: '', destinationUrl: '' }
    },

    // Article Page Sidebar Ads (News Detail Page)
    articleAd: {
        // Article Ad Banner (Pink/Purple gradient - "Advertise Your Business")
        banner: {
            enabled: true,
            imageUrl: '',
            linkUrl: '',
            title: 'Advertise Your Business'
        },
        // Article Sticky Ad (Bottom sticky - "Premium Ad Space")
        sticky: {
            enabled: true,
            imageUrl: '',
            linkUrl: '',
            title: 'Premium Ad Space'
        }
    },

    // Trending Section
    trending: {
        enabled: true,
        newsIds: [], // Array of news IDs marked as trending
        maxItems: 6
    },

    // Business Sidebar Ad (Homepage - BUSINESS Advertisement)
    businessAd: {
        enabled: true,
        imageUrl: '',
        linkUrl: '',
        title: 'BUSINESS',
        subtitle: 'Advertisement',
        buttonText: 'POST YOUR AD'
    },

    // News Settings
    news: {
        approvedIds: [], // IDs of approved news
        rejectedIds: [], // IDs of rejected news
        trendingIds: []  // IDs marked as trending
    },

    // Last updated timestamp
    lastUpdated: null
}

// Get all content settings
export const getContentSettings = () => {
    if (typeof window === 'undefined') return defaultSettings

    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) }
        }
    } catch (error) {
        console.error('Error reading content settings:', error)
    }

    return defaultSettings
}

// Save all content settings
export const saveContentSettings = (settings) => {
    if (typeof window === 'undefined') return false

    try {
        const updatedSettings = {
            ...settings,
            lastUpdated: new Date().toISOString()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings))
        return true
    } catch (error) {
        console.error('Error saving content settings:', error)
        return false
    }
}

// Premium Ad helpers
export const getPremiumAdSettings = async () => {
    try {
        const res = await fetch('/api/ads/premium')
        const data = await res.json()
        return data.enabled ? data : { enabled: false, imageUrl: '', linkUrl: '', title: '' }
    } catch (error) {
        console.error('Error fetching premium ad settings:', error)
        return { enabled: false, imageUrl: '', linkUrl: '', title: '' }
    }
}

export const savePremiumAdSettings = async (adSettings) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
        const res = await fetch('/api/admin/ads/premium', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(adSettings)
        })
        return res.ok
    } catch (error) {
        console.error('Error saving premium ad settings:', error)
        return false
    }
}

// Sidebar Ad helpers
export const getSidebarAdSettings = () => {
    const settings = getContentSettings()
    return settings.sidebarAd
}

export const saveSidebarAdSettings = async (adSettings) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
        const res = await fetch('/api/admin/ads/sidebar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(adSettings)
        })
        // Also save to localStorage for instant access
        const settings = getContentSettings()
        settings.sidebarAd = { ...settings.sidebarAd, ...adSettings }
        saveContentSettings(settings)
        return res.ok
    } catch (error) {
        console.error('Error saving sidebar ad settings:', error)
        return false
    }
}

// Article Page Sidebar Ad helpers
export const getArticleAdSettings = () => {
    const settings = getContentSettings()
    return settings.articleAd || {
        banner: { enabled: true, imageUrl: '', linkUrl: '', title: 'Advertise Your Business' },
        sticky: { enabled: true, imageUrl: '', linkUrl: '', title: 'Premium Ad Space' }
    }
}

export const saveArticleAdSettings = (adSettings) => {
    const settings = getContentSettings()
    settings.articleAd = { ...settings.articleAd, ...adSettings }
    return saveContentSettings(settings)
}

// Business Sidebar Ad helpers (Homepage - "BUSINESS Advertisement")
export const getBusinessAdSettings = () => {
    const settings = getContentSettings()
    return settings.businessAd || {
        enabled: true,
        imageUrl: '',
        linkUrl: '',
        title: 'BUSINESS',
        subtitle: 'Advertisement',
        buttonText: 'POST YOUR AD'
    }
}

export const saveBusinessAdSettings = (adSettings) => {
    const settings = getContentSettings()
    settings.businessAd = { ...settings.businessAd, ...adSettings }
    return saveContentSettings(settings)
}

// Trending section helpers
export const getTrendingSettings = () => {
    const settings = getContentSettings()
    return settings.trending
}

export const saveTrendingSettings = (trendingSettings) => {
    const settings = getContentSettings()
    settings.trending = { ...settings.trending, ...trendingSettings }
    return saveContentSettings(settings)
}

// News management helpers
export const getNewsSettings = () => {
    const settings = getContentSettings()
    return settings.news
}

export const markNewsAsTrending = (newsId, isTrending = true) => {
    const settings = getContentSettings()
    const trendingIds = new Set(settings.news.trendingIds || [])

    if (isTrending) {
        trendingIds.add(newsId)
    } else {
        trendingIds.delete(newsId)
    }

    settings.news.trendingIds = Array.from(trendingIds)
    settings.trending.newsIds = Array.from(trendingIds)
    return saveContentSettings(settings)
}

export const isNewsTrending = (newsId) => {
    const settings = getContentSettings()
    return (settings.news.trendingIds || []).includes(newsId)
}

export const getTrendingNewsIds = () => {
    const settings = getContentSettings()
    return settings.news.trendingIds || []
}

// Check if section should be visible
export const isPremiumAdVisible = () => {
    const settings = getPremiumAdSettings()
    return settings.enabled
}

export const isSidebarAdVisible = () => {
    const settings = getSidebarAdSettings()
    return settings.enabled
}

export const isTrendingSectionVisible = () => {
    const settings = getTrendingSettings()
    return settings.enabled
}

// Reset to defaults
export const resetContentSettings = () => {
    if (typeof window === 'undefined') return false

    try {
        localStorage.removeItem(STORAGE_KEY)
        return true
    } catch (error) {
        console.error('Error resetting content settings:', error)
        return false
    }
}

export default {
    getContentSettings,
    saveContentSettings,
    getPremiumAdSettings,
    savePremiumAdSettings,
    getSidebarAdSettings,
    saveSidebarAdSettings,
    getTrendingSettings,
    saveTrendingSettings,
    getNewsSettings,
    markNewsAsTrending,
    isNewsTrending,
    getTrendingNewsIds,
    isPremiumAdVisible,
    isSidebarAdVisible,
    isTrendingSectionVisible,
    resetContentSettings
}
