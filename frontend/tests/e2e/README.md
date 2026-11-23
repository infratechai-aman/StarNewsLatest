# Tests

## Unit (no server, no network)

```bash
npm run test:unit      # node:test + coverage for lib/
npm run lint           # eslint 8 + react-hooks (config: eslint.config.audit.json)
```

## E2E (Playwright, isolated from production)

The E2E suite must **never** touch the production Firebase project. It runs against an
isolated build where:

- the Firebase project id is `demo-qa` and all service-account variables are empty,
- `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` point to a dead port (`127.0.0.1:9`),
- the browser bundle gets a dummy `NEXT_PUBLIC_FIREBASE_API_KEY`,
- every browser `/api/*` call is answered from fixtures (`tests/e2e/fixtures.mjs`).

```bash
. ./qa.env.sh && npx next build    # isolated build (do NOT deploy this .next folder)
npx playwright install chromium firefox webkit   # first time only
npm run test:e2e                   # starts `next start -p 3300` with the QA env
```

Projects: desktop Chrome, Firefox, Safari (WebKit), Android phone (Pixel 5), iPhone 13, iPad.

After E2E, run a normal `npx next build` again before any local production-like testing,
because the QA build contains no real data.

### Not covered here
- Anything that needs a real backend (login, approvals, uploads, Firestore rules):
  needs the Firebase Emulator Suite (requires Java 11+) or a staging project.
- Real device hardware (camera upload, iOS low-power autoplay, notch/safe areas).
