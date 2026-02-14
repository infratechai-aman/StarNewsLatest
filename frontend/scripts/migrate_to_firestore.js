const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin
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
const auth = getAuth(app);

// Initialize Postgres
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    console.log('Starting migration...');
    const client = await pool.connect();

    try {
        // 1. Migrate Users
        console.log('Migrating Users...');
        const users = await client.query('SELECT * FROM users');
        for (const user of users.rows) {
            // Create in Firestore
            await db.collection('users').doc(user.id).set({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                phone: user.phone || '',
                address: user.address || '',
                createdAt: user.created_at?.toISOString() || new Date().toISOString(),
                updatedAt: user.updated_at?.toISOString() || new Date().toISOString()
            });

            // Create in Firebase Auth (if not exists)
            try {
                await auth.createUser({
                    uid: user.id,
                    email: user.email,
                    displayName: user.name,
                    // We cannot migrate passwords! Users must reset or we set temp password
                    password: 'temporaryPassword123!',
                });
                console.log(`Created Auth user: ${user.email}`);
            } catch (e) {
                if (e.code === 'auth/email-already-exists') {
                    // Update existing
                    await auth.updateUser(user.id, {
                        email: user.email,
                        displayName: user.name
                    });
                    console.log(`Updated Auth user: ${user.email}`);
                } else {
                    console.warn(`Failed to create Auth for ${user.email}: ${e.message}`);
                }
            }
        }

        // 2. Migrate Categories
        console.log('Migrating Categories...');
        const categories = await client.query('SELECT * FROM news_categories');
        for (const cat of categories.rows) {
            await db.collection('news_categories').doc(cat.id).set({
                id: cat.id,
                name: cat.name,
                nameHi: cat.name_hi || '',
                nameMr: cat.name_mr || '',
                slug: cat.slug,
                description: cat.description || '',
                active: cat.active,
                createdAt: cat.created_at?.toISOString()
            });
        }

        // 3. Migrate News Articles
        console.log('Migrating News Articles...');
        const articles = await client.query('SELECT * FROM news_articles');
        // Cache categories for denormalization
        const catSnap = await db.collection('news_categories').get();
        const catMap = {};
        catSnap.docs.forEach(d => catMap[d.id] = d.data().name);

        for (const article of articles.rows) {
            await db.collection('news_articles').doc(article.id).set({
                id: article.id,
                title: article.title,
                content: article.content,
                categoryId: article.category_id,
                category: catMap[article.category_id] || '', // Denormalized
                city: article.city || '',
                genre: article.genre || 'breaking',
                mainImage: article.main_image,
                galleryImages: article.gallery_images || [],
                videoUrl: article.video_url,
                youtubeUrl: article.youtube_url,
                tags: article.tags || [],
                metaDescription: article.meta_description,
                authorId: article.author_id,
                authorName: article.author_name || '',
                approvalStatus: article.approval_status,
                active: article.active,
                featured: article.featured,
                views: article.views,
                createdAt: article.created_at?.toISOString(),
                updatedAt: article.updated_at?.toISOString(),
                publishedAt: article.published_at?.toISOString()
            });
        }


        // 4. Migrate Businesses
        console.log('Migrating Businesses...');
        const businesses = await client.query('SELECT * FROM businesses');
        for (const bus of businesses.rows) {
            await db.collection('businesses').doc(bus.id).set({
                id: bus.id,
                name: bus.name,
                description: bus.description || '',
                category: bus.category || '',
                address: bus.address || '',
                city: bus.city || '',
                phone: bus.phone || '',
                email: bus.email || '',
                website: bus.website || '',
                image: bus.image || '',
                coverImage: bus.cover_image || '',
                images: bus.images || [],
                ownerId: bus.owner_id,
                approvalStatus: bus.approval_status || 'pending',
                active: bus.active,
                createdAt: bus.created_at?.toISOString(),
                updatedAt: bus.updated_at?.toISOString()
            });
        }

        // 5. Migrate Classifieds
        console.log('Migrating Classifieds...');
        const classifieds = await client.query('SELECT * FROM classified_ads');
        for (const ad of classifieds.rows) {
            await db.collection('classified_ads').doc(ad.id).set({
                id: ad.id,
                title: ad.title,
                description: ad.description || '',
                category: ad.category || '',
                price: parseFloat(ad.price || 0),
                contactName: ad.contact_name || '',
                contactPhone: ad.contact_phone || '',
                contactEmail: ad.contact_email || '',
                location: ad.location || '',
                images: ad.images || [],
                approvalStatus: ad.approval_status || 'pending',
                active: ad.active,
                userId: ad.user_id,
                createdAt: ad.created_at?.toISOString(),
                updatedAt: ad.updated_at?.toISOString()
            });
        }

        // 6. Migrate E-Newspapers
        console.log('Migrating E-Newspapers...');
        const papers = await client.query('SELECT * FROM enewspapers');
        for (const paper of papers.rows) {
            await db.collection('enewspapers').doc(paper.id).set({
                id: paper.id,
                title: paper.title,
                pdfUrl: paper.pdf_url,
                thumbnailUrl: paper.thumbnail_url || '',
                description: paper.description || '',
                publishDate: paper.publish_date ? new Date(paper.publish_date).toISOString() : new Date().toISOString(),
                active: paper.active,
                createdAt: paper.created_at?.toISOString()
            });
        }

        // 7. Migrate Site Settings & Ticker
        console.log('Migrating Settings & Ticker...');
        const settings = await client.query('SELECT * FROM site_settings');
        for (const setting of settings.rows) {
            await db.collection('site_settings').doc(setting.type).set({
                ...setting.items,
                enabled: setting.enabled,
                updatedAt: setting.updated_at?.toISOString()
            });
        }

        const ticker = await client.query('SELECT * FROM breaking_ticker WHERE status = \'active\' LIMIT 1');
        if (ticker.rows.length > 0) {
            const t = ticker.rows[0];
            await db.collection('breaking_ticker').doc('main').set({
                text: t.text,
                texts: t.texts || [],
                status: t.status,
                updatedAt: t.updated_at?.toISOString(),
                updatedBy: t.updated_by
            });
        }

        console.log('Migration Complete!');

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
