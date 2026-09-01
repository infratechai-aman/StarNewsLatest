import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebaseAdmin'
import { getCurrentUser, hasRole, ROLES } from '@/lib/auth'
import { translateText } from '@/lib/translation'
import { getCache, setCache, purgeCache } from '@/lib/cache'

export async function GET(request) {
    const db = getDb();
    if (!db) {
        console.error('Database not initialized');
        return NextResponse.json({ articles: [], total: 0 });
    }
    try {
        const { searchParams } = new URL(request.url)
        const categoryParam = searchParams.get('category')
        const featured = searchParams.get('featured')
        const limitParam = searchParams.get('limit')
        const pageParam = searchParams.get('page')

        // Generate a cache key directly from all search params
        const cacheKey = `news_${categoryParam || 'all'}_${featured || 'false'}_${limitParam || '50'}_${pageParam || '1'}`

        const cached = getCache(cacheKey);
        if (cached) {
            // Return cached data (saves Firebase reads!)
            const response = NextResponse.json(cached);
            response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
            return response;
        }

        const limit = parseInt(limitParam || '50')
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

        // fix(P1-DB-01): query.count() is a Firestore billing-tier API — fails on Spark (free) plan.
        // Strategy: Fetch all matching doc IDs (lightweight — no field data), count them in memory.
        // This works on ALL Firestore plans and avoids the billing-tier restriction.
        let total = 0;
        try {
            const countSnap = await query.select().get(); // select() fetches IDs only, not full documents
            total = countSnap.size;
        } catch (countErr) {
            // If even select() fails (e.g., no index), fall back to 0 — pagination won't be accurate
            // but the page will still load instead of returning 500
            console.warn('Count query failed, pagination total will be inaccurate:', countErr.message);
            total = 0;
        }

        // Apply Sorting & Pagination
        // TRY-CATCH for Fallback if Index is missing
        let snapshot;
        try {
            // Primary Strategy: Database Sort (Requires Index)
            let sortedQuery = query.orderBy('publishedAt', 'desc')
                .limit(limit)
                .offset((page - 1) * limit);

            snapshot = await sortedQuery.get();

        } catch (err) {
            // Fallback Strategy: In-Memory Sort (No Index Required)
            // ONLY if the error relates to a missing index
            if (err.message.includes('index') || err.message.includes('FAILED_PRECONDITION')) {
                console.warn('⚠️ FIRESTORE INDEX MISSING: Falling back to in-memory sorting. Please create the index for better performance.');

                snapshot = await query.limit(limit).get();

                let tempDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                tempDocs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

                const responseData = {
                    articles: tempDocs,
                    total: total || tempDocs.length,
                    page,
                    limit
                };
                setCache(cacheKey, responseData, 5 * 60 * 1000);
                return NextResponse.json(responseData);

            } else {
                throw err;
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

        setCache(cacheKey, responseData, 5 * 60 * 1000);

        const response = NextResponse.json(responseData)

        // Add Cache-Control headers for Edge Caching
        // s-maxage=60: Cache on Vercel Edge Network for 60 seconds
        // stale-while-revalidate=30: Serve stale content for up to 30s while revalidating
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')

        return response

    } catch (error) {
        console.error('News GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
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

        // Content size limits
        const titleStr = typeof title === 'string' ? title : JSON.stringify(title)
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
        if (titleStr.length > 500) {
            return NextResponse.json({ error: 'Title must be under 500 characters' }, { status: 400 })
        }
        if (contentStr.length > 500000) {
            return NextResponse.json({ error: 'Content too large (max 500KB)' }, { status: 400 })
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
        purgeCache('news_');

        return NextResponse.json({
            id: docRef.id,
            ...newArticle
        })

    } catch (error) {
        console.error('News POST Error:', error)
        return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
    }
}
