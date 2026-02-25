// Multilingual News Data helper functions
// The hardcoded newsData array has been emptied to transition to a dynamic system.

export const newsData = [];

const decodeHTMLEntities = (text) => {
    if (typeof text !== 'string') return text;
    return text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
};

export const getLocalizedText = (obj, lang = 'en') => {
    if (!obj) return '';
    let result = '';

    if (typeof obj === 'object' && obj !== null) {
        // Prefer the requested language
        result = obj[lang] || obj.en || obj.mr || obj.hi || '';
    } else if (typeof obj === 'string') {
        result = obj;
    }

    // Clean CDATA, common scraper junk, and raw HTML tags
    if (typeof result === 'string') {
        result = result
            .replace(/<!\[CDATA\[/gi, '')
            .replace(/\]\]>/gi, '')
            .replace(/<p>/gi, '')
            .replace(/<\/p>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>?/gm, '') // Strip remaining HTML tags
            .split('Source link')[0]
            .trim();
    }

    return decodeHTMLEntities(result);
};

export const getTranslatedCategory = (cat, lang = 'en') => {
    return getLocalizedText(cat, lang);
};

// Helper functions for data access (now targeting dynamic data through API and hooks)
export const getNewsById = (id) => newsData.find(news => news.id === id);
export const getNewsBySlug = (slug) => newsData.find(news => news.slug === slug);
export const getMainNewsBoxes = () => [];
export const getTrendingNews = () => [];
export const getBusinessNews = () => [];
export const getSportsNews = () => [];
export const getNationNews = () => [];
export const getEntertainmentNews = () => [];
