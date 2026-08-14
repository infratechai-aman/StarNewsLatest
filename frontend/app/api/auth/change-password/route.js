import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAuth, getDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * SECURITY: Verify old password by attempting sign-in via Firebase Auth REST API.
 * This ensures a session hijacker cannot change the password without the current one.
 */
async function verifyOldPassword(email, password) {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
        throw new Error('Firebase API key not configured');
    }

    const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: false,
            }),
        }
    );

    if (!response.ok) {
        return false;
    }

    return true;
}

// POST: Change password for authenticated user
export async function POST(request) {
    const adminAuth = getAuth();
    const db = getDb();

    if (!adminAuth || !db) {
        return NextResponse.json({ error: 'Firebase services not available' }, { status: 503 });
    }

    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { oldPassword, currentPassword, newPassword, confirmPassword } = body;

        // Accept both oldPassword and currentPassword for compatibility
        const existingPassword = oldPassword || currentPassword;

        if (!existingPassword || !newPassword) {
            return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
        }

        if (existingPassword === newPassword) {
            return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
        }

        // SECURITY: Verify the old password before allowing the change
        const isOldPasswordValid = await verifyOldPassword(user.email, existingPassword);
        if (!isOldPasswordValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        // Update password in Firebase Auth using Admin SDK
        await adminAuth.updateUser(user.userId, {
            password: newPassword
        });

        // If user had requirePasswordChange flag, clear it
        const userRef = db.collection('users').doc(user.userId);
        const userDoc = await userRef.get();

        if (userDoc.exists && userDoc.data().requirePasswordChange) {
            await userRef.update({
                requirePasswordChange: false,
                updatedAt: new Date().toISOString()
            });
        }

        // Get fresh user data
        const updatedUserDoc = await userRef.get();
        const userData = updatedUserDoc.exists ? updatedUserDoc.data() : {};

        // Generate a new token for the user
        const customToken = await adminAuth.createCustomToken(user.userId);

        return NextResponse.json({
            message: 'Password changed successfully',
            token: customToken,
            user: {
                ...userData,
                requirePasswordChange: false
            }
        });

    } catch (error) {
        console.error('Password Change Error:', error.code || error.message);

        if (error.code === 'auth/weak-password') {
            return NextResponse.json({ error: 'Password is too weak. Please choose a stronger password.' }, { status: 400 });
        }

        // SECURITY: Don't leak internal error details to the client
        return NextResponse.json({ error: 'Failed to change password. Please try again.' }, { status: 500 });
    }
}
