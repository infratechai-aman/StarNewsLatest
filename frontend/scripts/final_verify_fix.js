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

async function finalVerify() {
    try {
        const snapshot = await db.collection('news_articles')
            .where('authorId', '==', 'system-scraper-aajtak')
            .limit(10)
            .get();

        console.log(`Verifying ${snapshot.size} articles from scraper...`);
        let hasStringIds = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            const cid = data.categoryId;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cid);
            console.log(`Article: ${doc.id} | Category: ${data.category} | CID: ${cid} | ValidUUID: ${isUUID}`);
            if (!isUUID && cid !== 'trending' && cid !== 'special') {
                hasStringIds = true;
            }
        });

        if (hasStringIds) {
            console.error('FAIL: Some articles still have string category IDs.');
        } else {
            console.log('SUCCESS: All checked articles have valid category UUIDs (or reserved slugs).');
        }
        process.exit(0);
    } catch (e) {
        console.error('Verification error:', e.message);
        process.exit(1);
    }
}
finalVerify();
