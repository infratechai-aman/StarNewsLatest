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
    if (!forceFresh) {
        const cached = getCache(CACHE_KEY);
        if (cached) return NextResponse.json(cached);
    }

    const db = getDb();

    try {
        // Run all pending queries in parallel
        const [pendingNews, pendingBusinesses, pendingClassifieds, pendingUsers, pendingApplications] = await Promise.all([
            db.collection('news_articles').where('approvalStatus', '==', 'pending').get(),
            db.collection('businesses').where('approvalStatus', '==', 'pending').get(),
            db.collection('classified_ads').where('approvalStatus', '==', 'pending').get(),
            db.collection('users').where('status', '==', 'pending').get(),
            db.collection('reporter_applications').where('status', '==', 'PENDING').get()
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
            users: [...mapDocs(pendingUsers), ...extraAppUsers]
        };

        setCache(CACHE_KEY, result, 60 * 1000); // 60s TTL
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching pending items:', error.message);
        return NextResponse.json({ error: 'Failed to fetch pending items' }, { status: 500 });
    }
}
