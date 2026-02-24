const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env.local') });

let rawKey = process.env.FIREBASE_PRIVATE_KEY;
console.log("Raw Key exists:", !!rawKey);
if (rawKey) {
    let cleaned = rawKey;
    cleaned = cleaned.replace(/^['"](.*)['"]$/, '$1');
    cleaned = cleaned.replace(/\\n/g, '\n');
    if (!cleaned.includes('\n') && cleaned.includes('BEGIN PRIVATE KEY')) {
        cleaned = cleaned
            .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
            .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
    }

    try {
        const admin = require('firebase-admin');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: cleaned,
            })
        });
        console.log("Firebase initialized. Testing query...");
        admin.firestore().collection('news_articles').limit(1).get().then(snapshot => {
            console.log("Query SUCCESS. Found", snapshot.size, "records");
            process.exit(0);
        }).catch(err => {
            console.log("Query ERROR:", err.message);
            process.exit(1);
        });
    } catch (e) {
        console.log("Firebase INIT ERROR in test wrapper:", e.message);
    }
}
