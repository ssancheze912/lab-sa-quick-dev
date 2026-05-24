/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail visible on left side with Clientes and Contactos entries
 *   AC2 — Mobile: NavigationBar displayed at bottom with all items accessible
 *   AC3 — Deep linking: direct URL navigation renders correct view with active item
 *   AC4 — Unknown route: 404 / not-found view displays in Spanish with return link
 *   AC5 — Root redirect: accessing `/` redirects to `/clientes`
 *   AC6 — Active state: navigation item reflects current route at all times
 *
 * Required data-testid attributes (implementation must add these):
 *   - nav-rail            → NavigationRail wrapper element (desktop)
 *   - nav-bar             → NavigationBar wrapper element (mobile)
 *   - nav-item-clientes   → Clientes navigation item/link
 *   - nav-item-contactos  → Contactos navigation item/link
 *   - nav-item-active     → Currently active navigation item (or aria-current="page")
 *   - clientes-view       → Root element of the /clientes route view
 *   - contactos-view      → Root element of the /contactos route view
 *   - not-found-view      → Root element of the 404 not-found view
 *   - not-found-message   → Text message element in 404 page
 *   - not-found-link      → Return link in 404 page
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail visible on left side (viewport >= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // Network-first: register listener BEFORE navigation
    const pageLoaded = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await pageLoaded;

    // WHEN: The user views the app

    // THEN: A NavigationRail component is visible on the left side
    await expect(page.locator('[data-testid="nav-rail"]')).toBeVisible();
  });

  test('should display Clientes entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');

    // WHEN: The user views the navigation rail

    // THEN: A "Clientes" navigation entry is visible
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display Contactos entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');

    // WHEN: The user views the navigation rail

    // THEN: A "Contactos" navigation entry is visible
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/contactos');

    // Capture navigation events to verify no full page reload (SPA navigation)
    const navigationPromise = page.waitForURL('**/clientes', { waitUntil: 'networkidle' });

    // WHEN: The user clicks the Clientes navigation entry
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await navigationPromise;

    // THEN: The URL is /clientes and the correct view is rendered
    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should navigate to /contactos without full page reload when clicking Contactos', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');

    const navigationPromise = page.waitForURL('**/contactos', { waitUntil: 'networkidle' });

    // WHEN: The user clicks the Contactos navigation entry
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await navigationPromise;

    // THEN: The URL is /contactos and the correct view is rendered
    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should NOT display NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app

    // THEN: The mobile NavigationBar is NOT visible
    await expect(page.locator('[data-testid="nav-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile: NavigationBar at bottom (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 equivalent

  test('should render NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    const pageLoaded = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await pageLoaded;

    // WHEN: The user views the app

    // THEN: A NavigationBar component is displayed at the bottom
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
  });

  test('should display Clientes item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport
    await page.goto('/clientes');

    // WHEN: The user views the navigation bar

    // THEN: The Clientes item is accessible and tappable
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toBeVisible();
    await expect(clientesItem).toBeEnabled();
  });

  test('should display Contactos item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport
    await page.goto('/clientes');

    // WHEN: The user views the navigation bar

    // THEN: The Contactos item is accessible and tappable
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toBeVisible();
    await expect(contactosItem).toBeEnabled();
  });

  test('should NOT display NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    await page.goto('/clientes');

    // WHEN: The user views the app

    // THEN: The desktop NavigationRail is NOT visible
    await expect(page.locator('[data-testid="nav-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL navigation renders correct view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep Linking', () => {
  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The correct view is rendered without redirection
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    expect(page.url()).toContain('/clientes');
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The correct view is rendered without redirection
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
    expect(page.url()).toContain('/contactos');
  });

  test('should highlight the Clientes nav item as active when on /clientes via deep link', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    await page.goto('/clientes');

    // WHEN: The page loads

    // THEN: The Clientes navigation item is highlighted as active
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight the Contactos nav item as active when on /contactos via deep link', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    await page.goto('/contactos');

    // WHEN: The page loads

    // THEN: The Contactos navigation item is highlighted as active
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route: 404 / not-found view in Spanish
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not-Found Route', () => {
  test('should display the not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route (e.g., /foo)
    // WHEN: The page loads
    await page.goto('/foo-ruta-inexistente');

    // THEN: A 404 / not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display a message in Spanish on the 404 page', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.goto('/ruta-que-no-existe');

    // WHEN: The page loads

    // THEN: A Spanish message is displayed gracefully
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('should display a return link on the 404 page', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    await page.goto('/ruta-desconocida');

    // WHEN: The user sees the not-found view

    // THEN: A link to return to the application is available
    const returnLink = page.locator('[data-testid="not-found-link"]');
    await expect(returnLink).toBeVisible();
    await expect(returnLink).toBeEnabled();
  });

  test('should navigate back to /clientes when clicking the return link on the 404 page', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    await page.goto('/ruta-desconocida');

    const navigationPromise = page.waitForURL('**/clientes', { waitUntil: 'networkidle' });

    // WHEN: The user clicks the return link
    await page.locator('[data-testid="not-found-link"]').click();
    await navigationPromise;

    // THEN: The user is taken to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root redirect: `/` redirects to `/clientes`
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root Path Redirect', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The root path `/` is accessed
    // Network-first: intercept before navigation
    const redirected = page.waitForURL('**/clientes', { waitUntil: 'networkidle' });

    // WHEN: The page loads
    await page.goto('/');
    await redirected;

    // THEN: The user is automatically redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('should render the Clientes view after the root redirect', async ({ page }) => {
    // GIVEN: The root path `/` is accessed and redirected
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // WHEN: The redirect completes

    // THEN: The Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Active state: navigation item reflects current route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Active Navigation State', () => {
  test('should mark Clientes nav item as active when user is on /clientes', async ({ page }) => {
    // GIVEN: The application is running
    await page.goto('/clientes');

    // WHEN: The user is on the /clientes route

    // THEN: The Clientes navigation item reflects the active state
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should mark Contactos nav item as active when user is on /contactos', async ({ page }) => {
    // GIVEN: The application is running
    await page.goto('/contactos');

    // WHEN: The user is on the /contactos route

    // THEN: The Contactos navigation item reflects the active state
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should update active nav item when user navigates from /clientes to /contactos', async ({ page }) => {
    // GIVEN: The user is currently on /clientes
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');

    const navigationPromise = page.waitForURL('**/contactos');

    // WHEN: The user navigates to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await navigationPromise;

    // THEN: The Contactos item is now active (Clientes is no longer active)
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark Contactos as active when user is on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');

    // WHEN: The user views the navigation

    // THEN: The Contactos item does NOT have the active state
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — WCAG 2.1 AA compliance
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — Navigation Shell WCAG 2.1 AA', () => {
  test('should have a navigation landmark with aria-label in Spanish', async ({ page }) => {
    // GIVEN: The application is loaded
    await page.goto('/clientes');

    // WHEN: The user inspects the navigation structure

    // THEN: A nav landmark with accessible label exists
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();
  });

  test('should have keyboard-accessible navigation items (Tab navigation)', async ({ page }) => {
    // GIVEN: The application is loaded
    await page.goto('/clientes');

    // WHEN: The user presses Tab to focus through navigation items

    // THEN: The Clientes nav item is reachable via keyboard
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    // The first focusable nav item should be nav-item-clientes or nav-item-contactos
    expect(['nav-item-clientes', 'nav-item-contactos']).toContain(focusedElement ?? '');
  });
});
