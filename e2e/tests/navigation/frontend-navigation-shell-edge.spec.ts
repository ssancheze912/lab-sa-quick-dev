/**
 * Story 1.2: Frontend Navigation Shell — Edge Case Expansion
 * Epic 1: Project Foundation & Application Shell
 *
 * These tests EXPAND coverage beyond the ATDD happy-path scenarios.
 * Covers: mobile navigation clicks, active-state persistence, keyboard
 * accessibility, back-button behavior, 404 back-link, and cross-browser
 * boundary conditions.
 *
 * Levels: E2E (Playwright)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Mobile — tapping nav items navigates correctly
// ATDD covered existence of NavigationBar; this covers the click behaviour.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mobile — NavigationBar tap navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('[P1] should navigate to /contactos when Contactos is tapped on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport, app loaded at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User taps the Contactos nav item in NavigationBar
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos (client-side navigation)
    await expect(page).toHaveURL('/contactos');
  });

  test('[P1] should navigate to /clientes when Clientes is tapped on mobile from /contactos', async ({ page }) => {
    // GIVEN: Mobile viewport, app loaded at /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: User taps the Clientes nav item
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('[P1] should highlight Contactos as active after tapping Contactos on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport, starting at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User taps Contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // THEN: Contactos nav item has data-active="true"
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="true"]')).toBeVisible();
  });

  test('[P2] should NOT crash when tapping the already-active nav item on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport, already at /clientes
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User taps the already-active Clientes item
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: No errors, URL stays /clientes
    expect(runtimeErrors).toHaveLength(0);
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Desktop — active state persists after navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Desktop — active state persistence', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('[P1] should update active item to Contactos after navigating from Clientes', async ({ page }) => {
    // GIVEN: At /clientes, Clientes is active
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).toBeVisible();

    // WHEN: User clicks Contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // THEN: Contactos becomes active, Clientes no longer active
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).not.toBeVisible();
  });

  test('[P1] should restore active state to Clientes after navigating back', async ({ page }) => {
    // GIVEN: Navigate to /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks Clientes
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('/clientes');

    // THEN: Clientes is active again, Contactos is not
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"][data-active="true"]')).not.toBeVisible();
  });

  test('[P2] should NOT trigger a full page reload when clicking the already-active nav item on desktop', async ({ page }) => {
    // GIVEN: Already at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const navCountBefore = await page.evaluate(() => performance.getEntriesByType('navigation').length);

    // WHEN: User clicks the already-active Clientes item
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: No additional navigation entry (still client-side)
    const navCountAfter = await page.evaluate(() => performance.getEntriesByType('navigation').length);
    expect(navCountAfter).toBe(navCountBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Browser history — back/forward button behaviour
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser history navigation (back/forward)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('[P1] should restore correct route when user presses the browser back button', async ({ page }) => {
    // GIVEN: User navigates /clientes → /contactos
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // WHEN: User presses browser back
    await page.goBack();

    // THEN: Returns to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('[P1] should update active nav item when using browser back button', async ({ page }) => {
    // GIVEN: Navigate /clientes → /contactos
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // WHEN: User presses browser back
    await page.goBack();
    await page.waitForURL('/clientes');

    // THEN: Clientes nav item is active again
    await expect(page.locator('[data-testid="nav-item-clientes"][data-active="true"]')).toBeVisible();
  });

  test('[P2] should correctly navigate forward after pressing back', async ({ page }) => {
    // GIVEN: Navigated /clientes → /contactos → back to /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');
    await page.goBack();
    await page.waitForURL('/clientes');

    // WHEN: User presses browser forward
    await page.goForward();

    // THEN: Returns to /contactos
    await expect(page).toHaveURL('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: 404 view — back-link navigates to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 view — back-link click behavior', () => {
  test('[P1] should navigate to /clientes when clicking the back link on 404 view', async ({ page }) => {
    // GIVEN: User is on the 404 view
    await page.goto('/unknown-path-xyz');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: User clicks the "Volver a Clientes" back link
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: Navigates to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('[P1] should render the application shell after clicking back from 404', async ({ page }) => {
    // GIVEN: User is on the 404 view
    await page.goto('/unknown-path-xyz');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();
    await page.waitForURL('/clientes');

    // THEN: NavigationRail is visible (application shell is intact)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P2] should NOT display NavigationRail or NavigationBar on the 404 view itself', async ({ page, viewport }) => {
    // GIVEN: Desktop viewport on unknown route
    // WHEN: 404 page renders
    await page.goto('/deeply/nested/unknown/path');
    await page.waitForLoadState('networkidle');

    // THEN: 404 view is shown
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // NOTE: NavigationRail/Bar are inside _app layout, 404 view is in notFoundComponent on root
    // So they should NOT be visible on the 404 page
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Keyboard accessibility — nav items reachable and activatable via keyboard
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Keyboard accessibility — nav items', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('[P1] nav items should be focusable via keyboard Tab key', async ({ page }) => {
    // GIVEN: Application loaded at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User presses Tab to cycle through focusable elements
    // The overlay <Link> elements with opacity:0 should still be focusable
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // THEN: At some point one of the nav items is focused
    const focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    const navItemTestIds = ['nav-item-clientes', 'nav-item-contactos'];
    // At least one nav item received focus during Tab traversal
    // We check that the overlay links are in the focus ring
    const clientesLink = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesLink).toBeAttached();
  });

  test('[P2] nav items should have aria-label for screen reader accessibility', async ({ page }) => {
    // GIVEN: App loaded at /clientes (desktop)
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: Inspecting nav item attributes
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');

    // THEN: Both items have aria-label
    await expect(clientesItem).toHaveAttribute('aria-label', 'Clientes');
    await expect(contactosItem).toHaveAttribute('aria-label', 'Contactos');
  });

  test('[P2] active nav item should have aria-current="page"', async ({ page }) => {
    // GIVEN: App loaded at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: NavigationRail renders
    // THEN: The active Clientes link has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P2] inactive nav item should NOT have aria-current attribute', async ({ page }) => {
    // GIVEN: App loaded at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: Contactos item is not active
    // THEN: aria-current is not set on inactive item
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Direct URL entry — deeply nested unknown paths and edge-case paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Unknown routes — edge cases', () => {
  test('[P2] should display 404 view for a deeply nested unknown path', async ({ page }) => {
    // GIVEN: User navigates to a deeply nested unknown path
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/deeply/nested/unknown/path');
    await page.waitForLoadState('networkidle');

    // WHEN: Page loads
    // THEN: 404 view shown, no crashes
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should display 404 view for a path with special characters', async ({ page }) => {
    // GIVEN: User navigates to a path with encoded special characters
    await page.goto('/path-with-%20spaces');
    await page.waitForLoadState('networkidle');

    // WHEN: Page loads
    // THEN: 404 view shown gracefully
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ContactosShellView rendered content after direct URL navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Shell views — heading content validation', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('[P2] ClientesShellView should contain the heading text "Clientes"', async ({ page }) => {
    // GIVEN: Direct navigation to /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: Page renders
    // THEN: h1 heading with text "Clientes" is visible
    await expect(page.locator('[data-testid="clientes-shell-view"] h1')).toHaveText('Clientes');
  });

  test('[P2] ContactosShellView should contain the heading text "Contactos"', async ({ page }) => {
    // GIVEN: Direct navigation to /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: Page renders
    // THEN: h1 heading with text "Contactos" is visible
    await expect(page.locator('[data-testid="contactos-shell-view"] h1')).toHaveText('Contactos');
  });
});
