/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible with Clientes and Contactos; SPA navigation (FR28)
 *   AC2 — Mobile NavigationBar visible at bottom with accessible touch targets (FR29)
 *   AC3 — Deep linking to /clientes and /contactos renders correct view (FR30)
 *   AC4 — Unknown route displays 404 view with Spanish message and return link
 *   AC5 — ARIA landmarks and aria-current="page" for keyboard/screen reader users (WCAG 2.1 AA)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport >= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // Network-first: register listener BEFORE navigation
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: A NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display Clientes entry in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: NavigationRail has a Clientes entry
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display Contactos entry in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: NavigationRail has a Contactos entry
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes nav item', async ({ page }) => {
    // GIVEN: The application is loaded on desktop and user is on /contactos
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // WHEN: User clicks the Clientes navigation entry
    const navigationCount = { value: 0 };
    page.on('framenavigated', () => { navigationCount.value += 1; });

    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes (SPA routing — no full page reload)
    await expect(page).toHaveURL('/clientes');
    // Full page reload would cause framenavigated > 1; SPA routing stays at 0 extra navigations
    expect(navigationCount.value).toBe(0);
  });

  test('should navigate to /contactos without full page reload when clicking Contactos nav item', async ({ page }) => {
    // GIVEN: The application is loaded on desktop and user is on /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User clicks the Contactos navigation entry
    const navigationCount = { value: 0 };
    page.on('framenavigated', () => { navigationCount.value += 1; });

    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos (SPA routing — no full page reload)
    await expect(page).toHaveURL('/contactos');
    expect(navigationCount.value).toBe(0);
  });

  test('should NOT render NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The mobile NavigationBar is not visible on desktop
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should render NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: A NavigationBar is displayed at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should display Clientes entry in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: NavigationBar has an accessible Clientes entry
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display Contactos entry in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: NavigationBar has an accessible Contactos entry
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should have touch-target height of at least 48px for Clientes nav item on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Clientes nav item meets minimum touch target size (WCAG 2.5.5: 44px; company: 48px)
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const box = await clientesItem.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  test('should have touch-target height of at least 48px for Contactos nav item on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Contactos nav item meets minimum touch target size
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const box = await contactosItem.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  test('should NOT render NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (viewport < 1024px)
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The desktop NavigationRail is not visible on mobile
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep Linking to /clientes and /contactos (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep Linking', () => {
  test('should render /clientes view when navigating directly to /clientes URL', async ({ page }) => {
    // GIVEN: User types /clientes directly in the browser URL bar
    // Network-first: intercept BEFORE navigation
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The correct Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render /contactos view when navigating directly to /contactos URL', async ({ page }) => {
    // GIVEN: User types /contactos directly in the browser URL bar
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // THEN: The correct Contactos view is rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should NOT redirect /clientes to a home screen on direct URL access', async ({ page }) => {
    // GIVEN: User navigates directly to /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: URL remains /clientes (no redirect to / or home)
    await expect(page).toHaveURL('/clientes');
  });

  test('should NOT redirect /contactos to a home screen on direct URL access', async ({ page }) => {
    // GIVEN: User navigates directly to /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: URL remains /contactos (no redirect to / or home)
    await expect(page).toHaveURL('/contactos');
  });

  test('should highlight Clientes nav item as active when on /clientes route', async ({ page }) => {
    // GIVEN: User navigates directly to /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The Clientes navigation item is highlighted as active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('should highlight Contactos nav item as active when on /contactos route', async ({ page }) => {
    // GIVEN: User navigates directly to /contactos
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // THEN: The Contactos navigation item is highlighted as active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 Not-Found Route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not-Found Route', () => {
  test('should display 404 view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: User navigates to an unmatched/unknown route
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-path');
    await appLoad;

    // THEN: A 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display Spanish-language message "Página no encontrada" on 404 view', async ({ page }) => {
    // GIVEN: User navigates to an unmatched route
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-path');
    await appLoad;

    // THEN: A clear Spanish-language message is shown
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('should display a return link to /clientes on 404 view', async ({ page }) => {
    // GIVEN: User navigates to an unmatched route
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-path');
    await appLoad;

    // THEN: A link to /clientes is shown to help the user recover
    await expect(page.locator('[data-testid="not-found-return-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-return-link"]')).toHaveAttribute('href', '/clientes');
  });

  test('should navigate to /clientes when clicking the return link on 404 view', async ({ page }) => {
    // GIVEN: User is on the 404 view
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-path');
    await appLoad;

    // WHEN: User clicks the return to Clientes link
    await page.locator('[data-testid="not-found-return-link"]').click();

    // THEN: User is redirected to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Accessibility: ARIA Landmarks and aria-current (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Accessibility (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have a navigation landmark with aria-label on desktop', async ({ page }) => {
    // GIVEN: The NavigationRail is rendered on desktop
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: A <nav> element with aria-label="Navegación principal" is present
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();
  });

  test('should mark active Clientes nav item with aria-current="page" when on /clientes', async ({ page }) => {
    // GIVEN: User is on the /clientes route
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The Clientes navigation item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should mark active Contactos nav item with aria-current="page" when on /contactos', async ({ page }) => {
    // GIVEN: User is on the /contactos route
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // THEN: The Contactos navigation item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark Contactos nav item with aria-current="page" when on /clientes', async ({ page }) => {
    // GIVEN: User is on the /clientes route
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Only Clientes has aria-current="page"; Contactos does not
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should allow keyboard navigation to reach all nav items via Tab key on desktop', async ({ page }) => {
    // GIVEN: The NavigationRail is rendered on desktop
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User presses Tab to navigate through the page
    await page.keyboard.press('Tab');

    // THEN: At least one navigation item receives focus (keyboard accessible)
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(['nav-item-clientes', 'nav-item-contactos']).toContain(focusedElement);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (Mobile) — Accessibility on NavigationBar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Accessibility on Mobile NavigationBar', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should have a navigation landmark with aria-label on mobile', async ({ page }) => {
    // GIVEN: The NavigationBar is rendered on mobile
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: A <nav> element with aria-label="Navegación principal" is present
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();
  });

  test('should mark active Clientes nav item with aria-current="page" on mobile when on /clientes', async ({ page }) => {
    // GIVEN: User is on /clientes on a mobile viewport
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The Clientes navigation item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });
});
