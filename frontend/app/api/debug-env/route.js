import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function GET() {
    const envVars = {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NODE_ENV: process.env.NODE_ENV,
        CWD: process.cwd(),
    };

    const firebaseState = {
        appsLength: admin.apps.length,
        hasApp: admin.apps.length > 0,
    };

    return NextResponse.json({
        envVars,
        firebaseState,
        timestamp: new Date().toISOString()
    });
}
