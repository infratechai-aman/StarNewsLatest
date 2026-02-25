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

async function check() {
    try {
        console.log('Querying Firestore articles with Visibility filters...');
        const snapshot = await db.collection('news_articles')
            .where('approvalStatus', '==', 'approved')
            .where('active', '==', true)
            .get();

        console.log('Total visible articles:', snapshot.size);

        if (snapshot.size > 0) {
            const recent = await db.collection('news_articles')
                .where('approvalStatus', '==', 'approved')
                .where('active', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            recent.forEach(doc => {
                const data = doc.data();
                console.log(`- ${data.slug || data.title?.en} (Created: ${data.createdAt}, Published: ${data.publishedAt})`);
                if (!data.publishedAt) console.warn('  ⚠️ WARNING: Missing publishedAt!');
                if (typeof data.title !== 'object') console.warn('  ⚠️ WARNING: Title is not an object!');
                if (typeof data.content !== 'object') console.warn('  ⚠️ WARNING: Content is not an object!');
            });
        } else {
            console.log('No articles found with both approvalStatus: approved AND active: true');

            // Check why
            const all = await db.collection('news_articles').limit(5).get();
            all.forEach(doc => {
                const data = doc.data();
                console.log(`- ${data.slug} Status: ${data.approvalStatus}, Active: ${data.active}`);
            });
        }
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
check();
