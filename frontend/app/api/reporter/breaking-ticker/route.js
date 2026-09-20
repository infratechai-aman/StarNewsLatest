import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin, isSuperAdmin } from '@/lib/auth';
import { purgeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json({ ticker: null, error: 'Database connection failed' }, { status: 503 });
        }

        const doc = await db.collection('breaking_ticker').doc('main').get();

        if (doc.exists) {
            const data = doc.data();
            return NextResponse.json({
                ticker: {
                    text: data.text || data.texts?.join(' • ') || '',
                    texts: data.texts || [],
                    enabled: data.enabled !== false,
                    status: data.status || (data.enabled ? 'active' : 'inactive'),
                    pendingText: data.pendingText || data.pendingTexts?.join(' • ') || '',
                    pendingStatus: data.pendingStatus || null,
                    pendingBy: data.pendingBy || null,
                    pendingByName: data.pendingByName || null,
                    pendingAt: data.pendingAt || null,
                    updatedAt: data.updatedAt || null
                }
            });
        }
        return NextResponse.json({ ticker: null });
    } catch (error) {
        console.error('Reporter breaking ticker GET error:', error);
        return NextResponse.json({
            ticker: null,
            error: 'Internal server error',
            code: error.code
        }, { status: 500 });
    }
}

export async function POST(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    if (!db) {
        return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const text = (body.text || body.pendingText || '').trim();

        if (!text) {
            return NextResponse.json({ success: false, error: 'Ticker text is required' }, { status: 400 });
        }

        const texts = text.includes('•') ? text.split('•').map(t => t.trim()).filter(Boolean) : [text];
        const isAdmin = isSuperAdmin(authResult.user);

        const updateData = {
            updatedAt: new Date().toISOString()
        };

        if (isAdmin) {
            updateData.text = text;
            updateData.texts = texts;
            updateData.enabled = true;
            updateData.status = 'active';
            updateData.pendingText = '';
            updateData.pendingStatus = null;
            purgeCache('breaking_ticker');
        } else {
            updateData.pendingText = text;
            updateData.pendingTexts = texts;
            updateData.pendingStatus = 'pending';
            updateData.pendingBy = authResult.user.userId || authResult.user.email;
            updateData.pendingByName = authResult.user.name || authResult.user.email;
            updateData.pendingAt = new Date().toISOString();
        }

        await db.collection('breaking_ticker').doc('main').set(updateData, { merge: true });

        return NextResponse.json({
            success: true,
            status: isAdmin ? 'published' : 'pending_review',
            ticker: updateData
        });
    } catch (error) {
        console.error('Reporter breaking ticker POST error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            code: error.code
        }, { status: 500 });
    }
}

export const PUT = POST;
