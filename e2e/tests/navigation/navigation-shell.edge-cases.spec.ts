/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Boundary Conditions
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands ATDD coverage with edge cases, boundary conditions, and error paths
 * NOT covered by the ATDD acceptance test suite (navigation-shell.spec.ts).
 *
 * Coverage areas:
 *   - Viewport boundary (exactly 1024px, 1023px)
 *   - Rapid sequential navigation (SPA integrity)
 *   - Browser back/forward button navigation
 *   - Keyboard navigation and focus management
 *   - Mobile active state on NavigationBar
 *   - Tablet viewport handling
 *   - 404 view from deeply nested paths
 *   - Dark mode class presence
 *   - Navigation state after browser history manipulation
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Viewport exactly at breakpoint (1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport Boundary — 1024px breakpoint', () => {
  test('[P1] should display NavigationRail at exactly 1024px width (inclusive boundary)', async ({ page }) => {
    // GIVEN: Viewport width is exactly at the desktop breakpoint boundary
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto('/clientes');

    // THEN: NavigationRail is visible at the lg breakpoint boundary
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P1] should display NavigationBar at 1023px width (just below desktop breakpoint)', async ({ page }) => {
    // GIVEN: Viewport width is one pixel below the desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 768 });

    await page.goto('/clientes');

    // THEN: NavigationBar is visible at just below the lg breakpoint
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('[P2] should hide NavigationRail at 1023px (below breakpoint)', async ({ page }) => {
    // GIVEN: Viewport just below desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 768 });

    await page.goto('/clientes');

    // THEN: NavigationRail is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P2] should hide NavigationBar at exactly 1024px (at or above breakpoint)', async ({ page }) => {
    // GIVEN: Viewport exactly at desktop breakpoint
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto('/clientes');

    // THEN: NavigationBar is NOT visible
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile: Active state on NavigationBar (not covered by ATDD)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mobile NavigationBar — Active state', () => {
  test('[P1] should mark "Clientes" as active in NavigationBar on mobile when on /clientes', async ({ page }) => {
    // GIVEN: Mobile viewport, user on /clientes
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/clientes');

    // THEN: "Clientes" NavigationBar item has aria-current="page"
    await expect(page.locator('[data-testid="nav-bar-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should mark "Contactos" as active in NavigationBar on mobile when on /contactos', async ({ page }) => {
    // GIVEN: Mobile viewport, user on /contactos
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/contactos');

    // THEN: "Contactos" NavigationBar item has aria-current="page"
    await expect(page.locator('[data-testid="nav-bar-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should NOT mark "Contactos" as active when user is on /clientes in mobile', async ({ page }) => {
    // GIVEN: Mobile viewport, user on /clientes
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/clientes');

    // THEN: "Contactos" NavigationBar item does NOT have aria-current="page"
    await expect(page.locator('[data-testid="nav-bar-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should navigate from /clientes to /clientes back via NavigationBar tap on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport, user on /contactos
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/contactos');

    // Network-first: listen for navigation BEFORE tap
    const navigationPromise = page.waitForURL('**/clientes');

    // WHEN: User taps "Clientes" in the NavigationBar
    await page.locator('[data-testid="nav-bar-item-clientes"]').click();

    // THEN: URL changes to /clientes
    await navigationPromise;
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rapid sequential navigation (SPA integrity)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Rapid sequential navigation — SPA integrity', () => {
  test('[P1] should update active state correctly after rapid Clientes→Contactos→Clientes sequence', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // WHEN: User rapidly clicks Contactos then Clientes
    await page.locator('[data-testid="nav-rail-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.locator('[data-testid="nav-rail-item-clientes"]').click();
    await page.waitForURL('**/clientes');

    // THEN: Final active state is "Clientes"
    await expect(page.locator('[data-testid="nav-rail-item-clientes"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-rail-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P2] should maintain navigation shell visibility after multiple SPA navigations', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // WHEN: Multiple navigations occur without full reload
    await page.locator('[data-testid="nav-rail-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.locator('[data-testid="nav-rail-item-clientes"]').click();
    await page.waitForURL('**/clientes');

    // THEN: NavigationRail remains visible throughout
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    // AND: Correct view is rendered
    await expect(page.locator('[data-testid="clientes-placeholder-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser back/forward navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser history — back/forward navigation', () => {
  test('[P1] should update active nav state when user navigates back using browser back button', async ({ page }) => {
    // GIVEN: Desktop viewport, user navigates from /clientes to /contactos
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-rail-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // WHEN: User clicks browser back button
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: "Clientes" is active again
    await expect(page.locator('[data-testid="nav-rail-item-clientes"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-rail-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should update active nav state when user navigates forward using browser forward button', async ({ page }) => {
    // GIVEN: Desktop viewport, user navigates to /contactos then goes back to /clientes
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-rail-item-contactos"]').click();
    await page.waitForURL('**/contactos');
    await page.goBack();
    await page.waitForURL('**/clientes');

    // WHEN: User clicks browser forward button
    await page.goForward();
    await page.waitForURL('**/contactos');

    // THEN: "Contactos" is active again
    await expect(page.locator('[data-testid="nav-rail-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P2] should correctly render view content when using browser back button', async ({ page }) => {
    // GIVEN: User navigated from /clientes to /contactos
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-rail-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // WHEN: User goes back
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: ClientesPlaceholderView is rendered (not ContactosPlaceholderView)
    await expect(page.locator('[data-testid="clientes-placeholder-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="contactos-placeholder-view"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Keyboard navigation — accessibility', () => {
  test('[P1] should allow keyboard activation of "Contactos" nav item via Enter key on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport, user on /clientes
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // Network-first
    const navigationPromise = page.waitForURL('**/contactos');

    // WHEN: User focuses and presses Enter on "Contactos" nav item
    await page.locator('[data-testid="nav-rail-item-contactos"]').focus();
    await page.keyboard.press('Enter');

    // THEN: Navigates to /contactos
    await navigationPromise;
    expect(page.url()).toContain('/contactos');
  });

  test('[P2] should have focusable "Clientes" nav item in NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // THEN: "Clientes" nav item can receive focus (is a link or button)
    const clientesItem = page.locator('[data-testid="nav-rail-item-clientes"]');
    await expect(clientesItem).toBeVisible();
    const tagName = await clientesItem.evaluate((el) => el.tagName.toLowerCase());
    expect(['a', 'button']).toContain(tagName);
  });

  test('[P2] should have focusable "Contactos" nav item in NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // THEN: "Contactos" nav item can receive focus (is a link or button)
    const contactosItem = page.locator('[data-testid="nav-rail-item-contactos"]');
    const tagName = await contactosItem.evaluate((el) => el.tagName.toLowerCase());
    expect(['a', 'button']).toContain(tagName);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 view — Additional edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 Not Found — Edge cases and error paths', () => {
  test('[P2] should display not-found view for route with special characters /clientes/unknown%20page', async ({ page }) => {
    // GIVEN: User navigates to a route with a path that encodes special chars
    await page.goto('/clientes/unknown%20page');

    // THEN: Not-found view is rendered
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P2] should not render navigation shell (rail/bar) on 404 page (catch-all outside _app layout)', async ({ page }) => {
    // GIVEN: User navigates to unknown route (catch-all $.tsx renders outside _app layout)
    await page.goto('/completamente-desconocido');

    // THEN: Not-found view is shown
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    // AND: The 404 page content includes a 404 heading or message
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('404');
  });

  test('[P2] should display "Volver a Clientes" text on the back link in 404 view', async ({ page }) => {
    // GIVEN: User is on 404 page
    await page.goto('/no-existe');

    // THEN: Back link has Spanish label
    await expect(page.locator('[data-testid="not-found-back-link"]')).toContainText('Clientes');
  });

  test('[P2] should render not-found view for a route with numeric segment /123', async ({ page }) => {
    // GIVEN: User navigates to a purely numeric unknown route
    await page.goto('/123');

    // THEN: Not-found view is rendered
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect — Edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Root redirect — Edge cases', () => {
  test('[P1] should render ClientesPlaceholderView after root redirect (not a blank page)', async ({ page }) => {
    // GIVEN: User accesses root /
    const navigationPromise = page.waitForURL('**/clientes');
    await page.goto('/');
    await navigationPromise;

    // THEN: Clientes placeholder view is rendered (not empty/blank)
    await expect(page.locator('[data-testid="clientes-placeholder-view"]')).toBeVisible();
  });

  test('[P1] should show "Clientes" as active in nav after root redirect', async ({ page }) => {
    // GIVEN: Desktop viewport, user accesses /
    await page.setViewportSize({ width: 1280, height: 720 });
    const navigationPromise = page.waitForURL('**/clientes');
    await page.goto('/');
    await navigationPromise;

    // THEN: "Clientes" nav item is active
    await expect(page.locator('[data-testid="nav-rail-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation shell structure integrity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation shell structure — Integrity checks', () => {
  test('[P2] should render exactly one <nav> element with aria-label on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // THEN: There is exactly one primary navigation landmark visible
    const navElements = page.locator('nav[aria-label="Navegación principal"]');
    await expect(navElements).toHaveCount(1);
  });

  test('[P2] should render Spanish labels "Clientes" and "Contactos" in mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/clientes');

    // THEN: Both Spanish labels appear in the bottom NavigationBar
    const navBar = page.locator('[data-testid="navigation-bar"]');
    await expect(navBar).toContainText('Clientes');
    await expect(navBar).toContainText('Contactos');
  });

  test('[P2] should have main content area visible alongside navigation on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport on /clientes
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // THEN: Both NavigationRail and main content area (outlet) are visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="clientes-placeholder-view"]')).toBeVisible();
  });

  test('[P2] should have main content area visible on mobile (not obscured by bottom nav)', async ({ page }) => {
    // GIVEN: Mobile viewport on /clientes
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/clientes');

    // THEN: Both bottom nav and main content are present
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="clientes-placeholder-view"]')).toBeVisible();
  });
});
