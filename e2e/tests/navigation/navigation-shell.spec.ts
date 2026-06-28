/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop (>= 1024px) with Clientes and Contactos entries (FR28)
 *   AC2 — NavigationBar visible on mobile (< 1024px), items accessible and tappable (FR29)
 *   AC3 — Deep linking: /clientes and /contactos render correct view without redirect (FR30)
 *   AC4 — Unknown route renders 404 / not-found view with navigation shell still visible
 *   AC5 — Root path / redirects automatically to /clientes
 *
 * Test Cases (from test-design-epic-1.md):
 *   TC-E1-P1-01 — SPA navigation — no full page reload between routes
 *   TC-E1-P1-02 — Deep linking — direct URL access to /clientes
 *   TC-E1-P1-03 — Deep linking — direct URL access to /contactos
 *   TC-E1-P1-04 — 404 route — unknown URL shows not-found view
 *   TC-E1-P2-01 — NavigationRail visible on desktop viewport (1280px)
 *   TC-E1-P2-02 — NavigationBar visible on mobile viewport (375px)
 *   TC-E1-P2-03 — Index route redirects to /clientes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 + TC-E1-P1-02: Deep Linking — Direct URL Access to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep Linking to /clientes', () => {
  test('[P1][TC-E1-P1-02] should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The frontend dev server is running
    // Network-first: intercept navigation response BEFORE goto
    const navigationResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() < 400,
    );

    // WHEN: The browser navigates directly to /clientes (no prior navigation)
    await page.goto('/clientes');

    await navigationResponse;

    // THEN: The Clientes view renders without redirect
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P1][TC-E1-P1-02] should not redirect away from /clientes on direct URL access', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: URL remains at /clientes — no redirect to home or root
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('[P1][TC-E1-P1-02] should render the navigation shell (NavigationRail) on direct access to /clientes', async ({ page }) => {
    // GIVEN: A desktop viewport (default, >= 1024px)
    // WHEN: The user directly navigates to /clientes
    await page.goto('/clientes');

    // THEN: Navigation shell is still present (shell is not dismounted)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 + TC-E1-P1-03: Deep Linking — Direct URL Access to /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep Linking to /contactos', () => {
  test('[P1][TC-E1-P1-03] should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The frontend dev server is running
    // Network-first: intercept BEFORE navigation
    const navigationResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() < 400,
    );

    // WHEN: The browser navigates directly to /contactos
    await page.goto('/contactos');

    await navigationResponse;

    // THEN: The Contactos view renders without redirect or blank page
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('[P1][TC-E1-P1-03] should not redirect away from /contactos on direct URL access', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: URL remains at /contactos — no redirect
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('[P1][TC-E1-P1-03] should render the navigation shell (NavigationRail) on direct access to /contactos', async ({ page }) => {
    // GIVEN: A desktop viewport (default, >= 1024px)
    // WHEN: The user directly navigates to /contactos
    await page.goto('/contactos');

    // THEN: Navigation shell is still present
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + AC2 + TC-E1-P1-01: SPA Navigation — No Full Page Reload Between Routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1+AC2 — SPA Navigation (no full page reload)', () => {
  test('[P1][TC-E1-P1-01] should navigate to /clientes by clicking the Clientes nav entry without full page reload', async ({ page }) => {
    // GIVEN: The user is on the application (starting at /clientes)
    // Network-first: set up navigation listener BEFORE first goto
    await page.route('**/clientes', (route) => route.continue());

    await page.goto('/clientes');

    // Track full page navigation events (full reload = new navigation)
    let fullReloadOccurred = false;
    page.on('load', () => {
      fullReloadOccurred = true;
    });
    // Reset after initial load
    await page.waitForLoadState('domcontentloaded');
    fullReloadOccurred = false;

    // WHEN: User clicks the Clientes navigation entry
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL is /clientes and view content renders via SPA routing
    await expect(page).toHaveURL(/\/clientes/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    // No full page reload occurred (SPA navigation)
    expect(fullReloadOccurred).toBe(false);
  });

  test('[P1][TC-E1-P1-01] should navigate to /contactos by clicking the Contactos nav entry without full page reload', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');

    // Track page reload events
    let fullReloadOccurred = false;
    await page.waitForLoadState('domcontentloaded');
    page.on('load', () => {
      fullReloadOccurred = true;
    });
    fullReloadOccurred = false;

    // WHEN: User clicks the Contactos navigation entry
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos via SPA routing
    await expect(page).toHaveURL(/\/contactos/);
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
    expect(fullReloadOccurred).toBe(false);
  });

  test('[P1][TC-E1-P1-01] should keep the navigation shell visible during SPA navigation between routes', async ({ page }) => {
    // GIVEN: User is on /clientes with navigation shell visible
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: User navigates to /contactos via SPA link
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: Navigation shell remains mounted (not dismounted during SPA transition)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 + TC-E1-P1-04: 404 Route — Unknown URL Shows Not-Found View
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Not-Found (404) View for Unknown Routes', () => {
  test('[P1][TC-E1-P1-04] should display the not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // Network-first: intercept BEFORE navigation
    await page.route('**/*', (route) => route.continue());

    // WHEN: The user navigates to /ruta-desconocida
    await page.goto('/ruta-desconocida');

    // THEN: A not-found view is displayed (not a blank page, not a JS error)
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P1][TC-E1-P1-04] should display "Página no encontrada" text on unknown route', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/ruta-desconocida');

    // THEN: Spanish not-found message is visible
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('Página no encontrada');
  });

  test('[P1][TC-E1-P1-04] should keep the navigation shell visible when showing the not-found view', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    // WHEN: The 404 view renders
    await page.goto('/ruta-desconocida');

    // THEN: Navigation shell is still visible (layout persists — not dismounted)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P1][TC-E1-P1-04] should provide a link back to /clientes from the not-found view', async ({ page }) => {
    // GIVEN: User is on the not-found view
    await page.goto('/ruta-desconocida');

    // WHEN: The not-found view is rendered
    // THEN: A link to /clientes is present for navigation recovery
    await expect(page.locator('[data-testid="not-found-link-clientes"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 + TC-E1-P2-03: Index Route Redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root Route Redirect to /clientes', () => {
  test('[P2][TC-E1-P2-03] should automatically redirect from / to /clientes', async ({ page }) => {
    // GIVEN: User navigates to the root path /
    // Network-first: wait for redirect BEFORE asserting URL
    const redirectPromise = page.waitForURL(/\/clientes/);

    // WHEN: The page loads at /
    await page.goto('/');

    // THEN: User is automatically redirected to /clientes
    await redirectPromise;
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('[P2][TC-E1-P2-03] should render the Clientes view after redirect from /', async ({ page }) => {
    // GIVEN: User navigates to /
    // WHEN: Redirect occurs
    await page.goto('/');
    await page.waitForURL(/\/clientes/);

    // THEN: The Clientes view content is rendered (not a blank page)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + TC-E1-P2-01: NavigationRail Visible on Desktop Viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — NavigationRail on Desktop Viewport (>= 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2][TC-E1-P2-01] should render the NavigationRail on desktop viewport (1280px)', async ({ page }) => {
    // GIVEN: Desktop viewport width of 1280px (>= lg breakpoint 1024px)
    // Network-first: register route intercept before navigation
    await page.route('**/*', (route) => route.continue());

    // WHEN: The application loads
    await page.goto('/clientes');

    // THEN: NavigationRail from siesa-ui-kit is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P2][TC-E1-P2-01] should display "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport (1280px)
    // WHEN: Application loads
    await page.goto('/clientes');

    // THEN: NavigationRail contains a "Clientes" navigation entry
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('[P2][TC-E1-P2-01] should display "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport (1280px)
    // WHEN: Application loads
    await page.goto('/clientes');

    // THEN: NavigationRail contains a "Contactos" navigation entry
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('[P2][TC-E1-P2-01] should NOT display the NavigationBar (mobile) on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport (1280px)
    // WHEN: Application loads
    await page.goto('/clientes');

    // THEN: NavigationBar (mobile bottom bar) is NOT visible at desktop width
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 + TC-E1-P2-02: NavigationBar Visible on Mobile Viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — NavigationBar on Mobile Viewport (< 1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('[P2][TC-E1-P2-02] should render the NavigationBar on mobile viewport (375px)', async ({ page }) => {
    // GIVEN: Mobile viewport width of 375px (< lg breakpoint 1024px)
    // Network-first: set route handler before navigation
    await page.route('**/*', (route) => route.continue());

    // WHEN: The application loads
    await page.goto('/clientes');

    // THEN: NavigationBar (mobile bottom bar) from siesa-ui-kit is visible
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('[P2][TC-E1-P2-02] should display "Clientes" entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport (375px)
    // WHEN: Application loads
    await page.goto('/clientes');

    // THEN: NavigationBar contains a tappable "Clientes" navigation entry
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('[P2][TC-E1-P2-02] should display "Contactos" entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport (375px)
    // WHEN: Application loads
    await page.goto('/clientes');

    // THEN: NavigationBar contains a tappable "Contactos" entry
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('[P2][TC-E1-P2-02] should NOT display the NavigationRail (desktop) on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport (375px)
    // WHEN: Application loads
    await page.goto('/clientes');

    // THEN: NavigationRail (desktop left bar) is NOT visible at mobile width
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeHidden();
  });

  test('[P2][TC-E1-P2-02] should allow tapping the Contactos nav item on mobile', async ({ page }) => {
    // GIVEN: User is on /clientes on mobile viewport
    await page.goto('/clientes');

    // WHEN: User taps the Contactos entry in the NavigationBar
    await page.locator('[data-testid="nav-item-contactos"]').tap();

    // THEN: URL changes to /contactos (SPA navigation, not full reload)
    await expect(page).toHaveURL(/\/contactos/);
  });
});
