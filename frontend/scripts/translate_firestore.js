const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

let cleanedKey = process.env.FIREBASE_PRIVATE_KEY || '';
cleanedKey = cleanedKey.replace(/^['"](.*)['"]$/, '$1');
if (cleanedKey.includes('BEGIN PRIVATE KEY')) {
    let base64 = cleanedKey.substring(
        cleanedKey.indexOf('BEGIN PRIVATE KEY') + 17,
        cleanedKey.indexOf('-----END PRIVATE KEY-----')
    );
    base64 = base64.replace(/\\n/g, '').replace(/\s+/g, '').replace(/-/g, '');
    const lines = base64.match(/.{1,64}/g) || [];
    cleanedKey = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
} else {
    cleanedKey = cleanedKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: cleanedKey,
        }),
    });
}

const db = admin.firestore();

// Translation util
const TARGET_LANGUAGES = ['en', 'hi', 'mr'];
async function translateText(text, fromLang = 'en') {
    if (!text) return { en: '', hi: '', mr: '' };
    if (typeof text === 'object') return text;

    const results = { [fromLang]: text };

    for (const lang of TARGET_LANGUAGES) {
        if (lang === fromLang) continue;
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data && data[0]) {
                results[lang] = data[0].map(item => item[0]).join('');
            } else {
                results[lang] = text;
            }
        } catch (error) {
            console.error(`Translation failed for ${lang}:`, error.message);
            results[lang] = text;
        }
    }
    TARGET_LANGUAGES.forEach(lang => {
        if (!results[lang]) results[lang] = text;
    });
    return results;
}

async function migrate() {
    console.log('Fetching news articles...');
    const snapshot = await db.collection('news_articles').get();
    let updatedCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        let needsUpdate = false;
        let updateData = {};

        // Check Title
        if (typeof data.title === 'string') {
            console.log(`Translating string title for: ${data.id}`);
            updateData.title = await translateText(data.title);
            needsUpdate = true;
        } else if (typeof data.title === 'object' && data.title !== null) {
            const hi = data.title.hi;
            const mr = data.title.mr;
            const en = data.title.en;
            if (en && (!hi || !mr || hi.trim() === '' || mr.trim() === '')) {
                console.log(`Fixing missing object title translations for: ${data.id}`);
                updateData.title = await translateText(en);
                needsUpdate = true;
            }
        }

        // Check Content
        if (typeof data.content === 'string') {
            console.log(`Translating string content for: ${data.id}`);
            updateData.content = await translateText(data.content);
            needsUpdate = true;
        } else if (typeof data.content === 'object' && data.content !== null) {
            const hi = data.content.hi;
            const mr = data.content.mr;
            const en = data.content.en;
            if (en && (!hi || !mr || hi.trim() === '' || mr.trim() === '')) {
                console.log(`Fixing missing object content translations for: ${data.id}`);
                updateData.content = await translateText(en);
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await db.collection('news_articles').doc(doc.id).update(updateData);
            updatedCount++;
            console.log(`Updated document: ${doc.id}`);
            // Wait a bit to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    console.log(`Migration complete. Updated ${updatedCount} articles.`);
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
