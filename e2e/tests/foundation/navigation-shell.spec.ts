/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop (≥ 1024px) with Clientes + Contactos entries
 *   AC2 — NavigationBar visible on mobile (< 1024px); Rail NOT in DOM
 *   AC3 — Deep linking works for /clientes and /contactos (direct URL access)
 *   AC4 — Unknown route shows Spanish 404 view; shell remains visible
 *   AC5 — Root "/" redirects to /clientes
 *   AC6 — Active nav item reflects current route; shell does NOT unmount
 *
 * Test Case Mapping (from test-design-epic-1.md):
 *   - TC-E1-P1-02 → Deep link /clientes
 *   - TC-E1-P1-03 → Deep link /contactos
 *   - TC-E1-P1-04 → 404 route (also covered in component tests)
 *   - TC-E1-P2-01 → NavigationRail desktop (viewport-driven)
 *   - TC-E1-P2-02 → NavigationBar mobile (viewport-driven)
 *   - TC-E1-P2-03 → Index redirect (also covered in component tests)
 *
 * Patterns applied:
 *   - Network-first (waitForResponse registered BEFORE goto)
 *   - Given-When-Then structure
 *   - data-testid selectors only (no CSS class selectors)
 *   - Explicit waits — no hard sleeps
 *   - One primary assertion per test (atomic)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep Linking (direct URL access renders the correct view)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking: direct URL access', () => {
  test('TC-E1-P1-02 — should render Clientes view when navigating directly to /clientes', async ({
    page,
  }) => {
    // GIVEN: The frontend dev server is running

    // Network-first: register response listener BEFORE navigation
    const routeResponse = page.waitForResponse(
      (resp) => resp.url().includes('/clientes') && resp.status() < 400,
    );

    // WHEN: The user opens /clientes directly (deep link, no prior navigation)
    await page.goto('/clientes');
    await routeResponse.catch(() => {
      /* SPA route may resolve without a dedicated network response */
    });

    // THEN: The Clientes page renders (identified by data-testid="page-clientes")
    await expect(page.locator('[data-testid="page-clientes"]')).toBeVisible();
  });

  test('TC-E1-P1-02 — should NOT redirect to root when deep-linking to /clientes', async ({
    page,
  }) => {
    // GIVEN: The frontend dev server is running
    // WHEN: The user opens /clientes directly
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="page-clientes"]')).toBeVisible();

    // THEN: The URL remains /clientes — no redirect fired to "/" or a home screen
    expect(new URL(page.url()).pathname).toBe('/clientes');
  });

  test('TC-E1-P1-03 — should render Contactos view when navigating directly to /contactos', async ({
    page,
  }) => {
    // GIVEN: The frontend dev server is running

    const routeResponse = page.waitForResponse(
      (resp) => resp.url().includes('/contactos') && resp.status() < 400,
    );

    // WHEN: The user opens /contactos directly (deep link)
    await page.goto('/contactos');
    await routeResponse.catch(() => {
      /* SPA */
    });

    // THEN: The Contactos page renders
    await expect(page.locator('[data-testid="page-contactos"]')).toBeVisible();
  });

  test('TC-E1-P1-03 — should keep URL at /contactos after direct navigation', async ({ page }) => {
    // GIVEN: The frontend dev server is running
    // WHEN: The user opens /contactos directly
    await page.goto('/contactos');
    await expect(page.locator('[data-testid="page-contactos"]')).toBeVisible();

    // THEN: The URL remains /contactos
    expect(new URL(page.url()).pathname).toBe('/contactos');
  });

  test('AC3 — deep link should not produce JS runtime errors', async ({ page }) => {
    // GIVEN: The frontend dev server is running
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    // WHEN: The user deep-links to /clientes
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="page-clientes"]')).toBeVisible();

    // THEN: No JS runtime exceptions are thrown
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 / Not-Found (unknown route shows Spanish view; shell persists)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 not-found view for unknown routes', () => {
  test('TC-E1-P1-04 — should render the 404 view when navigating to an unknown route', async ({
    page,
  }) => {
    // GIVEN: The frontend dev server is running
    // WHEN: The user navigates to a URL that does not exist
    await page.goto('/ruta-que-no-existe');

    // THEN: The graceful 404 view is displayed (data-testid="page-not-found")
    await expect(page.locator('[data-testid="page-not-found"]')).toBeVisible();
  });

  test('TC-E1-P1-04 — 404 view should display the Spanish heading "Página no encontrada"', async ({
    page,
  }) => {
    // GIVEN: The frontend dev server is running
    // WHEN: The user navigates to an unknown route
    await page.goto('/no-existe');

    // THEN: The Spanish heading is present inside the 404 container
    const notFound = page.locator('[data-testid="page-not-found"]');
    await expect(notFound).toContainText('Página no encontrada');
  });

  test('AC4 — 404 view should keep the navigation shell visible', async ({ page }) => {
    // GIVEN: The frontend dev server is running
    // WHEN: The user navigates to an unknown route
    await page.goto('/no-existe');
    await expect(page.locator('[data-testid="page-not-found"]')).toBeVisible();

    // THEN: The persistent shell (app content wrapper) is still mounted
    await expect(page.locator('[data-testid="app-content"]')).toBeVisible();
  });

  test('AC4 — 404 view should not throw JS runtime errors', async ({ page }) => {
    // GIVEN: The frontend dev server is running
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    // WHEN: The user navigates to an unknown route
    await page.goto('/otra-ruta-inexistente');
    await expect(page.locator('[data-testid="page-not-found"]')).toBeVisible();

    // THEN: No JS runtime exceptions were thrown
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root redirect ("/" → "/clientes")
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root path redirects to /clientes', () => {
  test('TC-E1-P2-03 — should redirect the user from / to /clientes on load', async ({ page }) => {
    // GIVEN: The frontend dev server is running
    // WHEN: The user opens the root path
    await page.goto('/');
    await expect(page.locator('[data-testid="page-clientes"]')).toBeVisible();

    // THEN: The final URL is /clientes (the redirect resolved server- or client-side)
    expect(new URL(page.url()).pathname).toBe('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail visible on desktop viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — NavigationRail on desktop (≥ 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('TC-E1-P2-01 — should display NavigationRail on desktop viewport', async ({ page }) => {
    // GIVEN: The frontend dev server is running at a desktop viewport
    // WHEN: The user opens /clientes
    await page.goto('/clientes');

    // THEN: The NavigationRail root container is visible in the DOM
    await expect(page.locator('[data-testid="nav-rail-desktop"]')).toBeVisible();
  });

  test('AC1 — should NOT render the mobile NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: A desktop viewport
    // WHEN: The user opens the app
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-rail-desktop"]')).toBeVisible();

    // THEN: The mobile NavigationBar container is hidden (not visible to user)
    await expect(page.locator('[data-testid="nav-bar-mobile"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — NavigationBar visible on mobile viewport; Rail NOT rendered
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — NavigationBar on mobile (< 1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('TC-E1-P2-02 — should display NavigationBar on mobile viewport', async ({ page }) => {
    // GIVEN: The frontend dev server is running at a mobile viewport
    // WHEN: The user opens /clientes
    await page.goto('/clientes');

    // THEN: The mobile NavigationBar is visible
    await expect(page.locator('[data-testid="nav-bar-mobile"]')).toBeVisible();
  });

  test('AC2 — should hide the NavigationRail on mobile viewport (FR29)', async ({ page }) => {
    // GIVEN: A mobile viewport
    // WHEN: The user opens the app
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-bar-mobile"]')).toBeVisible();

    // THEN: The desktop NavigationRail is hidden from users on mobile
    await expect(page.locator('[data-testid="nav-rail-desktop"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 & AC6 & FR28 — SPA navigation without full page reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1/AC6 — SPA navigation between routes (no full reload, FR28)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('AC1 — clicking Contactos in the rail should navigate to /contactos', async ({ page }) => {
    // GIVEN: The user is on /clientes on a desktop viewport
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-rail-desktop"]')).toBeVisible();

    // WHEN: The user clicks the Contactos nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: The Contactos view renders
    await expect(page.locator('[data-testid="page-contactos"]')).toBeVisible();
  });

  test('AC1/FR28 — clicking a nav item should NOT trigger a full page reload', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="app-content"]')).toBeVisible();

    // Tag the current document to detect full reloads (a real reload wipes window.__navTag)
    await page.evaluate(() => {
      (window as unknown as { __navTag?: string }).__navTag = 'session-1';
    });

    // WHEN: The user navigates via the rail to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page.locator('[data-testid="page-contactos"]')).toBeVisible();

    // THEN: The tag is preserved — router navigation, not a full document reload
    const tag = await page.evaluate(
      () => (window as unknown as { __navTag?: string }).__navTag,
    );
    expect(tag).toBe('session-1');
  });

  test('AC6 — the persistent shell should remain mounted across route changes', async ({
    page,
  }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');
    const shell = page.locator('[data-testid="app-content"]');
    await expect(shell).toBeVisible();

    // WHEN: The user navigates to /contactos via the rail
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page.locator('[data-testid="page-contactos"]')).toBeVisible();

    // THEN: The shell container is still present (was never unmounted)
    await expect(shell).toBeVisible();
  });
});
