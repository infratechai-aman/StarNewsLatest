const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
    });
}
const db = admin.firestore();

async function migrate() {
    try {
        console.log('--- STARTING MIGRATION ---');
        // Find all approved articles
        const snapshot = await db.collection('news_articles')
            .where('approvalStatus', '==', 'approved')
            .get();

        console.log(`Found ${snapshot.size} approved articles to check.`);
        let updatedCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            let needsUpdate = false;
            const updateData = {};

            // 1. Missing publishedAt
            if (!data.publishedAt) {
                updateData.publishedAt = data.createdAt || new Date().toISOString();
                needsUpdate = true;
            }

            // 2. Missing or false active status
            if (data.active !== true) {
                updateData.active = true;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await doc.ref.update(updateData);
                updatedCount++;
                console.log(`  Updated ID: ${doc.id}`);
            }
        }

        console.log(`Migration Complete. Updated ${updatedCount} articles.`);
        process.exit(0);
    } catch (e) {
        console.error('Migration Error:', e.message);
        process.exit(1);
    }
}
migrate();
