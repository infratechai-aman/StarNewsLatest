/**
 * Shared role constants used by both client and server code.
 * fix(P3-FE-02): Extracted from lib/auth.js (server-only) into a shared
 * module so client components can import without pulling in Node.js dependencies.
 */
export const ROLES = {
  PUBLIC: 'public',
  REGISTERED: 'registered',
  ADVERTISER: 'advertiser',
  REPORTER: 'reporter',
  SUPER_ADMIN: 'super_admin'
}
