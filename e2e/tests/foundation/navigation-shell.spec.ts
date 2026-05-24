/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible on left side; SPA navigation to /clientes and /contactos (FR28)
 *   AC2 — Mobile NavigationBar at bottom; all items tappable (FR29)
 *   AC3 — Direct URL entry for /clientes and /contactos renders correct view (FR30)
 *   AC4 — Unknown route shows 404 view with Spanish message and link back to /clientes
 *   AC5 — Active navigation item is visually highlighted
 *   AC6 — Root URL / redirects to /clientes automatically
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail: visible and enables SPA navigation (FR28)
// Viewport: Desktop ≥ 1024px (Playwright default Desktop Chrome = 1280×720)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should render NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport ≥ 1024px)
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: A NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop browser with NavigationRail visible
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: "Clientes" navigation entry is present
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop browser with NavigationRail visible
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: "Contactos" navigation entry is present
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without a full page reload when clicking the Clientes nav item', async ({
    page,
  }) => {
    // GIVEN: Desktop browser on the application
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // Track whether a full-page reload occurs (load event fires on full reload, not on SPA pushState)
    let fullPageReload = false;
    page.on('load', () => {
      fullPageReload = true;
    });

    // WHEN: The user clicks the "Clientes" nav item
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes (SPA navigation — no full page reload)
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
    // SPA: load event does NOT fire for client-side pushState navigation
    expect(fullPageReload).toBe(false);
  });

  test('should navigate to /contactos without a full page reload when clicking the Contactos nav item', async ({
    page,
  }) => {
    // GIVEN: Desktop browser on /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    let fullPageReload = false;
    page.on('load', () => {
      fullPageReload = true;
    });

    // WHEN: The user clicks the "Contactos" nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos without full reload
    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');
    expect(fullPageReload).toBe(false);
  });

  test('should NOT render the mobile NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport ≥ 1024px
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Mobile NavigationBar is not visible (hidden lg:flex hides it on desktop)
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar: displayed at bottom; all items tappable (FR29)
// Viewport: Mobile < 1024px (Pixel 5: 393×851)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should render NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: A mobile NavigationBar is displayed (flex lg:hidden)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT render the desktop NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: NavigationRail is hidden (hidden lg:flex hides on mobile)
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should display "Clientes" nav item in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile browser with NavigationBar visible
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: "Clientes" is accessible in the NavigationBar
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" nav item in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile browser with NavigationBar visible
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: "Contactos" is accessible in the NavigationBar
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should have tappable touch targets of at least 44px height on Clientes nav item (WCAG 2.1 AA)', async ({
    page,
  }) => {
    // GIVEN: Mobile NavigationBar rendered
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: Measuring the Clientes nav item bounding box
    const navItem = page.locator('[data-testid="nav-item-clientes"]');
    const box = await navItem.boundingBox();

    // THEN: Touch target height is at least 44px (WCAG 2.1 AA minimum)
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should have tappable touch targets of at least 44px height on Contactos nav item (WCAG 2.1 AA)', async ({
    page,
  }) => {
    // GIVEN: Mobile NavigationBar rendered
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const navItem = page.locator('[data-testid="nav-item-contactos"]');
    const box = await navItem.boundingBox();

    // THEN: Touch target height is at least 44px
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL entry renders correct view (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking: direct URL renders correct view (FR30)', () => {
  test('should render the Clientes view when /clientes is typed directly in the URL bar', async ({
    page,
  }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // Network-first: intercept before navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads from direct URL entry
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The correct Clientes view is rendered (not redirected to home/root)
    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });

  test('should render the Contactos view when /contactos is typed directly in the URL bar', async ({
    page,
  }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads from direct URL entry
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The correct Contactos view is rendered (not redirected to home/root)
    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible();
  });

  test('should not redirect /clientes to the root or home page on direct entry', async ({
    page,
  }) => {
    // GIVEN: Direct URL access to /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: URL remains /clientes (no redirect to /)
    expect(page.url()).not.toMatch(/\/$|\/index/);
    expect(page.url()).toContain('/clientes');
  });

  test('should not redirect /contactos to the root or home page on direct entry', async ({
    page,
  }) => {
    // GIVEN: Direct URL access to /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: URL remains /contactos
    expect(page.url()).not.toMatch(/\/$|\/index/);
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route: 404 view with Spanish message and /clientes link
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 not-found view for unknown routes', () => {
  test('should display a not-found view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route (e.g., /unknown)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads an unknown path
    await page.goto('/unknown-route-xyz');
    await page.waitForLoadState('networkidle');

    // THEN: The 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
  });

  test('should display a Spanish-language message on the 404 page', async ({ page }) => {
    // GIVEN: Unknown route is accessed
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    // THEN: A Spanish message "Página no encontrada" is shown
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText(
      'Página no encontrada'
    );
  });

  test('should display a link back to /clientes on the 404 page', async ({ page }) => {
    // GIVEN: Unknown route displayed the 404 page
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    // THEN: A link to /clientes is present
    const backLink = page.locator('[data-testid="not-found-back-link"]');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', /\/clientes/);
  });

  test('should navigate to /clientes when clicking the back link on the 404 page', async ({
    page,
  }) => {
    // GIVEN: User is on the 404 page
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: User is taken to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Active navigation item is visually highlighted
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Active navigation item is visually highlighted', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should highlight the Clientes nav item when /clientes is the active route (desktop)', async ({
    page,
  }) => {
    // GIVEN: The user navigates to /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes nav item has the active/selected state
    const clientesNavItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesNavItem).toHaveAttribute('data-active', 'true');
  });

  test('should highlight the Contactos nav item when /contactos is the active route (desktop)', async ({
    page,
  }) => {
    // GIVEN: The user navigates to /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The Contactos nav item has the active/selected state
    const contactosNavItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosNavItem).toHaveAttribute('data-active', 'true');
  });

  test('should NOT highlight the Clientes nav item when /contactos is the active route (desktop)', async ({
    page,
  }) => {
    // GIVEN: The user navigates to /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes nav item is NOT active
    const clientesNavItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesNavItem).not.toHaveAttribute('data-active', 'true');
  });

  test('should update active highlight when user navigates from Clientes to Contactos', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes with Clientes item highlighted
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks Contactos nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // THEN: Contactos is now highlighted and Clientes is not
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute(
      'data-active',
      'true'
    );
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute(
      'data-active',
      'true'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Root URL / redirects to /clientes automatically
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Root URL redirects to /clientes', () => {
  test('should redirect / to /clientes automatically', async ({ page }) => {
    // GIVEN: The root URL / is accessed
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates to /
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The user is redirected to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
  });

  test('should render the Clientes view after being redirected from /', async ({ page }) => {
    // GIVEN: Root URL accessed
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes page content is visible after redirect
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });

  test('should not display the root / in the URL after redirect', async ({ page }) => {
    // GIVEN: Root URL accessed
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Final URL is /clientes, not /
    expect(page.url()).not.toMatch(/localhost:5173\/$/);
    expect(page.url()).toContain('/clientes');
  });
});
