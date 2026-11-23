import { test, expect, noHorizontalOverflow } from './fixtures.mjs'

const VIEWS = ['home', 'news', 'city', 'businesses', 'classifieds', 'live-tv', 'enewspaper', 'about', 'terms', 'privacy', 'login']

test.describe('every public view renders without crashing', () => {
  for (const view of VIEWS) {
    test(`view: ${view}`, async ({ page }) => {
      await page.goto(`/?view=${view}`)
      await expect(page.locator('main')).toBeVisible()
      await page.waitForTimeout(1200)
      await expect(page.getByText('This section failed to load')).toHaveCount(0)
      expect(page.pageErrors, page.pageErrors.join('\n')).toEqual([])
      await noHorizontalOverflow(page)
    })
  }
})

test('article deep link renders formatted content (no raw markdown)', async ({ page }) => {
  await page.goto('/?article=a1')
  await expect(page.locator('main h1')).toContainText('Kalepadal police')
  const body = page.locator('.article-prose-content').first()
  await expect(body.locator('h2, h3').first()).toHaveText('Police under scrutiny')
  await expect(body.locator('strong').first()).toHaveText('who gives the orders')
  const text = await page.locator('main').innerText()
  expect(text).not.toMatch(/###|\*\*|text-align/)
  expect(page.pageErrors).toEqual([])
})

test('deleted / unknown article link falls back to home instead of a blank page', async ({ page }) => {
  await page.goto('/?article=does-not-exist')
  // Fallback = 404 from the API, then home renders; allow for slow engines under parallel load
  await expect.poll(async () => (await page.locator('main').innerText()).trim().length, { timeout: 10_000 }).toBeGreaterThan(50)
  expect(page.pageErrors).toEqual([])
})

test('BUG-001 regression: business with 3 photos opens and gallery navigates', async ({ page }) => {
  await page.goto('/?view=businesses')
  await page.getByText('QA Multi Photo Cafe').first().click()
  await expect(page.locator('main h1')).toHaveText('QA Multi Photo Cafe')
  await expect(page.getByText('1 / 3')).toBeVisible()
  const next = page.locator('main button:has(svg.lucide-chevron-right)').first()
  await next.click({ force: true })
  await expect(page.getByText('2 / 3')).toBeVisible()
  expect(page.pageErrors).toEqual([])
})

test('business directory: locality chip filters results', async ({ page }) => {
  await page.goto('/?view=businesses')
  await expect(page.getByText(/Showing\s*3\s*businesses/)).toBeVisible()
  await page.getByRole('button', { name: /Maharashtra/ }).first().click()
  await expect(page.getByText(/Showing\s*1\s*businesses/)).toBeVisible()
  await expect(page.getByText('QA Vineyard')).toBeVisible()
})

test('classifieds: search and category tabs filter', async ({ page }) => {
  await page.goto('/?view=classifieds')
  await expect(page.getByText(/Showing\s*2\s*ads/)).toBeVisible()
  await page.getByPlaceholder(/Search for products/).fill('sofa')
  await expect(page.getByText(/Showing\s*1\s*ads/)).toBeVisible()
  await page.getByPlaceholder(/Search for products/).fill('')
  await page.getByRole('button', { name: 'Vehicles' }).first().click()
  await expect(page.getByText('Honda Activa 2019')).toBeVisible()
  await expect(page.getByText('Old sofa for sale')).toHaveCount(0)
})

test('Post Your Ad: business tab offers More Images; classified validation blocks empty submit', async ({ page }) => {
  await page.goto('/')
  const dialog = page.getByRole('dialog')
  // The listener is attached after hydration (slower on WebKit/Firefox): re-send until it opens
  await expect.poll(async () => {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('openPostAdModal', { detail: { tab: 'business' } })))
    return dialog.getByText('More Images').isVisible()
  }, { timeout: 20_000 }).toBe(true)
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('openPostAdModal', { detail: { tab: 'classified' } })))
  const alerts = []
  page.on('dialog', d => { alerts.push(d.message()); d.dismiss() })
  await dialog.getByRole('button', { name: 'Submit Ad' }).click()
  await page.waitForTimeout(500)
  // native "required" validation or our alert must stop the submit; no POST is sent
  const posted = await page.evaluate(() => performance.getEntriesByType('resource').some(e => e.name.includes('/api/classifieds/submit')))
  expect(posted).toBe(false)
})

test('Live TV autoplays muted with an unmute control; dead channel is a branded tile', async ({ page }) => {
  await page.goto('/?view=live-tv')
  const src = await page.locator('main iframe').first().getAttribute('src')
  expect(src).toContain('autoplay=1')
  expect(src).toContain('mute=1')
  await expect(page.getByRole('button', { name: /unmute/i })).toBeVisible()
  await expect(page.getByText('Dead Channel').first()).toBeVisible()
})

test('language switch to Hindi changes navigation labels', async ({ page, isMobile }) => {
  test.skip(isMobile, 'language menu is in the desktop header')
  await page.goto('/')
  await page.evaluate(() => { localStorage.setItem('starNewsLanguage', 'hi') })
  await page.reload()
  await expect(page.locator('header').getByText('होम').first()).toBeVisible()
})

test('search modal opens with Ctrl/Cmd+K and closes with Escape', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcut is desktop-only')
  await page.goto('/')
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('BUG-024 regression: newest article is listed on the News page on every screen size', async ({ page }) => {
  await page.goto('/?view=news')
  await expect(page.locator('main').getByText('Kalepadal police: serious questions raised').filter({ visible: true }).first()).toBeVisible()
})
