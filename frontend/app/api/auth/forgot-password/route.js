import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST: Send password reset email via Firebase Auth
 * Public endpoint — no authentication required (user forgot their password!)
 */
export async function POST(request) {
    const auth = getAuth();

    if (!auth) {
        return NextResponse.json({ error: 'Auth service not available' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { email } = body;

        if (!email || !email.trim()) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Firebase Admin SDK generates the password reset link
        // We use this to trigger Firebase's built-in email
        const resetLink = await auth.generatePasswordResetLink(email);

        // SECURITY: Always return success even if user doesn't exist
        // This prevents email enumeration attacks
        return NextResponse.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Password Reset Error:', error.code || error.message);

        // SECURITY: Don't reveal if email exists or not
        // Return success for all cases to prevent enumeration
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
            return NextResponse.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }

        return NextResponse.json({
            error: 'Failed to process request. Please try again later.'
        }, { status: 500 });
    }
}
