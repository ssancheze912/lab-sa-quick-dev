/**
 * Story 1.2 — Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD E2E Tests — RED Phase (intentionally failing until implementation lands)
 *
 * Covers test-design IDs:
 *   - TC-E1-P1-02 — Deep link /clientes loads the placeholder view, no redirect, no full reload (AC #3)
 *   - TC-E1-P1-03 — Deep link /contactos loads the placeholder view, no redirect, no full reload (AC #4)
 *
 * Plus complementary E2E acceptance for:
 *   - AC #5 — Unknown route renders NotFoundView with the shell still visible
 *   - AC #6 — "/" redirects to "/clientes" with no full reload
 *
 * Test rules (per project standards):
 *   - data-testid selectors (no fragile CSS).
 *   - Network-first: intercepts/listeners registered BEFORE page.goto.
 *   - No hard waits; only explicit Playwright waits / locator assertions.
 *   - Given-When-Then commentary on every test.
 */

import { test, expect } from '@playwright/test'

test.describe('Story 1.2 — Frontend Navigation Shell (E2E)', () => {
  test('TC-E1-P1-02 — direct URL load of /clientes renders the ClientesPlaceholderView inside the shell (AC #3)', async ({
    page,
  }) => {
    // GIVEN: a clean browser session with no prior navigation history

    // Network-first: register the response listener BEFORE navigating.
    const clientesResponse = page.waitForResponse(
      (resp) => resp.url().endsWith('/clientes') && resp.status() === 200,
    )

    // WHEN: the user types `/clientes` directly in the browser URL bar
    await page.goto('/clientes')

    // THEN: the response is 200, the app-root shell wrapper is visible, and the placeholder view
    // is rendered. No redirect away from /clientes.
    await clientesResponse
    await expect(page).toHaveURL(/\/clientes$/)
    await expect(page.getByTestId('app-root')).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: /^clientes$/i }),
    ).toBeVisible()
  })

  test('TC-E1-P1-03 — direct URL load of /contactos renders the ContactosPlaceholderView inside the shell (AC #4)', async ({
    page,
  }) => {
    // GIVEN: a clean browser session

    // Network-first: register the response listener BEFORE navigating.
    const contactosResponse = page.waitForResponse(
      (resp) => resp.url().endsWith('/contactos') && resp.status() === 200,
    )

    // WHEN: the user types `/contactos` directly in the browser URL bar
    await page.goto('/contactos')

    // THEN: the response is 200, the shell is visible, and the placeholder view is rendered.
    await contactosResponse
    await expect(page).toHaveURL(/\/contactos$/)
    await expect(page.getByTestId('app-root')).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: /^contactos$/i }),
    ).toBeVisible()
  })

  test('SPA navigation from /clientes → /contactos does NOT trigger a full page reload (AC #1, FR28)', async ({
    page,
  }) => {
    // GIVEN: the user is on /clientes
    await page.goto('/clientes')
    await expect(page.getByTestId('app-root')).toBeVisible()

    // Capture a stable client-side marker; if the SPA reloads, this marker disappears.
    const reloadMarker = '__siesa_atdd_no_reload_marker__'
    await page.evaluate((key) => {
      ;(window as unknown as Record<string, unknown>)[key] = true
    }, reloadMarker)

    // Track whether the document was reloaded (network-first observer registered before action).
    let documentReloaded = false
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        // A full reload would re-fetch the HTML document. SPA navigations do not produce a
        // 'document' navigation. We watch for that via response listener instead — but Playwright's
        // page.on('load') firing again is a reliable signal of a hard reload too.
      }
    })
    page.on('load', () => {
      documentReloaded = true
    })

    // WHEN: the user clicks the "Ir a Contactos" navigation item
    await page.getByRole('button', { name: /ir a contactos/i }).click()

    // THEN: the URL switches to /contactos via TanStack Router and the in-memory marker survives
    await expect(page).toHaveURL(/\/contactos$/)
    const markerSurvived = await page.evaluate(
      (key) => (window as unknown as Record<string, unknown>)[key] === true,
      reloadMarker,
    )
    expect(markerSurvived).toBe(true)
    expect(documentReloaded).toBe(false)
    await expect(page.getByTestId('app-root')).toBeVisible()
  })

  test('AC #6 — direct URL load of "/" redirects to "/clientes" via TanStack Router (no full reload)', async ({
    page,
  }) => {
    // GIVEN: a clean browser session

    // WHEN: the user opens the application root
    await page.goto('/')

    // THEN: the router resolves to /clientes (declarative redirect from index.tsx beforeLoad)
    await expect(page).toHaveURL(/\/clientes$/)
    await expect(page.getByTestId('app-root')).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: /^clientes$/i }),
    ).toBeVisible()
  })

  test('AC #5 — unknown route renders the Spanish NotFoundView inside the shell layout', async ({
    page,
  }) => {
    // GIVEN: a clean browser session

    // WHEN: the user navigates to an unknown path
    await page.goto('/ruta-que-no-existe')

    // THEN: NotFoundView is rendered, the shell is still visible, and the recovery link is offered
    await expect(page.getByTestId('app-root')).toBeVisible()
    await expect(page.getByText(/página no encontrada/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /ir a clientes/i })).toBeVisible()
  })

  test('AC #5 — clicking "Ir a Clientes" from the NotFoundView returns to /clientes via SPA navigation', async ({
    page,
  }) => {
    // GIVEN: the user landed on a 404 page
    await page.goto('/ruta-que-no-existe')
    await expect(page.getByText(/página no encontrada/i)).toBeVisible()

    // WHEN: the user clicks the recovery link
    await page.getByRole('link', { name: /ir a clientes/i }).click()

    // THEN: the router navigates to /clientes and the placeholder view renders
    await expect(page).toHaveURL(/\/clientes$/)
    await expect(
      page.getByRole('heading', { level: 1, name: /^clientes$/i }),
    ).toBeVisible()
  })
})

test.describe('Story 1.2 — Responsive navigation surfaces (E2E)', () => {
  test('AC #1 — desktop viewport (≥1024px) shows the NavigationRailGroup container', async ({
    page,
  }) => {
    // GIVEN: a desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })

    // WHEN: the user opens /clientes
    await page.goto('/clientes')

    // THEN: the desktop rail container is visible (lg:block)
    await expect(page.getByTestId('shell-rail-container')).toBeVisible()
  })

  test('AC #2, FR29 — mobile viewport (<1024px) shows the bottom NavigationBar', async ({
    page,
  }) => {
    // GIVEN: a mobile viewport
    await page.setViewportSize({ width: 375, height: 800 })

    // WHEN: the user opens /clientes
    await page.goto('/clientes')

    // THEN: the bottom-fixed mobile NavigationBar wrapper is visible (lg:hidden hides it on desktop only)
    await expect(page.getByTestId('shell-mobile-nav')).toBeVisible()
  })
})
