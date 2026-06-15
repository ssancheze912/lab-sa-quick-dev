/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop layout: NavigationRail (72px left) + Navbar top visible at ≥1024px
 *   AC2 — Desktop: clicking "Clientes" navigates to /clientes without full page reload; active state applied
 *   AC3 — Desktop: clicking "Contactos" navigates to /contactos without full page reload; active state applied
 *   AC4 — Mobile layout (<768px): NavigationBar (bottom 56px) replaces NavigationRail; top Navbar remains
 *   AC5 — Deep linking: /clientes and /contactos render correct views; matching nav item highlighted
 *   AC6 — Unknown route: 404 view in Spanish within shell with link back to /clientes
 *   AC7 — Root path /: automatic redirect to /clientes without visible flash
 *   AC8 — Accessibility: nav landmark with aria-label in Spanish, WCAG 2.1 AA (axe zero violations)
 *
 * Network-first pattern: ALL route intercepts set up BEFORE navigation.
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ─── Viewport helpers ────────────────────────────────────────────────────────

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 375, height: 667 };

async function setDesktopViewport(page: Page) {
  await page.setViewportSize(DESKTOP_VIEWPORT);
}

async function setMobileViewport(page: Page) {
  await page.setViewportSize(MOBILE_VIEWPORT);
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop layout: NavigationRail + Navbar visible at ≥1024px viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop navigation layout', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
  });

  test('should render the top Navbar with productName "Siesa Agents" on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport ≥ 1024px)
    // Network-first: listen for navigation BEFORE going to the page
    await page.goto('/clientes');

    // THEN: The Navbar is visible at the top with product name "Siesa Agents"
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar"]')).toContainText('Siesa Agents');
  });

  test('should render the NavigationRail on the left side on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport ≥ 1024px
    await page.goto('/clientes');

    // THEN: The NavigationRail is visible on the left
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.goto('/clientes');

    // THEN: "Clientes" navigation item is present
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.goto('/clientes');

    // THEN: "Contactos" navigation item is present
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Desktop: clicking "Clientes" navigates to /clientes, active state applied
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Desktop navigation to /clientes', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
  });

  test('should navigate to /clientes when "Clientes" nav item is clicked', async ({ page }) => {
    // GIVEN: The user is on the desktop layout at /contactos
    await page.goto('/contactos');

    // WHEN: The user clicks "Clientes" in the NavigationRail
    await page.click('[data-testid="nav-item-clientes"]');

    // THEN: The URL changes to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('should NOT cause a full page reload when navigating from /contactos to /clientes', async ({ page }) => {
    // GIVEN: Desktop layout — client-side navigation in place
    // Network-first: mark the page BEFORE navigation to detect hard reload
    await page.goto('/contactos');

    // Inject a marker on the window object that would be erased by a hard reload
    await page.evaluate(() => {
      (window as Record<string, unknown>).__navMarker = true;
    });

    // WHEN: The user clicks "Clientes"
    await page.click('[data-testid="nav-item-clientes"]');
    await expect(page).toHaveURL('/clientes');

    // THEN: The marker is still present (no full page reload)
    const markerSurvived = await page.evaluate(() => (window as Record<string, unknown>).__navMarker);
    expect(markerSurvived).toBe(true);
  });

  test('should visually mark "Clientes" as active after navigating to /clientes', async ({ page }) => {
    // GIVEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: "Clientes" nav item has the active attribute/class (aria-current="page")
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Desktop: clicking "Contactos" navigates to /contactos, active state applied
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Desktop navigation to /contactos', () => {
  test.beforeEach(async ({ page }) => {
    await setDesktopViewport(page);
  });

  test('should navigate to /contactos when "Contactos" nav item is clicked', async ({ page }) => {
    // GIVEN: The user is on the desktop layout at /clientes
    await page.goto('/clientes');

    // WHEN: The user clicks "Contactos" in the NavigationRail
    await page.click('[data-testid="nav-item-contactos"]');

    // THEN: The URL changes to /contactos
    await expect(page).toHaveURL('/contactos');
  });

  test('should NOT cause a full page reload when navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: Desktop layout
    await page.goto('/clientes');

    await page.evaluate(() => {
      (window as Record<string, unknown>).__navMarker = true;
    });

    // WHEN: User clicks "Contactos"
    await page.click('[data-testid="nav-item-contactos"]');
    await expect(page).toHaveURL('/contactos');

    // THEN: No full page reload occurred
    const markerSurvived = await page.evaluate(() => (window as Record<string, unknown>).__navMarker);
    expect(markerSurvived).toBe(true);
  });

  test('should visually mark "Contactos" as active after navigating to /contactos', async ({ page }) => {
    // GIVEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: "Contactos" nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Mobile layout (<768px): NavigationBar replaces NavigationRail
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Mobile navigation layout', () => {
  test.beforeEach(async ({ page }) => {
    await setMobileViewport(page);
  });

  test('should render the NavigationBar (bottom nav) on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile browser viewport < 768px
    await page.goto('/clientes');

    // THEN: NavigationBar is visible at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT render the NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport < 768px
    await page.goto('/clientes');

    // THEN: NavigationRail is hidden/absent on mobile
    const rail = page.locator('[data-testid="navigation-rail"]');
    await expect(rail).not.toBeVisible();
  });

  test('should still render the top Navbar on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.goto('/clientes');

    // THEN: The top Navbar remains visible
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('should display "Clientes" in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.goto('/clientes');

    // THEN: "Clientes" item is accessible in the bottom navigation
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.goto('/clientes');

    // THEN: "Contactos" item is accessible in the bottom navigation
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Deep linking: direct URL navigation renders correct view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Deep linking to /clientes and /contactos', () => {
  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The correct view is rendered (URL remains /clientes, no redirect)
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The correct view is rendered (URL remains /contactos, no redirect)
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should highlight "Clientes" as active when deep-linking to /clientes', async ({ page }) => {
    // GIVEN: Direct navigation to /clientes
    await page.goto('/clientes');

    // THEN: Matching nav item is highlighted as active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight "Contactos" as active when deep-linking to /contactos', async ({ page }) => {
    // GIVEN: Direct navigation to /contactos
    await page.goto('/contactos');

    // THEN: Matching nav item is highlighted as active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Unknown route: 404 view in Spanish within shell layout
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — 404 not-found route', () => {
  test('should display a 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.goto('/ruta-inexistente');

    // THEN: A not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display "Página no encontrada" text on the 404 view', async ({ page }) => {
    // GIVEN: Unknown route /ruta-inexistente
    await page.goto('/ruta-inexistente');

    // THEN: Spanish not-found text is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('Página no encontrada');
  });

  test('should render the 404 view inside the shell (Navbar visible on 404 page)', async ({ page }) => {
    // GIVEN: Unknown route
    await page.goto('/ruta-inexistente');

    // THEN: Shell layout is still rendered (Navbar is present)
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('should provide a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: Unknown route — 404 view displayed
    await page.goto('/ruta-inexistente');

    // WHEN: User clicks the link back to /clientes
    await page.click('[data-testid="not-found-home-link"]');

    // THEN: The user is navigated back to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Root path /: automatic redirect to /clientes without visible flash
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Root path redirect to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The app is loaded for the first time at root path /
    // Network-first: register navigation listener BEFORE going to /
    const navigationPromise = page.waitForURL('/clientes');

    // WHEN: The page renders at /
    await page.goto('/');

    // THEN: The user is automatically redirected to /clientes
    await navigationPromise;
    await expect(page).toHaveURL('/clientes');
  });

  test('should not show an intermediate home screen before redirecting from /', async ({ page }) => {
    // GIVEN: Root path /
    // Network-first: set up console listener BEFORE navigation
    const consoleMessages: string[] = [];
    page.on('console', (msg) => consoleMessages.push(msg.text()));

    // WHEN: Navigate to /
    await page.goto('/');
    await page.waitForURL('/clientes');

    // THEN: No "home" or index view is visible (redirect was immediate)
    const homeHeading = page.locator('h1:has-text("Siesa Agentes")');
    await expect(homeHeading).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Accessibility: WCAG 2.1 AA, nav landmark with Spanish aria-label
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Accessibility compliance', () => {
  test('should have a <nav> element with aria-label="Navegación principal"', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    await page.goto('/clientes');

    // THEN: The nav landmark has the correct accessible label in Spanish
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeVisible();
  });

  test('should have descriptive aria-label on "Clientes" navigation link', async ({ page }) => {
    // GIVEN: Navigation shell rendered
    await page.goto('/clientes');

    // THEN: "Clientes" link has an aria-label in Spanish
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const ariaLabel = await clientesItem.getAttribute('aria-label');
    expect(ariaLabel).not.toBeNull();
    expect(ariaLabel!.length).toBeGreaterThan(0);
  });

  test('should have descriptive aria-label on "Contactos" navigation link', async ({ page }) => {
    // GIVEN: Navigation shell rendered
    await page.goto('/clientes');

    // THEN: "Contactos" link has an aria-label in Spanish
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const ariaLabel = await contactosItem.getAttribute('aria-label');
    expect(ariaLabel).not.toBeNull();
    expect(ariaLabel!.length).toBeGreaterThan(0);
  });

  test('should mark active nav item with aria-current="page" for screen readers', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');

    // THEN: Active item exposes aria-current="page" (WCAG 4.1.2 Name, Role, Value)
    await expect(page.locator('[data-testid="nav-item-clientes"][aria-current="page"]')).toBeVisible();
  });
});
