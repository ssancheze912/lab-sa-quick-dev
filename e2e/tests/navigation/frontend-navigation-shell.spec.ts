/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible with Clientes & Contactos entries (FR28)
 *   AC2 — Mobile NavigationBar visible at bottom (FR29)
 *   AC3 — Deep linking to /clientes and /contactos with active state highlight (FR30)
 *   AC4 — 404 not-found view rendered gracefully with Spanish message and return link
 *   AC5 — Navigation landmark accessible to screen readers with Spanish aria-label (WCAG 2.1 AA)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport >= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (viewport >= 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the NavigationRail on the left side on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)

    // Network-first: intercept any API calls BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A NavigationRail component is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display "Clientes" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A "Clientes" entry is visible in the NavigationRail
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A "Contactos" entry is visible in the NavigationRail
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without a full page reload when clicking Clientes', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');

    // WHEN: The user clicks the "Clientes" navigation entry
    const navigationPromise = page.waitForURL('**/clientes');
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await navigationPromise;

    // THEN: The URL changes to /clientes without a full page reload
    expect(page.url()).toContain('/clientes');
  });

  test('should navigate to /contactos without a full page reload when clicking Contactos', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The user clicks the "Contactos" navigation entry
    const navigationPromise = page.waitForURL('**/contactos');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await navigationPromise;

    // THEN: The URL changes to /contactos without a full page reload
    expect(page.url()).toContain('/contactos');
  });

  test('should NOT render the NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationBar is NOT visible (hidden on desktop)
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (viewport < 1024px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should render the NavigationBar at the bottom on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A NavigationBar component is displayed at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should have the "Clientes" nav item accessible and tappable on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The "Clientes" navigation item is accessible and tappable
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeEnabled();
  });

  test('should have the "Contactos" nav item accessible and tappable on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The "Contactos" navigation item is accessible and tappable
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeEnabled();
  });

  test('should NOT render the NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail is NOT visible (hidden on mobile)
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking with active state highlight (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking to /clientes and /contactos (FR30)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered (no redirect)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered (no redirect)
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should highlight the Clientes nav item as active when on /clientes route', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /clientes
    await page.goto('/clientes');

    // THEN: The Clientes nav item has the active state indicator
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).toBeVisible();
  });

  test('should highlight the Contactos nav item as active when on /contactos route', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /contactos
    await page.goto('/contactos');

    // THEN: The Contactos nav item has the active state indicator
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="true"]')).toBeVisible();
  });

  test('should redirect root path / to /clientes', async ({ page }) => {
    // GIVEN: The user navigates to the root path /
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: The user is redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 Not-Found view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 not-found view for unknown routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render a 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route (e.g., /unknown-path)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/unknown-path');

    // THEN: A 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display an error message in Spanish on the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/unknown-path');

    // THEN: A message in Spanish is displayed on the 404 view
    await expect(page.locator('[data-testid="not-found-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('no encontrada');
  });

  test('should display a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/unknown-path');

    // THEN: A link back to /clientes is visible
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-back-link"]')).toHaveAttribute('href', '/clientes');
  });

  test('should navigate back to /clientes when clicking the return link on 404 view', async ({ page }) => {
    // GIVEN: The user is on the 404 not-found view
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/unknown-path');
    await page.locator('[data-testid="not-found-view"]').waitFor({ state: 'visible' });

    // WHEN: The user clicks the "Volver a Clientes" link
    const navigationPromise = page.waitForURL('**/clientes');
    await page.locator('[data-testid="not-found-back-link"]').click();
    await navigationPromise;

    // THEN: The user is redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Accessibility: navigation landmark announced in Spanish (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Navigation accessibility (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have a navigation landmark with an accessible label in Spanish', async ({ page }) => {
    // GIVEN: The application shell is rendered
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: A screen reader user navigates the page
    await page.goto('/clientes');

    // THEN: The navigation landmark has aria-label="Navegación principal" in Spanish
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();
  });

  test('should use a <nav> element as the navigation landmark wrapper', async ({ page }) => {
    // GIVEN: The application shell is rendered
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: A semantic <nav> element exists as the navigation wrapper
    await expect(page.locator('[data-testid="navigation-landmark"]')).toBeVisible();
  });
});
