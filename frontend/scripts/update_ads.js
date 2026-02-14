const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('ERROR: FIREBASE_PROJECT_ID is missing');
    process.exit(1);
}

const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
});

const db = getFirestore(app);

// Helper to get random item
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const AD_THEMES = [
    { bg: '0f172a', text: 'Cloud+Solutions', color: '38bdf8', industry: 'Tech' },
    { bg: '450a0a', text: 'Premium+Watches', color: 'fca5a5', industry: 'Luxury' },
    { bg: '172554', text: 'Global+Finance', color: '60a5fa', industry: 'Finance' },
    { bg: '064e3b', text: 'Eco+Energy', color: '34d399', industry: 'Energy' },
    { bg: '312e81', text: 'Cyber+Security', color: 'a5b4fc', industry: 'Security' },
    { bg: '701a75', text: 'Digital+Marketing', color: 'f0abfc', industry: 'Marketing' },
    { bg: '000000', text: 'Exclusive+Real+Estate', color: 'ffffff', industry: 'Real Estate' },
    { bg: '14532d', text: 'Organic+Grocers', color: 'bbf7d0', industry: 'Retail' }
];

const POSITIONS = ['header', 'sidebar', 'content'];

function generateAd(id, position) {
    const theme = random(AD_THEMES);
    const width = position === 'sidebar' ? '300' : '728';
    const height = position === 'sidebar' ? '250' : '90';

    return {
        id: id,
        name: `${theme.industry} Ad - ${Math.floor(Math.random() * 1000)}`,
        // Use placehold.co with custom colors
        image: `https://placehold.co/${width}x${height}/${theme.bg}/${theme.color}?text=${theme.text}`,
        url: 'https://example.com', // Placeholder URL
        position: position,
        active: true
    };
}

const ADS = [
    generateAd('header_ad_1', 'header'),
    generateAd('sidebar_ad_1', 'sidebar'),
    generateAd('sidebar_ad_2', 'sidebar'),
    generateAd('content_ad_1', 'content'),
    generateAd('content_ad_2', 'content')
];

async function updateAds() {
    console.log('Generating Random Professional Ads...');

    // Based on common patterns, ads might be in 'ads' or 'general'
    // Let's create/update a dedicated 'ads' document in site_settings
    await db.collection('site_settings').doc('ads').set({
        items: ADS,
        enabled: true,
        updatedAt: new Date().toISOString()
    });

    console.log('Ads Updated with Random Professional Themes.');
    console.log(ADS.map(a => `${a.name} (${a.position})`).join('\n'));
}

updateAds();
