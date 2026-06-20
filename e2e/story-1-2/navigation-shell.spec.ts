/**
 * ATDD Tests - Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * RED PHASE: All tests in this file are expected to FAIL until implementation is complete.
 * These tests define the expected behavior of the navigation shell before any route/component
 * code is written.
 *
 * Test Strategy:
 * - E2E: Full navigation flows, responsive breakpoints, routing, accessibility (AC1–AC9)
 *
 * Given-When-Then pattern applied throughout.
 * Network-first interception applied where applicable.
 * data-testid selectors used exclusively for stability.
 *
 * References:
 * - Story: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md
 * - Epic: _bmad-output/planning-artifacts/epics/epic-01-foundation.md
 * - Architecture: _bmad-output/planning-artifacts/architecture.md
 */

import { test, expect } from '@playwright/test';

// ============================================================
// AC1 — Desktop layout: LayoutBase, Navbar (64px), NavigationRail (72px)
// ============================================================

test.describe('AC1 — Desktop navigation shell renders LayoutBase structure', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Navbar top bar on desktop', async ({ page }) => {
    // GIVEN: Application loads on a desktop viewport (≥ 1024px)
    // WHEN: The user navigates to the root
    await page.goto('/');

    // THEN: The Navbar top bar element is visible
    await expect(page.getByTestId('navbar')).toBeVisible();
  });

  test('should render NavigationRail on the left side on desktop', async ({ page }) => {
    // GIVEN: Application loads on a desktop viewport (≥ 1024px)
    // WHEN: The root page loads
    await page.goto('/');

    // THEN: The NavigationRail is visible
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });

  test('should display "Clientes" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Application loads on desktop
    // WHEN: The navigation shell is rendered
    await page.goto('/');

    // THEN: A "Clientes" nav entry exists in the NavigationRail
    await expect(page.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('should display "Contactos" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Application loads on desktop
    // WHEN: The navigation shell is rendered
    await page.goto('/');

    // THEN: A "Contactos" nav entry exists in the NavigationRail
    await expect(page.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('should render LayoutBase shell wrapping main content outlet', async ({ page }) => {
    // GIVEN: Application loads on desktop
    // WHEN: The root page loads
    await page.goto('/');

    // THEN: The main content area (outlet) is present within the LayoutBase shell
    await expect(page.getByTestId('layout-content')).toBeVisible();
  });
});

// ============================================================
// AC2 — Click "Clientes" nav entry → navigates to /clientes, active state
// ============================================================

test.describe('AC2 — Clicking "Clientes" navigates to /clientes without full reload', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /clientes route when Clientes nav item is clicked', async ({ page }) => {
    // GIVEN: The user is on /contactos (any route in the app)
    await page.goto('/contactos');

    // WHEN: The user clicks the "Clientes" navigation entry
    await page.getByTestId('nav-item-clientes').click();

    // THEN: The URL changes to /clientes without a full page reload
    await expect(page).toHaveURL('/clientes');
  });

  test('should apply active visual state to "Clientes" nav item when on /clientes', async ({ page }) => {
    // GIVEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The "Clientes" nav item has the active CSS class or aria-current attribute
    const navItem = page.getByTestId('nav-item-clientes');
    await expect(navItem).toHaveAttribute('aria-current', 'page');
  });
});

// ============================================================
// AC3 — Click "Contactos" nav entry → navigates to /contactos, active state
// ============================================================

test.describe('AC3 — Clicking "Contactos" navigates to /contactos without full reload', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos route when Contactos nav item is clicked', async ({ page }) => {
    // GIVEN: The user is on /clientes (any route in the app)
    await page.goto('/clientes');

    // WHEN: The user clicks the "Contactos" navigation entry
    await page.getByTestId('nav-item-contactos').click();

    // THEN: The URL changes to /contactos without a full page reload
    await expect(page).toHaveURL('/contactos');
  });

  test('should apply active visual state to "Contactos" nav item when on /contactos', async ({ page }) => {
    // GIVEN: The user navigates to /contactos
    await page.goto('/contactos');

    // THEN: The "Contactos" nav item has the active CSS class or aria-current attribute
    const navItem = page.getByTestId('nav-item-contactos');
    await expect(navItem).toHaveAttribute('aria-current', 'page');
  });
});

// ============================================================
// AC4 — Mobile viewport: NavigationBar replaces NavigationRail, 44px touch targets
// ============================================================

test.describe('AC4 — Mobile viewport shows NavigationBar instead of NavigationRail', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should show NavigationBar on mobile viewport (< 1024px)', async ({ page }) => {
    // GIVEN: Application loads on a mobile browser (viewport < 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The mobile NavigationBar is visible
    await expect(page.getByTestId('navigation-bar')).toBeVisible();
  });

  test('should NOT show NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Application loads on a mobile browser (viewport < 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The desktop NavigationRail is hidden/not rendered
    await expect(page.getByTestId('navigation-rail')).not.toBeVisible();
  });

  test('should have "Clientes" nav item accessible on mobile NavigationBar', async ({ page }) => {
    // GIVEN: Application loads on mobile viewport
    // WHEN: The navigation bar is rendered
    await page.goto('/clientes');

    // THEN: The Clientes nav item is present in the mobile navigation bar
    await expect(page.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('should have "Contactos" nav item accessible on mobile NavigationBar', async ({ page }) => {
    // GIVEN: Application loads on mobile viewport
    // WHEN: The navigation bar is rendered
    await page.goto('/contactos');

    // THEN: The Contactos nav item is present in the mobile navigation bar
    await expect(page.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('should have minimum 44px touch target height for "Clientes" nav item on mobile', async ({ page }) => {
    // GIVEN: Application loads on mobile viewport
    // WHEN: The mobile NavigationBar is rendered
    await page.goto('/clientes');

    // THEN: The Clientes nav item has at least 44px height (accessible touch target)
    const navItem = page.getByTestId('nav-item-clientes');
    const boundingBox = await navItem.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should have minimum 44px touch target height for "Contactos" nav item on mobile', async ({ page }) => {
    // GIVEN: Application loads on mobile viewport
    // WHEN: The mobile NavigationBar is rendered
    await page.goto('/contactos');

    // THEN: The Contactos nav item has at least 44px height (accessible touch target)
    const navItem = page.getByTestId('nav-item-contactos');
    const boundingBox = await navItem.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });
});

// ============================================================
// AC5 — Direct URL /clientes: view renders, NavigationRail highlights Clientes
// ============================================================

test.describe('AC5 — Deep linking to /clientes renders Clientes view correctly', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when /clientes is typed directly in URL bar', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads (navigating directly, not via nav click)
    await page.goto('/clientes');

    // THEN: The Clientes view content is rendered
    await expect(page.getByTestId('clientes-view')).toBeVisible();
  });

  test('should NOT redirect away from /clientes when accessed directly', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The URL remains /clientes (no redirect to home)
    await expect(page).toHaveURL('/clientes');
  });

  test('should highlight the "Clientes" NavigationRail entry when /clientes is accessed directly', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The "Clientes" nav item is marked as active
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });
});

// ============================================================
// AC6 — Direct URL /contactos: view renders, NavigationRail highlights Contactos
// ============================================================

test.describe('AC6 — Deep linking to /contactos renders Contactos view correctly', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Contactos view when /contactos is typed directly in URL bar', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view content is rendered
    await expect(page.getByTestId('contactos-view')).toBeVisible();
  });

  test('should NOT redirect away from /contactos when accessed directly', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The URL remains /contactos (no redirect to home)
    await expect(page).toHaveURL('/contactos');
  });

  test('should highlight the "Contactos" NavigationRail entry when /contactos is accessed directly', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The "Contactos" nav item is marked as active
    await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
  });
});

// ============================================================
// AC7 — Unknown route → 404 not-found view with Spanish message and link to /clientes
// ============================================================

test.describe('AC7 — Unknown route displays 404 not-found page in Spanish', () => {
  test('should display the not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to a route that does not exist
    // WHEN: /unknown-path is accessed
    await page.goto('/unknown-path');

    // THEN: The 404 not-found view is rendered
    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });

  test('should display "Página no encontrada" heading on the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: /unknown-path is accessed
    await page.goto('/unknown-path');

    // THEN: A Spanish-language heading "Página no encontrada" is visible
    await expect(page.getByTestId('not-found-heading')).toHaveText('Página no encontrada');
  });

  test('should display a link back to /clientes on the 404 page', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    // WHEN: The not-found view is rendered
    await page.goto('/unknown-path');

    // THEN: A link pointing to /clientes is visible
    const backLink = page.getByTestId('not-found-back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/clientes');
  });

  test('should navigate to /clientes when the back link on the 404 page is clicked', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    await page.goto('/unknown-path');

    // WHEN: The user clicks "Volver a Clientes"
    await page.getByTestId('not-found-back-link').click();

    // THEN: The app navigates to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ============================================================
// AC8 — Root path / redirects automatically to /clientes
// ============================================================

test.describe('AC8 — Root path / redirects to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The user accesses the root URL /
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The browser URL is /clientes (redirect happened)
    await expect(page).toHaveURL('/clientes');
  });

  test('should render the Clientes view after redirecting from /', async ({ page }) => {
    // GIVEN: The user accesses /
    // WHEN: The automatic redirect to /clientes occurs
    await page.goto('/');
    await page.waitForURL('/clientes');

    // THEN: The Clientes view is visible
    await expect(page.getByTestId('clientes-view')).toBeVisible();
  });
});

// ============================================================
// AC9 — Keyboard-only navigation: Tab + Enter/Space, WCAG 2.1 AA
// ============================================================

test.describe('AC9 — Keyboard-only navigation reaches all nav entries (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should make "Clientes" nav item focusable via keyboard Tab', async ({ page }) => {
    // GIVEN: The application is loaded and no element is focused
    await page.goto('/contactos');

    // WHEN: The keyboard-only user presses Tab to navigate through focusable elements
    // Repeatedly tab until the Clientes nav item is focused
    const navItemClientes = page.getByTestId('nav-item-clientes');
    await navItemClientes.focus();

    // THEN: The Clientes nav item is focused
    await expect(navItemClientes).toBeFocused();
  });

  test('should make "Contactos" nav item focusable via keyboard Tab', async ({ page }) => {
    // GIVEN: The application is loaded
    await page.goto('/clientes');

    // WHEN: The keyboard-only user focuses the Contactos nav item
    const navItemContactos = page.getByTestId('nav-item-contactos');
    await navItemContactos.focus();

    // THEN: The Contactos nav item is focused
    await expect(navItemContactos).toBeFocused();
  });

  test('should navigate to /clientes when Enter key is pressed on the focused Clientes nav item', async ({ page }) => {
    // GIVEN: The user is on /contactos and has focused the Clientes nav item via keyboard
    await page.goto('/contactos');
    const navItemClientes = page.getByTestId('nav-item-clientes');
    await navItemClientes.focus();

    // WHEN: The user presses Enter to activate the nav item
    await page.keyboard.press('Enter');

    // THEN: The router navigates to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('should navigate to /contactos when Enter key is pressed on the focused Contactos nav item', async ({ page }) => {
    // GIVEN: The user is on /clientes and has focused the Contactos nav item via keyboard
    await page.goto('/clientes');
    const navItemContactos = page.getByTestId('nav-item-contactos');
    await navItemContactos.focus();

    // WHEN: The user presses Enter to activate the nav item
    await page.keyboard.press('Enter');

    // THEN: The router navigates to /contactos
    await expect(page).toHaveURL('/contactos');
  });

  test('should have an accessible aria-label on the "Clientes" nav icon button', async ({ page }) => {
    // GIVEN: The application is loaded on desktop
    // WHEN: The NavigationRail is rendered with icon-only nav items
    await page.goto('/clientes');

    // THEN: The Clientes nav item icon has aria-label="Clientes" for screen readers
    const navItemClientes = page.getByTestId('nav-item-clientes');
    await expect(navItemClientes).toHaveAttribute('aria-label', 'Clientes');
  });

  test('should have an accessible aria-label on the "Contactos" nav icon button', async ({ page }) => {
    // GIVEN: The application is loaded on desktop
    // WHEN: The NavigationRail is rendered with icon-only nav items
    await page.goto('/clientes');

    // THEN: The Contactos nav item icon has aria-label="Contactos" for screen readers
    const navItemContactos = page.getByTestId('nav-item-contactos');
    await expect(navItemContactos).toHaveAttribute('aria-label', 'Contactos');
  });
});
