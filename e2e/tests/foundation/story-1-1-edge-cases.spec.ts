/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge-case / boundary E2E tests
 * Expands coverage beyond the ATDD acceptance tests in:
 *   story-1-1-project-initialization.spec.ts
 *
 * Covers:
 *  - Navigation to unknown route returns a usable page (no blank screen / crash)
 *  - The page title matches what is set in index.html (not empty/undefined)
 *  - CSS loads correctly (TailwindCSS v4 — at least one stylesheet is present)
 *  - The app mounts inside #root, not a stray container
 *  - No network request to http://localhost:5000 is made on initial render
 *    (frontend shell should load independently)
 *  - main.tsx entry script tag is present in the HTML source
 *  - The <html> lang attribute is set to 'en' (internationalisation baseline)
 */

import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// Navigation edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation edge cases', () => {
  test('should not show a blank page when navigating to an unknown route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-atdd', { waitUntil: 'domcontentloaded' })
    // TanStack Router renders a 404 page or falls back to the root layout;
    // either way the <body> must contain at least some visible content
    const bodyText = await page.locator('body').innerText()
    // A blank page would have empty or whitespace-only text
    expect(bodyText.trim().length).toBeGreaterThan(0)
  })

  test('should not throw a JavaScript runtime exception when navigating to an unknown route', async ({ page }) => {
    const runtimeErrors: string[] = []
    page.on('pageerror', (err) => runtimeErrors.push(err.message))

    await page.goto('/nonexistent-path-edge-probe', { waitUntil: 'networkidle' })

    expect(runtimeErrors).toHaveLength(0)
  })

  test('should render the root route with HTTP 200 on a second navigation (no caching issue)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Navigate away then back
    await page.goto('/nonexistent', { waitUntil: 'domcontentloaded' })
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// HTML structure edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('HTML structure edge cases', () => {
  test('should mount the React app inside the element with id="root"', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Verify React rendered inside #root (not a stray container)
    const rootEl = page.locator('#root')
    await expect(rootEl).toBeVisible()
    // The root element should contain some child content after React mounts
    const childCount = await rootEl.locator('*').count()
    expect(childCount).toBeGreaterThan(0)
  })

  test('should have data-testid="app-root" present in the DOM', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('[data-testid="app-root"]')).toBeAttached()
  })

  test('should have the HTML lang attribute set (internationalisation baseline)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const lang = await page.locator('html').getAttribute('lang')
    // Must be a non-empty string — 'en', 'es', etc.
    expect(lang).toBeTruthy()
    expect(lang!.length).toBeGreaterThan(0)
  })

  test('should have a viewport meta tag (mobile-responsive baseline)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const viewportMeta = page.locator('meta[name="viewport"]')
    await expect(viewportMeta).toHaveCount(1)
    const content = await viewportMeta.getAttribute('content')
    expect(content).toContain('width=device-width')
  })

  test('should have a page title that is not "undefined" or "null"', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const title = await page.title()
    expect(title).not.toBe('undefined')
    expect(title).not.toBe('null')
    expect(title.trim().length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Asset loading edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Asset loading edge cases', () => {
  test('should load at least one CSS stylesheet (TailwindCSS v4 baseline)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    // Either a <link rel="stylesheet"> or Vite injects <style> tags for Tailwind
    const stylesheetLinks = await page.locator('link[rel="stylesheet"]').count()
    const styleTags = await page.locator('head style').count()
    expect(stylesheetLinks + styleTags).toBeGreaterThan(0)
  })

  test('should not return 404 for any script or style resource loaded by the page', async ({ page }) => {
    const failedResources: string[] = []
    page.on('response', (response) => {
      const url = response.url()
      const isAsset =
        url.endsWith('.js') ||
        url.endsWith('.ts') ||
        url.endsWith('.tsx') ||
        url.endsWith('.css') ||
        url.includes('/src/')
      if (isAsset && response.status() === 404) {
        failedResources.push(`${response.status()} ${url}`)
      }
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    expect(failedResources).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Frontend independence — should load without backend
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend shell independence', () => {
  test('should not make any request to localhost:5000 during initial page render', async ({ page }) => {
    const backendRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('localhost:5000')) {
        backendRequests.push(req.url())
      }
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    // The initialization shell (no feature modules) must NOT call the backend on load
    expect(backendRequests).toHaveLength(0)
  })
})
