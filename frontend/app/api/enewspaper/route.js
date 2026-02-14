import { db } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// GET: List active E-Newspapers (Public)
export async function GET(request) {
    try {
        const snapshot = await db.collection('enewspapers')
            .where('active', '==', true)
            .orderBy('publishDate', 'desc')
            .get();

        const papers = snapshot.docs.map(doc => ({
            ...doc.data(),
            pdfUrl: doc.data().pdfUrl, // Ensure consistency
            thumbnailUrl: doc.data().thumbnailUrl
        }));

        return NextResponse.json({ papers });
    } catch (error) {
        console.error('Error fetching enewspapers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
