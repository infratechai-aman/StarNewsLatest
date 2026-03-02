import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    try {
        // Find existing category or use first one
        let categoryId = 'business-economy';
        let categoryName = 'Business';
        const catSnap = await db.collection('news_categories').limit(1).get();
        if (!catSnap.empty) {
            categoryId = catSnap.docs[0].id;
            categoryName = catSnap.docs[0].data().name;
        }

        const mockArticle = {
            title: {
                en: "Local Kondhwa Business Sees Massive Growth in Q1 2026",
                hi: "स्थानीय कोंढवा व्यवसाय में भारी वृद्धि",
                mr: "स्थानिक कोंढवा व्यवसायात मोठी वाढ"
            },
            content: {
                en: "<p>A prominent local business in Kondhwa has reported spectacular growth during the first quarter of 2026...</p>",
                hi: "<p>कोंढवा में एक प्रमुख स्थानीय व्यवसाय ने शानदार वृद्धि दर्ज की है...</p>",
                mr: "<p>कोंढवा येथील एका प्रमुख स्थानिक व्यवसायाने शानदार वाढ नोंदवली आहे...</p>"
            },
            categoryId: categoryId,
            category: categoryName,
            city: "Pune",
            genre: "business",
            mainImage: "https://picsum.photos/seed/kondhwa/1200/800",
            galleryImages: [],
            views: 150,
            active: true,
            featured: true,  // Important: make it featured so it appears at the top
            approvalStatus: 'approved',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString()
        };

        const docRef = await db.collection('news_articles').add(mockArticle);

        return NextResponse.json({ success: true, id: docRef.id, message: 'Mock Kondhwa article injected successfully' });

    } catch (error) {
        console.error('Seed Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
