/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop (>= 1024px): NavigationRail is visible on the left side
 *   AC2 — Click "Clientes" in NavigationRail navigates to /clientes (client-side)
 *   AC3 — Click "Contactos" in NavigationRail navigates to /contactos (client-side)
 *   AC4 — Mobile (< 1024px): NavigationBar is displayed at the bottom
 *   AC5 — Deep link to /clientes renders ClientesShellView and highlights active entry
 *   AC6 — Deep link to /contactos renders ContactosShellView and highlights active entry
 *   AC7 — Unknown route shows 404 view gracefully without crashing
 *   AC8 — Root path / redirects to /clientes automatically
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Desktop NavigationRail is visible on the left side
// Viewport: >= 1024px (Desktop Chrome in playwright.config.ts uses 1280x720)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop: NavigationRail visible on left side', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should display NavigationRail on the left side when viewport is desktop', async ({ page }) => {
    // GIVEN: Application loaded with desktop viewport (>= 1024px)
    // Network-first: register listener BEFORE navigation
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User views the application
    // THEN: NavigationRail component is visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should show "Clientes" nav entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport, application loaded at /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User views the NavigationRail
    // THEN: "Clientes" navigation entry is present
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should show "Contactos" nav entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport, application loaded at /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User views the NavigationRail
    // THEN: "Contactos" navigation entry is present
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should NOT display NavigationBar at the bottom on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User views the application
    // THEN: NavigationBar (mobile) is NOT visible
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Click "Clientes" navigates to /clientes without full page reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Click Clientes navigates to /clientes (client-side)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should navigate to /clientes on clicking the Clientes nav item', async ({ page }) => {
    // GIVEN: Desktop NavigationRail is rendered, starting from /contactos
    // Network-first: intercept before navigation
    await page.route('**/clientes**', (route) => route.continue());
    await page.goto('/contactos');

    // WHEN: User clicks "Clientes"
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes (client-side navigation, no full reload)
    await expect(page).toHaveURL('/clientes');
  });

  test('should NOT trigger a full page reload when navigating to /clientes', async ({ page }) => {
    // GIVEN: Desktop NavigationRail rendered
    await page.goto('/contactos');

    // Track navigation type — full reload would increment navigationCount
    const navigationsBefore = await page.evaluate(() => performance.getEntriesByType('navigation').length);

    // WHEN: User clicks Clientes nav item
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('/clientes');

    // THEN: No extra navigation entries (client-side routing — same page)
    const navigationsAfter = await page.evaluate(() => performance.getEntriesByType('navigation').length);
    expect(navigationsAfter).toBe(navigationsBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Click "Contactos" navigates to /contactos without full page reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Click Contactos navigates to /contactos (client-side)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should navigate to /contactos on clicking the Contactos nav item', async ({ page }) => {
    // GIVEN: Desktop NavigationRail is rendered, starting from /clientes
    // Network-first: intercept before navigation
    await page.route('**/contactos**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: User clicks "Contactos"
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos (client-side navigation)
    await expect(page).toHaveURL('/contactos');
  });

  test('should NOT trigger a full page reload when navigating to /contactos', async ({ page }) => {
    // GIVEN: Desktop NavigationRail rendered
    await page.goto('/clientes');

    const navigationsBefore = await page.evaluate(() => performance.getEntriesByType('navigation').length);

    // WHEN: User clicks Contactos nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // THEN: No extra navigation entries (client-side routing)
    const navigationsAfter = await page.evaluate(() => performance.getEntriesByType('navigation').length);
    expect(navigationsAfter).toBe(navigationsBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Mobile viewport (< 1024px) shows NavigationBar at the bottom
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Mobile: NavigationBar displayed at the bottom', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should display NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: Application loaded with mobile viewport (< 1024px)
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User views the application
    // THEN: NavigationBar is visible (fixed at bottom)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT display NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User views the application
    // THEN: NavigationRail (desktop) is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should show all navigation items in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User views the bottom NavigationBar
    // THEN: "Clientes" item is accessible and tappable
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should show Contactos nav item in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User views the bottom NavigationBar
    // THEN: "Contactos" item is accessible and tappable
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Deep link to /clientes renders ClientesShellView and highlights active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Deep link /clientes renders view and highlights active nav entry', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should render ClientesShellView when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: User types /clientes directly in the browser URL bar
    // Network-first: set up navigation listener before goto
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: Page loads
    // THEN: ClientesShellView is rendered (confirmed by data-testid)
    await expect(page.locator('[data-testid="clientes-shell-view"]')).toBeVisible();
  });

  test('should highlight "Clientes" as active in NavigationRail on /clientes deep link', async ({ page }) => {
    // GIVEN: User types /clientes directly in the browser URL bar
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: NavigationRail renders
    // THEN: "Clientes" entry is marked as active
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Deep link to /contactos renders ContactosShellView and highlights active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Deep link /contactos renders view and highlights active nav entry', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should render ContactosShellView when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: User types /contactos directly in the browser URL bar
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // WHEN: Page loads
    // THEN: ContactosShellView is rendered
    await expect(page.locator('[data-testid="contactos-shell-view"]')).toBeVisible();
  });

  test('should highlight "Contactos" as active in NavigationRail on /contactos deep link', async ({ page }) => {
    // GIVEN: User types /contactos directly in the browser URL bar
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // WHEN: NavigationRail renders
    // THEN: "Contactos" entry is marked as active
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="true"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7: Unknown route displays 404 view gracefully
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Unknown route renders 404 view without crashing', () => {
  test('should display a 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    // Network-first: prepare before navigation
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-path-xyz');
    await appLoad;

    // WHEN: Page loads
    // THEN: 404 not-found view is rendered
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should show "Página no encontrada" text on the 404 view', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-path-xyz');
    await appLoad;

    // WHEN: 404 view is rendered
    // THEN: Spanish "Página no encontrada" text is visible
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('Página no encontrada');
  });

  test('should show a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: User sees 404 view
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-path-xyz');
    await appLoad;

    // WHEN: 404 view is rendered
    // THEN: A link to /clientes is present and accessible
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
  });

  test('should NOT crash the application when navigating to an unknown route', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-path-xyz');
    await appLoad;

    // WHEN: Page loads
    // THEN: No JavaScript runtime errors occur
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8: Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Root path / redirects automatically to /clientes', () => {
  test('should redirect from / to /clientes when accessing the root path', async ({ page }) => {
    // GIVEN: User accesses the root path /
    // Network-first: register response listener BEFORE navigation
    const redirectPromise = page.waitForURL('/clientes');
    await page.goto('/');

    // WHEN: Page loads
    // THEN: User is redirected to /clientes automatically
    await redirectPromise;
    await expect(page).toHaveURL('/clientes');
  });

  test('should render ClientesShellView after redirect from root /', async ({ page }) => {
    // GIVEN: User accesses root /
    await page.goto('/');
    await page.waitForURL('/clientes');

    // WHEN: Redirect completes
    // THEN: ClientesShellView content is visible
    await expect(page.locator('[data-testid="clientes-shell-view"]')).toBeVisible();
  });
});
