import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin'
import { getCurrentUser, hasRole, ROLES } from '@/lib/auth'
import { translateText } from '@/lib/translation'

// Simple in-memory cache for default news feed
let newsCache = {
    data: null,
    lastFetch: 0
};
const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET(request) {
    const db = getDb();
    if (!db) {
        console.error('Database not initialized');
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        const { searchParams } = new URL(request.url)
        const categoryParam = searchParams.get('category')
        const featured = searchParams.get('featured')
        const limitParam = searchParams.get('limit')
        const pageParam = searchParams.get('page')

        // Check if this is a default query (candidate for caching)
        // Default: no category, no featured, limit 20 (or null), page 1 (or null)
        const isDefaultQuery = !categoryParam && !featured && (!limitParam || limitParam === '20') && (!pageParam || pageParam === '1');

        if (isDefaultQuery && newsCache.data && (Date.now() - newsCache.lastFetch < CACHE_TTL)) {
            // Return cached data
            const response = NextResponse.json(newsCache.data);
            response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
            return response;
        }

        const limit = parseInt(limitParam || '20')
        const page = parseInt(pageParam || '1')

        let query = db.collection('news_articles')
            .where('approvalStatus', '==', 'approved')
            .where('active', '==', true)

        let targetCategoryId = null;

        if (categoryParam) {
            // Check if it's a UUID
            const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(categoryParam);

            if (isUUID) {
                targetCategoryId = categoryParam;
            } else {
                // Resolve Slug/Name to ID
                // Try Slug first
                let catSnap = await db.collection('news_categories')
                    .where('slug', '==', categoryParam).limit(1).get();

                if (catSnap.empty) {
                    // Try Name
                    catSnap = await db.collection('news_categories')
                        .where('name', '==', categoryParam).limit(1).get();
                }

                if (!catSnap.empty) {
                    targetCategoryId = catSnap.docs[0].id;
                } else {
                    // Category not found
                    return NextResponse.json({
                        articles: [],
                        total: 0,
                        page,
                        limit
                    });
                }
            }

            if (targetCategoryId) {
                query = query.where('categoryId', '==', targetCategoryId);
            }
        }

        if (featured === 'true') {
            query = query.where('featured', '==', true)
        }

        // Get Total Count (for pagination)
        const countQuery = query.count();
        const countSnapshot = await countQuery.get();
        const total = countSnapshot.data().count;

        // Apply Sorting & Pagination
        // Apply Sorting & Pagination
        // TRY-CATCH for Fallback if Index is missing
        let snapshot;
        try {
            // Primary Strategy: Database Sort (Requires Index)
            // We clone the query to avoid mutating the fallback base
            let sortedQuery = query.orderBy('publishedAt', 'desc')
                .limit(limit)
                .offset((page - 1) * limit);

            snapshot = await sortedQuery.get();

        } catch (err) {
            // Fallback Strategy: In-Memory Sort (No Index Required)
            // ONLY if the error relates to a missing index
            if (err.message.includes('index') || err.message.includes('FAILED_PRECONDITION')) {
                console.warn('⚠️ FIRESTORE INDED MISSING: Falling back to in-memory sorting. Please create the index for better performance.');

                // Fetch WITHOUT orderBy
                // Note: We might get more docs than needed if we want to sort accurately, 
                // but for now we just fetch the limit to render *something*.
                // Ideally we'd fetch all (up to a reasonable max) to sort, but that's expensive.
                // Compromise: Fetch limit * 2 to get recent-ish items if they naturally come back in insertion order (often true).

                snapshot = await query.limit(limit).get(); // Raw query without sort

                // Convert to array and sort in memory
                let tempDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                tempDocs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

                // Return explicitly to match structure
                const articles = tempDocs; // Already mapped

                const responseData = {
                    articles,
                    total: total || articles.length, // Fallback total
                    page,
                    limit
                };
                if (isDefaultQuery) {
                    newsCache = { data: responseData, lastFetch: Date.now() };
                }
                return NextResponse.json(responseData);

            } else {
                throw err; // Re-throw other errors
            }
        }

        const articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        const responseData = {
            articles,
            total,
            page,
            limit
        };

        if (isDefaultQuery) {
            newsCache = {
                data: responseData,
                lastFetch: Date.now()
            };
        }

        const response = NextResponse.json(responseData)

        // Add Cache-Control headers for Edge Caching
        // s-maxage=60: Cache on Vercel Edge Network for 60 seconds
        // stale-while-revalidate=30: Serve stale content for up to 30s while revalidating
        if (isDefaultQuery) {
            response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30')
        }

        return response

    } catch (error) {
        console.error('News GET Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    const db = getDb();
    if (!db) {
        console.error('Database not initialized');
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    try {
        const user = await getCurrentUser(request)
        if (!hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { title, content, categoryId, city, mainImage, galleryImages, videoUrl, youtubeUrl, tags, metaDescription, status, genre } = body

        if (!title || !content || !categoryId) {
            return NextResponse.json({ error: 'Title, content and category required' }, { status: 400 })
        }

        const approvalStatus = status === 'submit' ? 'pending' : 'draft'

        // Auto-translate Title and Content
        const translatedTitle = await translateText(title);
        const translatedContent = await translateText(content);

        // Fetch Category Name for denormalization
        const catDoc = await db.collection('news_categories').doc(categoryId).get()
        const categoryName = catDoc.exists ? catDoc.data().name : ''

        const newArticle = {
            title: translatedTitle,
            content: translatedContent,
            categoryId,
            category: categoryName, // Denormalized
            city: city || '',
            genre: genre || 'breaking',
            mainImage,
            galleryImages: galleryImages || [],
            videoUrl,
            youtubeUrl,
            tags: tags || [],
            metaDescription,
            authorId: user.userId,
            authorName: user.name || user.email, // Denormalized
            approvalStatus,
            active: true,
            featured: false,
            views: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: approvalStatus === 'approved' ? new Date().toISOString() : null
        }

        const docRef = await db.collection('news_articles').add(newArticle)

        // Invalidate cache
        newsCache = { data: null, lastFetch: 0 };

        return NextResponse.json({
            id: docRef.id,
            ...newArticle
        })

    } catch (error) {
        console.error('News POST Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
