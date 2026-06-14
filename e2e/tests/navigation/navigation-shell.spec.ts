/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail (desktop >= 1024px) visible on left, 72px icon-only, with Clientes and Contactos
 *   AC2 — Clicking "Clientes" in NavigationRail navigates to /clientes without full page reload; active state applied
 *   AC3 — Clicking "Contactos" in NavigationRail navigates to /contactos without full page reload; active state applied
 *   AC4 — NavigationBar (mobile < 1024px) displayed at bottom with Clientes and Contactos tappable (>= 44px touch)
 *   AC5 — Direct URL /clientes renders Clientes view and marks it active in nav
 *   AC6 — Direct URL /contactos renders Contactos view and marks it active in nav
 *   AC7 — Unknown route renders 404 view in Spanish with link back to /clientes
 *   AC8 — Root path / redirects to /clientes automatically
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1: NavigationRail visible on desktop (>= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — NavigationRail on desktop viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display the NavigationRail on the left side when viewport is >= 1024px', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // Network-first: listen BEFORE navigation to avoid race conditions
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The user views the app
    // THEN: The NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should render the "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The user views the NavigationRail
    // THEN: The "Clientes" nav item is present
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should render the "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The user views the NavigationRail
    // THEN: The "Contactos" nav item is present
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should NOT display the NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The user views the app at desktop width
    // THEN: The NavigationBar (mobile bottom nav) is NOT visible
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Clicking "Clientes" in NavigationRail — SPA navigation + active state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — SPA navigation to /clientes via NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /clientes without a full page reload when clicking Clientes', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // Track full page reloads (if navigation event fires, it would be SPA navigation only)
    let fullPageReload = false;
    page.on('framenavigated', (frame) => {
      // A full reload triggers a main-frame navigation event with a different URL
      if (frame === page.mainFrame() && frame.url().includes('contactos')) {
        // we navigated away, so next framenavigated will be the reload indicator
      }
    });
    page.on('load', () => {
      // Only fires on full page loads, not SPA transitions
      fullPageReload = true;
    });

    // Reset reload flag after initial load settles
    fullPageReload = false;

    // WHEN: The user clicks "Clientes" in the NavigationRail
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: Browser URL changes to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');

    // AND: No full page reload occurred (SPA navigation)
    expect(fullPageReload).toBe(false);
  });

  test('should render the "Clientes" nav item in its active state after clicking', async ({ page }) => {
    // GIVEN: The application is loaded and the user is on /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // WHEN: The user clicks "Clientes" in the NavigationRail
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('**/clientes');

    // THEN: The "Clientes" nav item has the active state attribute/class
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Clicking "Contactos" in NavigationRail — SPA navigation + active state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — SPA navigation to /contactos via NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos without a full page reload when clicking Contactos', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    let fullPageReload = false;
    page.on('load', () => {
      fullPageReload = true;
    });
    // Reset after initial load
    fullPageReload = false;

    // WHEN: The user clicks "Contactos" in the NavigationRail
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: Browser URL changes to /contactos
    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');

    // AND: No full page reload occurred
    expect(fullPageReload).toBe(false);
  });

  test('should render the "Contactos" nav item in its active state after clicking', async ({ page }) => {
    // GIVEN: The application is loaded and the user is on /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The user clicks "Contactos" in the NavigationRail
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // THEN: The "Contactos" nav item has the active state attribute/class
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: NavigationBar on mobile (< 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — NavigationBar on mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should display the NavigationBar at the bottom on mobile viewport (< 1024px)', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The user views the app
    // THEN: The NavigationBar is visible at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT display the NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The user views the app at mobile width
    // THEN: The NavigationRail is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeHidden();
  });

  test('should show "Clientes" navigation item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The user views the NavigationBar
    // THEN: The "Clientes" item is visible and tappable
    await expect(page.locator('[data-testid="nav-bar-item-clientes"]')).toBeVisible();
  });

  test('should show "Contactos" navigation item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The user views the NavigationBar
    // THEN: The "Contactos" item is visible and tappable
    await expect(page.locator('[data-testid="nav-bar-item-contactos"]')).toBeVisible();
  });

  test('should have NavigationBar items with touch targets >= 44px on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    const appLoaded = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoaded;

    // WHEN: The NavigationBar renders
    // THEN: The "Clientes" item has a touch target height of at least 44px
    const clientesItem = page.locator('[data-testid="nav-bar-item-clientes"]');
    const boundingBox = await clientesItem.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Direct URL /clientes — deep linking
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Deep linking to /clientes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar and presses Enter
    // Network-first: register load state listener before navigation
    const pageLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await pageLoad;

    // WHEN: The page loads
    // THEN: The Clientes view is rendered (placeholder heading visible)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should NOT redirect away from /clientes when navigating directly to it', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The page loads
    // THEN: No redirect occurs; URL remains /clientes
    expect(page.url()).toContain('/clientes');
    expect(page.url()).not.toContain('/contactos');
  });

  test('should mark "Clientes" as active in the NavigationRail when on /clientes via direct URL', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: The page loads
    // THEN: The NavigationRail marks "Clientes" as active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Direct URL /contactos — deep linking
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Deep linking to /contactos', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar and presses Enter
    const pageLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/contactos');
    await pageLoad;

    // WHEN: The page loads
    // THEN: The Contactos view is rendered (placeholder heading visible)
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should NOT redirect away from /contactos when navigating directly to it', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // WHEN: The page loads
    // THEN: No redirect occurs; URL remains /contactos
    expect(page.url()).toContain('/contactos');
    expect(page.url()).not.toContain('/clientes');
  });

  test('should mark "Contactos" as active in the NavigationRail when on /contactos via direct URL', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // WHEN: The page loads
    // THEN: The NavigationRail marks "Contactos" as active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7: Unknown route — 404 view in Spanish
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — 404 not-found view for unknown routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display the 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.goto('/ruta-inexistente');

    // WHEN: The page loads
    // THEN: The 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display the Spanish heading "Página no encontrada" on the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.goto('/ruta-inexistente');

    // WHEN: The 404 view renders
    // THEN: The heading "Página no encontrada" is visible
    await expect(page.locator('[data-testid="not-found-heading"]')).toHaveText('Página no encontrada');
  });

  test('should display a link that returns the user to /clientes from the 404 view', async ({ page }) => {
    // GIVEN: The user is on the 404 not-found view
    await page.goto('/ruta-inexistente');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: The user clicks the "Volver al inicio" link
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: The browser navigates to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
  });

  test('should NOT show a blank screen on the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/ruta-inexistente');

    // WHEN: The page loads
    // THEN: No blank screen — the not-found container is present and no unhandled errors
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8: Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Root path / redirects to /clientes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The application root / is accessed
    // Network-first: listen for navigation completion BEFORE going to /
    const navigationDone = page.waitForURL('**/clientes', { timeout: 10000 });
    await page.goto('/');

    // WHEN: The page loads
    // THEN: The user is redirected to /clientes
    await navigationDone;
    expect(page.url()).toContain('/clientes');
  });

  test('should render the Clientes view after the redirect from /', async ({ page }) => {
    // GIVEN: The application root / is accessed and redirected to /clientes
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // WHEN: The Clientes view is rendered after redirect
    // THEN: The Clientes view placeholder is visible
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});
