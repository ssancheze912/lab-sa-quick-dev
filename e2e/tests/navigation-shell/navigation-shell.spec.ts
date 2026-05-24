/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible at viewport >= 1024px; SPA navigation to /clientes and /contactos
 *   AC2 — Mobile NavigationBar visible at viewport < 1024px; all items accessible
 *   AC3 — Direct URL entry /clientes and /contactos renders correct view (deep linking)
 *   AC4 — Unknown route renders 404 view with Spanish message and link back to /clientes
 *   AC5 — Active navigation item is visually highlighted when navigating between sections
 *   AC6 — Root URL / redirects to /clientes automatically
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail visible and SPA navigation works
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (viewport >= 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show NavigationRail on the left side when viewport is desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // Network-first: intercept before navigation
    const responseReady = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );
    await page.goto('/clientes');
    await responseReady;

    // WHEN: The user views the app
    // THEN: A NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    // Network-first: intercept before navigation
    const responseReady = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );
    await page.goto('/clientes');
    await responseReady;

    // WHEN: The user views the app
    // THEN: "Clientes" navigation entry is visible in the rail
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    // Network-first: intercept before navigation
    const responseReady = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );
    await page.goto('/clientes');
    await responseReady;

    // WHEN: The user views the app
    // THEN: "Contactos" navigation entry is visible in the rail
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes entry', async ({ page }) => {
    // GIVEN: The app is loaded on desktop
    // Network-first: listen for navigation events before clicking
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    const navigationPromise = page.waitForURL('**/clientes', { waitUntil: 'networkidle' });

    // WHEN: The user clicks the "Clientes" navigation entry
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await navigationPromise;

    // THEN: URL changes to /clientes without full page reload (SPA navigation)
    expect(page.url()).toContain('/clientes');
    // No full reload: the app-shell container persists
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('should navigate to /contactos without full page reload when clicking Contactos entry', async ({ page }) => {
    // GIVEN: The app is loaded on desktop at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const navigationPromise = page.waitForURL('**/contactos', { waitUntil: 'networkidle' });

    // WHEN: The user clicks the "Contactos" navigation entry
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await navigationPromise;

    // THEN: URL changes to /contactos without full page reload (SPA navigation)
    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('should NOT show mobile NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Mobile NavigationBar is NOT visible on desktop
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar visible at viewport < 1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (viewport < 1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should show mobile NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    // Network-first: intercept before navigation
    const responseReady = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );
    await page.goto('/clientes');
    await responseReady;

    // WHEN: The user views the app
    // THEN: A mobile NavigationBar is displayed at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should display "Clientes" nav item in mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    const responseReady = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );
    await page.goto('/clientes');
    await responseReady;

    // WHEN: The user views the app
    // THEN: "Clientes" navigation item is accessible in the bottom bar
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" nav item in mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    const responseReady = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );
    await page.goto('/clientes');
    await responseReady;

    // WHEN: The user views the app
    // THEN: "Contactos" navigation item is accessible in the bottom bar
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should NOT show desktop NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Desktop NavigationRail is NOT visible on mobile
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should make "Clientes" nav item tappable on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar visible
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    const navigationPromise = page.waitForURL('**/clientes', { waitUntil: 'networkidle' });

    // WHEN: The user clicks/taps the "Clientes" nav item
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await navigationPromise;

    // THEN: Navigation goes to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL entry renders correct view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking to /clientes and /contactos', () => {
  test('should render Clientes view when navigating directly to /clientes via URL', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // Network-first: intercept before navigation
    const responseReady = page.waitForResponse(
      (resp) => resp.url().includes('/clientes') && resp.status() === 200
    );
    await page.goto('/clientes');
    await responseReady;

    // WHEN: The page loads
    // THEN: The correct Clientes view is rendered (no redirection to home)
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
    expect(page.url()).toContain('/clientes');
  });

  test('should render Contactos view when navigating directly to /contactos via URL', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // Network-first: intercept before navigation
    const responseReady = page.waitForResponse(
      (resp) => resp.url().includes('/contactos') && resp.status() === 200
    );
    await page.goto('/contactos');
    await responseReady;

    // WHEN: The page loads
    // THEN: The correct Contactos view is rendered (no redirection to home)
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible();
    expect(page.url()).toContain('/contactos');
  });

  test('should NOT redirect to a home screen when /clientes is accessed directly', async ({ page }) => {
    // GIVEN: The user directly enters /clientes in the URL bar
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The page loads
    // THEN: URL remains /clientes (no redirection)
    expect(page.url()).toContain('/clientes');
    expect(page.url()).not.toContain('/?');
  });

  test('should NOT redirect to a home screen when /contactos is accessed directly', async ({ page }) => {
    // GIVEN: The user directly enters /contactos in the URL bar
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: The page loads
    // THEN: URL remains /contactos (no redirection)
    expect(page.url()).toContain('/contactos');
    expect(page.url()).not.toContain('/?');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route renders 404 view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 not-found view for unknown routes', () => {
  test('should display a 404 not-found view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route /unknown
    // Network-first: intercept before navigation
    const responseReady = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );
    await page.goto('/unknown');
    await responseReady;

    // WHEN: The page loads
    // THEN: The 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
  });

  test('should display Spanish "Página no encontrada" message on 404 view', async ({ page }) => {
    // GIVEN: The user navigates to /ruta-inexistente
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    // WHEN: The page loads
    // THEN: A Spanish-language 404 message is displayed
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('should display a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The 404 view is displayed
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    // WHEN: The user sees the 404 page
    // THEN: A link back to /clientes is visible
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
    const backLink = page.locator('[data-testid="not-found-back-link"]');
    await expect(backLink).toHaveAttribute('href', /\/clientes/);
  });

  test('should navigate to /clientes when clicking the back link from the 404 view', async ({ page }) => {
    // GIVEN: The 404 view is displayed at /ruta-inexistente
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    const navigationPromise = page.waitForURL('**/clientes', { waitUntil: 'networkidle' });

    // WHEN: The user clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();
    await navigationPromise;

    // THEN: The user is navigated to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Active navigation item is visually highlighted
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Active navigation item highlighting', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should highlight "Clientes" nav item when on the /clientes route (desktop)', async ({ page }) => {
    // GIVEN: The application is loaded
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user is on the /clientes route
    // THEN: The "Clientes" nav item has the active state attribute
    const clientesNavItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesNavItem).toHaveAttribute('data-active', 'true');
  });

  test('should highlight "Contactos" nav item when on the /contactos route (desktop)', async ({ page }) => {
    // GIVEN: The application is loaded
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: The user is on the /contactos route
    // THEN: The "Contactos" nav item has the active state attribute
    const contactosNavItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosNavItem).toHaveAttribute('data-active', 'true');
  });

  test('should update active highlight when navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: User is on /clientes and Clientes is highlighted
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const navigationPromise = page.waitForURL('**/contactos', { waitUntil: 'networkidle' });

    // WHEN: The user navigates to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await navigationPromise;

    // THEN: "Contactos" is now highlighted and "Clientes" is not
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Root URL / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Root URL / redirects to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The root URL / is accessed
    // Network-first: wait for the redirect to complete
    const redirected = page.waitForURL('**/clientes', { waitUntil: 'networkidle' });

    // WHEN: The user navigates to /
    await page.goto('/');
    await redirected;

    // THEN: The user is redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('should render the Clientes view after redirect from /', async ({ page }) => {
    // GIVEN: The root URL / is accessed
    await page.goto('/');
    await page.waitForURL('**/clientes', { waitUntil: 'networkidle' });

    // WHEN: The redirect completes
    // THEN: The Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });
});
