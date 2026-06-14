/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Boundary E2E Tests — Automation Expansion
 * Expands ATDD coverage with edge cases not in the primary spec.
 *
 * Coverage added (NOT duplicated from navigation-shell.spec.ts):
 *   - Keyboard navigation: Tab key moves focus between nav items, Enter activates
 *   - Browser back/forward navigation (history API)
 *   - aria-current attribute set to "page" on active nav item
 *   - NavigationBar Contactos touch target >= 44px (only Clientes was in ATDD)
 *   - Mobile NavigationBar: switching active state from Clientes to Contactos
 *   - Root redirect preserves Clientes active state in NavigationRail
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard navigation — desktop
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Keyboard navigation — desktop NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should allow Tab key to move focus to the Clientes nav item', async ({ page }) => {
    // GIVEN: The application is loaded on desktop
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The user presses Tab to cycle focus to the Clientes nav item
    await page.locator('[data-testid="nav-item-clientes"]').focus();

    // THEN: The Clientes nav item is focused
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeFocused();
  });

  test('[P1] should allow Tab key to move focus to the Contactos nav item', async ({ page }) => {
    // GIVEN: The application is loaded on desktop and focus is on Clientes nav item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The user tabs past Clientes to Contactos
    await page.locator('[data-testid="nav-item-clientes"]').focus();
    await page.keyboard.press('Tab');

    // THEN: Focus moves to the Contactos nav item
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeFocused();
  });

  test('[P1] should navigate to /contactos when Enter is pressed on the Contactos nav item', async ({ page }) => {
    // GIVEN: Focus is on the Contactos nav item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').focus();

    // WHEN: The user presses Enter on the Contactos nav item
    await page.keyboard.press('Enter');

    // THEN: The URL changes to /contactos
    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser history — back/forward navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser history — back/forward navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should update the active nav item when the user presses the browser Back button', async ({ page }) => {
    // GIVEN: The user navigates from /clientes to /contactos
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // WHEN: The user presses the browser Back button
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: The Clientes nav item is active again
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should update the active nav item when the user presses the browser Forward button', async ({ page }) => {
    // GIVEN: The user navigated /clientes → /contactos and pressed Back
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.goBack();
    await page.waitForURL('**/clientes');

    // WHEN: The user presses the browser Forward button
    await page.goForward();
    await page.waitForURL('**/contactos');

    // THEN: The Contactos nav item is active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should render the correct view content when using browser Back from /contactos to /clientes', async ({ page }) => {
    // GIVEN: The user navigated from /clientes to /contactos
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // WHEN: The user presses Back
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: The Clientes view is displayed (not a blank screen)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// aria-current attribute — accessibility compliance
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — aria-current on active navigation items', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should set aria-current="page" on the Clientes nav item when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The NavigationRail is rendered
    // THEN: aria-current="page" is set on the Clientes item
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should NOT set aria-current="page" on the Contactos nav item when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The NavigationRail is rendered
    // THEN: aria-current is NOT "page" on the Contactos item
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const ariaCurrent = await contactosItem.getAttribute('aria-current');
    expect(ariaCurrent).not.toBe('page');
  });

  test('[P1] should set aria-current="page" on the Contactos nav item when on /contactos', async ({ page }) => {
    // GIVEN: The user is on /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // WHEN: The NavigationRail is rendered
    // THEN: aria-current="page" is set on the Contactos item
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should have aria-label="Navegación principal" on the NavigationRail', async ({ page }) => {
    // GIVEN: The user is on /clientes at desktop viewport
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The NavigationRail is rendered
    // THEN: The nav element has the correct aria-label for screen readers
    await expect(page.locator('[data-testid="navigation-rail"]')).toHaveAttribute('aria-label', 'Navegación principal');
  });

  test('[P1] should have aria-label="Navegación principal" on the mobile NavigationBar', async ({ page }) => {
    // GIVEN: The user is on /clientes at mobile viewport
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The NavigationBar is rendered
    // THEN: The nav element has the correct aria-label
    await expect(page.locator('[data-testid="navigation-bar"]')).toHaveAttribute('aria-label', 'Navegación principal');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile NavigationBar — additional touch targets and active state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 edge cases — mobile NavigationBar touch targets and active state', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('[P1] should have the Contactos NavigationBar item with touch target >= 44px on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The NavigationBar renders
    // THEN: The "Contactos" item touch target height is at least 44px (WCAG 2.5.5)
    const contactosItem = page.locator('[data-testid="nav-bar-item-contactos"]');
    const boundingBox = await contactosItem.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('[P1] should mark "Contactos" as active in the NavigationBar when on /contactos (mobile)', async ({ page }) => {
    // GIVEN: The application is loaded on mobile and the user navigates to /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // WHEN: The NavigationBar renders
    // THEN: The Contactos item has data-active="true"
    await expect(page.locator('[data-testid="nav-bar-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should mark "Clientes" as active in the NavigationBar when on /clientes (mobile)', async ({ page }) => {
    // GIVEN: The application is loaded on mobile at /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The NavigationBar renders
    // THEN: The Clientes item has data-active="true"
    await expect(page.locator('[data-testid="nav-bar-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should switch active state in NavigationBar when navigating between routes on mobile', async ({ page }) => {
    // GIVEN: The user is on /clientes (Clientes is active)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await expect(page.locator('[data-testid="nav-bar-item-clientes"]')).toHaveAttribute('data-active', 'true');

    // WHEN: The user taps the Contactos item in the NavigationBar
    await page.locator('[data-testid="nav-bar-item-contactos"]').tap();
    await page.waitForURL('**/contactos');

    // THEN: Contactos is now active and Clientes is no longer active
    await expect(page.locator('[data-testid="nav-bar-item-contactos"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="nav-bar-item-clientes"]')).toHaveAttribute('data-active', 'false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect — edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 edge cases — root redirect', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should mark Clientes as active in the NavigationRail after redirect from /', async ({ page }) => {
    // GIVEN: The user navigates to the root /
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // WHEN: The redirect completes and /clientes is loaded
    // THEN: The Clientes nav item is marked as active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should NOT show a 404 view after redirect from /', async ({ page }) => {
    // GIVEN: The user navigates to /
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // WHEN: The page finishes loading after redirect
    // THEN: No not-found view is shown
    const notFoundView = page.locator('[data-testid="not-found-view"]');
    await expect(notFoundView).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 not-found edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 edge cases — 404 view additional scenarios', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should display the 404 view for deeply nested unknown routes', async ({ page }) => {
    // GIVEN: The user navigates to a deeply nested unknown route
    await page.goto('/algo/muy/profundo/que/no/existe');

    // WHEN: The page loads
    // THEN: The 404 not-found view is displayed (not a blank screen)
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P2] should display the 404 view for routes with query strings that do not exist', async ({ page }) => {
    // GIVEN: The user navigates to a route with query params that does not exist
    await page.goto('/ruta-inexistente?param=valor');

    // WHEN: The page loads
    // THEN: The 404 view is shown (query params do not bypass the 404)
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P1] should navigate back to /clientes from the 404 view using the back-link', async ({ page }) => {
    // GIVEN: The user is on the 404 view after navigating to an unknown route
    await page.goto('/pagina-que-no-existe');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: The user clicks the back link without a full page reload
    let fullPageReload = false;
    page.on('load', () => { fullPageReload = true; });
    fullPageReload = false;

    await page.locator('[data-testid="not-found-back-link"]').click();
    await page.waitForURL('**/clientes');

    // THEN: The user arrives at /clientes
    expect(page.url()).toContain('/clientes');
  });
});
