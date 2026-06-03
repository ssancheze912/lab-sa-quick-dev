/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop viewport shows NavigationRail on the left with Clientes and Contactos entries
 *   AC2 — Mobile viewport shows NavigationBar at the bottom instead of NavigationRail
 *   AC3 — Direct URL access to /clientes or /contactos renders the correct view with active nav item
 *   AC4 — Unknown routes show a 404 view with "Página no encontrada" and a link back to /clientes
 *   AC5 — Root path / redirects automatically to /clientes
 *   AC6 — Zero TypeScript errors and zero React render errors on any navigation
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop navigation: NavigationRail visible on viewport >= 1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (viewport >= 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display NavigationRail on desktop viewport', async ({ page }) => {
    // GIVEN: A desktop browser with viewport width 1280px
    // WHEN: The application loads

    // Network-first: listen for responses BEFORE navigation
    const pageLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await pageLoad;

    // THEN: The NavigationRail component is visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display "Clientes" navigation item in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport and application loaded
    // WHEN: The navigation shell renders
    await page.goto('/clientes');

    // THEN: The "Clientes" navigation item is present and visible
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" navigation item in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport and application loaded
    // WHEN: The navigation shell renders
    await page.goto('/clientes');

    // THEN: The "Contactos" navigation item is present and visible
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes nav item', async ({ page }) => {
    // GIVEN: User is on the /contactos route
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the "Clientes" navigation item
    // Network-first: register beforeunload listener to detect full-page reload
    let fullReloadOccurred = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloadOccurred = true;
      }
    });

    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('/clientes');

    // THEN: URL changes to /clientes (client-side routing — no full reload)
    expect(page.url()).toContain('/clientes');
    expect(fullReloadOccurred).toBe(false);
  });

  test('should navigate to /contactos without full page reload when clicking Contactos nav item', async ({ page }) => {
    // GIVEN: User is on the /clientes route
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the "Contactos" navigation item
    let fullReloadOccurred = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloadOccurred = true;
      }
    });

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // THEN: URL changes to /contactos (client-side routing — no full reload)
    expect(page.url()).toContain('/contactos');
    expect(fullReloadOccurred).toBe(false);
  });

  test('should hide NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: A desktop browser with viewport width 1280px
    // WHEN: The application loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationBar (mobile) is NOT visible
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile navigation: NavigationBar visible on viewport < 1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (viewport < 1024px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should display NavigationBar at bottom on mobile viewport', async ({ page }) => {
    // GIVEN: A mobile browser with viewport width 390px (iPhone 14 Pro)
    // WHEN: The application loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationBar component is visible at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should hide NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: A mobile browser with viewport width 390px
    // WHEN: The application loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationRail (desktop) is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should display "Clientes" navigation item in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport and application loaded
    // WHEN: The navigation shell renders
    await page.goto('/clientes');

    // THEN: The "Clientes" navigation item is accessible and tappable
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display "Contactos" navigation item in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport and application loaded
    // WHEN: The navigation shell renders
    await page.goto('/clientes');

    // THEN: The "Contactos" navigation item is accessible and tappable
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /contactos when tapping Contactos in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: User is on /clientes on mobile
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User taps the "Contactos" navigation item
    await page.locator('[data-testid="nav-item-contactos"]').tap();
    await page.waitForURL('/contactos');

    // THEN: URL changes to /contactos
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL access renders correct view with active nav
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking and active route highlighting', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render /clientes route view when accessing URL directly', async ({ page }) => {
    // GIVEN: User types /clientes directly in the URL bar
    // WHEN: The page loads

    // Network-first: wait for DOM content before asserting
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The Clientes view content is rendered (no redirect to home)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render /contactos route view when accessing URL directly', async ({ page }) => {
    // GIVEN: User types /contactos directly in the URL bar
    // WHEN: The page loads
    await page.goto('/contactos');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The Contactos view content is rendered (no redirect to home)
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should highlight Clientes nav item as active when at /clientes', async ({ page }) => {
    // GIVEN: User navigates directly to /clientes
    // WHEN: The page loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes nav item is marked as active
    await expect(page.locator('[data-testid="nav-item-clientes"][aria-current="page"]')).toBeVisible();
  });

  test('should highlight Contactos nav item as active when at /contactos', async ({ page }) => {
    // GIVEN: User navigates directly to /contactos
    // WHEN: The page loads
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The Contactos nav item is marked as active
    await expect(page.locator('[data-testid="nav-item-contactos"][aria-current="page"]')).toBeVisible();
  });

  test('should NOT redirect /clientes to a home screen', async ({ page }) => {
    // GIVEN: User accesses /clientes directly
    // WHEN: The page loads
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The URL remains /clientes (no redirect away from the route)
    expect(page.url()).toContain('/clientes');
    expect(page.url()).not.toContain('/?');
  });

  test('should NOT redirect /contactos to a home screen', async ({ page }) => {
    // GIVEN: User accesses /contactos directly
    // WHEN: The page loads
    await page.goto('/contactos');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The URL remains /contactos (no redirect away from the route)
    expect(page.url()).toContain('/contactos');
    expect(page.url()).not.toContain('/?');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 Not Found view for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not Found view', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display 404 view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: No route matches /unknown
    // WHEN: The page loads with /unknown URL
    await page.goto('/unknown');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should show Spanish "Página no encontrada" message in 404 view', async ({ page }) => {
    // GIVEN: User accesses an unknown route /ruta-desconocida
    // WHEN: The page loads
    await page.goto('/ruta-desconocida');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The 404 message is displayed in Spanish
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('should display a back-to-clientes link in the 404 view', async ({ page }) => {
    // GIVEN: User is on the 404 page
    // WHEN: The 404 view is rendered
    await page.goto('/unknown');
    await page.waitForLoadState('domcontentloaded');

    // THEN: A link/button to navigate back to /clientes is visible
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
  });

  test('should navigate back to /clientes when clicking the back link in 404 view', async ({ page }) => {
    // GIVEN: User is on the 404 page
    await page.goto('/unknown');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: User clicks the back-to-clientes link
    await page.locator('[data-testid="not-found-back-link"]').click();
    await page.waitForURL('/clientes');

    // THEN: User is redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root redirect: / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root redirect / to /clientes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The root path / is accessed
    // WHEN: The page loads
    await page.goto('/');
    await page.waitForURL('/clientes');

    // THEN: The user is automatically redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('should render Clientes view after redirect from /', async ({ page }) => {
    // GIVEN: User accesses /
    // WHEN: Redirect completes
    await page.goto('/');
    await page.waitForURL('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The Clientes section is visible
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Zero TypeScript and React errors on navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — No TypeScript or React errors on navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should not produce TypeScript or React errors when navigating to /clientes', async ({ page }) => {
    // GIVEN: The application is loaded
    // WHEN: User navigates to /clientes
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Zero TypeScript and React render errors
    const tsErrors = consoleErrors.filter((e) =>
      e.includes('[TypeScript]') || e.includes('TS') || e.includes('React')
    );
    expect(tsErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('should not produce TypeScript or React errors when navigating to /contactos', async ({ page }) => {
    // GIVEN: The application is loaded on /clientes
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    // WHEN: User navigates from /clientes to /contactos via nav item click
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('/contactos');

    // THEN: Zero TypeScript and React render errors during navigation
    const tsErrors = consoleErrors.filter((e) =>
      e.includes('[TypeScript]') || e.includes('TS') || e.includes('React')
    );
    expect(tsErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });
});
