import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translation';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

        const snapshot = await db.collection('news_articles').limit(150).get();
        let translatedCount = 0;
        const updatedIds = [];

        for (const doc of snapshot.docs) {
            if (translatedCount >= limit) break;
            const data = doc.data();

            const needsTitleTranslation = typeof data.title === 'string';
            const needsContentTranslation = typeof data.content === 'string';

            if (needsTitleTranslation || needsContentTranslation) {
                const updatePayload = {
                    updatedAt: new Date().toISOString()
                };

                if (needsTitleTranslation) {
                    updatePayload.title = await translateText(data.title);
                }
                if (needsContentTranslation) {
                    updatePayload.content = await translateText(data.content);
                }

                await doc.ref.update(updatePayload);
                translatedCount++;
                updatedIds.push(doc.id);
            }
        }

        if (translatedCount > 0) {
            purgeCache('news_');
            purgeCache('admin_news_list_');
        }

        return NextResponse.json({
            success: true,
            translatedCount,
            updatedIds,
            message: `Successfully translated ${translatedCount} legacy articles.`
        });
    } catch (error) {
        console.error('Error backfilling news translations:', error);
        return NextResponse.json({ error: error.message || 'Backfill failed' }, { status: 500 });
    }
}
