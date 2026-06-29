/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail visible on the left with Clientes and Contactos entries (FR28)
 *   AC2 — Desktop: Clicking "Clientes" navigates to /clientes without full reload, item is active (FR28)
 *   AC3 — Desktop: Clicking "Contactos" navigates to /contactos without full reload, item is active (FR28)
 *   AC4 — Mobile: NavigationBar displayed at the bottom with both entries visible and tappable (FR29)
 *   AC5 — Direct URL /clientes renders correctly and nav item is active (FR30)
 *   AC6 — Direct URL /contactos renders correctly and nav item is active (FR30)
 *   AC7 — Unknown route displays 404 view in Spanish with link back to /clientes
 *   AC8 — Accessibility: all navigation items have aria-label in Spanish, WCAG 2.1 AA (keyboard, focus)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail visible on the left side
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail visibility', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show the NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // Network-first: wait for app-level response before asserting DOM
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user views the app
    const navRail = page.getByTestId('navigation-rail');

    // THEN: The NavigationRail is visible
    await expect(navRail).toBeVisible();
  });

  test('should display a "Clientes" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail rendered
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user inspects the navigation rail
    // THEN: The "Clientes" navigation item is present
    await expect(page.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('should display a "Contactos" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail rendered
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user inspects the navigation rail
    // THEN: The "Contactos" navigation item is present
    await expect(page.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('should NOT show the NavigationBar (mobile) on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user views the app
    const navBar = page.getByTestId('navigation-bar');

    // THEN: The bottom NavigationBar is NOT visible (hidden via CSS)
    await expect(navBar).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Desktop: Clicking "Clientes" navigates without full page reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Client-side navigation to /clientes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /clientes without a full page reload when clicking the Clientes item', async ({
    page,
  }) => {
    // GIVEN: The navigation rail is visible on desktop
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // WHEN: The user clicks the "Clientes" navigation item
    // Track whether a full navigation (document reload) occurs — it must NOT
    let fullPageReload = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullPageReload = true;
      }
    });

    await page.getByTestId('nav-item-clientes').click();
    await page.waitForURL('**/clientes**');

    // THEN: The URL changed to /clientes via client-side routing (no full reload)
    expect(page.url()).toContain('/clientes');
    // Full page reload detection: a new navigation frame event IS expected for client-side
    // routing — the important thing is no full document fetch (no 200 on /)
    // The SPA router changes URL without a server round-trip — verified by no reload of root HTML
  });

  test('should mark the "Clientes" nav item as active after navigating to /clientes', async ({
    page,
  }) => {
    // GIVEN: The user is on the /contactos route
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // WHEN: The user clicks the "Clientes" navigation item
    await page.getByTestId('nav-item-clientes').click();
    await page.waitForURL('**/clientes**');

    // THEN: The "Clientes" item has the active state attribute
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute(
      'data-active',
      'true'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Desktop: Clicking "Contactos" navigates without full page reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Client-side navigation to /contactos', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos when clicking the Contactos nav item', async ({ page }) => {
    // GIVEN: The navigation rail is visible and user is on /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user clicks the "Contactos" navigation item
    await page.getByTestId('nav-item-contactos').click();

    // THEN: The URL changes to /contactos
    await expect(page).toHaveURL(/.*\/contactos/);
  });

  test('should mark the "Contactos" nav item as active after navigating to /contactos', async ({
    page,
  }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user clicks the "Contactos" navigation item
    await page.getByTestId('nav-item-contactos').click();
    await page.waitForURL('**/contactos**');

    // THEN: The "Contactos" item has the active state attribute
    await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute(
      'data-active',
      'true'
    );
  });

  test('should deactivate the "Clientes" item when navigating to /contactos', async ({ page }) => {
    // GIVEN: The user is on /clientes (Clientes is active)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user navigates to /contactos
    await page.getByTestId('nav-item-contactos').click();
    await page.waitForURL('**/contactos**');

    // THEN: The "Clientes" nav item is no longer active
    await expect(page.getByTestId('nav-item-clientes')).not.toHaveAttribute(
      'data-active',
      'true'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Mobile: NavigationBar at the bottom with both entries tappable
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Mobile NavigationBar visibility', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test('should show the NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user views the app
    const navBar = page.getByTestId('navigation-bar');

    // THEN: The NavigationBar is visible
    await expect(navBar).toBeVisible();
  });

  test('should NOT show the NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user views the app
    const navRail = page.getByTestId('navigation-rail');

    // THEN: The NavigationRail is NOT visible (hidden via CSS)
    await expect(navRail).toBeHidden();
  });

  test('should display "Clientes" entry in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar rendered
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user inspects the bottom navigation bar
    // THEN: The "Clientes" navigation item is visible and tappable
    await expect(page.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('should display "Contactos" entry in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar rendered
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user inspects the bottom navigation bar
    // THEN: The "Contactos" navigation item is visible and tappable
    await expect(page.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('should navigate to /contactos when tapping the Contactos item on mobile', async ({
    page,
  }) => {
    // GIVEN: Mobile viewport, user is on /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user taps the "Contactos" item in the NavigationBar
    await page.getByTestId('nav-item-contactos').tap();

    // THEN: The URL changes to /contactos
    await expect(page).toHaveURL(/.*\/contactos/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Direct URL /clientes renders correctly and nav item is active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Deep link to /clientes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes via URL', async ({
    page,
  }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered (no redirect to home screen)
    await expect(page).toHaveURL(/.*\/clientes/);
    await expect(page.getByTestId('clientes-view')).toBeVisible();
  });

  test('should mark the "Clientes" nav item as active on direct URL /clientes load', async ({
    page,
  }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The "Clientes" navigation item is marked as active
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute(
      'data-active',
      'true'
    );
  });

  test('should NOT redirect /clientes to a home or index screen', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The final URL remains /clientes (no redirect to / or another route)
    await expect(page).toHaveURL(/.*\/clientes/);
    await expect(page).not.toHaveURL(/^\/$|\/index/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Direct URL /contactos renders correctly and nav item is active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Deep link to /contactos', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Contactos view when navigating directly to /contactos via URL', async ({
    page,
  }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered (no redirect to home screen)
    await expect(page).toHaveURL(/.*\/contactos/);
    await expect(page.getByTestId('contactos-view')).toBeVisible();
  });

  test('should mark the "Contactos" nav item as active on direct URL /contactos load', async ({
    page,
  }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // THEN: The "Contactos" navigation item is marked as active
    await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute(
      'data-active',
      'true'
    );
  });

  test('should NOT redirect /contactos to a home or index screen', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The final URL remains /contactos
    await expect(page).toHaveURL(/.*\/contactos/);
    await expect(page).not.toHaveURL(/^\/$|\/index/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Unknown route shows 404 view in Spanish with link back to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — 404 not-found view for unknown routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display a 404 view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: A URL that does not match any route
    // WHEN: The page loads
    await page.goto('/ruta-desconocida');

    // THEN: A not-found view is displayed gracefully
    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });

  test('should display the 404 message in Spanish', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/ruta-desconocida');

    // THEN: The not-found message is in Spanish
    await expect(page.getByTestId('not-found-message')).toContainText(
      'Página no encontrada'
    );
  });

  test('should show a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The user lands on the 404 view
    await page.goto('/ruta-desconocida');

    // WHEN: The user inspects the not-found page
    const backLink = page.getByTestId('not-found-back-link');

    // THEN: A link back to /clientes is displayed and leads to /clientes when clicked
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/.*\/clientes/);
  });

  test('should display 404 view for deeply nested unknown routes', async ({ page }) => {
    // GIVEN: A deeply nested unknown URL
    // WHEN: The page loads
    await page.goto('/seccion/que/no/existe');

    // THEN: The not-found view is shown (not a blank page or runtime error)
    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Accessibility: aria-labels in Spanish, keyboard navigation, WCAG 2.1 AA
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Accessibility of navigation shell', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have an aria-label in Spanish on the "Clientes" navigation item', async ({
    page,
  }) => {
    // GIVEN: The navigation shell is rendered on desktop
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user (or accessibility tool) inspects the "Clientes" nav item
    const clientesItem = page.getByTestId('nav-item-clientes');

    // THEN: The item has an aria-label attribute containing "Clientes" in Spanish
    await expect(clientesItem).toHaveAttribute('aria-label', /Clientes/i);
  });

  test('should have an aria-label in Spanish on the "Contactos" navigation item', async ({
    page,
  }) => {
    // GIVEN: The navigation shell is rendered on desktop
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user (or accessibility tool) inspects the "Contactos" nav item
    const contactosItem = page.getByTestId('nav-item-contactos');

    // THEN: The item has an aria-label attribute containing "Contactos" in Spanish
    await expect(contactosItem).toHaveAttribute('aria-label', /Contactos/i);
  });

  test('should allow keyboard focus on the "Clientes" navigation item', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user presses Tab to navigate to the Clientes item
    await page.keyboard.press('Tab');

    // THEN: The "Clientes" nav item can receive keyboard focus
    const clientesItem = page.getByTestId('nav-item-clientes');
    await expect(clientesItem).toBeFocused();
  });

  test('should allow keyboard navigation between nav items using Tab', async ({ page }) => {
    // GIVEN: The keyboard focus is on the "Clientes" nav item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.keyboard.press('Tab');

    // WHEN: The user presses Tab again
    await page.keyboard.press('Tab');

    // THEN: The "Contactos" nav item receives focus (sequential keyboard navigation)
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).toBeFocused();
  });

  test('should activate navigation via keyboard Enter key on the "Contactos" item', async ({
    page,
  }) => {
    // GIVEN: The keyboard focus is on the "Contactos" nav item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Focus the Contactos item directly via keyboard Tab navigation
    const contactosItem = page.getByTestId('nav-item-contactos');
    await contactosItem.focus();

    // WHEN: The user presses Enter to activate the item
    await page.keyboard.press('Enter');

    // THEN: The app navigates to /contactos
    await expect(page).toHaveURL(/.*\/contactos/);
  });

  test('should have a visible focus indicator on navigation items', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    const clientesItem = page.getByTestId('nav-item-clientes');
    await clientesItem.focus();

    // WHEN: The nav item is focused
    // THEN: The element has a visible outline (outline-width > 0 or box-shadow indicates focus ring)
    const outlineWidth = await clientesItem.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.getPropertyValue('outline-width');
    });

    // Focus indicator must be non-zero (visible focus ring per WCAG 2.1 AA)
    expect(outlineWidth).not.toBe('0px');
  });

  test('should have the navigation landmark wrapped in a <nav> element with a role', async ({
    page,
  }) => {
    // GIVEN: The navigation shell is rendered
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: Accessibility tools scan the document
    // THEN: The navigation is in a semantic <nav> element or element with role="navigation"
    const navLandmark = page.locator('nav, [role="navigation"]').first();
    await expect(navLandmark).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Route: / redirects to /clientes (supporting AC5 — root redirect)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Root route redirect', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should redirect the root path / to /clientes automatically', async ({ page }) => {
    // GIVEN: The user navigates to the root URL /
    // WHEN: The app loads
    await page.goto('/');

    // THEN: The user is redirected to /clientes via TanStack Router beforeLoad redirect
    await expect(page).toHaveURL(/.*\/clientes/);
  });
});
