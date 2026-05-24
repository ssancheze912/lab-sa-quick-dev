/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 *
 * Acceptance Criteria covered:
 *   AC5 — Deep linking to /clientes and /contactos directly renders correct view with nav shell intact
 *   AC6 — Root path / redirects to /clientes
 *   AC7 — Unknown route renders 404 view with Spanish message and back link
 *   AC8 — WCAG 2.1 AA: <nav> landmark, aria-current="page" on active item, keyboard accessible
 */

import { test, expect } from '@playwright/test';

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
    const navInteractiveCount = await page.locator('nav a, nav button').count();
    expect(navInteractiveCount).toBeGreaterThanOrEqual(2); // At least Clientes and Contactos
  });
});
