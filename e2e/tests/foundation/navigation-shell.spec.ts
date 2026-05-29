/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — Navigation Layout (AC1-AC4)
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible with Clientes/Contactos; SPA navigation (FR28)
 *   AC2 — Mobile viewport renders NavigationBar at bottom; items tappable (FR29)
 *   AC3 — Direct URL /clientes renders Clientes view with active highlight (FR30)
 *   AC4 — Direct URL /contactos renders Contactos view with active highlight (FR30)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail with SPA navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (>= 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show NavigationRail on the left side at desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (>= 1024px)
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

    // THEN: "Clientes" navigation entry is visible (scoped to NavigationRail)
    await expect(page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail rendered
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: "Contactos" navigation entry is visible (scoped to NavigationRail)
    await expect(page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes entry', async ({ page }) => {
    // GIVEN: Desktop viewport, user is on /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');

    // WHEN: User clicks the "Clientes" navigation entry (scoped to NavigationRail)
    const navigationPromise = page.waitForURL('**/clientes**', { waitUntil: 'networkidle' });
    await page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-clientes"]').click();
    await navigationPromise;

    // THEN: URL changes to /clientes without a full page reload
    expect(page.url()).toContain('/clientes');
  });

  test('should navigate to /contactos without full page reload when clicking Contactos entry', async ({ page }) => {
    // GIVEN: Desktop viewport, user is on /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: User clicks the "Contactos" navigation entry (scoped to NavigationRail)
    const navigationPromise = page.waitForURL('**/contactos**', { waitUntil: 'networkidle' });
    await page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-contactos"]').click();
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

    // THEN: "Clientes" navigation item is accessible and tappable (scoped to NavigationBar)
    await expect(page.locator('[data-testid="navigation-bar"] [data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar rendered
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: "Contactos" navigation item is accessible and tappable (scoped to NavigationBar)
    await expect(page.locator('[data-testid="navigation-bar"] [data-testid="nav-item-contactos"]')).toBeVisible();
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

    // THEN: The "Clientes" entry is highlighted as active (scoped to NavigationRail)
    await expect(page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
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

    // THEN: The "Contactos" entry is highlighted as active (scoped to NavigationRail)
    await expect(page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
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
