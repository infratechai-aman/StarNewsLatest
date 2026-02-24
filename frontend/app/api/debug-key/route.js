import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function GET() {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';

    // Dump first 100 characters in char code
    const codes = [];
    for (let i = 0; i < Math.min(rawKey.length, 100); i++) {
        codes.push(rawKey.charCodeAt(i));
    }

    try {
        const db = getDb();
        if (db) {
            await db.collection('news_articles').limit(1).get();
            return NextResponse.json({ success: true, keyLength: rawKey.length, codes });
        } else {
            return NextResponse.json({ error: 'DB is null', keyLength: rawKey.length, codes }, { status: 500 });
        }
    } catch (e) {
        return NextResponse.json({ error: e.message, keyLength: rawKey.length, codes }, { status: 500 });
    }
}
