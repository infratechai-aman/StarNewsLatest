import { getDb } from '@/lib/firebaseAdmin';
import { requireReporterOrAdmin, isSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch ticker state (including any pending submission)
// Accessible by reporters (to see if their submission is pending) and admins (to review)
export async function GET(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();

    try {
        const doc = await db.collection('breaking_ticker').doc('main').get();

        if (!doc.exists) {
            return NextResponse.json({ ticker: null });
        }

        const t = doc.data();

        return NextResponse.json({
            ticker: {
                // Live (published) state
                text: t.text,
                status: t.status,
                // Pending (awaiting admin approval) state
                pendingText: t.pendingText,
                pendingStatus: t.pendingStatus,
                pendingBy: t.pendingBy,
                pendingAt: t.pendingAt,
                updatedAt: t.updatedAt
            }
        });
    } catch (error) {
        console.error('Error fetching pending ticker:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Submit ticker update
// fix(P2-BE-03): Reporters MUST NOT be able to set the live ticker directly.
// - Reporters write to pendingText/pendingStatus (requires admin review)
// - Super admins write directly to text/status (goes live immediately)
// Previously ALL authenticated users could set status='active', bypassing approval.
export async function POST(request) {
    const authResult = await requireReporterOrAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getDb();
    const isAdmin = isSuperAdmin(authResult.user);

    try {
        const body = await request.json();
        const { text, texts, enabled } = body;

        const resolvedText = text || texts?.[0] || '';
        const resolvedTexts = texts || (text ? [text] : []);

        let updateData;

        if (isAdmin) {
            // fix(P1-API-01 + P2-BE-03): Admin sets live ticker directly using 'status' string
            updateData = {
                text: resolvedText,
                texts: resolvedTexts,
                status: (enabled !== undefined ? enabled : true) ? 'active' : 'inactive',
                updatedAt: new Date().toISOString()
            };
        } else {
            // fix(P2-BE-03): Reporter submits for review — goes into pendingText, NOT live status
            updateData = {
                pendingText: resolvedText,
                pendingTexts: resolvedTexts,
                pendingStatus: 'pending',
                pendingBy: authResult.user.userId,
                pendingAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }

        await db.collection('breaking_ticker').doc('main').set(updateData, { merge: true });

        return NextResponse.json({
            success: true,
            status: isAdmin ? 'published' : 'pending_review'
        });
    } catch (error) {
        console.error('Error updating pending ticker:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
