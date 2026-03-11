import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        time: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasNextPublicProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasAdminProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,

        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasNextPublicClientEmail: !!process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,

        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
        privateKeyStartsWithQuote: process.env.FIREBASE_PRIVATE_KEY?.startsWith('"'),
        privateKeyStartsWithBrace: process.env.FIREBASE_PRIVATE_KEY?.startsWith('{'),

        // Let's also parse it to see if it works
        parsed: (() => {
            const rawKey = process.env.FIREBASE_PRIVATE_KEY;
            if (rawKey && rawKey.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(rawKey);
                    return {
                        success: true,
                        hasParsedEmail: !!parsed.client_email,
                        hasParsedKey: !!parsed.private_key,
                        parsedKeyLength: parsed.private_key ? parsed.private_key.length : 0
                    };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
            return { isJson: false };
        })()
    });
}
