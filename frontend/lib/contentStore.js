// Content Store - localStorage-based admin content settings
// Allows admin to control what appears on frontend without backend changes

const STORAGE_KEY = 'starnews_content_settings'

// Default settings
const defaultSettings = {
    // Premium Ad Banner (Top)
    premiumAd: {
        enabled: true,
        imageUrl: 'https://picsum.photos/seed/ad1/1200/200',
        linkUrl: '#',
        title: 'Premium Advertisement Space',
        altText: 'Advertisement'
    },

    // Sidebar Ad - Each item has its own image and destination URL
    sidebarAd: {
        enabled: true,
        items: [
            { imageUrl: 'https://picsum.photos/seed/ad2/600/600', destinationUrl: '#' },
            { imageUrl: 'https://picsum.photos/seed/ad3/600/600', destinationUrl: '#' },
            { imageUrl: 'https://picsum.photos/seed/ad4/600/600', destinationUrl: '#' },
            { imageUrl: 'https://picsum.photos/seed/ad8/600/600', destinationUrl: '#' }
        ]
    },

    // Article Page Sidebar Ads (News Detail Page)
    articleAd: {
        // Article Ad Banner (Pink/Purple gradient - "Advertise Your Business")
        banner: {
            enabled: true,
            imageUrl: 'https://picsum.photos/seed/ad5/1200/200',
            linkUrl: '#',
            title: 'Advertise Your Business'
        },
        // Article Sticky Ad (Bottom sticky - "Premium Ad Space")
        sticky: {
            enabled: true,
            imageUrl: 'https://picsum.photos/seed/ad6/400/400',
            linkUrl: '#',
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
        imageUrl: 'https://picsum.photos/seed/ad7/600/300',
        linkUrl: '#',
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
        const res = await fetch('/api/ads/premium', { cache: 'no-store' })
        const data = await res.json()
        if (data.enabled === false) {
            return { enabled: false, imageUrl: '', linkUrl: '', title: '' }
        }
        if (data.enabled && data.imageUrl) {
            return data
        }
        return { ...defaultSettings.premiumAd, enabled: false }
    } catch (error) {
        console.error('Error fetching premium ad settings:', error)
        return { ...defaultSettings.premiumAd, enabled: false }
    }
}

export const savePremiumAdSettings = async (adSettings) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
        const res = await fetch('/api/ads/premium', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(adSettings)
        })
        const settings = getContentSettings()
        settings.premiumAd = { ...settings.premiumAd, ...adSettings }
        saveContentSettings(settings)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('adSettingsChanged'))
        }
        return res.ok
    } catch (error) {
        console.error('Error saving premium ad settings:', error)
        return false
    }
}

export const getSidebarAdSettings = async () => {
    try {
        const res = await fetch('/api/ads/sidebar', { cache: 'no-store' })
        const data = await res.json()
        if (data.enabled === false) {
            const settings = getContentSettings()
            settings.sidebarAd = { ...(settings.sidebarAd || {}), ...data, enabled: false }
            saveContentSettings(settings)
            return { enabled: false, items: [] }
        }
        if (data.enabled && data.items && data.items.length > 0) {
            const settings = getContentSettings()
            settings.sidebarAd = data
            saveContentSettings(settings)
            return data
        }
        return { enabled: false, items: [] }
    } catch (error) {
        console.error('Error fetching sidebar ad settings:', error)
        const settings = getContentSettings()
        if (settings.sidebarAd && settings.sidebarAd.enabled === false) {
            return { enabled: false, items: [] }
        }
        if (settings.sidebarAd?.items && settings.sidebarAd.items.length > 0) {
            return settings.sidebarAd
        }
        return { enabled: false, items: [] }
    }
}

export const saveSidebarAdSettings = async (adSettings) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
        const res = await fetch('/api/ads/sidebar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(adSettings)
        })
        const settings = getContentSettings()
        settings.sidebarAd = { ...settings.sidebarAd, ...adSettings }
        saveContentSettings(settings)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('adSettingsChanged'))
        }
        return res.ok
    } catch (error) {
        console.error('Error saving sidebar ad settings:', error)
        return false
    }
}

// Article Page Sidebar Ad helpers
export const getArticleAdSettings = () => {
    const settings = getContentSettings()
    const adSettings = settings.articleAd || {};
    const banner = adSettings.banner || {};
    const sticky = adSettings.sticky || {};

    return {
        banner: {
            enabled: banner.enabled === false ? false : Boolean(banner.imageUrl),
            imageUrl: banner.imageUrl || '',
            linkUrl: banner.linkUrl || '',
            title: banner.title || defaultSettings.articleAd.banner.title
        },
        sticky: {
            enabled: sticky.enabled === false ? false : Boolean(sticky.imageUrl),
            imageUrl: sticky.imageUrl || '',
            linkUrl: sticky.linkUrl || '',
            title: sticky.title || defaultSettings.articleAd.sticky.title
        }
    };
}

export const saveArticleAdSettings = (adSettings) => {
    const settings = getContentSettings()
    settings.articleAd = { ...settings.articleAd, ...adSettings }
    const res = saveContentSettings(settings)
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('adSettingsChanged'))
    }
    return res
}

// Business Sidebar Ad helpers (Homepage - "BUSINESS Advertisement")
export const getBusinessAdSettings = () => {
    const settings = getContentSettings()
    const bAd = settings.businessAd || {}
    if (bAd.enabled === false) {
        return { ...defaultSettings.businessAd, ...bAd, enabled: false }
    }
    if (bAd.imageUrl) {
        return { ...defaultSettings.businessAd, ...bAd, enabled: true }
    }
    return { ...defaultSettings.businessAd, enabled: false }
}

export const saveBusinessAdSettings = (adSettings) => {
    const settings = getContentSettings()
    settings.businessAd = { ...settings.businessAd, ...adSettings }
    const res = saveContentSettings(settings)
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('adSettingsChanged'))
    }
    return res
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
export const isPremiumAdVisible = async () => {
    const settings = await getPremiumAdSettings()
    return settings.enabled
}

export const isSidebarAdVisible = async () => {
    const settings = await getSidebarAdSettings()
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
