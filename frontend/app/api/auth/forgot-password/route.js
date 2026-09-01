import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST: Send password reset email via Firebase Auth REST API
 * This triggers Firebase's built-in email sending (unlike generatePasswordResetLink which only creates a URL).
 * Public endpoint — no authentication required (user forgot their password!)
 */
export async function POST(request) {
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

        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!apiKey) {
            console.error('NEXT_PUBLIC_FIREBASE_API_KEY not set');
            return NextResponse.json({ error: 'Service configuration error' }, { status: 503 });
        }

        // Use Firebase Auth REST API — this ACTUALLY sends the email
        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestType: 'PASSWORD_RESET',
                    email: email.trim(),
                }),
            }
        );

        // SECURITY: Always return success even if user doesn't exist
        // This prevents email enumeration attacks
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorCode = errorData?.error?.message || '';
            
            // These errors mean the email doesn't exist — but we don't reveal that
            if (errorCode === 'EMAIL_NOT_FOUND' || errorCode === 'INVALID_EMAIL') {
                return NextResponse.json({
                    success: true,
                    message: 'If an account exists with this email, a password reset link has been sent.'
                });
            }
            
            console.error('Password reset API error:', errorCode);
        }

        return NextResponse.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Password Reset Error:', error.message);
        return NextResponse.json({
            error: 'Failed to process request. Please try again later.'
        }, { status: 500 });
    }
}

