// Base URL for Firebase Auth REST (Identity Toolkit). Uses the Auth emulator when
// FIREBASE_AUTH_EMULATOR_HOST is set (local QA only); production uses Google.
export function identityToolkitUrl(path) {
  const emu = process.env.FIREBASE_AUTH_EMULATOR_HOST
  const base = emu ? `http://${emu}/identitytoolkit.googleapis.com` : 'https://identitytoolkit.googleapis.com'
  return `${base}/v1/${path}`
}
