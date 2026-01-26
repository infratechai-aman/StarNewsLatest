// Authentication utilities using JWT
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

// JWT Secret from environment (required for production)
const JWT_SECRET_STRING = process.env.JWT_SECRET
if (!JWT_SECRET_STRING) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using fallback secret (NOT SAFE FOR PRODUCTION)')
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING || 'starnews-fallback-secret-key-2025')

// Single Admin Enforcement - HARDCODED
export const ADMIN_USERNAME = 'Riyaz@StarNews'
export const ADMIN_DEFAULT_PASSWORD = 'Macbook@StarNews'

// User roles
export const ROLES = {
  PUBLIC: 'public',
  REGISTERED: 'registered',
  ADVERTISER: 'advertiser',
  REPORTER: 'reporter',
  SUPER_ADMIN: 'super_admin'
}

// Generate JWT token
export async function generateToken(user, requirePasswordChange = false) {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    requirePasswordChange: requirePasswordChange
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)

  return token
}

// Verify JWT token
export async function verifyToken(token) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload
  } catch (error) {
    return null
  }
}

// Get current user from request headers or cookies
export async function getCurrentUser(request) {
  try {
    // Try to get token from Authorization header first (primary method for API calls)
    const authHeader = request.headers.get('authorization')
    let token = authHeader?.replace('Bearer ', '')

    // If no header, try cookies (fallback for server-side rendering)
    if (!token) {
      try {
        const cookieStore = cookies()
        token = cookieStore.get('token')?.value
      } catch (cookieError) {
        // cookies() can throw in Edge Runtime or certain contexts - this is fine
        console.log('Cookie access not available, using header auth only')
      }
    }

    if (!token) {
      console.log('No auth token found in request')
      return null
    }

    const payload = await verifyToken(token)
    if (!payload) {
      console.log('Token verification failed')
      return null
    }

    return payload
  } catch (error) {
    console.error('getCurrentUser error:', error.message)
    return null
  }
}

// Hash password
export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

// Compare password
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
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
