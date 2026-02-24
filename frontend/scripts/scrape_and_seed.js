require('dotenv').config({ path: './.env.local' });
const admin = require('firebase-admin');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { translateText } = require('../lib/translation');

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

// Fetch homepage links
async function getRecentLinks() {
    console.log("Fetching StarNewsIndia homepage...");
    const response = await fetch('https://starnewsindia.in/');
    const html = await response.text();
    const $ = cheerio.load(html);

    const links = new Set();
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('https://starnewsindia.in/') && !href.includes('category') && !href.includes('author') && href.length > 40) {
            links.add(href);
        }
    });

    return Array.from(links);
}

// Scrape individual article
async function scrapeArticle(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        let title = $('h1').first().text().trim();
        // Fallback for title
        if (!title) title = $('meta[property="og:title"]').attr('content') || '';

        const mainImage = $('meta[property="og:image"]').attr('content') || $('img').first().attr('src') || '';

        // Let's grab category
        let category = 'National'; // Default
        const metaCat = $('meta[property="article:section"]').attr('content');
        if (metaCat) category = metaCat;

        // Remove interactive elements from content before saving
        $('.artshare, .artsharwrp, .brdcrmb, #coral-wrap, .atbtlink, style, script').remove();

        let contentHtml = $('.entry-content').html() || $('article').html() || '';

        if (!title || !contentHtml) return null;

        return {
            title,
            content: contentHtml,
            mainImage,
            category,
            originalUrl: url
        };
    } catch (e) {
        console.error(`Failed to scrape ${url}:`, e.message);
        return null;
    }
}

// Map textual categories to known IDs if possible
async function getCategoryId(categoryName) {
    const snapshot = await db.collection('news_categories').get();
    let bestMatchId = '0c56a63e-2e43-456b-9235-9bd387e33ff6'; // Default to National if not found

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const name = typeof data.name === 'object' ? data.name.en : data.name;
        if (name && name.toLowerCase() === categoryName.toLowerCase()) {
            return doc.id;
        }
    }
    return bestMatchId;
}

// Main Runner
async function run() {
    console.log("Starting Web Scraper...");
    const links = await getRecentLinks();
    console.log(`Found ${links.length} potential articles on homepage.`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const url of links) {
        console.log(`\nProcessing: ${url}`);

        // 1. Check if we already have this URL in DB
        const existingUrlCheck = await db.collection('news_articles')
            .where('originalUrl', '==', url).limit(1).get();

        if (!existingUrlCheck.empty) {
            console.log("-> Skipping: Article URL already exists in database.");
            skippedCount++;
            continue;
        }

        // 2. Scrape it
        const articleData = await scrapeArticle(url);
        if (!articleData) {
            console.log("-> Skipping: Could not extract title or content.");
            skippedCount++;
            continue;
        }

        // 3. Fallback Duplicate Check by Title (to handle older articles before we saved originalUrl)
        // Note: Title might be Hindi or English on the source site. We check raw string inclusion.
        const snapshot = await db.collection('news_articles').limit(200).get(); // Check recent 200
        let isDuplicate = false;
        for (const doc of snapshot.docs) {
            const existingTitle = doc.data().title;
            const existingTitleStr = typeof existingTitle === 'object' ? JSON.stringify(existingTitle) : existingTitle;
            // Simple duplicate check: if the first 20 chars match, it's probably the same
            const excerpt = articleData.title.substring(0, 20);
            if (existingTitleStr && existingTitleStr.includes(excerpt)) {
                isDuplicate = true;
                break;
            }
        }

        if (isDuplicate) {
            console.log("-> Skipping: Article title seems to already exist.");
            skippedCount++;
            continue;
        }

        // 4. Translate!
        console.log("-> Translating article...");
        const translatedTitle = await translateText(articleData.title, 'en');
        const translatedContent = await translateText(articleData.content, 'en');
        const categoryId = await getCategoryId(articleData.category);

        // 5. Save to Firestore
        const newDoc = {
            title: translatedTitle,
            content: translatedContent,
            categoryId: categoryId,
            category: articleData.category, // Denormalized string
            city: 'India',
            genre: 'breaking',
            mainImage: articleData.mainImage,
            galleryImages: [],
            videoUrl: '',
            youtubeUrl: '',
            tags: ['StarNewsIndia', 'Scraped'],
            metaDescription: articleData.content.substring(0, 150).replace(/<[^>]*>?/gm, ''), // Strip HTML for meta
            authorId: 'system-scraper',
            authorName: 'StarNews Scraper',
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
        console.log("-> SUCCESSFULLY ADDED:", articleData.title);
        addedCount++;

        // Only do a max limit per run to avoid huge translate API spam at once (e.g. 10 fresh ones)
        if (addedCount >= 10) {
            console.log("\nReached batch limit of 10 new articles.");
            break;
        }
    }

    console.log(`\nDone! Added: ${addedCount}, Skipped: ${skippedCount}`);
    process.exit(0);
}

run().catch(console.error);
