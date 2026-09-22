import { getDb } from '@/lib/firebaseAdmin';
import { requireSuperAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getCache, setCache, invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET: Unified Pending List
export async function GET(request) {
    const authResult = await requireSuperAdmin(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // opt(PERF-02): Cache pending data for 60 seconds.
    // This runs 4 parallel Firestore queries on every admin mount and tab visit.
    // 60s is safe — all approval actions call loadPendingData() which triggers a
    // fresh fetch, so approved items will always appear immediately after action.
    const { searchParams } = new URL(request.url);
    const forceFresh = searchParams.get('fresh') === 'true';

    const CACHE_KEY = 'admin_pending';
    if (forceFresh) {
        invalidateCache(CACHE_KEY);
    } else {
        const cached = getCache(CACHE_KEY);
        if (cached) {
            return NextResponse.json(cached, {
                headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
            });
        }
    }

    const db = getDb();

    try {
    // Run all pending queries in parallel with per-collection error isolation.
    // If a single collection fails (e.g., missing index), others still succeed.
    const safeGet = (query) => query.catch(() => ({ docs: [] }));

    const [pendingNews, pendingBusinesses, pendingClassifieds, pendingUsers, pendingApplications, pendingTickers] = await Promise.all([
        safeGet(db.collection('news_articles').where('approvalStatus', '==', 'pending').get()),
        safeGet(db.collection('businesses').where('approvalStatus', '==', 'pending').get()),
        safeGet(db.collection('classified_ads').where('approvalStatus', '==', 'pending').get()),
        safeGet(db.collection('users').where('status', '==', 'pending').get()),
        safeGet(db.collection('reporter_applications').where('status', '==', 'PENDING').get()),
        safeGet(db.collection('ticker_change_requests').where('status', '==', 'pending').get())
    ]);

        const mapDocs = (snap) => snap.docs.map(d => ({ ...d.data(), id: d.id }));

        // Map pending applications into users format so they appear in pending reporter queues
        const existingEmails = new Set(pendingUsers.docs.map(d => (d.data().email || '').toLowerCase().trim()));
        const extraAppUsers = pendingApplications.docs
            .filter(d => !existingEmails.has((d.data().email || '').toLowerCase().trim()))
            .map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    isApplication: true,
                    name: data.fullName || 'Reporter Applicant',
                    email: data.email,
                    phone: data.phone,
                    role: 'reporter',
                    status: 'pending',
                    createdAt: data.submittedAt || new Date().toISOString()
                };
            });

        const result = {
            news: mapDocs(pendingNews),
            businesses: mapDocs(pendingBusinesses),
            classifieds: mapDocs(pendingClassifieds),
            ads: [],
            users: [...mapDocs(pendingUsers), ...extraAppUsers],
            tickerRequests: mapDocs(pendingTickers)
        };

        setCache(CACHE_KEY, result, 60 * 1000); // 60s TTL
        return NextResponse.json(result, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error) {
        console.error('Error fetching pending items:', error.message);
        return NextResponse.json({ error: 'Failed to fetch pending items' }, { status: 500 });
    }
}
