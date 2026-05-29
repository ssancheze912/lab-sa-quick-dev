/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible with Clientes/Contactos; SPA navigation (FR28)
 *   AC2 — Mobile viewport renders NavigationBar at bottom; items tappable (FR29)
 *   AC3 — Direct URL /clientes renders Clientes view with active highlight (FR30)
 *   AC4 — Direct URL /contactos renders Contactos view with active highlight (FR30)
 *   AC5 — Unknown route renders graceful 404 in Spanish with link to /clientes
 *   AC6 — Root path / redirects automatically to /clientes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail with SPA navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (>= 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show NavigationRail on the left side at desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (>= 1024px)

    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display "Clientes" entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail rendered
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: "Clientes" navigation entry is visible
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail rendered
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: "Contactos" navigation entry is visible
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes entry', async ({ page }) => {
    // GIVEN: Desktop viewport, user is on /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');

    // WHEN: User clicks the "Clientes" navigation entry
    const navigationPromise = page.waitForURL('**/clientes**', { waitUntil: 'networkidle' });
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await navigationPromise;

    // THEN: URL changes to /clientes without a full page reload (no page navigation event)
    expect(page.url()).toContain('/clientes');
  });

  test('should navigate to /contactos without full page reload when clicking Contactos entry', async ({ page }) => {
    // GIVEN: Desktop viewport, user is on /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: User clicks the "Contactos" navigation entry
    const navigationPromise = page.waitForURL('**/contactos**', { waitUntil: 'networkidle' });
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await navigationPromise;

    // THEN: URL changes to /contactos without a full page reload
    expect(page.url()).toContain('/contactos');
  });

  test('should NOT show NavigationBar (bottom bar) at desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar (mobile) is NOT visible
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (< 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (< 1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should show NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar is displayed at the bottom of the screen
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT show NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationRail is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeHidden();
  });

  test('should display "Clientes" entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar rendered
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: "Clientes" navigation item is accessible and tappable
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar rendered
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: "Contactos" navigation item is accessible and tappable
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Direct URL /clientes deep link with active highlight
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Direct URL deep link to /clientes (FR30)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered correctly
    await expect(page.locator('[data-testid="clientes-shell-view"]')).toBeVisible();
  });

  test('should show navigation rail/bar when accessing /clientes via direct URL', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: Navigation rail is still visible (not redirected away)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should highlight "Clientes" as active when on /clientes route', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The "Clientes" entry is highlighted as active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('should NOT redirect to home screen when accessing /clientes directly', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The URL remains /clientes (no redirection to home or /)
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Direct URL /contactos deep link with active highlight
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Direct URL deep link to /contactos (FR30)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered correctly
    await expect(page.locator('[data-testid="contactos-shell-view"]')).toBeVisible();
  });

  test('should show navigation rail/bar when accessing /contactos via direct URL', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: Navigation rail is still visible (not redirected away)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should highlight "Contactos" as active when on /contactos route', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The "Contactos" entry is highlighted as active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });

  test('should NOT redirect to home screen when accessing /contactos directly', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The URL remains /contactos (no redirection to home or /)
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Unknown route renders 404 view in Spanish
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Unknown route renders 404 not-found view', () => {
  test('should display a 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/unknown-route-xyz');

    // THEN: A not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display Spanish message "Página no encontrada" on 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/unknown-route-xyz');

    // THEN: A Spanish not-found message is shown
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('should display a link to return to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/unknown-route-xyz');

    // THEN: A link to /clientes is visible on the not-found view
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
  });

  test('should navigate to /clientes when clicking the back link on the 404 view', async ({ page }) => {
    // GIVEN: The user is on an unknown route showing the 404 view
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/unknown-route-xyz');
    await page.locator('[data-testid="not-found-view"]').waitFor({ state: 'visible' });

    // WHEN: The user clicks the link to return to /clientes
    const navPromise = page.waitForURL('**/clientes**');
    await page.locator('[data-testid="not-found-back-link"]').click();
    await navPromise;

    // THEN: The user is taken to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Root path / redirects to /clientes', () => {
  test('should redirect / to /clientes automatically', async ({ page }) => {
    // GIVEN: The root path / is accessed
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForURL('**/clientes**');

    // THEN: The user is automatically redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('should NOT display a blank screen when accessing the root path /', async ({ page }) => {
    // GIVEN: The root path / is accessed
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads and redirects
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Content is visible (no blank screen)
    await expect(page.locator('[data-testid="app-root"]')).not.toBeEmpty();
  });
});
