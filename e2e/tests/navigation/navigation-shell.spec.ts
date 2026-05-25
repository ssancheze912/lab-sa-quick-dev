/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop (≥1024px) with Clientes and Contactos entries; SPA navigation
 *   AC2 — Mobile NavigationBar visible on mobile viewport (≥375px); all items accessible
 *   AC3 — Deep linking: /clientes and /contactos render correct views without redirect
 *   AC4 — Active navigation item is visually marked when on the matching route
 *   AC5 — Unknown route shows a 404 not-found view with a link back to /clientes
 *   AC6 — Root path / redirects automatically to /clientes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Root / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Root path redirect', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The user accesses the root path /
    // Network-first: intercept navigation response BEFORE navigating
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200,
    );

    // WHEN: The page loads
    await page.goto('/');
    await responsePromise;

    // THEN: The URL is redirected to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail is visible and provides SPA navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop navigation rail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display the navigation rail on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (≥ 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The navigation rail container is visible
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });

  test('should show "Clientes" navigation item in the rail', async ({ page }) => {
    // GIVEN: Desktop viewport with navigation rail rendered
    // WHEN: The user views the navigation rail
    await page.goto('/clientes');

    // THEN: A navigation entry labeled "Clientes" is visible
    await expect(page.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('should show "Contactos" navigation item in the rail', async ({ page }) => {
    // GIVEN: Desktop viewport with navigation rail rendered
    // WHEN: The user views the navigation rail
    await page.goto('/clientes');

    // THEN: A navigation entry labeled "Contactos" is visible
    await expect(page.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('should navigate to /clientes without a full page reload when clicking Clientes', async ({ page }) => {
    // GIVEN: The user is on /contactos and the app is loaded
    await page.goto('/contactos');

    // Track whether a full navigation occurs (full reload resets navigation entries)
    const navigationEvents: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationEvents.push(frame.url());
      }
    });

    // WHEN: The user clicks the Clientes navigation item
    await page.getByTestId('nav-item-clientes').click();

    // THEN: The URL changes to /clientes
    await expect(page).toHaveURL('/clientes');

    // AND: No full page reload occurred (SPA navigation — only 1 navigation in total from goto)
    const clientesNavigations = navigationEvents.filter((url) => url.includes('/clientes'));
    expect(clientesNavigations.length).toBeLessThanOrEqual(1);
  });

  test('should navigate to /contactos without a full page reload when clicking Contactos', async ({ page }) => {
    // GIVEN: The user is on /clientes and the app is loaded
    await page.goto('/clientes');

    // WHEN: The user clicks the Contactos navigation item
    await page.getByTestId('nav-item-contactos').click();

    // THEN: The URL changes to /contactos
    await expect(page).toHaveURL('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar is visible on mobile viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile navigation bar', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro dimensions

  test('should display the mobile navigation bar on a mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (≥ 375px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The mobile navigation bar is visible
    await expect(page.getByTestId('navigation-bar-mobile')).toBeVisible();
  });

  test('should NOT display the desktop navigation rail on a mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The navigation rail is not visible (hidden by responsive breakpoint)
    await expect(page.getByTestId('navigation-rail')).toBeHidden();
  });

  test('should show "Clientes" navigation item in the mobile bar', async ({ page }) => {
    // GIVEN: Mobile viewport with bottom navigation bar rendered
    // WHEN: The user views the navigation bar
    await page.goto('/clientes');

    // THEN: "Clientes" item is visible and tappable
    await expect(page.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('should show "Contactos" navigation item in the mobile bar', async ({ page }) => {
    // GIVEN: Mobile viewport with bottom navigation bar rendered
    // WHEN: The user views the navigation bar
    await page.goto('/clientes');

    // THEN: "Contactos" item is visible and tappable
    await expect(page.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('should navigate to /contactos when tapping Contactos on mobile', async ({ page }) => {
    // GIVEN: The user is on /clientes on a mobile device
    await page.goto('/clientes');

    // WHEN: The user taps the Contactos navigation item
    await page.getByTestId('nav-item-contactos').tap();

    // THEN: The URL changes to /contactos (SPA navigation)
    await expect(page).toHaveURL('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL access renders the correct view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking', () => {
  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered (identified by its page title)
    await expect(page.getByTestId('clientes-page-title')).toBeVisible();
  });

  test('should NOT redirect away from /clientes when accessed directly', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The URL remains /clientes (no redirect to home or another page)
    await expect(page).toHaveURL('/clientes');
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered (identified by its page title)
    await expect(page.getByTestId('contactos-page-title')).toBeVisible();
  });

  test('should NOT redirect away from /contactos when accessed directly', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The URL remains /contactos
    await expect(page).toHaveURL('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Active navigation item is visually marked for current route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Active navigation item state', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should mark the Clientes item as active when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    // WHEN: The navigation rail is rendered
    await page.goto('/clientes');

    // THEN: The Clientes nav item has the active attribute/class
    const clientesItem = page.getByTestId('nav-item-clientes');
    await expect(clientesItem).toHaveAttribute('aria-current', 'page');
  });

  test('should mark the Contactos item as active when on /contactos', async ({ page }) => {
    // GIVEN: The user is on /contactos
    // WHEN: The navigation rail is rendered
    await page.goto('/contactos');

    // THEN: The Contactos nav item has the active attribute/class
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark Contactos as active when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    // WHEN: The navigation rail is rendered
    await page.goto('/clientes');

    // THEN: The Contactos nav item does NOT have aria-current="page"
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).not.toHaveAttribute('aria-current', 'page');
  });

  test('should update active state after navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: The user starts on /clientes
    await page.goto('/clientes');

    // WHEN: The user clicks the Contactos navigation item
    await page.getByTestId('nav-item-contactos').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: Contactos item is now active and Clientes item is not
    await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Unknown route shows a 404 / not-found view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — 404 not-found view', () => {
  test('should display a 404 not-found view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route (e.g., /unknown)
    // WHEN: The page loads
    await page.goto('/unknown-route-that-does-not-exist');

    // THEN: The 404 not-found view is displayed
    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });

  test('should display a graceful message on the 404 view in Spanish', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The 404 view is rendered
    await page.goto('/ruta-inexistente');

    // THEN: A Spanish message indicating the page was not found is visible
    await expect(page.getByTestId('not-found-message')).toBeVisible();
    await expect(page.getByTestId('not-found-message')).toContainText('encontrada');
  });

  test('should display a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The user sees the 404 not-found view
    // WHEN: The 404 view is rendered
    await page.goto('/ruta-inexistente');

    // THEN: A link to /clientes is present and visible
    await expect(page.getByTestId('not-found-back-link')).toBeVisible();
  });

  test('should navigate to /clientes when clicking the back link on the 404 view', async ({ page }) => {
    // GIVEN: The user is on the 404 not-found view
    await page.goto('/ruta-inexistente');
    await expect(page.getByTestId('not-found-view')).toBeVisible();

    // WHEN: The user clicks the "Ir a Clientes" link
    await page.getByTestId('not-found-back-link').click();

    // THEN: The user is navigated to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});
