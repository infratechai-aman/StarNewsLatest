import { getAuth, getDb } from './firebaseAdmin'
import { ROLES } from './roles'

// fix(P3-FE-02): ROLES moved to lib/roles.js (shared, client-safe).
// Re-exported here so all existing server-side imports keep working unchanged.
export { ROLES }

// fix(DEFECT-10): Cache user document lookups to avoid redundant Firestore reads.
// Every admin API call does requireSuperAdmin() which reads the user doc.
// Cache for 5 minutes — admin role doesn't change mid-session.
const userDocCache = new Map()
const USER_DOC_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedUserDoc(db, uid, email = null) {
  const cached = userDocCache.get(uid)
  if (cached && (Date.now() - cached.ts < USER_DOC_CACHE_TTL)) {
    return cached.data
  }
  const userDoc = await db.collection('users').doc(uid).get()
  if (userDoc.exists) {
    const data = userDoc.data()
    // Evict old entries if cache grows
    if (userDocCache.size > 100) {
      const oldest = userDocCache.keys().next().value
      userDocCache.delete(oldest)
    }
    userDocCache.set(uid, { data, ts: Date.now() })
    return data
  }
  // Fallback: lookup by email if user document key differs from UID
  if (email) {
    const emailSnap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).get();
    if (!emailSnap.empty) {
      const data = emailSnap.docs[0].data();
      userDocCache.set(uid, { data, ts: Date.now() });
      return data;
    }
  }
  return null
}

// Get current user from request headers (token-based only, no cookie fallback)
export async function getCurrentUser(request) {
  const auth = getAuth();
  const db = getDb();

  if (!auth || !db) {
    console.error('Firebase services not available in getCurrentUser');
    return null;
  }

  try {
    // Get token from Authorization header only (no cookie fallback — prevents CSRF)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    // Verify Firebase Token
    const decodedToken = await auth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Fetch user details from Firestore to get Role
    const userDoc = await db.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      // If user authenticated but no doc, return basic info
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

/**
 * MIDDLEWARE: Verify that the request is from a super_admin.
 * Consolidates the token extraction + verification + admin check
 * that was previously duplicated across 20+ API route files.
 *
 * @param {Request} request - The incoming request
 * @returns {{ user: object } | { error: string, status: number }}
 *
 * Usage in route handlers:
 *   const authResult = await requireSuperAdmin(request);
 *   if (authResult.error) {
 *     return NextResponse.json({ error: authResult.error }, { status: authResult.status });
 *   }
 *   const user = authResult.user;
 */
export async function requireSuperAdmin(request) {
  const auth = getAuth();
  const db = getDb();

  if (!auth || !db) {
    return { error: 'Firebase services not available', status: 503 };
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { error: 'Authentication required', status: 401 };
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // fix(DEFECT-10): Use cached user doc lookup with email fallback
    const userData = await getCachedUserDoc(db, uid, decodedToken.email);

    if (!userData) {
      return { error: 'User not found', status: 403 };
    }

    const roleLower = String(userData.role || '').toLowerCase().trim();
    const emailLower = String(decodedToken.email || '').toLowerCase().trim();
    const isAdmin = 
      roleLower === ROLES.SUPER_ADMIN || 
      roleLower === 'admin' || 
      roleLower === 'superadmin' ||
      emailLower === 'riyaz@starnews.com' ||
      emailLower === 'admin@starnews.local' ||
      emailLower === 'talukdaraman24@gmail.com' ||
      emailLower === 'arthomepune@gmail.com';

    if (!isAdmin) {
      return { error: 'Forbidden: Admin access required', status: 403 };
    }

    return {
      user: {
        userId: uid,
        email: decodedToken.email,
        role: userData.role || (isAdmin ? ROLES.SUPER_ADMIN : 'registered'),
        ...userData
      }
    };
  } catch (error) {
    console.error('Admin auth error:', error.code || error.message);
    return { error: `Auth Error: ${error.message}`, status: 401 };
  }
}

/**
 * MIDDLEWARE: Verify that the request is from a reporter or super_admin.
 */
export async function requireReporterOrAdmin(request) {
  const auth = getAuth();
  const db = getDb();

  if (!auth || !db) {
    return { error: 'Firebase services not available', status: 503 };
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { error: 'Authentication required', status: 401 };
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // fix(DEFECT-10): Use cached user doc lookup with email fallback
    const userData = await getCachedUserDoc(db, uid, decodedToken.email);

    if (!userData) {
      return { error: 'User not found', status: 403 };
    }

    const roleLower = String(userData.role || '').toLowerCase().trim();
    const emailLower = String(decodedToken.email || '').toLowerCase().trim();
    const isAuthorized = 
      roleLower === ROLES.SUPER_ADMIN || 
      roleLower === ROLES.REPORTER || 
      roleLower === 'admin' || 
      roleLower === 'superadmin' ||
      emailLower === 'riyaz@starnews.com' ||
      emailLower === 'admin@starnews.local' ||
      emailLower === 'talukdaraman24@gmail.com' ||
      emailLower === 'arthomepune@gmail.com';

    if (!isAuthorized) {
      return { error: 'Forbidden: Reporter or Admin access required', status: 403 };
    }

    return {
      user: {
        userId: uid,
        email: decodedToken.email,
        role: userData.role || (isAuthorized ? ROLES.SUPER_ADMIN : 'registered'),
        ...userData
      }
    };
  } catch (error) {
    console.error('Auth error:', error.code || error.message);
    return { error: `Auth Error: ${error.message}`, status: 401 };
  }
}
