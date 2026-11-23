// Backend E2E against the local Firebase EMULATOR (project demo-qa). No mocks, no production.
//   npm run emulators            # terminal 1 (Java 11+)
//   npm run seed:emulator        # once per emulator start
//   . ./qa-emulator.env.sh && npx next build && npx next start -p 3400   # terminal 2
//   npm run test:backend
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e-backend',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-backend.json' }]],
  use: { baseURL: 'http://localhost:3400', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'backend-chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
})
