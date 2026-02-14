const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (assuming credentials in ./service-account.json or similar, or using default logic)
// Since we are in the project root/scripts context, let's try to locate the service account or use existing config.
// The user has 'lib/firebaseAdmin.js', but that's for Next.js runtime. 
// We will look for a key file.
// If none, we will rely on Application Default Credentials if set up, OR try to init with project ID.

// Actually, let's peek at lib/firebaseAdmin.js to see how it initializes.
// We'll try to replicate that logic but for a standalone script.

const { cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Try to find a service account file
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
const keys = [
    'service-account.json',
    'star-news-latest-firebase-adminsdk.json',
    'starnewslatest-firebase-adminsdk.json'
];

let serviceAccount = null;

// Search in parent/root dirs
const searchDirs = [process.cwd(), path.join(process.cwd(), 'frontend'), path.join(process.cwd(), '..')];

for (const dir of searchDirs) {
    for (const key of keys) {
        const p = path.join(dir, key);
        if (fs.existsSync(p)) {
            console.log(`Found service account at: ${p}`);
            serviceAccount = require(p);
            break;
        }
    }
    if (serviceAccount) break;
}

if (!serviceAccount) {
    console.error("Could not find service-account.json. Please ensure it exists in the root or frontend directory.");
    // Fallback: Try to read from env vars if possible (simulating what nextjs might do)
    // But for a script, file is best.
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function listUsers() {
    console.log('Listing users...');
    try {
        const listUsersResult = await auth.listUsers(100);
        console.log(`Found ${listUsersResult.users.length} users in Auth:`);

        for (const userRecord of listUsersResult.users) {
            // Check if they have a role in Firestore 'users' collection
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            let role = 'N/A';
            if (userDoc.exists) {
                role = userDoc.data().role || 'public';
            }

            // Also check custom claims
            const claims = userRecord.customClaims || {};

            if (role !== 'public' || Object.keys(claims).length > 0) {
                console.log(`- Email: ${userRecord.email} | UID: ${userRecord.uid} | Role (DB): ${role} | Claims: ${JSON.stringify(claims)}`);
            }
        }
    } catch (error) {
        console.log('Error listing users:', error);
    }
}

listUsers().then(() => {
    process.exit(0);
});
