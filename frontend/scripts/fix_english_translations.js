require('dotenv').config({ path: './.env.local' });
const admin = require('firebase-admin');
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

// Regex to detect Devanagari (Hindi) characters
const isHindi = (text) => {
    if (!text || typeof text !== 'string') return false;
    return /[\u0900-\u097F]/.test(text);
};

async function fixEnglishTranslations() {
    console.log('Scanning news articles for Hindi text in English fields...');

    const snapshot = await db.collection('news_articles').get();
    let updatedCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        let needsUpdate = false;
        let updateData = {};

        // Check Title
        if (typeof data.title === 'object' && data.title !== null) {
            const enText = data.title.en;
            if (isHindi(enText)) {
                console.log(`[${doc.id}] Fixing Title (Hindi found in EN).`);
                // Assume the 'en' field is actually Hindi and translate it
                updateData.title = await translateText(enText, 'hi');
                needsUpdate = true;
            }
        }

        // Check Content
        if (typeof data.content === 'object' && data.content !== null) {
            const enText = data.content.en;
            if (isHindi(enText)) {
                console.log(`[${doc.id}] Fixing Content (Hindi found in EN object).`);
                updateData.content = await translateText(enText, 'hi');
                needsUpdate = true;
            }
        } else if (typeof data.content === 'string' && isHindi(data.content)) {
            console.log(`[${doc.id}] Fixing Content (String to Object).`);
            updateData.content = await translateText(data.content, 'hi');
            needsUpdate = true;
        }

        // Check Short Description
        if (typeof data.shortDescription === 'object' && data.shortDescription !== null) {
            const enText = data.shortDescription.en;
            if (isHindi(enText)) {
                console.log(`[${doc.id}] Fixing Short Description (Hindi found in EN object).`);
                updateData.shortDescription = await translateText(enText, 'hi');
                needsUpdate = true;
            }
        } else if (typeof data.shortDescription === 'string' && isHindi(data.shortDescription)) {
            console.log(`[${doc.id}] Fixing Short Description (String to Object).`);
            updateData.shortDescription = await translateText(data.shortDescription, 'hi');
            needsUpdate = true;
        }

        // Check Meta Description
        if (typeof data.metaDescription === 'object' && data.metaDescription !== null) {
            const enText = data.metaDescription.en;
            if (isHindi(enText)) {
                console.log(`[${doc.id}] Fixing Meta Description (Hindi found in EN object).`);
                updateData.metaDescription = await translateText(enText, 'hi');
                needsUpdate = true;
            }
        } else if (typeof data.metaDescription === 'string' && isHindi(data.metaDescription)) {
            console.log(`[${doc.id}] Fixing Meta Description (String to Object).`);
            updateData.metaDescription = await translateText(data.metaDescription, 'hi');
            needsUpdate = true;
        }

        if (needsUpdate) {
            try {
                // Also update updated_at if possible
                updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
                await db.collection('news_articles').doc(doc.id).update(updateData);
                updatedCount++;
            } catch (error) {
                console.error(`Failed to update article ${doc.id}:`, error);
            }
        }
    }

    console.log(`\nMigration complete. Fixed ${updatedCount} articles with incorrect English translations.`);
    process.exit(0);
}

fixEnglishTranslations().catch(console.error);
