const admin = require('firebase-admin');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Firebase
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
const firestore = admin.firestore();

// Postgres
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://starnews:starnews123@localhost:5432/starnews'
});

async function runCheck() {
    let report = '--- ARTICLE ADDITION REPORT ---\n\n';

    try {
        // Postgres Check
        const pgRes = await pool.query('SELECT count(*) FROM news_articles');
        report += `Postgres (news_articles): ${pgRes.rows[0].count} articles\n`;

        const pgRecent = await pool.query('SELECT title, created_at FROM news_articles ORDER BY created_at DESC LIMIT 3');
        report += 'Recent in Postgres:\n';
        pgRecent.rows.forEach(r => report += `- ${r.title} (${r.created_at})\n`);

        // Firestore Check
        const fsSnap = await firestore.collection('news_articles').get();
        report += `\nFirestore (news_articles): ${fsSnap.size} articles\n`;

        const fsRecent = await firestore.collection('news_articles').orderBy('createdAt', 'desc').limit(3).get();
        report += 'Recent in Firestore:\n';
        fsRecent.forEach(doc => {
            const data = doc.data();
            report += `- ${data.slug || data.title?.en} (${data.createdAt})\n`;
        });

        fs.writeFileSync('article_report.txt', report);
        console.log('Report generated in article_report.txt');
        console.log(report);

        process.exit(0);
    } catch (e) {
        console.error('Error during check:', e);
        process.exit(1);
    }
}

runCheck();
