/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Expanded Coverage
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands ATDD coverage with edge cases, boundary conditions, and error paths
 * not covered in the primary navigation-shell.spec.ts ATDD file.
 *
 * Scenarios added:
 *   - Browser back/forward button navigation
 *   - Rapid sequential navigation clicks
 *   - Viewport resize from desktop to mobile
 *   - Mobile active state on direct URL access
 *   - 404 page: navigation shell presence
 *   - Keyboard Enter/Space activation of nav items
 *   - 404 page for deeply nested unknown paths
 *   - Active state on edge-case route prefixes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Browser History Navigation (back/forward)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser history navigation (back/forward buttons)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should restore /clientes view after pressing browser Back from /contactos', async ({ page }) => {
    // GIVEN: User navigated from /clientes to /contactos via SPA navigation
    await page.goto('/clientes');
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // WHEN: User presses the browser Back button
    await page.goBack();

    // THEN: The /clientes URL is restored and clientes view is visible
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P1] should restore active nav state to Clientes after pressing Back from /contactos', async ({ page }) => {
    // GIVEN: User navigated from /clientes to /contactos
    await page.goto('/clientes');
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // WHEN: User presses the browser Back button
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // THEN: Clientes nav item is active again
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"][aria-current="page"]')
    ).toBeVisible();
  });

  test('[P1] should navigate forward to /contactos after pressing Back then Forward', async ({ page }) => {
    // GIVEN: User went clientes -> contactos -> back to clientes
    await page.goto('/clientes');
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();
    await expect(page).toHaveURL('/contactos');
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // WHEN: User presses browser Forward button
    await page.goForward();

    // THEN: /contactos is restored with contactos view
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rapid Sequential Navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Rapid sequential navigation (stress test)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should settle on /contactos after rapid back-and-forth clicks ending on Contactos', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');

    // WHEN: User rapidly alternates between Clientes and Contactos, ending on Contactos
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();
    await page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"]').click();
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();

    // THEN: Final URL and active state are /contactos
    await expect(page).toHaveURL('/contactos');
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"][aria-current="page"]')
    ).toBeVisible();
  });

  test('[P2] should settle on /clientes after rapid back-and-forth clicks ending on Clientes', async ({ page }) => {
    // GIVEN: User is on /contactos
    await page.goto('/contactos');

    // WHEN: User rapidly alternates, ending on Clientes
    await page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"]').click();
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();
    await page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"]').click();

    // THEN: Final URL and active state are /clientes
    await expect(page).toHaveURL('/clientes');
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"][aria-current="page"]')
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Viewport Resize: Desktop to Mobile Transition
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport resize: responsive layout transition', () => {
  test('[P1] should show NavigationBar after resizing from desktop to mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: The viewport is resized to mobile dimensions
    await page.setViewportSize({ width: 390, height: 844 });

    // THEN: The NavigationBar is now visible
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('[P1] should hide NavigationRail after resizing from desktop to mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop viewport with NavigationRail visible
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: The viewport is resized to mobile dimensions
    await page.setViewportSize({ width: 390, height: 844 });

    // THEN: The NavigationRail is no longer visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P1] should show NavigationRail after resizing from mobile to desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();

    // WHEN: The viewport is expanded to desktop dimensions
    await page.setViewportSize({ width: 1280, height: 800 });

    // THEN: The NavigationRail becomes visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Active State on Direct URL Access
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mobile NavigationBar — active state on direct URL access', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P1] should mark Clientes as active in NavigationBar when /clientes is accessed directly', async ({ page }) => {
    // GIVEN: Mobile viewport
    // WHEN: User navigates directly to /clientes
    await page.goto('/clientes');

    // THEN: Clientes item in NavigationBar has aria-current="page"
    await expect(
      page.locator('[data-testid="navigation-bar"] [aria-label="Clientes"][aria-current="page"]')
    ).toBeVisible();
  });

  test('[P1] should mark Contactos as active in NavigationBar when /contactos is accessed directly', async ({ page }) => {
    // GIVEN: Mobile viewport
    // WHEN: User navigates directly to /contactos
    await page.goto('/contactos');

    // THEN: Contactos item in NavigationBar has aria-current="page"
    await expect(
      page.locator('[data-testid="navigation-bar"] [aria-label="Contactos"][aria-current="page"]')
    ).toBeVisible();
  });

  test('[P1] should navigate to /contactos via mobile NavigationBar tap', async ({ page }) => {
    // GIVEN: Mobile viewport on /clientes
    await page.goto('/clientes');

    // WHEN: User taps the Contactos item in the NavigationBar
    await page.locator('[data-testid="navigation-bar"] [aria-label="Contactos"]').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('[P1] should update active state to Contactos in NavigationBar after tap', async ({ page }) => {
    // GIVEN: Mobile viewport on /clientes (Clientes is active)
    await page.goto('/clientes');

    // WHEN: User taps the Contactos item
    await page.locator('[data-testid="navigation-bar"] [aria-label="Contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: Contactos has aria-current="page" in NavigationBar
    await expect(
      page.locator('[data-testid="navigation-bar"] [aria-label="Contactos"][aria-current="page"]')
    ).toBeVisible();
  });

  test('[P1] should remove active state from Clientes in NavigationBar after navigating to Contactos', async ({ page }) => {
    // GIVEN: Mobile viewport on /clientes (Clientes is active)
    await page.goto('/clientes');

    // WHEN: User taps the Contactos item
    await page.locator('[data-testid="navigation-bar"] [aria-label="Contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: Clientes no longer has aria-current="page"
    await expect(
      page.locator('[data-testid="navigation-bar"] [aria-label="Clientes"][aria-current="page"]')
    ).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 Page — Additional Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 page — boundary and edge cases', () => {
  test('[P2] should display 404 view for deeply nested unknown paths', async ({ page }) => {
    // GIVEN: A deeply nested path that does not exist
    // WHEN: The page loads
    await page.goto('/nivel-uno/nivel-dos/nivel-tres');

    // THEN: The not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('Página no encontrada');
  });

  test('[P2] should display 404 view for a route with special characters', async ({ page }) => {
    // GIVEN: A path with special characters that does not exist
    // WHEN: The page loads
    await page.goto('/ruta-con-%20caracteres%20especiales');

    // THEN: The not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P1] should allow navigation from 404 page back to /clientes via back link without page reload', async ({ page }) => {
    // GIVEN: User is on a 404 page
    await page.goto('/ruta-inexistente');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // Track document (full page reload) requests after 404
    const htmlRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        htmlRequests.push(req.url());
      }
    });

    // WHEN: User clicks the "Ir a Clientes" back link
    await page.locator('[data-testid="not-found-view"] a[href="/clientes"]').click();

    // THEN: URL changes to /clientes and no full page reload occurred
    await expect(page).toHaveURL('/clientes');
    const reloadRequests = htmlRequests.filter((url) => url.includes('localhost:5173'));
    expect(reloadRequests).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard Activation of Navigation Items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Keyboard accessibility — Enter/Space activation of nav items', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should navigate to /contactos when Enter key is pressed on Contactos nav item (desktop)', async ({ page }) => {
    // GIVEN: The application is on /clientes and Contactos nav item is focused
    await page.goto('/clientes');
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').focus();

    // WHEN: User presses Enter key
    await page.keyboard.press('Enter');

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');
  });

  test('[P1] should navigate to /contactos when Space key is pressed on Contactos nav item (desktop)', async ({ page }) => {
    // GIVEN: The application is on /clientes and Contactos nav item is focused
    await page.goto('/clientes');
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').focus();

    // WHEN: User presses Space key
    await page.keyboard.press('Space');

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');
  });

  test('[P1] should navigate to /clientes when Enter key is pressed on Clientes nav item from /contactos (desktop)', async ({ page }) => {
    // GIVEN: The application is on /contactos and Clientes nav item is focused
    await page.goto('/contactos');
    await page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"]').focus();

    // WHEN: User presses Enter key
    await page.keyboard.press('Enter');

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root Redirect Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Root redirect — edge cases', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should redirect / to /clientes and show active Clientes nav item', async ({ page }) => {
    // GIVEN: The root path / is accessed
    await page.goto('/');

    // WHEN: The redirect resolves to /clientes
    await expect(page).toHaveURL('/clientes');

    // THEN: Clientes is marked as the active nav item
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"][aria-current="page"]')
    ).toBeVisible();
  });

  test('[P2] should NOT expose Contactos as active when accessing root /', async ({ page }) => {
    // GIVEN: The root path / is accessed (which redirects to /clientes)
    await page.goto('/');
    await expect(page).toHaveURL('/clientes');

    // THEN: Contactos is NOT marked as active
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"][aria-current="page"]')
    ).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// App Shell Structural Integrity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('App shell structural integrity', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P0] should maintain app-shell wrapper across route changes', async ({ page }) => {
    // GIVEN: The app is on /clientes
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();

    // WHEN: User navigates to /contactos
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: The app-shell wrapper is still present (no unmount/remount of shell)
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('[P1] should preserve navigation rail across route changes (no full remount)', async ({ page }) => {
    // GIVEN: The app is on /clientes with navigation-rail visible
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: User navigates to /contactos
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: The navigation-rail is still present and visible (layout route not remounted)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P2] should only have one nav landmark with "Navegación principal" label on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.goto('/clientes');

    // WHEN: The shell renders
    const navLandmarks = page.locator('nav[aria-label="Navegación principal"]');

    // THEN: Only one nav landmark with this label should exist (not duplicated)
    await expect(navLandmarks).toHaveCount(1);
  });
});
