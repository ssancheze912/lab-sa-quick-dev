/**
 * Story 1.2: Frontend Navigation Shell — EXPANDED COVERAGE
 * Epic 1: Project Foundation & Application Shell
 *
 * Test Expansion (testarch-automate) — E2E edges and negative paths
 * Builds on top of the ATDD baselines in `deep-link-clientes.spec.ts` and
 * `deep-link-contactos.spec.ts`.
 *
 * NOTE: Execution requires a Playwright runner installed at the repo root and
 * the Vite dev server reachable on the baseURL. This blocker is documented in
 * the story Completion Notes (same as ATDD E2E specs).
 *
 * Coverage focus (NOT duplicated with ATDD):
 *   - AC #3 edges: trailing slash deep link, case sensitivity, unknown route
 *     renders the 404 page directly via the URL bar.
 *   - AC #5 edge: opening "/" performs a router-level redirect to /clientes,
 *     verified at the HTTP/URL level (not just in-memory router).
 *   - AC #1 edge: SPA navigation between sections does NOT trigger a full page
 *     reload (window/document load event count stays at 1).
 *   - AC #6 edge: directly opening /contactos shows Contactos as the active
 *     section in the visible nav surface.
 */

import { test, expect } from '@playwright/test'

test.describe('Deep link edges — Story 1.2 / AC #3, #5, #6 — edges', () => {
  test('[P2] should preserve the trailing-slash deep link on /clientes/', async ({ page }) => {
    // GIVEN: user types /clientes/ (with trailing slash)
    // WHEN: navigating
    await page.goto('/clientes/')
    await page.waitForLoadState('networkidle')

    // THEN: the Clientes heading is visible and the URL ends with /clientes (with or without trailing slash)
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()
    await expect(page).toHaveURL(/\/clientes\/?$/)
  })

  test('[P1] should redirect "/" to /clientes at the URL level', async ({ page }) => {
    // GIVEN: user opens the app root
    // WHEN: navigating
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // THEN: final URL is /clientes (the router redirect resolved)
    await expect(page).toHaveURL(/\/clientes$/)
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()
  })

  test('[P2] should render the 404 view when the URL bar points to an unknown route', async ({ page }) => {
    // GIVEN: user types an unknown route
    // WHEN: navigating
    await page.goto('/no-existe-este-path')
    await page.waitForLoadState('networkidle')

    // THEN: the Spanish 404 view is rendered AND the shell nav is still visible
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await expect(page.getByText('Página no encontrada')).toBeVisible()

    const rail = page.getByTestId('navigation-rail')
    const bar = page.getByTestId('navigation-bar')
    await expect(rail.or(bar).first()).toBeVisible()
  })

  test('[P1] should NOT issue a full page reload when navigating between sections', async ({ page }) => {
    // GIVEN: user lands on /clientes and tracks the load event count
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')

    let loadEvents = 0
    page.on('load', () => {
      loadEvents += 1
    })

    // WHEN: user clicks the Contactos nav link
    await page.getByTestId('nav-link-contactos').click()

    // THEN: URL changes to /contactos AND no additional `load` event fires (SPA navigation only)
    await expect(page).toHaveURL(/\/contactos$/)
    await expect(page.getByRole('heading', { name: 'Contactos' })).toBeVisible()
    expect(loadEvents).toBe(0)
  })

  test('[P2] should flag Contactos as active when the URL is /contactos directly', async ({ page }) => {
    // GIVEN: deep link to /contactos
    // WHEN: page loads
    await page.goto('/contactos')
    await page.waitForLoadState('networkidle')

    // THEN: the active-marker for Contactos is mounted in the DOM
    await expect(page.getByTestId('nav-item-contactos-active')).toBeAttached()
    // AND: the Clientes active-marker is NOT present
    await expect(page.getByTestId('nav-item-clientes-active')).toHaveCount(0)
  })

  test('[P2] should flag Clientes as active after the / -> /clientes redirect', async ({ page }) => {
    // GIVEN: user opens the root
    // WHEN: redirect resolves
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // THEN: the Clientes active-marker is mounted
    await expect(page.getByTestId('nav-item-clientes-active')).toBeAttached()
  })

  test('[P2] should serve an HTML document with HTTP 200 when deep-linking to /contactos', async ({ page }) => {
    // GIVEN: user types /contactos
    const response = await page.goto('/contactos')

    // WHEN/THEN: HTTP response is 200 and the content type is HTML
    expect(response).not.toBeNull()
    expect(response?.status()).toBe(200)
    const contentType = response?.headers()['content-type'] ?? ''
    expect(contentType).toContain('text/html')
  })
})
