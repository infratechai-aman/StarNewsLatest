import { getAuth, getDb } from './firebaseAdmin'
import { cookies } from 'next/headers'

// Single Admin Enforcement - HARDCODED (Can be moved to Firestore later)
export const ADMIN_USERNAME = 'riyaz@starnews.com'

// User roles
export const ROLES = {
  PUBLIC: 'public',
  REGISTERED: 'registered',
  ADVERTISER: 'advertiser',
  REPORTER: 'reporter',
  SUPER_ADMIN: 'super_admin'
}

// Get current user from request headers or cookies
export async function getCurrentUser(request) {
  const auth = getAuth();
  const db = getDb();

  if (!auth || !db) {
    console.error('Firebase services not available in getCurrentUser');
    return null;
  }

  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization')
    let token = authHeader?.replace('Bearer ', '')

    // If no header, try cookies (optional fallback)
    if (!token) {
      try {
        const cookieStore = cookies()
        token = cookieStore.get('token')?.value
      } catch (cookieError) {
        // console.log('Cookie access not available')
      }
    }

    if (!token) {
      return null
    }

    // Verify Firebase Token
    const decodedToken = await auth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Fetch user details from Firestore to get Role
    const userDoc = await db.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      // If user authenticated but no doc, return basic info (or handle as error)
      return {
        userId: uid,
        email: decodedToken.email,
        role: ROLES.REGISTERED // Default role
      }
    }

    const userData = userDoc.data()
    return {
      userId: uid,
      email: decodedToken.email,
      role: userData.role || ROLES.REGISTERED,
      ...userData
    }

  } catch (error) {
    console.error('Auth Error:', error.code, error.message)
    return null
  }
}

// Check if user has required role
export function hasRole(user, allowedRoles) {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

// Check if user is Super Admin
export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN
}

// Check if user is Reporter or Super Admin
export function canManageNews(user) {
  return hasRole(user, [ROLES.REPORTER, ROLES.SUPER_ADMIN])
}

// Check if user is Advertiser or Super Admin
export function canManageAds(user) {
  return hasRole(user, [ROLES.ADVERTISER, ROLES.SUPER_ADMIN])
}
