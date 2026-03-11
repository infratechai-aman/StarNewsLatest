import { getDb } from '../lib/firebaseAdmin.js';

async function checkDb() {
    const db = getDb();
    const snapshot = await db.collection('news_articles').limit(5).get();
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`Title type: ${typeof data.title}`);
        console.log(`Title value:`, data.title);
        console.log('---');
    });
    process.exit(0);
}

checkDb();
