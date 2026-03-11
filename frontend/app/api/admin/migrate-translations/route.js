import { getDb, getAuth } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translation';
import { purgeNewsCache } from '@/lib/newsCache';

export const dynamic = 'force-dynamic';
// Allow long execution for migration
export const maxDuration = 300;

async function isSuperAdmin(token, db, auth) {
    if (!token || !db || !auth) return false;
    try {
        const decodedUser = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedUser.uid).get();
        return userDoc.exists && userDoc.data().role === 'super_admin';
    } catch (e) {
        return false;
    }
}

/**
 * POST: Migrate all old articles with plain string title/content
 *       to multilingual {en, hi, mr} objects.
 * 
 * Query params:
 *   ?dryRun=true  — preview what would be translated without writing
 *   ?limit=10     — only process N articles (default: all)
 */
export async function POST(request) {
    const db = getDb();
    const auth = getAuth();

    try {
        // Auth check — only super admin can run migration
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized — Super Admin only' }, { status: 403 });
        }

        const url = new URL(request.url);
        const dryRun = url.searchParams.get('dryRun') === 'true';
        const limitParam = url.searchParams.get('limit');

        // Fetch all articles
        const snapshot = await db.collection('news_articles').get();
        const allDocs = snapshot.docs;

        // Find articles that need translation (missing language or identical strings indicating failed translation)
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

        const limit = limitParam ? parseInt(limitParam) : needsTranslation.length;
        const toProcess = needsTranslation.slice(0, limit);

        if (dryRun) {
            return NextResponse.json({
                message: 'Dry run — no changes made',
                totalArticles: allDocs.length,
                needsTranslation: needsTranslation.length,
                wouldProcess: toProcess.length,
                sampleArticles: toProcess.slice(0, 5).map(doc => ({
                    id: doc.id,
                    title: doc.data().title
                }))
            });
        }

        // Process translations in batches of 3 to avoid rate limiting
        const results = { success: 0, failed: 0, skipped: 0, errors: [] };
        const BATCH_SIZE = 3;

        for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
            const batch = toProcess.slice(i, i + BATCH_SIZE);

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
                    } else {
                        results.skipped++;
                    }
                } catch (err) {
                    results.failed++;
                    results.errors.push({ id: doc.id, error: err.message });
                }
            }));

            // Small delay between batches to be gentle on Google Translate
            if (i + BATCH_SIZE < toProcess.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Purge news cache so fresh translated data is served
        purgeNewsCache();

        return NextResponse.json({
            message: 'Migration complete!',
            totalArticles: allDocs.length,
            needsTranslation: needsTranslation.length,
            processed: toProcess.length,
            ...results
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Check migration status (how many articles need translation)
export async function GET(request) {
    const db = getDb();
    const auth = getAuth();

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!(await isSuperAdmin(token, db, auth))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const snapshot = await db.collection('news_articles').get();
        const allDocs = snapshot.docs;

        let plainStringCount = 0;
        let multilingualCount = 0;

        allDocs.forEach(doc => {
            const data = doc.data();
            if (typeof data.title === 'string' || typeof data.content === 'string') {
                plainStringCount++;
            } else {
                multilingualCount++;
            }
        });

        return NextResponse.json({
            totalArticles: allDocs.length,
            needsTranslation: plainStringCount,
            alreadyTranslated: multilingualCount,
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
