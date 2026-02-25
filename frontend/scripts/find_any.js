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

async function findAny() {
    try {
        console.log('Querying for ANY article with author system-scraper-aajtak...');
        const snapshot = await db.collection('news_articles')
            .where('authorId', '==', 'system-scraper-aajtak')
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log('STILL NOTHING found for author system-scraper-aajtak.');
            // Search by authorName
            const snap2 = await db.collection('news_articles')
                .where('authorName', '==', 'AajTak Scraper')
                .limit(1)
                .get();
            if (!snap2.empty) {
                console.log('Found by authorName!');
                console.log(JSON.stringify(snap2.docs[0].data(), null, 2));
            } else {
                console.log('Searching for ANY article added in last 2 hours...');
                const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
                const snap3 = await db.collection('news_articles')
                    .where('createdAt', '>=', twoHoursAgo)
                    .limit(1)
                    .get();
                if (!snap3.empty) {
                    console.log('Found by createdAt!');
                    console.log(JSON.stringify(snap3.docs[0].data(), null, 2));
                } else {
                    console.log('Absolutely no recent articles found for that author or timestamp.');

                    // List authors of last 10 articles
                    const snap4 = await db.collection('news_articles').orderBy('createdAt', 'desc').limit(10).get();
                    console.log('Last 10 articles authors:');
                    snap4.forEach(d => console.log(`- ${d.data().authorId} | ${d.data().authorName} | ${d.id}`));
                }
            }
            process.exit(0);
        }

        console.log(JSON.stringify(snapshot.docs[0].data(), null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
findAny();
