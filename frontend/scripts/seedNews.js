const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase credentials in .env.local');
    process.exit(1);
}

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

// Sample Data from newsData.js (Hand-picked top articles)
const articlesToSeed = [
    {
        slug: 'mumbai-bmc-elections-2026-voter-turnout',
        title: {
            en: 'Mumbai BMC Elections 2026: 41.08% Voter Turnout Recorded Till 3:30 PM',
            hi: 'मुंबई बीएमसी चुनाव 2026: 3:30 बजे तक 41.08% मतदान दर्ज',
            mr: 'मुंबई बीएमसी निवडणूक 2026: 3:30 वाजेपर्यंत 41.08% मतदान'
        },
        categoryId: 'City News',
        category: 'City News',
        publishedAt: '2026-01-15T15:30:00Z',
        createdAt: '2026-01-15T15:30:00Z',
        views: 15678,
        mainImage: 'https://picsum.photos/800/500?random=1001',
        content: {
            en: '<p>Mumbai witnessed a significant voter turnout in the BMC Elections 2026, with 41.08% voters casting their votes till 3:30 PM.</p><p>The State Election Commission reported that voting was smooth across most polling stations.</p>',
            hi: '<p>बीएमसी चुनाव 2026 में मुंबई में 3:30 बजे तक 41.08% मतदान हुआ।</p><p>राज्य निर्वाचन आयोग ने बताया कि अधिकांश मतदान केंद्रों पर मतदान सुचारू रूप से हुआ।</p>',
            mr: '<p>बीएमसी निवडणूक 2026 मध्ये मुंबईत 3:30 वाजेपर्यंत 41.08% मतदान झाले.</p><p>राज्य निवडणूक आयोगाने सांगितले की बहुतेक मतदान केंद्रांवर मतदान सुरळीत झाले.</p>'
        },
        tags: ['BMC Elections', 'Mumbai', '2026', 'Voting'],
        approvalStatus: 'approved',
        active: true,
        featured: true,
        showOnHome: true,
        authorName: 'StarNews Admin'
    },
    {
        slug: 'india-u19-cricket-world-cup-2026',
        title: {
            en: "Henil Patel's 5-Wicket Haul Helps India Bowl Out USA for 107 in U19 World Cup",
            hi: 'हेनिल पटेल की 5 विकेट से भारत ने यूएसए को 107 पर किया ऑलआउट',
            mr: 'हेनिल पटेलच्या 5 विकेट्समुळे भारताने यूएसएला 107 वर ऑलआउट केले'
        },
        categoryId: 'Sports',
        category: 'Sports',
        publishedAt: '2026-01-15T14:00:00Z',
        createdAt: '2026-01-15T14:00:00Z',
        views: 23456,
        mainImage: 'https://picsum.photos/800/500?random=1011',
        content: {
            en: '<p>India\'s Henil Patel delivered a stunning bowling performance, taking 5 wickets to bowl out USA for just 107 runs.</p><p>India chased down the target with ease.</p>',
            hi: '<p>भारत के हेनिल पटेल ने शानदार गेंदबाजी करते हुए 5 विकेट लेकर यूएसए को 107 रन पर ऑलआउट किया।</p><p>भारत ने आसानी से लक्ष्य हासिल किया।</p>',
            mr: '<p>भारताच्या हेनिल पटेलने 5 विकेट्स घेत यूएसएला 107 धावांवर ऑलआउट केले.</p><p>भारताने सहजपणे लक्ष्य गाठले.</p>'
        },
        tags: ['Cricket', 'U19 World Cup', 'India'],
        approvalStatus: 'approved',
        active: true,
        featured: true,
        showOnHome: true,
        authorName: 'StarNews Admin'
    },
    {
        slug: 'uddhav-thackeray-removable-ink-controversy',
        title: {
            en: 'Uddhav Thackeray Raises Alarm Over Removable Ink in Mumbai Civic Polls',
            hi: 'उद्धव ठाकरे ने मुंबई नागरिक चुनाव में हटाने योग्य स्याही पर चिंता जताई',
            mr: 'उद्धव ठाकरेंनी मुंबई महानगरपालिका निवडणुकीत काढता येणाऱ्या शाईबद्दल चिंता व्यक्त केली'
        },
        categoryId: 'Politics',
        category: 'Politics',
        publishedAt: '2026-01-15T12:00:00Z',
        createdAt: '2026-01-15T12:00:00Z',
        views: 18765,
        mainImage: 'https://picsum.photos/800/500?random=1021',
        content: {
            en: '<p>Shiv Sena (UBT) chief Uddhav Thackeray raised serious concerns over the use of removable ink at polling booths.</p><p>"This is a serious issue," Thackeray stated.</p>',
            hi: '<p>शिवसेना (यूबीटी) प्रमुख उद्धव ठाकरे ने मतदान केंद्रों पर हटाने योग्य स्याही के उपयोग पर गंभीर चिंता जताई।</p><p>"यह एक गंभीर मुद्दा है," ठाकरे ने कहा।</p>',
            mr: '<p>शिवसेना (युबीटी) प्रमुख उद्धव ठाकरे यांनी मतदान केंद्रांवर काढता येणाऱ्या शाईच्या वापराबद्दल गंभीर चिंता व्यक्त केली.</p><p>"हा एक गंभीर मुद्दा आहे," ठाकरे म्हणाले.</p>'
        },
        tags: ['Uddhav Thackeray', 'BMC Elections', 'Mumbai'],
        approvalStatus: 'approved',
        active: true,
        featured: true,
        showOnHome: true,
        authorName: 'StarNews Admin'
    }
];

async function seed() {
    console.log('Starting seed process...');

    for (const article of articlesToSeed) {
        try {
            // Check if article with this slug already exists
            const existing = await db.collection('news_articles').where('slug', '==', article.slug).limit(1).get();

            if (!existing.empty) {
                console.log(`Article with slug "${article.slug}" already exists. Skipping.`);
                continue;
            }

            await db.collection('news_articles').add(article);
            console.log(`Added article: ${article.slug}`);
        } catch (error) {
            console.error(`Error adding article ${article.slug}:`, error);
        }
    }

    console.log('Seed process completed.');
    process.exit(0);
}

seed();
