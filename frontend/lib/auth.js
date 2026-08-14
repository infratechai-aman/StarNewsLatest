import { getAuth, getDb } from './firebaseAdmin'

// User roles
export const ROLES = {
  PUBLIC: 'public',
  REGISTERED: 'registered',
  ADVERTISER: 'advertiser',
  REPORTER: 'reporter',
  SUPER_ADMIN: 'super_admin'
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

    // Check Firestore for role
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return { error: 'User not found', status: 403 };
    }

    const userData = userDoc.data();

    if (userData.role !== ROLES.SUPER_ADMIN) {
      return { error: 'Forbidden: Admin access required', status: 403 };
    }

    return {
      user: {
        userId: uid,
        email: decodedToken.email,
        role: userData.role,
        ...userData
      }
    };
  } catch (error) {
    console.error('Admin auth error:', error.code || error.message);
    return { error: 'Invalid or expired token', status: 401 };
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

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return { error: 'User not found', status: 403 };
    }

    const userData = userDoc.data();

    if (userData.role !== ROLES.SUPER_ADMIN && userData.role !== ROLES.REPORTER) {
      return { error: 'Forbidden: Reporter or Admin access required', status: 403 };
    }

    return {
      user: {
        userId: uid,
        email: decodedToken.email,
        role: userData.role,
        ...userData
      }
    };
  } catch (error) {
    console.error('Auth error:', error.code || error.message);
    return { error: 'Invalid or expired token', status: 401 };
  }
}
