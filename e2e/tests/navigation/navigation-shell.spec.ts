/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (failing until implementation is complete)
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop (>= 1024px)
 *   AC2 — Click "Clientes" → SPA navigation to /clientes, active state applied
 *   AC3 — Click "Contactos" → SPA navigation to /contactos, active state applied
 *   AC4 — NavigationBar at bottom on mobile (< 1024px)
 *   AC5 — Direct URL /clientes renders ClientesPlaceholderView, nav active on Clientes
 *   AC6 — Direct URL /contactos renders ContactosPlaceholderView, nav active on Contactos
 *   AC7 — Unknown route renders 404 view in Spanish with link back to /clientes
 *   AC8 — Root / redirects automatically to /clientes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail visible on desktop viewport (>= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail', () => {
  test('should render NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport (1280×720, >= 1024px)
    await page.setViewportSize({ width: 1280, height: 720 });

    // Network-first: intercept before navigation
    const pageLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await pageLoad;

    // THEN: NavigationRail is visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display "Clientes" label in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/clientes');

    // THEN: "Clientes" nav entry with label is visible in the rail
    await expect(page.locator('[data-testid="nav-rail-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" label in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/clientes');

    // THEN: "Contactos" nav entry with label is visible in the rail
    await expect(page.locator('[data-testid="nav-rail-item-contactos"]')).toBeVisible();
  });

  test('should render a nav element with aria-label="Navegación principal"', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/clientes');

    // THEN: Accessible nav landmark is present with correct label
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Click "Clientes" → SPA navigation to /clientes, active state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Clientes navigation and active state (desktop)', () => {
  test('should navigate to /clientes without full page reload when clicking Clientes', async ({ page }) => {
    // GIVEN: User is on the desktop app at /contactos
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/contactos');

    // Network-first: listen for navigation BEFORE click
    const navigationPromise = page.waitForURL('**/clientes');

    // WHEN: User clicks "Clientes" in the NavigationRail
    await page.locator('[data-testid="nav-rail-item-clientes"]').click();

    // THEN: URL changes to /clientes via SPA (no full reload)
    await navigationPromise;
    expect(page.url()).toContain('/clientes');
  });

  test('should mark "Clientes" nav item as active after navigating to /clientes', async ({ page }) => {
    // GIVEN: Desktop viewport, user on /clientes
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // THEN: The "Clientes" nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-rail-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should not mark "Contactos" as active when "Clientes" is the current route', async ({ page }) => {
    // GIVEN: Desktop viewport, user on /clientes
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // THEN: "Contactos" nav item does NOT have aria-current="page"
    await expect(page.locator('[data-testid="nav-rail-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Click "Contactos" → SPA navigation to /contactos, active state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Contactos navigation and active state (desktop)', () => {
  test('should navigate to /contactos without full page reload when clicking Contactos', async ({ page }) => {
    // GIVEN: User is on desktop app at /clientes
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // Network-first: listen for navigation BEFORE click
    const navigationPromise = page.waitForURL('**/contactos');

    // WHEN: User clicks "Contactos" in the NavigationRail
    await page.locator('[data-testid="nav-rail-item-contactos"]').click();

    // THEN: URL changes to /contactos via SPA (no full reload)
    await navigationPromise;
    expect(page.url()).toContain('/contactos');
  });

  test('should mark "Contactos" nav item as active after navigating to /contactos', async ({ page }) => {
    // GIVEN: Desktop viewport, user on /contactos
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/contactos');

    // THEN: The "Contactos" nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-rail-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should not mark "Clientes" as active when "Contactos" is the current route', async ({ page }) => {
    // GIVEN: Desktop viewport, user on /contactos
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/contactos');

    // THEN: "Clientes" nav item does NOT have aria-current="page"
    await expect(page.locator('[data-testid="nav-rail-item-clientes"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — NavigationBar at bottom on mobile (< 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Mobile NavigationBar', () => {
  test('should display NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport (375×812, < 1024px)
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/clientes');

    // THEN: NavigationBar is visible at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT display NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport (375×812)
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/clientes');

    // THEN: NavigationRail is not visible (hidden via CSS)
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should display tappable "Clientes" item in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/clientes');

    // THEN: "Clientes" item is visible and accessible in the bottom NavigationBar
    await expect(page.locator('[data-testid="nav-bar-item-clientes"]')).toBeVisible();
  });

  test('should display tappable "Contactos" item in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/clientes');

    // THEN: "Contactos" item is visible and accessible in the bottom NavigationBar
    await expect(page.locator('[data-testid="nav-bar-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /contactos from NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport, user on /clientes
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/clientes');

    // Network-first: listen for navigation BEFORE tap
    const navigationPromise = page.waitForURL('**/contactos');

    // WHEN: User taps "Contactos" in the NavigationBar
    await page.locator('[data-testid="nav-bar-item-contactos"]').click();

    // THEN: URL changes to /contactos (SPA navigation)
    await navigationPromise;
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Direct URL /clientes renders ClientesPlaceholderView, Clientes active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Direct URL /clientes renders placeholder and nav active', () => {
  test('should render ClientesPlaceholderView when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: User types /clientes directly in browser URL bar
    // Network-first: intercept page load before navigation
    const pageLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await pageLoad;

    // THEN: ClientesPlaceholderView content is rendered
    await expect(page.locator('[data-testid="clientes-placeholder-view"]')).toBeVisible();
  });

  test('should NOT redirect away from /clientes when accessed directly', async ({ page }) => {
    // GIVEN: User navigates directly to /clientes
    await page.goto('/clientes');

    // THEN: URL remains /clientes (no redirect to home or 404)
    expect(page.url()).toContain('/clientes');
    expect(page.url()).not.toContain('/404');
  });

  test('should show "Clientes" as active in NavigationRail when on /clientes directly', async ({ page }) => {
    // GIVEN: Desktop viewport, user accessed /clientes via direct URL
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/clientes');

    // THEN: "Clientes" nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-rail-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Direct URL /contactos renders ContactosPlaceholderView, Contactos active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Direct URL /contactos renders placeholder and nav active', () => {
  test('should render ContactosPlaceholderView when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: User types /contactos directly in browser URL bar
    const pageLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/contactos');
    await pageLoad;

    // THEN: ContactosPlaceholderView content is rendered
    await expect(page.locator('[data-testid="contactos-placeholder-view"]')).toBeVisible();
  });

  test('should NOT redirect away from /contactos when accessed directly', async ({ page }) => {
    // GIVEN: User navigates directly to /contactos
    await page.goto('/contactos');

    // THEN: URL remains /contactos
    expect(page.url()).toContain('/contactos');
    expect(page.url()).not.toContain('/404');
  });

  test('should show "Contactos" as active in NavigationRail when on /contactos directly', async ({ page }) => {
    // GIVEN: Desktop viewport, user accessed /contactos via direct URL
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/contactos');

    // THEN: "Contactos" nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-rail-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Unknown route renders 404 view in Spanish with link back to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — 404 Not Found view for unknown routes', () => {
  test('should display a not-found view when accessing an unknown route /unknown', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    await page.goto('/unknown');

    // THEN: A 404/not-found view element is rendered
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display a not-found view for deeply nested unknown route /foo/bar', async ({ page }) => {
    // GIVEN: User navigates to a deeply nested unknown route
    await page.goto('/foo/bar');

    // THEN: A 404/not-found view element is rendered
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display the not-found message in Spanish', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    await page.goto('/unknown');

    // THEN: The not-found message is in Spanish
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText(/página no encontrada|no encontrado|404/i);
  });

  test('should display a link that returns the user to /clientes from the 404 view', async ({ page }) => {
    // GIVEN: User is on the not-found view
    await page.goto('/unknown');

    // THEN: A link to /clientes is present
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();

    // Network-first: listen for navigation BEFORE click
    const navigationPromise = page.waitForURL('**/clientes');

    // WHEN: User clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: User is redirected to /clientes
    await navigationPromise;
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Root / automatically redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Root path / redirects to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: User navigates to the root path /
    // Network-first: set up URL wait BEFORE navigation
    const navigationPromise = page.waitForURL('**/clientes');

    // WHEN: The page loads at /
    await page.goto('/');

    // THEN: Automatic redirect to /clientes
    await navigationPromise;
    expect(page.url()).toContain('/clientes');
  });

  test('should render the navigation shell after root redirect to /clientes', async ({ page }) => {
    // GIVEN: User navigates to /
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: The app shell (navigation) is visible after the redirect
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});
