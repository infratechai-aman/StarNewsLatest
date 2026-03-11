import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: List active E-Newspapers (Public)
export async function GET(request) {
    const db = getDb();
    try {
        if (!db) {
            return NextResponse.json({ papers: [] });
        }

        let papers = [];
        try {
            // Try with ordering (requires composite index)
            const snapshot = await db.collection('enewspapers')
                .where('active', '==', true)
                .orderBy('publishDate', 'desc')
                .get();
            papers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (indexError) {
            // Fallback: fetch without ordering if composite index missing
            console.warn('enewspaper index missing, fetching without order:', indexError.message);
            const snapshot = await db.collection('enewspapers')
                .where('active', '==', true)
                .get();
            papers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            // Sort in JS
            papers.sort((a, b) => new Date(b.publishDate || 0) - new Date(a.publishDate || 0));
        }

        return NextResponse.json({ papers });
    } catch (error) {
        console.error('Error fetching enewspapers:', error);
        // Return empty instead of 500 so page still renders
        return NextResponse.json({ papers: [] });
    }
}
