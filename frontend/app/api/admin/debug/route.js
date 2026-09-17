import { getAuth, getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Diagnostic endpoint to check Firebase Admin status
export async function GET(request) {
    const result = {
        timestamp: new Date().toISOString(),
        firebaseAdmin: { auth: false, db: false },
        envVars: {
            hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
            privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) || 'MISSING',
        },
        tokenTest: null
    };

    // Check Firebase services
    const auth = getAuth();
    const db = getDb();
    result.firebaseAdmin.auth = !!auth;
    result.firebaseAdmin.db = !!db;

    // Try to verify the token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token && auth) {
        try {
            const decoded = await auth.verifyIdToken(token);
            result.tokenTest = {
                success: true,
                uid: decoded.uid,
                email: decoded.email,
                exp: new Date(decoded.exp * 1000).toISOString()
            };
        } catch (error) {
            result.tokenTest = {
                success: false,
                errorCode: error.code,
                errorMessage: error.message
            };
        }
    } else {
        result.tokenTest = { success: false, reason: token ? 'No auth service' : 'No token sent' };
    }

    return NextResponse.json(result);
}
