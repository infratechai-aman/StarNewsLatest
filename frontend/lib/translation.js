/**
 * Simple translation utility for Star News
 * Supports EN, HI, MR
 */

const TARGET_LANGUAGES = ['en', 'hi', 'mr'];

/**
 * Splits text into chunks of maximum size, trying to break at paragraph or sentence boundaries.
 */
function chunkText(text, maxSize = 3000) {
    if (!text || text.length <= maxSize) return [text];

    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxSize) {
            chunks.push(remaining);
            break;
        }

        // Find best break point (paragraph, then sentence, then space)
        let breakPoint = remaining.lastIndexOf('\n\n', maxSize);
        if (breakPoint === -1) breakPoint = remaining.lastIndexOf('\n', maxSize);
        if (breakPoint === -1) breakPoint = remaining.lastIndexOf('. ', maxSize);
        if (breakPoint === -1) breakPoint = remaining.lastIndexOf(' ', maxSize);
        if (breakPoint === -1 || breakPoint < maxSize * 0.5) breakPoint = maxSize;

        chunks.push(remaining.substring(0, breakPoint).trim());
        remaining = remaining.substring(breakPoint).trim();
    }

    return chunks;
}

/**
 * Translates text into all supported languages
 * @param {string} text The text to translate
 * @param {string} fromLang The source language (default: 'en')
 * @returns {Promise<Object>} Object with translations {en, hi, mr}
 */
export async function translateText(text, fromLang = 'en') {
    if (!text) return { en: '', hi: '', mr: '' };

    // If text is already an object, assume it's already translated
    if (typeof text === 'object') {
        const baseText = text[fromLang] || text.en || text.hi || text.mr || '';
        if (!baseText) return text;
        text = baseText;
    }

    // Auto-detect Devanagari script if fromLang is set to English
    if (fromLang === 'en' && typeof text === 'string' && /[\u0900-\u097F]/.test(text)) {
        fromLang = 'hi';
    }

    const chunks = chunkText(text);
    const results = { [fromLang]: text };

    for (const lang of TARGET_LANGUAGES) {
        if (lang === fromLang) continue;

        try {
            const translatedChunks = await Promise.all(chunks.map(async (chunk) => {
                if (!chunk.trim()) return '';
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${lang}&dt=t&q=${encodeURIComponent(chunk)}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                if (data && data[0]) {
                    return data[0].map(item => item[0]).join('');
                }
                return chunk;
            }));

            results[lang] = translatedChunks.join('\n\n');
        } catch (error) {
            console.error(`Translation failed for ${lang}:`, error);
            results[lang] = text; // Fallback
        }
    }

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
