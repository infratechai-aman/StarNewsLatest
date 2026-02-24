/**
 * Simple translation utility for Star News
 * Supports EN, HI, MR
 */

const TARGET_LANGUAGES = ['en', 'hi', 'mr'];

/**
 * Translates text into all supported languages
 * @param {string} text The text to translate
 * @param {string} fromLang The source language (default: 'en')
 * @returns {Promise<Object>} Object with translations {en, hi, mr}
 */
export async function translateText(text, fromLang = 'en') {
    if (!text) return { en: '', hi: '', mr: '' };

    // If text is already an object, assume it's already translated or needs partial update
    if (typeof text === 'object') {
        const baseText = text[fromLang] || text.en || text.hi || text.mr || '';
        if (!baseText) return text;
        text = baseText;
    }

    const results = { [fromLang]: text };

    const translatePromises = TARGET_LANGUAGES.map(async (lang) => {
        if (lang === fromLang) return;

        try {
            // Using a free translation service (unofficial Google Translate API)
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();

            // The gtx response is a complex nested array: [[["translated", "original", ...], ...]]
            if (data && data[0]) {
                const translatedPart = data[0].map(item => item[0]).join('');
                results[lang] = translatedPart || text;
            } else {
                results[lang] = text; // Fallback
            }
        } catch (error) {
            console.error(`Translation failed for ${lang}:`, error);
            results[lang] = text; // Fallback
        }
    });

    await Promise.all(translatePromises);

    // Ensure all keys exist
    TARGET_LANGUAGES.forEach(lang => {
        if (!results[lang]) results[lang] = text;
    });

    return results;
}

/**
 * Normalizes a field that could be a string or a translated object
 * @param {any} value 
 * @param {string} defaultLang 
 * @returns {Object} {en, hi, mr}
 */
export function normalizeLocalized(value, defaultLang = 'en') {
    if (!value) return { en: '', hi: '', mr: '' };
    if (typeof value === 'object') {
        return {
            en: value.en || '',
            hi: value.hi || '',
            mr: value.mr || ''
        };
    }
    return {
        en: defaultLang === 'en' ? value : '',
        hi: defaultLang === 'hi' ? value : '',
        mr: defaultLang === 'mr' ? value : ''
    };
}
