// E2E against an ISOLATED local build: production Firebase is unreachable.
// Build first with:  . ./qa.env.sh && npx next build   (see tests/e2e/README.md)
import { defineConfig, devices } from '@playwright/test'

const QA_ENV = {
  FIREBASE_PROJECT_ID: 'demo-qa', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-qa', FIREBASE_ADMIN_PROJECT_ID: 'demo-qa',
  FIREBASE_PRIVATE_KEY: '', FIREBASE_ADMIN_PRIVATE_KEY: '', FIREBASE_CLIENT_EMAIL: '',
  NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL: '', FIREBASE_ADMIN_CLIENT_EMAIL: '',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:9', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9',
  GOOGLE_APPLICATION_CREDENTIALS: '/nonexistent',
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
  use: {
    baseURL: 'http://localhost:3300',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx next start -p 3300',
    url: 'http://localhost:3300',
    reuseExistingServer: true, // start it yourself with: . ./qa.env.sh && npx next start -p 3300
    timeout: 120_000,
    env: QA_ENV,
  },
  projects: [
    { name: 'chrome-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    // Headless Firefox on Windows can crash its software compositor under parallel load
    { name: 'firefox-desktop', fullyParallel: false, use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 },
      launchOptions: { firefoxUserPrefs: { 'gfx.webrender.software': true, 'layers.acceleration.disabled': true } } } },
    { name: 'safari-desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } },
    { name: 'android-phone', use: { ...devices['Pixel 5'] } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 7)'] } },
  ],
})
