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

async function inspect() {
    try {
        console.log('--- ALL RECENT ARTICLES ---');
        const allSnap = await db.collection('news_articles')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        allSnap.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`  Title: ${data.title?.en || data.title?.hi || data.title}`);
            console.log(`  Status: ${data.approvalStatus}`);
            console.log(`  Active: ${data.active} (${typeof data.active})`);
            console.log(`  Created: ${data.createdAt}`);
            console.log(`  Published: ${data.publishedAt}`);
            console.log('---');
        });

        console.log('\n--- ATTEMPTING PRODUCTION QUERY ---');
        try {
            const prodSnap = await db.collection('news_articles')
                .where('approvalStatus', '==', 'approved')
                .where('active', '==', true)
                .orderBy('publishedAt', 'desc')
                .limit(10)
                .get();

            console.log(`Found ${prodSnap.size} approved/active articles.`);
            prodSnap.forEach(doc => {
                const data = doc.data();
                console.log(`ID: ${doc.id} | Title: ${data.title?.en || data.title?.hi || data.title} | Pub: ${data.publishedAt}`);
            });
        } catch (e) {
            console.error('PROD QUERY FAILED:', e.message);
        }

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
inspect();
