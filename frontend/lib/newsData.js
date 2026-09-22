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

import { translations } from '@/lib/translations';

const CATEGORY_MAP = {
    // English
    'all': 'all',
    'all news': 'allNews',
    'business': 'business',
    'city': 'city',
    'city news': 'cityNews',
    'crime': 'crime',
    'education': 'education',
    'entertainment': 'entertainment',
    'jobs': 'jobs',
    'national': 'nation',
    'nation': 'nation',
    'politics': 'politics',
    'sports': 'sports',
    'test category': 'testCategory',
    'trending': 'trending',
    'technology': 'technology',
    'tech': 'technology',
    'health': 'health',
    'murder': 'crime',
    'general': 'general',
    'market intelligence': 'marketIntelligence',
    'economy': 'economy',

    // Marathi & Hindi variants (scraped from old Star News / regional portals)
    'व्यापार': 'business',
    'व्यवसाय': 'business',
    'उद्योग': 'business',
    'गुन्हा': 'crime',
    'अपराध': 'crime',
    'क्राईम': 'crime',
    'खून': 'crime',
    'हत्या': 'crime',
    'राजकारण': 'politics',
    'राजनीति': 'politics',
    'खेळ': 'sports',
    'खेल': 'sports',
    'क्रीडा': 'sports',
    'मनोरंजन': 'entertainment',
    'सिनेमा': 'entertainment',
    'बॉलीवूड': 'entertainment',
    'शिक्षण': 'education',
    'शिक्षा': 'education',
    'आरोग्य': 'health',
    'स्वास्थ्य': 'health',
    'तंत्रज्ञान': 'technology',
    'टेक्नॉलॉजी': 'technology',
    'देश': 'nation',
    'राष्ट्रीय': 'nation',
    'राष्ट्र': 'nation',
    'शहर': 'cityNews',
    'शहर वार्ता': 'cityNews',
    'स्थानिक': 'cityNews',
    'पुणे': 'cityNews',
    'पुणे शहर': 'cityNews',
    'महाराष्ट्र': 'nation',
    'सामान्य': 'general',
    'रोजगार': 'jobs',
    'नोकरी': 'jobs'
};

export const getTranslatedCategory = (cat, lang = 'en') => {
    if (!cat) return '';
    if (typeof cat === 'object' && cat !== null) {
        return getLocalizedText(cat, lang);
    }
    const catStr = String(cat).trim();
    const key = CATEGORY_MAP[catStr.toLowerCase()] || CATEGORY_MAP[catStr];

    if (key && translations[lang]?.[key]) {
        return translations[lang][key];
    }
    if (key && translations.en?.[key]) {
        return lang === 'en' ? translations.en[key] : (translations[lang]?.[key] || catStr);
    }
    return catStr;
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
