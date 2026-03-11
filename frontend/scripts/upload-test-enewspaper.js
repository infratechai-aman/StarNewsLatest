// Script to upload test e-newspaper entries to Firestore
// Run: node scripts/upload-test-enewspaper.js

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Clean private key (same logic as firebaseAdmin.js)
function cleanPrivateKey(key) {
    if (!key) return null;
    let cleaned = key.replace(/^['"](.*)['"]$/, '$1');
    const beginMarker = '-----BEGIN PRIVATE KEY-----';
    const endMarker = '-----END PRIVATE KEY-----';
    if (cleaned.includes(beginMarker) && cleaned.includes(endMarker)) {
        let base64 = cleaned.substring(
            cleaned.indexOf(beginMarker) + beginMarker.length,
            cleaned.indexOf(endMarker)
        );
        base64 = base64.replace(/\\n/g, '');
        base64 = base64.replace(/\s+/g, '');
        const lines = base64.match(/.{1,64}/g) || [];
        cleaned = `${beginMarker}\n${lines.join('\n')}\n${endMarker}\n`;
    } else {
        cleaned = cleaned.replace(/\\n/g, '\n');
    }
    return cleaned;
}

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !rawKey) {
    console.error('❌ Missing Firebase credentials in .env.local');
    process.exit(1);
}

const privateKey = cleanPrivateKey(rawKey);

admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

async function uploadTestNewspaper() {
    const testPapers = [
        {
            title: 'StarNews Daily',
            pdfUrl: 'https://www.africau.edu/images/default/sample.pdf',
            thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
            publishDate: new Date().toISOString().split('T')[0],
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'StarNews Weekend Edition',
            pdfUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf',
            thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400',
            publishDate: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })(),
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    for (const paper of testPapers) {
        const docRef = await db.collection('enewspapers').add(paper);
        await docRef.update({ id: docRef.id });
        console.log(`✅ Uploaded: "${paper.title}" (ID: ${docRef.id})`);
    }

    console.log('\n🎉 Done! Test newspapers uploaded. Refresh the E-Newspaper page to see them.');
    process.exit(0);
}

uploadTestNewspaper().catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
});
