require('dotenv').config({ path: './.env.local' });
const admin = require('firebase-admin');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const { translateText } = require('../lib/translation');

puppeteer.use(StealthPlugin());

// Initialize Firebase Admin
if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
}
const db = admin.firestore();

async function getCategoryId(categoryName) {
    const snapshot = await db.collection('news_categories').get();
    let bestMatchId = '0c56a63e-2e43-456b-9235-9bd387e33ff6'; // Default (Business?? No, let's find it)

    // Explicit Mapping for AajTak specific categories
    const explicitMapping = {
        'National': 'Nation',
        'International': 'World',
        'Politics': 'Politics',
        'Sports': 'Sports',
        'Business': 'Business',
        'Entertainment': 'Entertainment'
    };

    const targetName = explicitMapping[categoryName] || categoryName;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const name = typeof data.name === 'object' ? data.name.en : data.name;
        if (name && name.toLowerCase() === targetName.toLowerCase()) {
            return doc.id;
        }
    }
    return bestMatchId;
}

// Map slug to text category
function inferCategoryFromUrl(url) {
    if (url.includes('/business')) return 'Business';
    if (url.includes('/sports')) return 'Sports';
    if (url.includes('/entertainment')) return 'Entertainment';
    if (url.includes('/world') || url.includes('/international')) return 'International';
    return 'National';
}

async function run() {
    console.log("Starting AajTak Puppeteer Scraper...");
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        // Step 1: Gather Links
        const urlsToCrawl = [
            'https://www.aajtak.in/',
            'https://www.aajtak.in/national',
            'https://www.aajtak.in/business'
        ];

        const links = new Set();

        for (const pageUrl of urlsToCrawl) {
            console.log(`Crawling index: ${pageUrl}`);
            try {
                await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                const html = await page.content();
                const $ = cheerio.load(html);

                $('a').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href && href.startsWith('https://www.aajtak.in/') && !href.includes('/videogallery/') && !href.includes('/livetv') && href.length > 50) {
                        links.add(href);
                    }
                });
            } catch (e) {
                console.warn(`Error crawling index ${pageUrl}:`, e.message);
            }
        }

        const linkArray = Array.from(links);
        console.log(`\nFound ${linkArray.length} potential AajTak article links.`);

        // Step 2: Iterate and Extract
        let addedCount = 0;
        let skippedCount = 0;
        const TARGET_COUNT = 55;

        for (const url of linkArray) {
            console.log(`\nProcessing: ${url.substring(0, 60)}...`);

            // Check Duplicate
            const existingUrlCheck = await db.collection('news_articles')
                .where('originalUrl', '==', url).limit(1).get();

            if (!existingUrlCheck.empty) {
                console.log("-> Skipping: URL already exists.");
                skippedCount++;
                continue;
            }

            const cat = inferCategoryFromUrl(url);
            // Render Article Wait
            let articleData = null;
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await new Promise(r => setTimeout(r, 1500)); // allow text to render

                // Extract content using the active browser's DOM Engine, not Cheerio
                articleData = await page.evaluate((urlCat) => {
                    const titleNode = document.querySelector('h1') || document.querySelector('meta[property="og:title"]');
                    const imgNode = document.querySelector('meta[property="og:image"]') || document.querySelector('img');

                    const title = titleNode ? (titleNode.innerText || titleNode.content || '').trim() : '';
                    const mainImage = imgNode ? (imgNode.content || imgNode.src || '') : '';

                    // Nuke noise before extracting paragraphs
                    document.querySelectorAll('script, style, nav, header, footer, .ad-section, .social-share, .also-read').forEach(el => el.remove());

                    let contentHtml = '';

                    // AajTak often scatters text across various classes
                    const pTags = document.querySelectorAll('.story-details p, .text-align p, article p, .story-body p');

                    pTags.forEach(p => {
                        const text = (p.innerText || '').trim();
                        // Filter short sponsor/read-more jumps
                        if (text.length > 20 && !text.includes('ये भी पढ़ें') && !text.includes('Related')) {
                            contentHtml += `<p>${p.innerHTML}</p>\n`;
                        }
                    });

                    // Extreme fallback
                    if (contentHtml.length < 50) {
                        const articleWrapper = document.querySelector('.story-details') || document.querySelector('article');
                        if (articleWrapper && articleWrapper.innerText.length > 100) {
                            contentHtml = `<p>${articleWrapper.innerText.substring(0, 1500)}</p>`;
                        }
                    }

                    if (title && contentHtml.length > 50 && mainImage) {
                        return { title, content: contentHtml, mainImage, category: urlCat, originalUrl: window.location.href };
                    }
                    return null;
                }, cat);
            } catch (e) {
                console.warn("-> Article Load failed:", e.message);
            }

            if (!articleData) {
                console.log("-> Skipping: Could not extract valid content dynamically.");
                skippedCount++;
                continue;
            }

            // Duplicate check by fuzzy title
            const existingTitleCheck = await db.collection('news_articles').limit(200).get();
            let isDuplicate = false;
            for (const doc of existingTitleCheck.docs) {
                const existingTitle = doc.data().title;
                const existingTitleStr = typeof existingTitle === 'object' ? JSON.stringify(existingTitle) : existingTitle;
                if (existingTitleStr && existingTitleStr.includes(articleData.title.substring(0, 20))) {
                    isDuplicate = true;
                    break;
                }
            }

            if (isDuplicate) {
                console.log("-> Skipping: Title excerpt already exists.");
                skippedCount++;
                continue;
            }

            // 3. Translate and Save
            console.log("-> Translating article...");
            const translatedTitle = await translateText(articleData.title, 'hi');
            const translatedContent = await translateText(articleData.content, 'hi');
            const categoryId = await getCategoryId(articleData.category);

            const newDoc = {
                title: translatedTitle,
                content: {
                    en: translatedContent.en || translatedContent,
                    hi: translatedContent.hi || articleData.content,
                    mr: translatedContent.mr || articleData.content
                },
                categoryId: categoryId,
                category: articleData.category,
                city: 'India',
                genre: 'breaking',
                mainImage: articleData.mainImage,
                galleryImages: [],
                videoUrl: '',
                youtubeUrl: '',
                tags: ['AajTak', 'Puppeteer', 'Scraped'],
                metaDescription: $(articleData.content).text().substring(0, 150),
                authorId: 'system-scraper-aajtak',
                authorName: 'AajTak Scraper',
                approvalStatus: 'approved',
                active: true,
                featured: false,
                views: 0,
                originalUrl: articleData.originalUrl,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                publishedAt: new Date().toISOString()
            };

            await db.collection('news_articles').add(newDoc);
            console.log(`-> SUCCESSFULLY ADDED (${addedCount + 1}/${TARGET_COUNT}):`, articleData.title.trim());
            addedCount++;

            if (addedCount >= TARGET_COUNT) {
                console.log(`\nReached target of ${TARGET_COUNT} new articles!`);
                break;
            }
        }

        console.log(`\nDone! Added: ${addedCount}, Skipped: ${skippedCount}`);
    } catch (error) {
        console.error("Critical Scraper Error:", error);
    } finally {
        if (browser) await browser.close();
        process.exit(0);
    }
}

run();
