// Seeds the LOCAL Firebase emulator (project "demo-qa") with test users and content.
// Refuses to run unless both emulator hosts are set, so it can never touch production.
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 node tests/emulator/seed.mjs
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('Refusing to seed: FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must point at the emulator.')
  process.exit(1)
}

// Test-only credentials for the emulator. Not valid anywhere else.
export const QA_USERS = {
  admin: { email: 'qa-admin@qa.test', password: 'QaAdmin#2026!', role: 'super_admin', name: 'QA Admin' },
  reporter: { email: 'qa-reporter@qa.test', password: 'QaReporter#2026!', role: 'reporter', name: 'QA Reporter' },
  reader: { email: 'qa-reader@qa.test', password: 'QaReader#2026!', role: 'registered', name: 'QA Reader' },
}

const app = initializeApp({ projectId: 'demo-qa' })
const auth = getAuth(app)
const db = getFirestore(app)

async function upsertUser({ email, password, role, name }) {
  let user
  try { user = await auth.getUserByEmail(email); await auth.updateUser(user.uid, { password, emailVerified: true, disabled: false }) } catch { user = await auth.createUser({ email, password, displayName: name, emailVerified: true }) }
  await db.collection('users').doc(user.uid).set({
    id: user.uid, email, name, role, status: 'active', active: true, requirePasswordChange: false,
    createdAt: new Date().toISOString(),
  }, { merge: true })
  return user.uid
}

const now = new Date().toISOString()
const img = (id) => `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=60`

async function main() {
  const ids = {}
  for (const [k, u] of Object.entries(QA_USERS)) ids[k] = await upsertUser(u)

  for (const name of ['City News', 'Crime', 'Politics', 'Business', 'Sports']) {
    await db.collection('news_categories').doc(name.toLowerCase().replace(/\s+/g, '-')).set({ name, active: true })
  }

  await db.collection('news_articles').doc('seed-approved-1').set({
    id: 'seed-approved-1', title: { en: 'Seeded approved article' }, content: { en: '<p>Seed body.</p>' },
    category: 'City News', categoryId: 'City News', city: 'Pune', approvalStatus: 'approved', active: true,
    featured: false, showOnHome: true, authorId: ids.admin, authorName: 'QA Admin', createdAt: now, publishedAt: now, views: 0,
  })

  await db.collection('businesses').doc('seed-biz-multi').set({
    id: 'seed-biz-multi', name: 'Seed Multi Photo Bakery', businessName: 'Seed Multi Photo Bakery', category: 'Cafe',
    area: 'Kondhwa', address: 'NIBM Road, Kondhwa, Pune', description: 'Seeded with three photos.',
    coverImage: img('photo-1554118811-1e0d58224f24'),
    images: [img('photo-1554118811-1e0d58224f24'), img('photo-1517248135467-4c7edcad34c4'), img('photo-1504674900247-0877df9cc836')],
    approvalStatus: 'approved', active: true, createdAt: now,
  })

  for (const [id, date, title] of [['seed-paper-1', '2026-11-20', 'Seed Edition A'], ['seed-paper-2', '2026-11-18', 'Seed Edition B']]) {
    await db.collection('enewspapers').doc(id).set({
      id, title, editionDate: date, publishDate: date, pdfUrl: '/api/file/seed-missing', approvalStatus: 'approved', status: 'approved',
      active: true, createdAt: `${date}T06:00:00.000Z`,
    })
  }

  await db.collection('breaking_ticker').doc('main').set({ enabled: true, text: 'Seed ticker', texts: ['Seed ticker'], updatedAt: now })
  console.log('Seeded emulator:', Object.keys(ids).join(', '))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
