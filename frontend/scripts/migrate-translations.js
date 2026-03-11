import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getDb } from '../lib/firebaseAdmin.js';
import { translateText } from '../lib/translation.js';

// Standalone migration script to convert plain string titles/contents to multilingual
// Run with: node scripts/migrate-translations.js

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMigration() {
    console.log('Starting multilingual translation migration...');
    const db = getDb();

    if (!db) {
        console.error('Failed to connect to Firebase Admin.');
        process.exit(1);
    }

    try {
        const snapshot = await db.collection('news_articles').get();
        const allDocs = snapshot.docs;

        console.log(`Found ${allDocs.length} total articles.`);

        // Find articles needing translation
        const needsTranslation = allDocs.filter(doc => {
            const data = doc.data();

            const needsTitle = typeof data.title === 'string' ||
                (typeof data.title === 'object' && data.title && (
                    !data.title.mr || !data.title.en || !data.title.hi ||
                    data.title.mr === data.title.hi || data.title.en === data.title.hi || data.title.mr === data.title.en
                ));

            const needsContent = typeof data.content === 'string' ||
                (typeof data.content === 'object' && data.content && (
                    !data.content.mr || !data.content.en || !data.content.hi ||
                    data.content.mr === data.content.hi || data.content.en === data.content.hi || data.content.mr === data.content.en
                ));

            return needsTitle || needsContent;
        });

        console.log(`${needsTranslation.length} articles need translation.`);

        if (needsTranslation.length === 0) {
            console.log('Nothing to do!');
            process.exit(0);
        }

        const results = { success: 0, failed: 0, skipped: 0 };
        const BATCH_SIZE = 3;

        for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
            const batch = needsTranslation.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(needsTranslation.length / BATCH_SIZE)}`);

            await Promise.all(batch.map(async (doc) => {
                const data = doc.data();
                const updates = {};

                try {
                    // Translate title if it's a plain string or missing proper translations
                    let sourceTitle = '';
                    if (typeof data.title === 'string') sourceTitle = data.title;
                    else if (data.title && (data.title.hi || data.title.en || data.title.mr)) {
                        sourceTitle = data.title.hi || data.title.en || data.title.mr;
                    }
                    if (sourceTitle && sourceTitle.trim()) {
                        updates.title = await translateText(sourceTitle);
                    }

                    // Translate content if it's a plain string or missing proper translations
                    let sourceContent = '';
                    if (typeof data.content === 'string') sourceContent = data.content;
                    else if (data.content && (data.content.hi || data.content.en || data.content.mr)) {
                        sourceContent = data.content.hi || data.content.en || data.content.mr;
                    }
                    if (sourceContent && sourceContent.trim()) {
                        updates.content = await translateText(sourceContent);
                    }

                    // For category and metaDescription, fallback to same logic
                    let sourceCategory = '';
                    if (typeof data.category === 'string') sourceCategory = data.category;
                    else if (data.category && (data.category.hi || data.category.en || data.category.mr)) {
                        sourceCategory = data.category.hi || data.category.en || data.category.mr;
                    }
                    if (sourceCategory && sourceCategory.trim()) {
                        updates.category = await translateText(sourceCategory);
                    }

                    let sourceMeta = '';
                    if (typeof data.metaDescription === 'string') sourceMeta = data.metaDescription;
                    else if (data.metaDescription && (data.metaDescription.hi || data.metaDescription.en || data.metaDescription.mr)) {
                        sourceMeta = data.metaDescription.hi || data.metaDescription.en || data.metaDescription.mr;
                    }
                    if (sourceMeta && sourceMeta.trim()) {
                        updates.metaDescription = await translateText(sourceMeta);
                    }

                    if (Object.keys(updates).length > 0) {
                        await db.collection('news_articles').doc(doc.id).update(updates);
                        results.success++;
                        console.log(`  ✅ Translated article: ${doc.id}`);
                    } else {
                        results.skipped++;
                    }
                } catch (err) {
                    results.failed++;
                    console.error(`  ❌ Failed to translate article ${doc.id}: ${err.message}`);
                }
            }));

            // Small delay to prevent rate limit (HTTP 429 Too Many Requests) from Google Translate
            if (i + BATCH_SIZE < needsTranslation.length) {
                console.log('  Waiting 1 second before next batch to avoid Google Translate rate limits...');
                await delay(1000);
            }
        }

        console.log('\n--- Migration Complete ---');
        console.log(`Total Success: ${results.success}`);
        console.log(`Total Skipped: ${results.skipped}`);
        console.log(`Total Failed:  ${results.failed}`);

    } catch (error) {
        console.error('Migration crashed:', error);
    }

    process.exit(0);
}

runMigration();
