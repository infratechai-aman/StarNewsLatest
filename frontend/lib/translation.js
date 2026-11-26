/**
 * Multilingual translation utilities for Star News (EN, HI, MR).
 * Supports Hindi, Marathi, and English uploads using byte-safe chunking,
 * automatic source detection (sl=auto), and multi-endpoint fallbacks.
 */

const TARGET_LANGUAGES = ['en', 'hi', 'mr'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const stripHtmlForTranslation = (input) =>
    String(input || '')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .trim();

/**
 * Checks whether a localized `{ en, hi, mr }` object already has distinct translations.
 */
export function isLocalizedComplete(value) {
    if (!value || typeof value !== 'object') return false;
    const en = typeof value.en === 'string' ? value.en.trim() : '';
    const hi = typeof value.hi === 'string' ? value.hi.trim() : '';
    const mr = typeof value.mr === 'string' ? value.mr.trim() : '';
    if (!en || !hi || !mr) return false;
    if (en === hi && hi === mr && en.length > 10) return false;
    return true;
}

/**
 * Splits text into chunks whose URL-encoded length stays within maxEncodedBytes.
 * Devanagari characters expand 9x when percent-encoded, so byte-safe chunking
 * prevents HTTP 400 / 414 errors on Hindi and Marathi articles.
 */
export function chunkText(text, maxEncodedBytes = 900) {
    if (!text) return [''];
    const str = String(text);
    if (encodeURIComponent(str).length <= maxEncodedBytes) return [str];

    const chunks = [];
    let remaining = str;

    while (remaining.length > 0) {
        if (encodeURIComponent(remaining).length <= maxEncodedBytes) {
            chunks.push(remaining);
            break;
        }

        // Binary-search largest prefix whose encoded size fits maxEncodedBytes
        let lo = 1;
        let hi = Math.min(remaining.length, maxEncodedBytes);
        while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2);
            if (encodeURIComponent(remaining.slice(0, mid)).length <= maxEncodedBytes) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        const safeMaxIdx = Math.max(1, lo);
        const windowStr = remaining.slice(0, safeMaxIdx);

        // Prefer natural boundaries inside the safe prefix
        let breakPoint = windowStr.lastIndexOf('\n\n');
        if (breakPoint < safeMaxIdx * 0.4) breakPoint = windowStr.lastIndexOf('\n');
        if (breakPoint < safeMaxIdx * 0.4) breakPoint = windowStr.lastIndexOf('। ');
        if (breakPoint < safeMaxIdx * 0.4) breakPoint = windowStr.lastIndexOf('. ');
        if (breakPoint < safeMaxIdx * 0.4) breakPoint = windowStr.lastIndexOf(' ');
        if (breakPoint <= 0) breakPoint = safeMaxIdx;

        const piece = remaining.slice(0, breakPoint).trim();
        if (piece) chunks.push(piece);
        remaining = remaining.slice(breakPoint).trim();
    }

    return chunks.length ? chunks : [''];
}

const fetchWithTimeout = (url) => {
    const signal =
        typeof AbortSignal !== 'undefined' && AbortSignal.timeout
            ? AbortSignal.timeout(7000)
            : undefined;
    return fetch(url, { ...(signal ? { signal } : {}) });
};

/**
 * Translates a single safe-sized chunk using Google Translate primary/backup
 * endpoints and MyMemory fallback. Returns `{ text, detectedLang }` or null.
 */
async function translateChunk(chunk, targetLang, sourceHint = 'auto') {
    const clean = chunk.trim();
    if (!clean) return { text: '', detectedLang: sourceHint };

    const encoded = encodeURIComponent(clean);
    const gtxUrls = [
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceHint}&tl=${targetLang}&dt=t&q=${encoded}`,
        `https://translate.googleapis.com/translate_a/single?client=webapp&sl=${sourceHint}&tl=${targetLang}&dt=t&q=${encoded}`,
    ];

    for (const url of gtxUrls) {
        try {
            const res = await fetchWithTimeout(url);
            if (!res.ok) continue;
            const data = await res.json();
            if (data && Array.isArray(data[0])) {
                const translated = data[0].map((part) => part?.[0] || '').join('');
                if (translated) {
                    const detected = typeof data[2] === 'string' ? data[2] : sourceHint;
                    return { text: translated, detectedLang: detected };
                }
            }
        } catch {
            // Try next endpoint
        }
    }

    // Secondary Google endpoint (dict-chrome-ex)
    try {
        const res = await fetchWithTimeout(
            `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceHint}&tl=${targetLang}&q=${encoded}`
        );
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data[0]) {
                const first = data[0];
                if (Array.isArray(first) && typeof first[0] === 'string') {
                    return { text: first[0], detectedLang: first[1] || sourceHint };
                }
                if (typeof first === 'string') {
                    return { text: first, detectedLang: sourceHint };
                }
            }
        }
    } catch {
        // Continue to MyMemory fallback
    }

    // Tertiary fallback: MyMemory (requires explicit source pair and <= 500 chars)
    if (clean.length <= 480) {
        const resolvedSource =
            sourceHint && sourceHint !== 'auto'
                ? sourceHint
                : /[\u0900-\u097F]/.test(clean)
                ? 'hi'
                : 'en';
        if (resolvedSource !== targetLang) {
            try {
                const res = await fetchWithTimeout(
                    `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${resolvedSource}|${targetLang}`
                );
                if (res.ok) {
                    const data = await res.json();
                    const translated = data?.responseData?.translatedText;
                    if (
                        translated &&
                        !/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated)
                    ) {
                        return { text: translated, detectedLang: resolvedSource };
                    }
                }
            } catch {
                // Fall through
            }
        }
    }

    return null;
}

/**
 * Translates full text into a single target language using byte-safe chunking.
 * Returns `{ translated, detectedLang, ok }`.
 */
export async function translateToTarget(text, targetLang, sourceHint = 'auto') {
    if (!text) return { translated: '', detectedLang: sourceHint, ok: true };
    const cleanInput = /<[^>]+>/.test(String(text))
        ? stripHtmlForTranslation(text)
        : String(text);

    const chunks = chunkText(cleanInput);
    const outChunks = [];
    let detected = sourceHint;
    let anySuccess = false;

    for (let i = 0; i < chunks.length; i += 2) {
        const pair = chunks.slice(i, i + 2);
        const resPair = await Promise.all(
            pair.map((c) => translateChunk(c, targetLang, detected !== 'auto' ? detected : sourceHint))
        );
        for (let j = 0; j < resPair.length; j++) {
            const item = resPair[j];
            if (item && item.text) {
                anySuccess = true;
                if (detected === 'auto' && TARGET_LANGUAGES.includes(item.detectedLang)) {
                    detected = item.detectedLang;
                }
                outChunks.push(item.text);
            } else {
                outChunks.push(pair[j]);
            }
        }
        if (i + 2 < chunks.length) await sleep(50);
    }

    return {
        translated: outChunks.join('\n\n'),
        detectedLang: detected,
        ok: anySuccess,
    };
}

/**
 * Translates text into all supported languages ({ en, hi, mr }).
 * Automatically detects English, Hindi, and Marathi sources.
 * @param {string|Object} text
 * @param {string} fromLang Optional source hint ('auto' recommended)
 * @returns {Promise<{en: string, hi: string, mr: string}>}
 */
export async function translateText(text, fromLang = 'auto') {
    if (!text) return { en: '', hi: '', mr: '' };

    if (typeof text === 'object') {
        if (isLocalizedComplete(text)) {
            return {
                en: text.en || '',
                hi: text.hi || '',
                mr: text.mr || '',
            };
        }
        const baseText = text.hi || text.mr || text.en || '';
        if (!baseText) return { en: '', hi: '', mr: '' };
        text = baseText;
    }

    const rawText = String(text);
    const hasDevanagari = /[\u0900-\u097F]/.test(rawText);

    // Never trust an 'en' hint for Devanagari text, or 'hi' hint for plain English text;
    // 'auto' lets Google distinguish Marathi vs Hindi accurately too.
    let sourceHint = fromLang || 'auto';
    if (hasDevanagari && sourceHint === 'en') sourceHint = 'auto';
    if (!hasDevanagari && (sourceHint === 'hi' || sourceHint === 'mr')) sourceHint = 'auto';
    if (hasDevanagari && sourceHint === 'hi') sourceHint = 'auto';

    // Translate into first target to discover exact source language (e.g. 'mr' vs 'hi' vs 'en')
    const firstTarget = hasDevanagari ? 'en' : 'hi';
    const firstRes = await translateToTarget(rawText, firstTarget, sourceHint);
    const detected = TARGET_LANGUAGES.includes(firstRes.detectedLang)
        ? firstRes.detectedLang
        : hasDevanagari
        ? 'hi'
        : 'en';

    const results = {
        [detected]: rawText,
        [firstTarget]: firstRes.translated || rawText,
    };

    const remainingTargets = TARGET_LANGUAGES.filter(
        (lang) => lang !== detected && lang !== firstTarget
    );

    for (const lang of remainingTargets) {
        const res = await translateToTarget(rawText, lang, detected);
        results[lang] = res.translated || rawText;
    }

    for (const lang of TARGET_LANGUAGES) {
        if (!results[lang]) results[lang] = rawText;
    }

    return results;
}

/**
 * Normalizes a field that could be a string or a translated object
 * @param {any} value
 * @param {string} defaultLang
 * @returns {Object} {en, hi, mr}
 */
export function normalizeLocalized(value, defaultLang = 'hi') {
    if (!value) return { en: '', hi: '', mr: '' };
    if (typeof value === 'object') {
        return {
            en: value.en || '',
            hi: value.hi || '',
            mr: value.mr || '',
        };
    }
    return {
        en: defaultLang === 'en' ? value : '',
        hi: defaultLang === 'hi' ? value : '',
        mr: defaultLang === 'mr' ? value : '',
    };
}
