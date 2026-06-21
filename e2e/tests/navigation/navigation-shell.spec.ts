/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD E2E Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Requires: frontend dev server running on http://localhost:5173
 *
 * Acceptance Criteria covered:
 *   AC#2 — SPA navigation: clicking nav items does not trigger full page reload
 *   AC#3 — SPA navigation: clicking nav items does not trigger full page reload
 *   AC#5 — Deep linking: direct URL /clientes renders Clientes view without redirect
 *   AC#6 — Deep linking: direct URL /contactos renders Contactos view without redirect
 *   AC#7 — Root path / redirects to /clientes (browser-level redirect verification)
 *
 * Test Cases:
 *   TC-1.2-E-01 (AC#5)     — Deep link to /clientes
 *   TC-1.2-E-02 (AC#6)     — Deep link to /contactos
 *   TC-1.2-E-03 (AC#2/#3)  — SPA navigation without full page reload
 *   TC-1.2-E-04 (AC#7)     — Root / redirects to /clientes
 */

import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// AC#5 — Deep linking: Direct URL /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#5 — Deep link to /clientes renders Clientes view', () => {
  test('[P1][TC-1.2-E-01] Given dev server running, When browser opens /clientes directly, Then Clientes view is displayed without redirect or blank screen', async ({
    page,
  }) => {
    // GIVEN: The frontend dev server is running at http://localhost:5173
    // Network-first: intercept responses BEFORE navigation (Playwright best practice)
    const navigationResponse = page.waitForResponse(
      (resp) =>
        resp.url() === 'http://localhost:5173/clientes' ||
        resp.url() === 'http://localhost:5173/',
      { timeout: 10000 }
    )

    // WHEN: The user types /clientes directly in the browser URL bar
    await page.goto('/clientes')

    // Wait for the response to confirm page loaded
    await navigationResponse.catch(() => {
      // SPA routing — the server may only serve index.html; this is acceptable
    })

    // THEN: The URL remains at /clientes (no redirect away from the route)
    await expect(page).toHaveURL(/\/clientes$/)

    // AND: The Clientes view is rendered (contains the expected heading)
    await expect(page.getByTestId('clientes-view')).toBeVisible()

    // AND: No blank page, no generic error page
    const title = await page.title()
    expect(title).not.toBe('')
  })

  test('[P1][TC-1.2-E-01b] Given /clientes loaded directly, When page renders, Then NavigationRail shows "Clientes" as active item', async ({
    page,
  }) => {
    // GIVEN: Browser navigates directly to /clientes
    await page.goto('/clientes')

    // WHEN: The page renders
    await expect(page.getByTestId('clientes-view')).toBeVisible()

    // THEN: The NavigationRail is present
    await expect(page.getByTestId('navigation-rail')).toBeVisible()

    // AND: The "Clientes" navigation item is marked as active (aria-current="page")
    const clientesNavItem = page.getByTestId('nav-item-clientes')
    await expect(clientesNavItem).toBeVisible()
    await expect(clientesNavItem).toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#6 — Deep linking: Direct URL /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#6 — Deep link to /contactos renders Contactos view', () => {
  test('[P1][TC-1.2-E-02] Given dev server running, When browser opens /contactos directly, Then Contactos view is displayed without redirect or blank screen', async ({
    page,
  }) => {
    // GIVEN: The frontend dev server is running at http://localhost:5173
    // Network-first: intercept BEFORE navigation
    const navigationResponse = page.waitForResponse(
      (resp) =>
        resp.url() === 'http://localhost:5173/contactos' ||
        resp.url() === 'http://localhost:5173/',
      { timeout: 10000 }
    )

    // WHEN: The user types /contactos directly in the browser URL bar
    await page.goto('/contactos')

    await navigationResponse.catch(() => {
      // SPA routing — index.html served for all paths; acceptable behavior
    })

    // THEN: The URL remains at /contactos (no redirect to a home screen)
    await expect(page).toHaveURL(/\/contactos$/)

    // AND: The Contactos view is rendered
    await expect(page.getByTestId('contactos-view')).toBeVisible()

    // AND: No blank page
    const title = await page.title()
    expect(title).not.toBe('')
  })

  test('[P1][TC-1.2-E-02b] Given /contactos loaded directly, When page renders, Then NavigationRail shows "Contactos" as active item', async ({
    page,
  }) => {
    // GIVEN: Browser navigates directly to /contactos
    await page.goto('/contactos')

    // WHEN: The page renders
    await expect(page.getByTestId('contactos-view')).toBeVisible()

    // THEN: The "Contactos" navigation item is marked as active
    const contactosNavItem = page.getByTestId('nav-item-contactos')
    await expect(contactosNavItem).toBeVisible()
    await expect(contactosNavItem).toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#2/#3 — SPA navigation: no full page reload when clicking nav items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#2/#3 — SPA navigation: clicking nav items uses client-side routing', () => {
  test('[P1][TC-1.2-E-03] Given app loaded, When user clicks Clientes then Contactos nav items, Then navigation occurs without full page reload', async ({
    page,
  }) => {
    // GIVEN: The application is loaded
    await page.goto('/')

    // Wait for the shell to be rendered
    await expect(page.getByTestId('navigation-rail')).toBeVisible()

    // Track full page reloads via network — a full reload would re-request index.html
    const fullReloadRequests: string[] = []

    // Network-first: register interceptor BEFORE any click
    page.on('request', (req) => {
      if (
        req.url() === 'http://localhost:5173/' ||
        req.url() === 'http://localhost:5173/clientes' ||
        req.url() === 'http://localhost:5173/contactos'
      ) {
        if (req.resourceType() === 'document') {
          fullReloadRequests.push(req.url())
        }
      }
    })

    // WHEN: User clicks the "Contactos" navigation item
    const contactosNavItem = page.getByTestId('nav-item-contactos')
    await contactosNavItem.click()

    // THEN: Contactos view renders (client-side navigation succeeded)
    await expect(page.getByTestId('contactos-view')).toBeVisible()

    // AND: The URL changed without a full document request
    await expect(page).toHaveURL(/\/contactos$/)

    // WHEN: User clicks the "Clientes" navigation item
    const clientesNavItem = page.getByTestId('nav-item-clientes')
    await clientesNavItem.click()

    // THEN: Clientes view renders
    await expect(page.getByTestId('clientes-view')).toBeVisible()
    await expect(page).toHaveURL(/\/clientes$/)

    // AND: Shell persists throughout navigation (NavigationRail still mounted)
    await expect(page.getByTestId('navigation-rail')).toBeVisible()

    // AND: No full document reload occurred (fullReloadRequests only captures
    // the initial page load, not subsequent SPA navigations)
    // The initial goto('/') IS a document request; subsequent clicks must NOT be
    const postInitialReloads = fullReloadRequests.filter(
      (url) => !url.endsWith('/')
    )
    expect(postInitialReloads).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#7 — Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#7 — Root path / redirects to /clientes automatically', () => {
  test('[P2][TC-1.2-E-04] Given dev server running, When browser opens /, Then browser is redirected to /clientes with no blank screen', async ({
    page,
  }) => {
    // GIVEN: The frontend dev server is running
    // Network-first: intercept response BEFORE navigation
    const indexResponse = page.waitForResponse(
      (resp) => resp.url() === 'http://localhost:5173/',
      { timeout: 10000 }
    )

    // WHEN: The browser navigates to the root path
    await page.goto('/')
    await indexResponse.catch(() => {})

    // THEN: The browser's URL bar shows /clientes (client-side redirect)
    await expect(page).toHaveURL(/\/clientes$/)

    // AND: The Clientes view is rendered (not a blank screen at /)
    await expect(page.getByTestId('clientes-view')).toBeVisible()

    // AND: No NotFound / 404 view shown
    await expect(page.getByTestId('not-found-view')).not.toBeVisible()
  })
})
