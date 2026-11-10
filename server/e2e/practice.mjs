import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Run against freshly started fixture API and Vite; see member-b-handoff.md.
const out = fileURLToPath(new URL('../test-results/', import.meta.url))
await mkdir(out, { recursive: true })
console.info('Launching local Edge browser')
const browser = await chromium.launch({ channel: 'msedge', headless: true, timeout: 20000 })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
page.setDefaultTimeout(15000)
try {
  const errors = [],
    privateFields = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', async (response) => {
    if (/\/api\/attempts\/[a-f0-9]{24}$/.test(response.url()) || response.url().endsWith('/play')) {
      const body = await response.json().catch(() => null)
      if (
        body?.test?.sections.some(
          (s) =>
            'transcript' in s ||
            s.groups.some((g) =>
              g.questions.some((q) => 'answers' in q || 'explanation' in q || 'evidence' in q),
            ),
        )
      )
        privateFields.push(response.url())
    }
  })
  await page.goto('http://localhost:5173/login')
  await page.getByRole('button', { name: /demo local/ }).click()
  await page.waitForURL('**/library')
  await page.getByRole('article').filter({ hasText: 'Reading' }).getByRole('button').click()
  await page.locator('.mode-panel button.primary').click()
  await page.waitForURL(/\/attempts\/[a-f0-9]{24}$/)
  const attemptUrl = page.url()
  const firstAnswer = () => page.locator('.answer-field input').first()
  const saved = () =>
    page.getByRole('status').filter({ hasText: '\u0110\u00e3 l\u01b0u' }).waitFor()
  await firstAnswer().fill('ten')
  await saved()
  await page.reload()
  await firstAnswer().waitFor()
  assert.equal(await firstAnswer().inputValue(), 'ten')
  console.info('PASS: browser save and reload restores answer')
  await page.screenshot({ path: `${out}/attempt-desktop.png`, fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.locator('.question').last().scrollIntoViewIfNeeded()
  const timerBox = await page.locator('.timer').boundingBox()
  assert.ok(timerBox.y >= 0 && timerBox.y + timerBox.height < 812)
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  )
  await page.screenshot({ path: `${out}/attempt-mobile.png`, fullPage: true })
  await page.screenshot({ path: `${out}/attempt-mobile-viewport.png` })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('.exam-actions button').click()
  await page.locator('.confirm-panel button.primary').click()
  await page.waitForURL('**/review')
  await page.getByText('1/40 c\u00e2u \u0111\u00fang').waitFor()
  await page.locator('.review-question').first().click()
  assert.ok((await page.locator('mark').count()) > 0)
  await page.goto('http://localhost:5173/history')
  await page.locator('.attempt-card a').first().waitFor()
  await page.goto('http://localhost:5173/')
  await page.getByText(/\u0110\u00e3 n\u1ed9p \d+ b\u00e0i\./).waitFor()
  console.info('PASS: submit -> review evidence -> history -> dashboard')
  await page.goto('http://localhost:5173/vocab')
  await page.locator('.inline-form input').fill('Transport browser test')
  await page.locator('.inline-form button').click()
  await page.waitForURL('**/vocab/*')
  await page.locator('.form-actions button').first().click()
  const fields = page.locator('.word-row input')
  await fields.nth(0).fill('bus')
  await fields.nth(1).fill('xe buyt')
  await fields.nth(2).fill('The red bus.')
  await page.locator('.form-actions button.primary').click()
  await page.getByRole('status').waitFor()
  await page.reload()
  await page.locator('.flashcard-face').click()
  assert.match(await page.locator('.flashcard-face').innerText(), /xe buyt/)
  console.info('PASS: vocabulary create, save, reload, flashcard')
  await page.goto('http://localhost:5173/library')
  await page.getByRole('article').filter({ hasText: 'Listening' }).getByRole('button').click()
  await page.locator('.mode-panel input[type=number]').fill('1')
  await page.locator('.mode-panel button.primary').click()
  await page.waitForURL(/\/attempts\/[a-f0-9]{24}$/)
  const audio = page.locator('audio')
  await audio.evaluate(async (el) => {
    await el.play()
  })
  assert.equal(await audio.evaluate((el) => el.paused), false)
  assert.equal(await audio.evaluate((el) => el.duration), 3)
  await firstAnswer().fill('ten')
  await saved()
  console.info('PASS: local Listening audio playback; waiting real 1-minute deadline')
  await page.waitForURL('**/review', { timeout: 75000 })
  await page.getByText('1/40 c\u00e2u \u0111\u00fang').waitFor()
  assert.ok(
    (await page
      .getByRole('heading', { name: 'B\u1ea3n ch\u00e9p l\u1eddi', exact: true })
      .count()) > 0,
  )
  assert.deepEqual(privateFields, [])
  assert.deepEqual(errors, [])
  console.info(
    `PASS: real timer auto-submit; no answer leakage or page exceptions; first attempt ${attemptUrl}`,
  )
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png`, fullPage: true }).catch(() => {})
  console.error('Browser failure at', page.url())
  throw error
} finally {
  await browser.close()
}
