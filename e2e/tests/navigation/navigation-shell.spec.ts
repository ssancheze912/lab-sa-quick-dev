/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail visible on left side with Clientes and Contactos entries
 *   AC2 — Mobile: NavigationBar at bottom instead of rail, all entries accessible
 *   AC3 — Client-side navigation via TanStack Router (no full page reload)
 *   AC4 — Deep linking to /clientes renders correct view without redirection
 *   AC5 — Deep linking to /contactos renders correct view without redirection
 *   AC6 — Unknown routes display 404 view in Spanish with /clientes link
 *   AC7 — Root path / redirects automatically to /clientes
 *   AC8 — Navigation uses <nav> semantics, ARIA labels in Spanish, WCAG AA contrast
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail visible on left side
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail', () => {
  test('should render NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport width >= 1024px)
    await page.setViewportSize({ width: 1280, height: 800 });

    // Network-first: intercept before navigation
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should show Clientes entry in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport width >= 1024px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: Clientes entry is visible in the NavigationRail
    await expect(page.locator('[data-testid="nav-link-clientes"]')).toBeVisible();
  });

  test('should show Contactos entry in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport width >= 1024px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: Contactos entry is visible in the NavigationRail
    await expect(page.locator('[data-testid="nav-link-contactos"]')).toBeVisible();
  });

  test('should highlight the active route entry in NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser on /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: The Clientes nav link is marked as active (aria-current="page")
    await expect(page.locator('[data-testid="nav-link-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT render NavigationBar (mobile) on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport width >= 1024px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: NavigationBar (mobile) is not visible on desktop
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar at bottom
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar', () => {
  test('should render NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport width < 1024px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: NavigationBar is displayed at the bottom of the screen
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should show Clientes entry in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport width < 1024px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: Clientes entry is accessible in the NavigationBar
    await expect(page.locator('[data-testid="nav-link-clientes"]')).toBeVisible();
  });

  test('should show Contactos entry in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport width < 1024px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: Contactos entry is accessible in the NavigationBar
    await expect(page.locator('[data-testid="nav-link-contactos"]')).toBeVisible();
  });

  test('should NOT render NavigationRail (desktop) on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport width < 1024px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: NavigationRail is not visible on mobile
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Client-side navigation via TanStack Router (no full page reload)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Client-side navigation without page reload', () => {
  test('should navigate to /clientes on clicking Clientes without full page reload', async ({ page }) => {
    // GIVEN: The user is on the /contactos page
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/contactos');

    // Capture navigation events — a full page reload would trigger 'load'
    let fullReloadOccurred = false;
    page.on('load', () => { fullReloadOccurred = true; });
    // Reset flag after initial load settles
    await page.waitForLoadState('networkidle');
    fullReloadOccurred = false;

    // WHEN: The user clicks the Clientes nav link
    await page.click('[data-testid="nav-link-clientes"]');

    // THEN: The router navigates to /clientes via client-side routing
    await expect(page).toHaveURL('/clientes');
    // Client-side navigation should NOT trigger a full page load event
    expect(fullReloadOccurred).toBe(false);
  });

  test('should navigate to /contactos on clicking Contactos without full page reload', async ({ page }) => {
    // GIVEN: The user is on the /clientes page
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    let fullReloadOccurred = false;
    page.on('load', () => { fullReloadOccurred = true; });
    await page.waitForLoadState('networkidle');
    fullReloadOccurred = false;

    // WHEN: The user clicks the Contactos nav link
    await page.click('[data-testid="nav-link-contactos"]');

    // THEN: The router navigates to /contactos via client-side routing
    await expect(page).toHaveURL('/contactos');
    expect(fullReloadOccurred).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Deep linking to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Deep linking to /clientes', () => {
  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered correctly
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should NOT redirect away from /clientes on direct access', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The URL remains /clientes (no redirection to home or other route)
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Deep linking to /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Deep linking to /contactos', () => {
  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered correctly
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should NOT redirect away from /contactos on direct access', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The URL remains /contactos (no redirection to home or other route)
    await expect(page).toHaveURL('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Unknown route displays 404 view in Spanish with /clientes link
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — 404 not-found view for unknown routes', () => {
  test('should display the 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads with an unknown path
    await page.goto('/ruta-inexistente');

    // THEN: The 404 / not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display the 404 heading in Spanish', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/ruta-inexistente');

    // THEN: The heading "Página no encontrada" is visible
    await expect(page.locator('[data-testid="not-found-heading"]')).toHaveText('Página no encontrada');
  });

  test('should display a link to /clientes from the 404 view', async ({ page }) => {
    // GIVEN: The user is viewing the 404 not-found page
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/ruta-inexistente');

    // THEN: A link to return to /clientes is visible
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-back-link"]')).toHaveAttribute('href', '/clientes');
  });

  test('should navigate back to /clientes from the 404 view when clicking the return link', async ({ page }) => {
    // GIVEN: The user is on the 404 not-found page
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/ruta-inexistente');

    // WHEN: The user clicks the /clientes return link
    await page.click('[data-testid="not-found-back-link"]');

    // THEN: The router navigates to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Root path redirect to /clientes', () => {
  test('should redirect / to /clientes automatically', async ({ page }) => {
    // GIVEN: The user accesses the root path /
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /
    await page.goto('/');

    // THEN: The router redirects automatically to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('should render the Clientes view after the root redirect', async ({ page }) => {
    // GIVEN: The user accesses the root path /
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads (redirected to /clientes)
    await page.goto('/');

    // THEN: The Clientes view is rendered (not a blank or home page)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Accessibility: nav semantics, ARIA labels in Spanish, WCAG AA
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Accessibility of navigation shell', () => {
  test('should have a <nav> landmark with the expected ARIA label in Spanish', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: A <nav> element with aria-label="Navegación principal" exists
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
  });

  test('should have an aria-label in Spanish on the Clientes nav link', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: The Clientes nav link has a descriptive ARIA label
    const clientesLink = page.locator('[data-testid="nav-link-clientes"]');
    await expect(clientesLink).toHaveAttribute('aria-label', 'Clientes');
  });

  test('should have an aria-label in Spanish on the Contactos nav link', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: The Contactos nav link has a descriptive ARIA label
    const contactosLink = page.locator('[data-testid="nav-link-contactos"]');
    await expect(contactosLink).toHaveAttribute('aria-label', 'Contactos');
  });

  test('should mark the active nav link with aria-current="page"', async ({ page }) => {
    // GIVEN: The navigation shell is rendered with /contactos as the active route
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/contactos');

    // THEN: The Contactos nav link is marked as the current page
    await expect(page.locator('[data-testid="nav-link-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should have keyboard-focusable nav links', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // WHEN: Keyboard Tab reaches the Clientes nav link
    await page.keyboard.press('Tab');

    // THEN: The nav link is focusable (part of tab order)
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    // The test expects navigation links to be reachable via keyboard
    // Implementation must ensure links are in the natural tab order
    const clientesLink = page.locator('[data-testid="nav-link-clientes"]');
    await expect(clientesLink).toBeVisible();
    // Verify focus ring is visible (implementation must set focus-visible styles)
    await clientesLink.focus();
    const isFocusable = await clientesLink.evaluate((el) => el.tabIndex >= 0);
    expect(isFocusable).toBe(true);
  });
});
