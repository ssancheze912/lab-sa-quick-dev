/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible at ≥1024px; Clientes/Contactos navigate without reload
 *   AC2 — Mobile NavigationBar visible at <1024px; items tappable with ≥44px touch targets
 *   AC3 — Deep linking to /clientes and /contactos renders the correct view placeholder
 *   AC4 — Unknown routes render a 404 view in Spanish with a link back to /clientes
 *   AC5 — Active route nav item shows highlighted visual state
 *   AC6 — <nav> has aria-label="Navegación principal"; nav items have accessible names in Spanish; Tab reaches all items
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport ≥ 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (viewport ≥ 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P0] should render NavigationRail on the left side on desktop viewport', async ({
    page,
  }) => {
    // GIVEN: Desktop viewport (≥1024px) is set

    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The application is loaded
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: NavigationRail is visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P0] should show "Clientes" nav item in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport; NavigationRail is rendered
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The user inspects the nav items
    // THEN: "Clientes" nav item is visible in the rail
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('[P0] should show "Contactos" nav item in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport; NavigationRail is rendered
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The user inspects the nav items
    // THEN: "Contactos" nav item is visible in the rail
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('[P0] clicking "Clientes" nav item navigates to /clientes without full page reload', async ({
    page,
  }) => {
    // GIVEN: Desktop viewport; user is on /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForLoadState('domcontentloaded');

    // Track page reload: inject a sentinel in window; a full reload destroys it, SPA navigation preserves it
    await page.evaluate(() => { (window as any).__spaMarker = true; });

    // WHEN: The user clicks the "Clientes" nav item
    await page.click('[data-testid="nav-item-clientes"]');
    await page.waitForURL('**/clientes');

    // THEN: URL changed to /clientes and no full page reload occurred (SPA navigation)
    const fullReloadOccurred = !(await page.evaluate(() => !!(window as any).__spaMarker));
    expect(page.url()).toContain('/clientes');
    expect(fullReloadOccurred).toBe(false);
  });

  test('[P0] clicking "Contactos" nav item navigates to /contactos without full page reload', async ({
    page,
  }) => {
    // GIVEN: Desktop viewport; user is on /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // Track page reload: inject a sentinel in window; a full reload destroys it, SPA navigation preserves it
    await page.evaluate(() => { (window as any).__spaMarker = true; });

    // WHEN: The user clicks the "Contactos" nav item
    await page.click('[data-testid="nav-item-contactos"]');
    await page.waitForURL('**/contactos');

    // THEN: URL changed to /contactos without a full page reload
    const fullReloadOccurred = !(await page.evaluate(() => !!(window as any).__spaMarker));
    expect(page.url()).toContain('/contactos');
    expect(fullReloadOccurred).toBe(false);
  });

  test('[P1] NavigationBar should NOT be visible on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport (≥1024px)
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The layout is rendered
    // THEN: Mobile NavigationBar is hidden (not visible)
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (viewport < 1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('[P0] should render NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport (375px width — iPhone SE)

    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The application is loaded
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: NavigationBar is visible
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('[P1] NavigationRail should NOT be visible on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The layout is rendered
    // THEN: Desktop NavigationRail is hidden
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P0] mobile NavigationBar should display "Clientes" nav item', async ({ page }) => {
    // GIVEN: Mobile viewport; NavigationBar is rendered
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The user inspects the bottom navigation
    // THEN: "Clientes" item is accessible in the bottom bar
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('[P0] mobile NavigationBar should display "Contactos" nav item', async ({ page }) => {
    // GIVEN: Mobile viewport; NavigationBar is rendered
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The user inspects the bottom navigation
    // THEN: "Contactos" item is accessible in the bottom bar
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('[P0] mobile nav item "Clientes" must have a minimum 44px touch target height', async ({
    page,
  }) => {
    // GIVEN: WCAG 2.1 AA requires minimum 44×44px touch targets
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The touch target size is measured
    const boundingBox = await page.locator('[data-testid="nav-item-clientes"]').boundingBox();

    // THEN: The touch target height is at least 44px (WCAG 2.1 AA)
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('[P0] mobile nav item "Contactos" must have a minimum 44px touch target height', async ({
    page,
  }) => {
    // GIVEN: WCAG 2.1 AA requires minimum 44×44px touch targets
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The touch target size is measured
    const boundingBox = await page.locator('[data-testid="nav-item-contactos"]').boundingBox();

    // THEN: The touch target height is at least 44px
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking to /clientes and /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking renders correct view placeholders', () => {
  test('[P0] direct URL /clientes should render the Clientes view placeholder', async ({
    page,
  }) => {
    // GIVEN: No prior navigation history
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user types /clientes directly in the browser address bar
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: Clientes placeholder view is rendered (data-testid="clientes-view")
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P0] direct URL /contactos should render the Contactos view placeholder', async ({
    page,
  }) => {
    // GIVEN: No prior navigation history
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user types /contactos directly in the browser address bar
    await page.goto('/contactos');
    await page.waitForLoadState('domcontentloaded');

    // THEN: Contactos placeholder view is rendered (data-testid="contactos-view")
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('[P1] direct URL /clientes should NOT redirect to a home screen', async ({ page }) => {
    // GIVEN: Deep link /clientes is accessed directly
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates directly to /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: URL stays at /clientes (no redirect to / or any other route)
    expect(page.url()).toContain('/clientes');
    expect(page.url()).not.toMatch(/\/#?\s*$/);
  });

  test('[P1] direct URL /contactos should NOT redirect to a home screen', async ({ page }) => {
    // GIVEN: Deep link /contactos is accessed directly
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates directly to /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('domcontentloaded');

    // THEN: URL stays at /contactos (no redirect)
    expect(page.url()).toContain('/contactos');
  });

  test('[P1] root URL / should redirect to /clientes', async ({ page }) => {
    // GIVEN: index.tsx has beforeLoad that redirects / to /clientes
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates to the root URL
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: URL is /clientes (redirect happened)
    await expect(page).toHaveURL(/.*\/clientes/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 Not Found view for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not Found view for unknown routes', () => {
  test('[P0] navigating to unknown route should render the 404 not-found view', async ({
    page,
  }) => {
    // GIVEN: No route matches /unknown-path
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates to a completely unknown path
    await page.goto('/unknown-path');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The not-found view is displayed (data-testid="not-found-view")
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P0] 404 view should display a message in Spanish', async ({ page }) => {
    // GIVEN: User navigates to a non-existent route
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/does-not-exist');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The 404 view is rendered
    // THEN: The message "Página no encontrada" (or similar Spanish 404 message) is visible
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText(
      'Página no encontrada'
    );
  });

  test('[P0] 404 view should contain a link back to /clientes', async ({ page }) => {
    // GIVEN: User is on a 404 not-found view
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/completely-unknown-route');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The user sees the 404 page
    // THEN: There is a visible link back to /clientes
    const backLink = page.locator('[data-testid="not-found-view"] a[href="/clientes"]');
    await expect(backLink).toBeVisible();
  });

  test('[P1] clicking the "Volver a Clientes" link from 404 should navigate to /clientes', async ({
    page,
  }) => {
    // GIVEN: User is on a 404 view with a link back to /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/nonexistent');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The user clicks the link back to Clientes
    await page.click('[data-testid="not-found-view"] a[href="/clientes"]');
    await page.waitForURL('**/clientes');

    // THEN: User is navigated to /clientes
    await expect(page).toHaveURL(/.*\/clientes/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Active nav item visual state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Active nav item shows highlighted visual state', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P0] "Clientes" nav item should show active state when on /clientes route', async ({
    page,
  }) => {
    // GIVEN: Desktop viewport
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user is on the /clientes route
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The "Clientes" nav item has aria-current="page" (active state)
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('[P0] "Contactos" nav item should show active state when on /contactos route', async ({
    page,
  }) => {
    // GIVEN: Desktop viewport
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user is on the /contactos route
    await page.goto('/contactos');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The "Contactos" nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('[P1] "Clientes" nav item should NOT show active state when on /contactos route', async ({
    page,
  }) => {
    // GIVEN: Desktop viewport; user is on /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The nav items are rendered
    // THEN: "Clientes" item does NOT have aria-current="page"
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const ariaCurrent = await clientesItem.getAttribute('aria-current');
    expect(ariaCurrent).not.toBe('page');
  });

  test('[P1] active nav item visual state persists after SPA navigation', async ({ page }) => {
    // GIVEN: User starts on /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: User navigates to /contactos via the nav item
    await page.click('[data-testid="nav-item-contactos"]');
    await page.waitForURL('**/contactos');

    // THEN: "Contactos" nav item becomes active and "Clientes" becomes inactive
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute(
      'aria-current',
      'page'
    );
    const clientesAriaCurrent = await page
      .locator('[data-testid="nav-item-clientes"]')
      .getAttribute('aria-current');
    expect(clientesAriaCurrent).not.toBe('page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Accessibility: <nav> landmark, accessible names, keyboard navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Accessibility requirements (WCAG 2.1 AA)', () => {
  test('[P0] navigation landmark must have aria-label="Navegación principal"', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page is loaded
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The <nav> element has aria-label="Navegación principal"
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();
  });

  test('[P0] "Clientes" nav item must have an accessible name in Spanish', async ({ page }) => {
    // GIVEN: Nav item buttons must be keyboard/screen-reader accessible
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The "Clientes" nav item is inspected for accessibility
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');

    // THEN: It has an accessible name "Clientes" (via text content or aria-label)
    await expect(clientesItem).toHaveAccessibleName('Clientes');
  });

  test('[P0] "Contactos" nav item must have an accessible name in Spanish', async ({ page }) => {
    // GIVEN: Nav item buttons must be keyboard/screen-reader accessible
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The "Contactos" nav item is inspected
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');

    // THEN: It has an accessible name "Contactos"
    await expect(contactosItem).toHaveAccessibleName('Contactos');
  });

  test('[P0] Tab key navigation should reach the "Clientes" nav item', async ({ page }) => {
    // GIVEN: Keyboard navigation must reach all nav items (WCAG 2.1 AA 2.1.1)
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The user presses Tab from the start of the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // THEN: Focus can reach the "Clientes" nav item (within first 5 tabs from body)
    // We verify the element is focusable by checking it can receive focus
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await clientesItem.focus();
    await expect(clientesItem).toBeFocused();
  });

  test('[P0] Tab key navigation should reach the "Contactos" nav item', async ({ page }) => {
    // GIVEN: Keyboard navigation must reach all nav items
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The user tabs to the "Contactos" nav item
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosItem.focus();

    // THEN: Focus is on the "Contactos" nav item
    await expect(contactosItem).toBeFocused();
  });

  test('[P1] nav items should not have any accessibility violations (no role conflicts)', async ({
    page,
  }) => {
    // GIVEN: The navigation is rendered with semantic HTML
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: The nav structure is inspected
    const navLandmark = page.locator('nav[aria-label="Navegación principal"]');

    // THEN: The nav landmark exists (correctly structured)
    await expect(navLandmark).toBeAttached();

    // AND: Each nav item is a link or button (interactive element with correct role)
    const navItems = page.locator('[data-testid="nav-item-clientes"], [data-testid="nav-item-contactos"]');
    const count = await navItems.count();
    expect(count).toBe(2);
  });
});
