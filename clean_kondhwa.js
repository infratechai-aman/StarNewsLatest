const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'frontend', '.env.local') });

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

async function cleanKondhwa() {
    try {
        console.log('Querying for Kondhwa articles...');
        const snapshot = await db.collection('news_articles').get();
        let count = 0;

        const batch = db.batch();
        snapshot.forEach(doc => {
            const data = doc.data();
            const titleStr = typeof data.title === 'object' ? data.title.en : data.title;
            if (titleStr && titleStr.toLowerCase().includes('kondhwa')) {
                batch.delete(doc.ref);
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`Successfully deleted ${count} Kondhwa articles.`);
        } else {
            console.log('No Kondhwa articles found.');
        }
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
cleanKondhwa();
