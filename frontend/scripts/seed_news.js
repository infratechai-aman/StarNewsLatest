const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin
if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('ERROR: FIREBASE_PROJECT_ID is missing in .env.local');
    process.exit(1);
}

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

const TARGET_COUNT = 50;
const RSS_URL = 'https://starnewsindia.in/feed';

async function fetchRSS(page = 1) {
    const url = page === 1 ? RSS_URL : `${RSS_URL}/?paged=${page}`;
    console.log(`Fetching RSS Page: ${url}`);
    const res = await fetch(url);
    const text = await res.text();
    return text;
}

function extractItems(xml) {
    const items = [];
    // Simple regex to extract item blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        items.push(match[1]);
    }
    return items;
}

function parseItem(itemXml) {
    const getTag = (tag) => {
        const regex = new RegExp(`<${tag}.*?>([\\s\\S]*?)<\/${tag}>`, 'i');
        const m = regex.exec(itemXml);
        return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
    };

    return {
        title: getTag('title'),
        link: getTag('link'),
        pubDate: getTag('pubDate'),
        description: getTag('description'),
        content: getTag('content:encoded')
    };
}

async function scrapeArticle(url) {
    try {
        console.log(`  Scraping: ${url}`);
        const res = await fetch(url);
        const html = await res.text();

        // Extract YouTube
        // Look for iframeSrc with youtube
        const ytRegex = /src=["'](https:\/\/(?:www\.)?youtube\.com\/embed\/[\w-]+)["']/;
        const ytMatch = ytRegex.exec(html);
        const youtubeUrl = ytMatch ? ytMatch[1] : null;

        // Extract Image (og:image)
        const imgRegex = /meta property=["']og:image["'] content=["'](.*?)["']/;
        const imgMatch = imgRegex.exec(html);
        const mainImage = imgMatch ? imgMatch[1] : null;

        // Extract Category? We can skip or infer.

        return { youtubeUrl, mainImage };
    } catch (e) {
        console.error(`  Failed to scrape ${url}:`, e.message);
        return { youtubeUrl: null, mainImage: null };
    }
}

async function seed() {
    console.log('Starting Seed Process...');
    let totalAdded = 0;
    let page = 1;

    // Fetch Categories for ID mapping
    const catSnap = await db.collection('news_categories').limit(1).get();
    let defaultCategoryId = '';
    let defaultCategoryName = 'General';
    if (!catSnap.empty) {
        defaultCategoryId = catSnap.docs[0].id; // Use first available category
        defaultCategoryName = catSnap.docs[0].data().name;
    } else {
        console.log('No categories found. Creating "General" category.');
        const catRef = await db.collection('news_categories').add({
            name: 'General',
            slug: 'general',
            active: true,
            createdAt: new Date().toISOString()
        });
        defaultCategoryId = catRef.id;
    }

    while (totalAdded < TARGET_COUNT) {
        const xml = await fetchRSS(page);
        const itemXmls = extractItems(xml);

        if (itemXmls.length === 0) {
            console.log('No more items found in RSS.');
            break;
        }

        for (const itemXml of itemXmls) {
            if (totalAdded >= TARGET_COUNT) break;

            const data = parseItem(itemXml);

            // Check if exists
            const exists = await db.collection('news_articles').where('title', '==', data.title).get();
            if (!exists.empty) {
                console.log(`  Skipping (Duplicate): ${data.title}`);
                continue;
            }

            // Scrape Details
            const details = await scrapeArticle(data.link);

            // Create Document
            const article = {
                title: data.title,
                content: data.content || data.description || '',
                categoryId: defaultCategoryId, // Default to first category
                category: defaultCategoryName,
                city: 'India', // Default
                genre: details.youtubeUrl ? 'video' : 'breaking',
                mainImage: details.mainImage || '',
                galleryImages: [],
                videoUrl: '',
                youtubeUrl: details.youtubeUrl || '',
                tags: ['Imported', 'StarNewsIndia'],
                metaDescription: data.description ? data.description.substring(0, 150) : '',
                authorId: 'system',
                authorName: 'System Crawler',
                approvalStatus: 'approved',
                active: true,
                featured: false,
                views: 0,
                createdAt: new Date(data.pubDate).toISOString(),
                updatedAt: new Date().toISOString(),
                publishedAt: new Date(data.pubDate).toISOString()
            };

            await db.collection('news_articles').add(article);
            console.log(`  Added [${totalAdded + 1}]: ${data.title}`);
            totalAdded++;
        }
        page++;
    }

    console.log(`DONE. Added ${totalAdded} articles.`);
}

seed().catch(console.error);
