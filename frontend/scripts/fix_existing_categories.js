const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Category Mapping based on earlier list_categories_full.js output
const CATEGORY_MAP = {
    'National': '2938afdc-be75-4c07-8898-9993959828ec', // Nation
    'Business': '0c56a63e-2e43-456b-9235-9bd387e33ff6',
    'Entertainment': 'ecbfdbdd-f785-465f-b4f0-4660eb6c8e93',
    'Sports': 'bb062a26-9040-4f51-8e0f-90e1c25fc0fc', // Mapping Sports
    'International': 'e5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5' // World fallback or similar
};

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
        })
    });
}
const db = admin.firestore();

async function fixArticles() {
    try {
        console.log("Fetching categories to confirm IDs...");
        const catSnap = await db.collection('news_categories').get();
        const idMap = {};
        catSnap.forEach(doc => {
            const data = doc.data();
            const name = typeof data.name === 'object' ? data.name.en : data.name;
            idMap[name] = doc.id;
        });

        // Manual overrides for scraper names
        idMap['National'] = idMap['Nation'];
        idMap['International'] = idMap['World'];

        console.log("Resolved IDs:", idMap);

        const snapshot = await db.collection('news_articles')
            .where('authorId', '==', 'system-scraper-aajtak')
            .get();

        console.log(`Found ${snapshot.size} articles to fix.`);

        let fixedCount = 0;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const categoryName = data.category; // Original string category
            const correctId = idMap[categoryName];

            if (correctId && data.categoryId !== correctId) {
                console.log(`Fixing ${doc.id}: ${categoryName} -> ${correctId}`);
                await db.collection('news_articles').doc(doc.id).update({
                    categoryId: correctId
                });
                fixedCount++;
            } else if (!correctId) {
                console.warn(`No mapping found for category: ${categoryName} in doc ${doc.id}`);
                // Fallback to Nation if it's "National" or something similar
                if (categoryName === 'National' && idMap['Nation']) {
                    await db.collection('news_articles').doc(doc.id).update({
                        categoryId: idMap['Nation']
                    });
                    fixedCount++;
                }
            }
        }

        console.log(`Successfully fixed ${fixedCount} articles.`);
        process.exit(0);
    } catch (e) {
        console.error("Error fixing articles:", e);
        process.exit(1);
    }
}

fixArticles();
