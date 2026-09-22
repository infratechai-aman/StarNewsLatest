import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic'

export async function GET(request) {
    const db = getDb();
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!db) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
        }

        // Fetch latest data from Firestore
        let userDoc = await db.collection('users').doc(user.userId).get();

        if (!userDoc.exists && user.email) {
            // Check if document was created with an alternate ID or email
            const emailSnap = await db.collection('users')
                .where('email', '==', user.email.toLowerCase().trim())
                .get();

            if (!emailSnap.empty) {
                userDoc = emailSnap.docs[0];
                // Sync to user.userId for future direct lookups
                await db.collection('users').doc(user.userId).set({
                    ...userDoc.data(),
                    id: user.userId,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
        }

        const d = userDoc.exists ? userDoc.data() : {
            id: user.userId,
            email: user.email || '',
            name: user.name || '',
            role: user.role || 'registered',
            status: 'active'
        };

        // Normalize role: treat admin aliases and admin emails as 'super_admin'
        // This must match the same logic used in requireSuperAdmin() in lib/auth.js
        const ADMIN_EMAILS = [
            'riyaz@starnews.com',
            'admin@starnews.local',
            'talukdaraman24@gmail.com',
            'arthomepune@gmail.com'
        ];
        const rawRole = String(d.role || '').toLowerCase().trim();
        const emailLower = String(d.email || user.email || '').toLowerCase().trim();
        let normalizedRole = d.role || 'registered';
        if (
            rawRole === 'super_admin' ||
            rawRole === 'admin' ||
            rawRole === 'superadmin' ||
            ADMIN_EMAILS.includes(emailLower)
        ) {
            normalizedRole = 'super_admin';
        }

        return NextResponse.json({
            id: d.id || user.userId,
            email: d.email || '',
            name: d.name || '',
            role: normalizedRole,
            status: d.status || 'active',
            phone: d.phone || '',
            address: d.address || '',
            profileImage: d.profileImage || '',
            requirePasswordChange: d.requirePasswordChange || false,
            createdAt: d.createdAt || '',
            updatedAt: d.updatedAt || ''
        })
    } catch (error) {
        console.error('Auth/Me Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
