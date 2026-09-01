import { getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET: Breaking Ticker (Public — no auth required)
export async function GET(request) {
    const CACHE_KEY = 'api_breaking_ticker';
    const cachedData = getCache(CACHE_KEY);
    if (cachedData) return NextResponse.json(cachedData);

    try {
        const db = getDb();
        if (!db) {
            return NextResponse.json({ enabled: false, text: '', texts: [] });
        }
        const doc = await db.collection('breaking_ticker').doc('main').get();

        if (!doc.exists) {
            return NextResponse.json({ enabled: false, text: '', texts: [] });
        }

        const t = doc.data();
        if (t.status !== 'active') {
            return NextResponse.json({ enabled: false, text: '', texts: [] });
        }

        // Join all texts so multiple selected articles all appear in the ticker
        const allTexts = t.texts && t.texts.length > 0 ? t.texts : (t.text ? [t.text] : []);
        const joinedText = allTexts.filter(Boolean).join(' • ');

        const responseData = {
            enabled: true,
            text: joinedText || t.text || '',
            texts: allTexts,
            updatedAt: t.updatedAt
        };

        setCache(CACHE_KEY, responseData, 60 * 1000); // 1 minute cache for breaking news
        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching ticker:', error.message);
        return NextResponse.json({ enabled: false, text: '', texts: [] });
    }
}

// POST: Update Breaking Ticker (requires reporter or admin role)
export async function POST(request) {
    // Use centralized auth middleware
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    const role = authResult.user.role;

    try {
        const body = await request.json();
        const { enabled, texts } = body;

        // Validate ticker content limits
        if (texts && Array.isArray(texts)) {
            if (texts.length > 10) {
                return NextResponse.json({ error: 'Maximum 10 ticker items allowed' }, { status: 400 });
            }
            for (const text of texts) {
                if (typeof text === 'string' && text.length > 500) {
                    return NextResponse.json({ error: 'Each ticker item must be under 500 characters' }, { status: 400 });
                }
            }
        }

        const updateData = {
            updatedAt: new Date().toISOString()
        };

        if (role === 'super_admin') {
            updateData.text = texts?.[0] || '';
            updateData.texts = texts || [];
            // fix: use explicit ternary to handle enabled=false correctly
            // Previously `enabled ? 'active' : 'inactive'` treated undefined as falsy
            updateData.status = (enabled !== undefined ? enabled : true) ? 'active' : 'inactive';
        } else {
            // Reporter: only update pending fields
            updateData.pendingText = texts?.[0] || '';
            updateData.pendingStatus = 'pending';
        }

        await db.collection('breaking_ticker').doc('main').set(updateData, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Ticker POST error:', error.message);
        return NextResponse.json({ error: 'Failed to update ticker' }, { status: 500 });
    }
}
