/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop (≥ 1024px) with Clientes and Contactos entries
 *   AC2 — Navigation changes route without full page reload; active item updates visual state
 *   AC3 — NavigationBar (bottom tab bar) shown on mobile (< 1024px)
 *   AC4 — Direct URL /clientes renders Clientes view; NavigationRail/Bar shows Clientes active
 *   AC5 — Direct URL /contactos renders Contactos view; NavigationRail/Bar shows Contactos active
 *   AC6 — Unknown routes display a 404 view in Spanish with a link back to /clientes
 *   AC7 — Root route / redirects automatically to /clientes without a blank page
 *   AC8 — App shell uses LayoutBase with Navbar (64px) containing Siesa logo and "Siesa Agents"
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail on desktop (viewport ≥ 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — NavigationRail visible on desktop viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display the NavigationRail on the left side of the app shell', async ({ page }) => {
    // GIVEN: Application is loaded on a desktop browser (viewport ≥ 1024px)
    // Network-first: listen for responses BEFORE navigation
    await page.route('**/*', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail component is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should show "Clientes" entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Application is loaded on desktop
    await page.goto('/clientes');

    // WHEN: The user views the NavigationRail
    // THEN: A "Clientes" navigation entry is visible
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should show "Contactos" entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Application is loaded on desktop
    await page.goto('/clientes');

    // WHEN: The user views the NavigationRail
    // THEN: A "Contactos" navigation entry is visible
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should apply active visual state to the active NavigationRail item', async ({ page }) => {
    // GIVEN: Application is loaded on desktop with /clientes as current route
    await page.goto('/clientes');

    // WHEN: The user views the NavigationRail
    // THEN: The "Clientes" item has the active CSS classes (primary-50 background + primary-700 text)
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toHaveAttribute('data-active', 'true');
  });

  test('should not show NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: Application is loaded on desktop (viewport ≥ 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: The mobile NavigationBar is NOT visible
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Navigation changes route without full page reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Client-side navigation without full page reload', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should update URL to /clientes when clicking the Clientes nav item', async ({ page }) => {
    // GIVEN: The user is on the app (starting from /contactos)
    await page.goto('/contactos');

    // WHEN: The user clicks "Clientes" in the NavigationRail
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: The URL updates to /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should update URL to /contactos when clicking the Contactos nav item', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');

    // WHEN: The user clicks "Contactos" in the NavigationRail
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: The URL updates to /contactos
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('should not trigger a full page reload when navigating between sections', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');

    // Track page navigation events (a full reload would fire a load event)
    let fullReloadOccurred = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame() && frame.url().includes('/contactos')) {
        fullReloadOccurred = true;
      }
    });

    // Set a marker in sessionStorage — it survives client-side navigation but NOT full reloads
    await page.evaluate(() => {
      sessionStorage.setItem('nav-marker', 'present');
    });

    // WHEN: The user clicks "Contactos"
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: The sessionStorage marker is still present (no full reload occurred)
    const marker = await page.evaluate(() => sessionStorage.getItem('nav-marker'));
    expect(marker).toBe('present');
  });

  test('should update the active visual state on the Contactos nav item after navigation', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');

    // WHEN: The user clicks "Contactos"
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: The Contactos nav item is active
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toHaveAttribute('data-active', 'true');
  });

  test('should deactivate the Clientes nav item when navigating to Contactos', async ({ page }) => {
    // GIVEN: The user is on /clientes (Clientes is active)
    await page.goto('/clientes');

    // WHEN: The user navigates to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: The Clientes nav item is no longer active
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — NavigationBar (mobile bottom tab bar) shown on mobile viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — NavigationBar visible on mobile viewport (< 1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should display the NavigationBar (bottom tab bar) on mobile', async ({ page }) => {
    // GIVEN: Application is loaded on a mobile browser (viewport < 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: The NavigationBar component is displayed
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should show Clientes entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Application is loaded on mobile
    await page.goto('/clientes');

    // WHEN: The user views the NavigationBar
    // THEN: The Clientes tab is visible
    await expect(page.locator('[data-testid="nav-bar-item-clientes"]')).toBeVisible();
  });

  test('should show Contactos entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Application is loaded on mobile
    await page.goto('/clientes');

    // WHEN: The user views the NavigationBar
    // THEN: The Contactos tab is visible
    await expect(page.locator('[data-testid="nav-bar-item-contactos"]')).toBeVisible();
  });

  test('should have touch targets of at least 44px height for NavigationBar items', async ({ page }) => {
    // GIVEN: Application is loaded on mobile
    await page.goto('/clientes');

    // WHEN: Measuring touch target sizes
    const clientesItem = page.locator('[data-testid="nav-bar-item-clientes"]');

    // THEN: Each nav item has a minimum height of 44px (WCAG touch target requirement)
    const box = await clientesItem.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should hide the NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Application is loaded on mobile (viewport < 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: The desktop NavigationRail is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Direct URL /clientes renders Clientes view correctly
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Deep linking to /clientes renders correctly', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view content is rendered
    await expect(page.locator('[data-testid="clientes-placeholder"]')).toBeVisible();
  });

  test('should show Clientes as the active nav item when at /clientes via direct URL', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The NavigationRail shows "Clientes" as active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('should NOT redirect to a home screen when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The current URL remains /clientes (no unwanted redirect)
    await expect(page).toHaveURL(/\/clientes/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Direct URL /contactos renders Contactos view correctly
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Deep linking to /contactos renders correctly', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view content is rendered
    await expect(page.locator('[data-testid="contactos-placeholder"]')).toBeVisible();
  });

  test('should show Contactos as the active nav item when at /contactos via direct URL', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The NavigationRail shows "Contactos" as active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });

  test('should NOT redirect to a home screen when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The current URL remains /contactos (no unwanted redirect)
    await expect(page).toHaveURL(/\/contactos/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Unknown routes show a 404 page in Spanish
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — 404 Not Found page for unknown routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display a 404 view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/ruta-inexistente');

    // THEN: A 404 page is rendered (data-testid="not-found-page")
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
  });

  test('should display the Spanish heading "Página no encontrada" on the 404 page', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route /unknown
    // WHEN: The page loads
    await page.goto('/unknown');

    // THEN: The heading reads "Página no encontrada" in Spanish
    await expect(page.locator('[data-testid="not-found-heading"]')).toHaveText('Página no encontrada');
  });

  test('should show a link back to /clientes on the 404 page', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    await page.goto('/abc');

    // WHEN: The user sees the 404 page
    const backLink = page.locator('[data-testid="not-found-back-link"]');

    // THEN: A link back to /clientes is available
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/clientes');
  });

  test('should navigate to /clientes when clicking the back link on the 404 page', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    await page.goto('/ruta-invalida');

    // WHEN: The user clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: The user lands on /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Root route / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Root route / redirects to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The user accesses the root route /
    // Network-first: intercept BEFORE navigation
    const navigationPromise = page.waitForURL(/\/clientes/);

    // WHEN: The page loads
    await page.goto('/');
    await navigationPromise;

    // THEN: The user is on /clientes (automatic redirect)
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should not display a blank page when accessing root route /', async ({ page }) => {
    // GIVEN: The user accesses the root route /
    // WHEN: The page loads (and redirect fires)
    await page.goto('/');
    await page.waitForURL(/\/clientes/);

    // THEN: The Clientes view content is rendered (not a blank page)
    await expect(page.locator('[data-testid="clientes-placeholder"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — App shell uses LayoutBase with Navbar (64px) and Siesa branding
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — App shell layout with Navbar and Siesa branding', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display the Navbar across all routes', async ({ page }) => {
    // GIVEN: The app shell is rendered on /clientes
    await page.goto('/clientes');

    // WHEN: Any view is displayed
    // THEN: The top Navbar is visible
    await expect(page.locator('[data-testid="app-navbar"]')).toBeVisible();
  });

  test('should display the product name "Siesa Agents" in the Navbar', async ({ page }) => {
    // GIVEN: The app shell is rendered
    await page.goto('/clientes');

    // WHEN: The user views the Navbar
    // THEN: The product name "Siesa Agents" is shown
    await expect(page.locator('[data-testid="navbar-product-name"]')).toHaveText('Siesa Agents');
  });

  test('should display the Siesa logo or symbol in the Navbar', async ({ page }) => {
    // GIVEN: The app shell is rendered
    await page.goto('/clientes');

    // WHEN: The user views the Navbar
    // THEN: The Siesa brand symbol/logo is visible
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible();
  });

  test('should keep the Navbar visible on the /contactos route', async ({ page }) => {
    // GIVEN: The app is navigated to /contactos
    await page.goto('/contactos');

    // WHEN: The Contactos view is displayed
    // THEN: The Navbar remains visible and consistent
    await expect(page.locator('[data-testid="app-navbar"]')).toBeVisible();
  });

  test('should keep the Navbar visible on the 404 route', async ({ page }) => {
    // GIVEN: The user is on an unknown route
    await page.goto('/any-unknown-path');

    // WHEN: The 404 view is displayed
    // THEN: The Navbar is still visible (consistent across all routes)
    await expect(page.locator('[data-testid="app-navbar"]')).toBeVisible();
  });

  test('should render the app shell using the LayoutBase structure (NavigationRail + content area)', async ({
    page,
  }) => {
    // GIVEN: Desktop viewport, any route
    await page.goto('/clientes');

    // WHEN: The layout is rendered
    // THEN: The LayoutBase wrapper element is present in DOM
    await expect(page.locator('[data-testid="layout-base"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — WCAG 2.1 AA compliance (referenced in AC1, AC3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — Navigation WCAG 2.1 AA', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have aria-label="Navegación principal" on the navigation wrapper', async ({ page }) => {
    // GIVEN: The app shell is rendered
    await page.goto('/clientes');

    // WHEN: Screen reader inspects the navigation
    // THEN: The nav wrapper has the correct Spanish aria-label
    const nav = page.locator('[data-testid="main-nav"]');
    await expect(nav).toHaveAttribute('aria-label', 'Navegación principal');
  });

  test('should have aria-current="page" on the active navigation item', async ({ page }) => {
    // GIVEN: The current route is /clientes
    await page.goto('/clientes');

    // WHEN: Screen reader inspects the active nav item
    // THEN: aria-current="page" is present on the Clientes item
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT have aria-current="page" on inactive navigation items', async ({ page }) => {
    // GIVEN: The current route is /clientes
    await page.goto('/clientes');

    // WHEN: Screen reader inspects the Contactos nav item
    // THEN: aria-current is not "page" on the Contactos item
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).not.toHaveAttribute('aria-current', 'page');
  });
});
