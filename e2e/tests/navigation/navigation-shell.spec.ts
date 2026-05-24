/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible on viewport >= 1024px with Clientes and Contactos entries
 *   AC2 — Mobile NavigationBar visible on viewport < 1024px with accessible entries
 *   AC3 — Click "Clientes" changes URL to /clientes, renders Clientes view without full page reload
 *   AC4 — Click "Contactos" changes URL to /contactos, renders Contactos view without full page reload
 *
 * AC5-AC8 tests are in navigation-shell.routing.spec.ts
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport >= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail on wide viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: Application loads on a desktop browser (viewport >= 1024px)
    // Network-first: intercept route BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // THEN: NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Application loads on a desktop browser (viewport >= 1024px)
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // THEN: "Clientes" nav entry is visible
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Application loads on a desktop browser (viewport >= 1024px)
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // THEN: "Contactos" nav entry is visible
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should visually highlight the active route entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Application loads on desktop and user is at /clientes
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: The "Clientes" nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT show NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: Application loads on a desktop browser (viewport >= 1024px)
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // THEN: NavigationBar (mobile) is NOT visible on desktop
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar on narrow viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test('should show NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: Application loads on a mobile browser (viewport < 1024px)
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // THEN: NavigationBar is visible at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should display "Clientes" entry accessible and tappable in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Application loads on mobile
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // THEN: "Clientes" nav entry is visible and enabled in the bottom bar
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeEnabled();
  });

  test('should display "Contactos" entry accessible and tappable in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Application loads on mobile
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // THEN: "Contactos" nav entry is visible and enabled in the bottom bar
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeEnabled();
  });

  test('should NOT show NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Application loads on mobile
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // THEN: NavigationRail (desktop) is NOT visible on mobile
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Click "Clientes" navigates to /clientes without full page reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Clientes navigation without full page reload', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should change URL to /clientes when clicking Clientes nav item', async ({ page }) => {
    // GIVEN: The user is on the application
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // WHEN: The user clicks "Clientes" in the navigation
    await page.click('[data-testid="nav-item-clientes"]');

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('should render Clientes placeholder view after clicking Clientes nav item', async ({ page }) => {
    // GIVEN: The user is at the application root
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // WHEN: The user clicks "Clientes" in the navigation
    await page.click('[data-testid="nav-item-clientes"]');

    // THEN: Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should navigate to /clientes without triggering a full page reload', async ({ page }) => {
    // GIVEN: The user is on the Contactos view (to establish a prior state)
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/contactos');

    // Track navigation type: full reload = 'navigate', SPA = 'pushState' / no reload event
    let fullReloadOccurred = false;
    page.on('framenavigated', (frame) => {
      // A framenavigated on the main frame triggered by a link click indicates SPA navigation
      // We distinguish it from a full reload by checking if it is a same-document navigation
      if (frame === page.mainFrame()) {
        // This fires for both SPA and full reloads; we detect full reload separately
      }
    });
    // Full page reload would trigger 'load' event on the page
    // For SPA transitions the DOM persists; we verify by checking navigation shell is still present
    // after the click without re-requesting index.html
    page.on('request', (req) => {
      if (req.url().includes('localhost:5173') && req.resourceType() === 'document') {
        fullReloadOccurred = true;
      }
    });

    // WHEN: The user clicks "Clientes"
    await page.click('[data-testid="nav-item-clientes"]');
    await expect(page).toHaveURL('/clientes');

    // THEN: No new document request (no full reload) after the initial page load
    // The navigation shell persists — verifying no full reload happened
    expect(fullReloadOccurred).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Click "Contactos" navigates to /contactos without full page reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Contactos navigation without full page reload', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should change URL to /contactos when clicking Contactos nav item', async ({ page }) => {
    // GIVEN: The user is on the application
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // WHEN: The user clicks "Contactos" in the navigation
    await page.click('[data-testid="nav-item-contactos"]');

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');
  });

  test('should render Contactos placeholder view after clicking Contactos nav item', async ({ page }) => {
    // GIVEN: The user is at the application root
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // WHEN: The user clicks "Contactos" in the navigation
    await page.click('[data-testid="nav-item-contactos"]');

    // THEN: Contactos view is rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should keep the navigation shell visible after navigating to Contactos', async ({ page }) => {
    // GIVEN: The user is on the application
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/');

    // WHEN: The user clicks "Contactos"
    await page.click('[data-testid="nav-item-contactos"]');
    await expect(page).toHaveURL('/contactos');

    // THEN: Navigation shell (rail or bar) is still present — no full page reload occurred
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });
});

// AC5-AC8 tests are in navigation-shell.routing.spec.ts
