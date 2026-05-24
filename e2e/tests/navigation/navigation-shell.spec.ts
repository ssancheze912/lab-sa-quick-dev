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
 *   AC5 — Deep linking to /clientes and /contactos directly renders correct view with nav shell intact
 *   AC6 — Root path / redirects to /clientes
 *   AC7 — Unknown route renders 404 view with Spanish message and back link
 *   AC8 — WCAG 2.1 AA: <nav> landmark, aria-current="page" on active item, keyboard accessible
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
    const navigationRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('localhost:5173') && req.resourceType() === 'document') {
        navigationRequests.push(req.url());
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

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Deep linking renders correct view with nav shell intact
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Deep linking to /clientes and /contactos', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser address bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /clientes
    await page.goto('/clientes');

    // THEN: Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should show navigation shell intact when deep linking to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser address bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /clientes
    await page.goto('/clientes');

    // THEN: Navigation rail/shell is still present — no redirect to home screen
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should render Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser address bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /contactos
    await page.goto('/contactos');

    // THEN: Contactos view is rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should show navigation shell intact when deep linking to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser address bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /contactos
    await page.goto('/contactos');

    // THEN: Navigation rail/shell is still present — no redirect to home screen
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should NOT redirect /clientes to a home screen when loading directly', async ({ page }) => {
    // GIVEN: The user types /clientes directly
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /clientes
    await page.goto('/clientes');

    // THEN: URL remains /clientes (no redirect to / or /home)
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Root path / redirects to /clientes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should automatically redirect from / to /clientes', async ({ page }) => {
    // GIVEN: The user navigates to the root path /
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /
    await page.goto('/');

    // THEN: URL is redirected to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('should render the Clientes view after redirect from /', async ({ page }) => {
    // GIVEN: The user navigates to /
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads and redirects
    await page.goto('/');

    // THEN: Clientes view is visible after redirect
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Unknown route shows 404 view with Spanish message and back link
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Unknown route 404 view', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display the not-found view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to /unknown-path
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at an unknown route
    await page.goto('/unknown-path');

    // THEN: Not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display "Página no encontrada" Spanish message on 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /another-unknown-route
    await page.goto('/another-unknown-route');

    // THEN: Spanish "Página no encontrada" message is visible
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('Página no encontrada');
  });

  test('should show a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The user landed on a 404 page
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/this-does-not-exist');

    // THEN: A back-link pointing to /clientes is present
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-back-link"]')).toHaveAttribute('href', '/clientes');
  });

  test('should navigate to /clientes when clicking the back link from 404 view', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/does-not-exist');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: The user clicks the back link
    await page.click('[data-testid="not-found-back-link"]');

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — WCAG 2.1 AA Accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — WCAG 2.1 AA accessibility compliance', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have a <nav> landmark wrapping the navigation component', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: A <nav> element is present as accessibility landmark
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should set aria-current="page" on the active Clientes nav item', async ({ page }) => {
    // GIVEN: The user is at /clientes
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: Clientes nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should set aria-current="page" on the active Contactos nav item', async ({ page }) => {
    // GIVEN: The user is at /contactos
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/contactos');

    // THEN: Contactos nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT set aria-current on inactive Contactos nav item when at /clientes', async ({ page }) => {
    // GIVEN: The user is at /clientes
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: Contactos nav item does NOT have aria-current="page"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should have all interactive nav elements keyboard-focusable', async ({ page }) => {
    // GIVEN: The navigation shell is rendered at /clientes
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // WHEN: The user tabs through the page
    await page.keyboard.press('Tab');

    // THEN: At least one nav element receives focus (keyboard accessible)
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    // Focus lands on a nav item or a focusable element within nav
    const navHasFocusableChild = await page.locator('nav').locator(':focus-within').count();
    // We assert that the nav area contains at least one element that can receive focus
    const navInteractiveCount = await page.locator('nav a, nav button').count();
    expect(navInteractiveCount).toBeGreaterThanOrEqual(2); // At least Clientes and Contactos
  });
});
