/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Boundary Conditions
 * Epic 1: Project Foundation & Application Shell
 *
 * EXPAND automation coverage: edge cases, error paths, boundary conditions
 * NOT covered by the ATDD happy-path tests in frontend-navigation-shell.spec.ts
 *
 * Scenarios:
 *   - Viewport boundary at exactly 1024px (breakpoint edge)
 *   - Root route "/" renders shell without active nav items
 *   - Self-navigation (clicking an already-active nav item)
 *   - Rapid sequential navigation (no race conditions / stale renders)
 *   - 404 view preserves navigation shell (nav items remain visible)
 *   - Browser Back/Forward navigates correctly and updates active nav
 *   - Multiple unknown route paths all render the same 404 view
 *   - 404 back-link href points to /clientes
 *   - Contactos nav item keyboard activation (Enter) from desktop
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// BOUNDARY: Viewport at exactly 1024px (breakpoint edge)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport breakpoint boundary (1024px)', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('[P1] should render NavigationRail at exactly 1024px viewport width', async ({ page }) => {
    // GIVEN: Viewport is at exactly the breakpoint boundary (1024px)
    // WHEN: App loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Desktop rail is used (breakpoint: isMobile = window.innerWidth < 768 in implementation)
    // The implementation uses 768 as breakpoint; at 1024px desktop rail is shown
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });

  test('[P2] should show both nav items when viewport is exactly 1024px', async ({ page }) => {
    // GIVEN: Viewport at 1024px
    // WHEN: App loads at /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: Both navigation items are visible in the rail
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BOUNDARY: Viewport just below 768px (mobile breakpoint)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport just below mobile breakpoint (767px)', () => {
  test.use({ viewport: { width: 767, height: 844 } });

  test('[P1] should render NavigationBar at 767px viewport width', async ({ page }) => {
    // GIVEN: Viewport is 1px below the 768 mobile breakpoint
    // WHEN: App loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Mobile NavigationBar is shown, rail is not present
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: Root route "/" renders shell without either nav item active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Root "/" route — navigation shell behavior', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should render NavigationRail on the root "/" route', async ({ page }) => {
    // GIVEN: User navigates to the root path
    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Navigation shell is present
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P2] should NOT mark Clientes as active when on root "/"', async ({ page }) => {
    // GIVEN: User is on the root path
    // WHEN: The shell renders
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Clientes nav item is NOT active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'false');
  });

  test('[P2] should NOT mark Contactos as active when on root "/"', async ({ page }) => {
    // GIVEN: User is on the root path
    // WHEN: The shell renders
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Contactos nav item is NOT active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: Self-navigation (clicking an already-active nav item stays on same route)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Self-navigation — clicking already-active nav item', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should remain on /clientes when clicking Clientes nav item while already on /clientes', async ({ page }) => {
    // GIVEN: User is already on /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the Clientes nav item again
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL stays at /clientes (no error, no redirect)
    await expect(page).toHaveURL('/clientes');
  });

  test('[P2] should keep Clientes nav item active after self-navigation', async ({ page }) => {
    // GIVEN: User is already on /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the Clientes nav item again
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: Active state remains true
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: Rapid sequential navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Rapid sequential navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should handle rapid back-and-forth navigation without getting stuck', async ({ page }) => {
    // GIVEN: User starts on /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User rapidly clicks Contactos then Clientes
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: Final URL is /clientes and correct nav item is active
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: 404 view preserves navigation shell
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 view — navigation shell still present', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should show NavigationRail alongside the 404 view on desktop', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    // WHEN: The 404 view is displayed
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    // THEN: Navigation shell is still visible (not-found renders inside root layout)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P1] should NOT mark any nav item as active on an unknown route', async ({ page }) => {
    // GIVEN: User is on an unknown route
    // WHEN: The 404 view is displayed
    await page.goto('/pagina-que-no-existe');
    await page.waitForLoadState('networkidle');

    // THEN: Neither nav item is active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'false');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: Browser Back/Forward navigation updates active nav item
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser Back/Forward — active nav updates correctly', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should mark Clientes as active after using browser Back from /contactos', async ({ page }) => {
    // GIVEN: User navigates /clientes → /contactos
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // WHEN: User presses browser Back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // THEN: URL is /clientes and Clientes is marked active
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should mark Contactos as active after using browser Forward to /contactos', async ({ page }) => {
    // GIVEN: User navigated /clientes → /contactos, then pressed Back
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // WHEN: User presses browser Forward
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // THEN: URL is /contactos and Contactos is marked active
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: Multiple distinct unknown routes all trigger the same 404 view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Multiple unknown routes — consistent 404 rendering', () => {
  const unknownRoutes = ['/foo', '/foo/bar', '/foo/bar/baz', '/clientes/999/edit'];

  for (const route of unknownRoutes) {
    test(`[P2] should display 404 view for unknown route "${route}"`, async ({ page }) => {
      // GIVEN: User navigates to an arbitrary unknown path
      // WHEN: Page loads
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // THEN: The not-found view is displayed
      await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="not-found-title"]')).toHaveText('Página no encontrada');
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: 404 back-link points to /clientes (href attribute)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 back-link — correct href', () => {
  test('[P0] should have href="/clientes" on the back link in the 404 view', async ({ page }) => {
    // GIVEN: User is on an unknown route
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    // WHEN: The 404 view is displayed
    const backLink = page.locator('[data-testid="not-found-back-link"]');

    // THEN: The back link points exactly to /clientes
    await expect(backLink).toHaveAttribute('href', '/clientes');
  });

  test('[P0] should display the 404 description paragraph in Spanish', async ({ page }) => {
    // GIVEN: User is on an unknown route
    await page.goto('/pagina-desconocida');
    await page.waitForLoadState('networkidle');

    // THEN: The secondary description is visible
    await expect(page.locator('text=La ruta que buscas no existe.')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: Keyboard activation — Contactos nav item via Enter on desktop
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Keyboard activation — Contactos nav item', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should activate Contactos nav item via Enter key when focused', async ({ page }) => {
    // GIVEN: User is on /clientes and focuses the Contactos nav item
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosItem.focus();

    // WHEN: User presses Enter
    await page.keyboard.press('Enter');

    // THEN: Navigation occurs to /contactos
    await expect(page).toHaveURL('/contactos');
  });

  test('[P1] should activate Contactos nav item via Space key when focused', async ({ page }) => {
    // GIVEN: User is on /clientes and focuses the Contactos nav item
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosItem.focus();

    // WHEN: User presses Space
    await page.keyboard.press('Space');

    // THEN: Navigation occurs to /contactos
    await expect(page).toHaveURL('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: nav-item aria-current attribute reflects active route (WCAG 4.1.2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('aria-current attribute on active nav item', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should set aria-current="page" on the Clientes nav item when on /clientes', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Active item has aria-current="page" for screen readers
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should NOT set aria-current on the Contactos nav item when on /clientes', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Inactive item does not have aria-current
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const ariaCurrent = await contactosItem.getAttribute('aria-current');
    expect(ariaCurrent).toBeNull();
  });

  test('[P1] should set aria-current="page" on the Contactos nav item when on /contactos', async ({ page }) => {
    // GIVEN: User is on /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: Active item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: Mobile viewport — NavigationBar on 404 view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 view on mobile — NavigationBar visible', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P1] should show NavigationBar alongside the 404 view on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport and unknown route
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    // THEN: Mobile navigation bar is visible together with the not-found view
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });
});
