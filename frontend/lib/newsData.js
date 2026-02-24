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
    if (typeof obj === 'string') {
        result = obj;
    } else if (typeof obj === 'object' && obj !== null) {
        result = obj[lang] || obj.en || obj.mr || obj.hi || '';
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
