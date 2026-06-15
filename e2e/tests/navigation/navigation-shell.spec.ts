/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD E2E Tests — RED Phase (Playwright)
 *
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Covers Acceptance Criteria:
 *   AC #4 — Direct URL `/clientes` or `/contactos` renders the correct view without
 *           redirection to a home screen, and the shell remains mounted (FR30).
 *   AC #5 — Unknown route renders a not-found view with Spanish message + link to /clientes;
 *           the navigation shell remains visible.
 *   AC #6 — Root path `/` redirects to `/clientes`.
 *
 * Test Cases mapped:
 *   TC-E1-P1-02 — Deep linking to /clientes
 *   TC-E1-P1-03 — Deep linking to /contactos
 *
 * Notes:
 *   - Network-first: route interception is registered BEFORE page.goto.
 *   - Selectors use data-testid only — never CSS/XPath.
 *   - No hard waits — only explicit `expect` polling and waitFor.
 */

import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// AC #4 — Deep linking: direct URL access to /clientes
// TC-E1-P1-02
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #4 — Deep link to /clientes (TC-E1-P1-02)', () => {
  test('GIVEN user types /clientes directly into the URL bar WHEN the page loads THEN the Clientes view is rendered with shell visible', async ({
    page,
  }) => {
    // GIVEN: Network-first — register response listener BEFORE navigation
    const initialLoad = page.waitForResponse(
      (resp) => resp.url().includes('/clientes') && resp.status() === 200,
    )

    // WHEN: User navigates directly to /clientes
    await page.goto('/clientes')
    await initialLoad

    // THEN: Clientes view heading is rendered
    await expect(page.getByTestId('clientes-heading')).toBeVisible()
  })

  test('GIVEN /clientes is reached via direct URL WHEN inspecting the URL THEN no redirect to home occurred (URL remains /clientes)', async ({
    page,
  }) => {
    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()

    // THEN: The URL was NOT rewritten to / or any other path (FR30)
    expect(new URL(page.url()).pathname).toBe('/clientes')
  })

  test('GIVEN /clientes is reached via direct URL WHEN inspecting the page THEN the persistent shell (rail or bar) is mounted', async ({
    page,
  }) => {
    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()

    // THEN: Either rail (desktop) or bar (mobile) is present — shell must remain mounted
    const rail = page.getByTestId('app-navigation-rail')
    const bar = page.getByTestId('app-navigation-bar')
    const shellVisible = (await rail.count()) > 0 || (await bar.count()) > 0
    expect(shellVisible).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC #4 — Deep linking: direct URL access to /contactos
// TC-E1-P1-03
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #4 — Deep link to /contactos (TC-E1-P1-03)', () => {
  test('GIVEN user types /contactos directly into the URL bar WHEN the page loads THEN the Contactos view is rendered', async ({
    page,
  }) => {
    const initialLoad = page.waitForResponse(
      (resp) => resp.url().includes('/contactos') && resp.status() === 200,
    )

    await page.goto('/contactos')
    await initialLoad

    // THEN: Contactos heading is rendered
    await expect(page.getByTestId('contactos-heading')).toBeVisible()
  })

  test('GIVEN /contactos is reached via direct URL WHEN inspecting the URL THEN no redirect to home occurred', async ({
    page,
  }) => {
    await page.goto('/contactos')
    await expect(page.getByTestId('contactos-heading')).toBeVisible()

    expect(new URL(page.url()).pathname).toBe('/contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC #5 — Unknown route shows not-found view with Spanish message
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #5 — Unknown route shows NotFoundView', () => {
  test('GIVEN user navigates to /ruta-que-no-existe WHEN the page loads THEN the not-found view is displayed', async ({
    page,
  }) => {
    await page.goto('/ruta-que-no-existe')

    // THEN: NotFoundView component is visible
    await expect(page.getByTestId('not-found-view')).toBeVisible()
  })

  test('GIVEN user navigates to an unknown route WHEN the page loads THEN the Spanish "Página no encontrada" heading is shown', async ({
    page,
  }) => {
    await page.goto('/otra-ruta-invalida')

    await expect(
      page.getByRole('heading', { name: /página no encontrada/i }),
    ).toBeVisible()
  })

  test('GIVEN user lands on an unknown route WHEN they inspect the page THEN a link back to /clientes is provided', async ({
    page,
  }) => {
    await page.goto('/ruta-que-no-existe')

    const link = page.getByTestId('not-found-link-clientes')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/clientes')
  })

  test('GIVEN user lands on an unknown route WHEN the not-found view renders THEN the persistent shell (rail or bar) is still mounted', async ({
    page,
  }) => {
    await page.goto('/ruta-que-no-existe')
    await expect(page.getByTestId('not-found-view')).toBeVisible()

    // THEN: At least one of rail/bar must be present
    const rail = page.getByTestId('app-navigation-rail')
    const bar = page.getByTestId('app-navigation-bar')
    const shellVisible = (await rail.count()) > 0 || (await bar.count()) > 0
    expect(shellVisible).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC #6 — Root path redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #6 — Root path / redirects to /clientes', () => {
  test('GIVEN user lands on the root URL / WHEN the page loads THEN the router redirects to /clientes', async ({
    page,
  }) => {
    // GIVEN: Visit the root URL
    await page.goto('/')

    // THEN: The URL resolves to /clientes (redirect happens before render)
    await expect(page).toHaveURL(/\/clientes$/)
    await expect(page.getByTestId('clientes-heading')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC #2 — SPA navigation between routes (no full page reload)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #2 — SPA navigation without full reload', () => {
  test('GIVEN user is on /clientes WHEN they click the Contactos navigation item THEN URL becomes /contactos without a full page reload', async ({
    page,
  }) => {
    // GIVEN: Load /clientes and capture the initial page lifecycle counter
    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()

    // Tag the window so we can detect if a full reload occurred
    await page.evaluate(() => {
      ;(window as unknown as { __atddSpaTag?: string }).__atddSpaTag = 'spa-marker'
    })

    // WHEN: Click on Contactos nav item (rail on desktop, bar on mobile)
    const railItem = page.getByTestId('nav-rail-item-contactos')
    const barItem = page.getByTestId('nav-bar-item-contactos')

    if ((await railItem.count()) > 0 && (await railItem.isVisible())) {
      await railItem.click()
    } else {
      await barItem.click()
    }

    // THEN: URL is /contactos and the SPA marker survived (no full reload)
    await expect(page).toHaveURL(/\/contactos$/)
    const marker = await page.evaluate(
      () => (window as unknown as { __atddSpaTag?: string }).__atddSpaTag,
    )
    expect(marker).toBe('spa-marker')
  })
})
