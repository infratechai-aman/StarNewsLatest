// Talks only to the Auth EMULATOR (127.0.0.1:9099). Throws if pointed anywhere else.
export const AUTH_EMU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
export const USERS = {
  admin: { email: 'qa-admin@qa.test', password: 'QaAdmin#2026!' },
  reporter: { email: 'qa-reporter@qa.test', password: 'QaReporter#2026!' },
  reader: { email: 'qa-reader@qa.test', password: 'QaReader#2026!' },
}

export async function idToken(request, email, password) {
  const r = await request.post(`${AUTH_EMU}/accounts:signInWithPassword?key=demo-key`, {
    data: { email, password, returnSecureToken: true },
  })
  const j = await r.json()
  if (!j.idToken) throw new Error(`emulator sign-in failed for ${email}: ${JSON.stringify(j.error)}`)
  return j.idToken
}

export const bearer = (t) => ({ Authorization: `Bearer ${t}` })
export const uniq = (p) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`

// Each call looks like a different client, so per-IP rate limits don't bleed between tests.
export const rip = () => ({ 'x-forwarded-for': `10.${(Math.random() * 250) | 0}.${(Math.random() * 250) | 0}.${(Math.random() * 250) | 0}` })
