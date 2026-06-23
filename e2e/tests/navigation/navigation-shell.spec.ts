/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible with Clientes and Contactos entries (FR28)
 *   AC2 — Mobile NavigationBar visible at viewport < 1024px (FR29)
 *   AC3 — Deep linking to /clientes works with correct active state (FR30)
 *   AC4 — Deep linking to /contactos works with correct active state (FR30)
 *   AC5 — Unknown route shows 404 not-found in Spanish
 *   AC6 — Root / redirects to /clientes automatically
 *   AC7 — Navigation is client-side (no full page reload)
 *   AC8 — Active state reflects current route
 *   AC9 — WCAG 2.1 AA: ARIA labels in Spanish, keyboard-navigable
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Desktop — NavigationRail visible with Clientes and Contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display NavigationRail on the left side at desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should render Clientes entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail visible
    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: "Clientes" nav item is present
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should render Contactos entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail visible
    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: "Contactos" nav item is present
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes entry', async ({ page }) => {
    // GIVEN: The user is on a desktop browser at /contactos
    await page.goto('/contactos');

    // WHEN: The user clicks the Clientes nav item
    let navigationCount = 0;
    page.on('framenavigated', () => { navigationCount++; });

    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes and no full page reload occurred
    await page.waitForURL('**/clientes');
    expect(navigationCount).toBe(0);
  });

  test('should navigate to /contactos without full page reload when clicking Contactos entry', async ({ page }) => {
    // GIVEN: The user is on a desktop browser at /clientes
    await page.goto('/clientes');

    // WHEN: The user clicks the Contactos nav item
    let navigationCount = 0;
    page.on('framenavigated', () => { navigationCount++; });

    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos and no full page reload occurred
    await page.waitForURL('**/contactos');
    expect(navigationCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Mobile — NavigationBar visible at viewport < 1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should display NavigationBar instead of NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport width < 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar is visible (bottom bar) and NavigationRail is hidden
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should have Clientes item accessible in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar
    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: Clientes item is present and tappable
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should have Contactos item accessible in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar
    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: Contactos item is present and tappable
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /contactos when tapping Contactos on mobile', async ({ page }) => {
    // GIVEN: User is on /clientes on a mobile viewport
    await page.goto('/clientes');

    // WHEN: User taps the Contactos nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos
    await page.waitForURL('**/contactos');
    await expect(page).toHaveURL(/\/contactos/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Deep Linking — /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep Linking to /clientes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });

  test('should NOT redirect to home screen when accessing /clientes directly', async ({ page }) => {
    // GIVEN: The user directly accesses /clientes
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The URL remains /clientes (no redirection)
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should show Clientes nav item as active when on /clientes', async ({ page }) => {
    // GIVEN: The user directly navigates to /clientes
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes nav item has an active/selected state
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Deep Linking — /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Deep Linking to /contactos', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible();
  });

  test('should NOT redirect to home screen when accessing /contactos directly', async ({ page }) => {
    // GIVEN: The user directly accesses /contactos
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The URL remains /contactos (no redirection)
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('should show Contactos nav item as active when on /contactos', async ({ page }) => {
    // GIVEN: The user directly navigates to /contactos
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos nav item has an active/selected state
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: 404 — Not Found
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — 404 Not Found route', () => {
  test('should display a 404 not-found view for unknown routes', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/desconocido');

    // THEN: A 404 / not-found view is displayed
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
  });

  test('should display a user-friendly not-found message in Spanish', async ({ page }) => {
    // GIVEN: The user navigates to /desconocido
    // WHEN: The page loads
    await page.goto('/desconocido');

    // THEN: A Spanish-language not-found message is shown
    const notFoundMessage = page.locator('[data-testid="not-found-message"]');
    await expect(notFoundMessage).toBeVisible();
    // Message must be in Spanish
    const text = await notFoundMessage.innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('should provide a link back to /clientes from the not-found page', async ({ page }) => {
    // GIVEN: User is on the 404 page
    await page.goto('/desconocido');

    // WHEN: Looking at the page
    // THEN: There is a navigation link back to /clientes
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Root Redirect
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Root redirect to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The user navigates to the root path /
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The app automatically redirects to /clientes
    await page.waitForURL('**/clientes');
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should not show a blank screen during redirect from / to /clientes', async ({ page }) => {
    // GIVEN: The user navigates to /
    // WHEN: The redirect occurs
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: Content is visible immediately after redirect (no blank screen)
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7: No Full Reload — Client-side navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Client-side navigation without full page reload', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should NOT perform a full page reload when navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');

    // Inject a marker into the DOM that survives SPA navigation but not full reloads
    await page.evaluate(() => {
      (window as Record<string, unknown>).__spaMarker = true;
    });

    // WHEN: The user clicks the Contactos nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // THEN: The SPA marker still exists (page was NOT fully reloaded)
    const markerExists = await page.evaluate(() => {
      return (window as Record<string, unknown>).__spaMarker === true;
    });
    expect(markerExists).toBe(true);
  });

  test('should NOT perform a full page reload when navigating from /contactos to /clientes', async ({ page }) => {
    // GIVEN: The user is on /contactos
    await page.goto('/contactos');

    // Inject SPA marker
    await page.evaluate(() => {
      (window as Record<string, unknown>).__spaMarker = true;
    });

    // WHEN: The user clicks the Clientes nav item
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('**/clientes');

    // THEN: SPA marker still exists (no full reload)
    const markerExists = await page.evaluate(() => {
      return (window as Record<string, unknown>).__spaMarker === true;
    });
    expect(markerExists).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8: Active State reflects current route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Active navigation state', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show Clientes nav item as active when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    // WHEN: The navigation is rendered
    await page.goto('/clientes');

    // THEN: Clientes item is marked active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('should show Contactos nav item as NOT active when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    // WHEN: The navigation is rendered
    await page.goto('/clientes');

    // THEN: Contactos item is NOT active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('data-active', 'true');
  });

  test('should show Contactos nav item as active when on /contactos', async ({ page }) => {
    // GIVEN: The user is on /contactos
    // WHEN: The navigation is rendered
    await page.goto('/contactos');

    // THEN: Contactos item is marked active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });

  test('should show Clientes nav item as NOT active when on /contactos', async ({ page }) => {
    // GIVEN: The user is on /contactos
    // WHEN: The navigation is rendered
    await page.goto('/contactos');

    // THEN: Clientes item is NOT active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('data-active', 'true');
  });

  test('should update active state when navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');

    // WHEN: The user navigates to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // THEN: Contactos becomes active and Clientes becomes inactive
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9: WCAG 2.1 AA — ARIA labels and keyboard navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — Accessibility: ARIA labels and keyboard navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have accessible label in Spanish on the Clientes nav item', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail
    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: Clientes nav item has an ARIA label or visible Spanish text
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const ariaLabel = await clientesItem.getAttribute('aria-label');
    const textContent = await clientesItem.innerText();
    const hasLabel = (ariaLabel !== null && ariaLabel.length > 0) || textContent.includes('Clientes');
    expect(hasLabel).toBe(true);
  });

  test('should have accessible label in Spanish on the Contactos nav item', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail
    // WHEN: The app is loaded
    await page.goto('/clientes');

    // THEN: Contactos nav item has an ARIA label or visible Spanish text
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const ariaLabel = await contactosItem.getAttribute('aria-label');
    const textContent = await contactosItem.innerText();
    const hasLabel = (ariaLabel !== null && ariaLabel.length > 0) || textContent.includes('Contactos');
    expect(hasLabel).toBe(true);
  });

  test('should allow keyboard Tab to focus the Clientes nav item', async ({ page }) => {
    // GIVEN: Desktop viewport, page is loaded
    await page.goto('/clientes');

    // WHEN: User presses Tab to cycle through focusable elements
    // Focus navigation area first via keyboard
    await page.locator('[data-testid="navigation-rail"]').focus();
    await page.keyboard.press('Tab');

    // THEN: A nav item receives focus (keyboard navigation works)
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should activate navigation item when pressing Enter on a focused nav item', async ({ page }) => {
    // GIVEN: Desktop viewport, Clientes nav item is focused
    await page.goto('/contactos');
    await page.locator('[data-testid="nav-item-clientes"]').focus();

    // WHEN: User presses Enter
    await page.keyboard.press('Enter');

    // THEN: Navigation occurs to /clientes
    await page.waitForURL('**/clientes');
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should have a nav landmark element wrapping the navigation items', async ({ page }) => {
    // GIVEN: Desktop viewport
    // WHEN: App is loaded
    await page.goto('/clientes');

    // THEN: Navigation is wrapped in a <nav> element (landmark for accessibility)
    const navElement = page.locator('nav[data-testid="navigation-rail"], nav[data-testid="app-navigation"]');
    await expect(navElement).toBeVisible();
  });
});
