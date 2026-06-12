/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered (E2E level):
 *   TC-E1-P1-02 — Deep linking: direct URL access to /clientes (AC3, FR30)
 *   TC-E1-P1-03 — Deep linking: direct URL access to /contactos (AC3, FR30)
 *   TC-E1-P1-04b — Navigation shell persists on unknown route (AC5, 404 view — E2E layer)
 *   TC-E1-P1-05 — Root / redirects to /clientes (AC4)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-02: Deep Linking — Direct URL Access to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E1-P1-02 — Deep linking: direct URL access to /clientes', () => {
  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The frontend dev server is running at http://localhost:5173
    // WHEN: The user types /clientes directly in the browser URL bar (cold navigation)

    // Network-first: set up response listener BEFORE navigation to prevent race conditions
    const navigationResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );

    await page.goto('/clientes');
    await navigationResponse;

    // THEN: The Clientes view is rendered (heading "Clientes" is visible)
    // Implementation must add data-testid="clientes-heading" to ClientesPlaceholder
    await expect(page.locator('[data-testid="clientes-heading"]')).toBeVisible();
  });

  test('should NOT redirect away from /clientes when navigated directly', async ({ page }) => {
    // GIVEN: The frontend dev server is running
    // WHEN: The user navigates directly to /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The URL stays at /clientes (no redirect to / or any other path)
    expect(page.url()).toContain('/clientes');
  });

  test('should not show a blank page or 404 error when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: TanStack Router is configured with the /clientes route
    // WHEN: The user navigates directly to /clientes

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript runtime errors and the page body is not empty
    expect(pageErrors).toHaveLength(0);
    const bodyHtml = await page.locator('body').innerHTML();
    expect(bodyHtml.trim().length).toBeGreaterThan(0);
  });

  test('should display the navigation shell (NavigationRail or NavigationBar) at /clientes', async ({ page }) => {
    // GIVEN: The pathless layout route _app.tsx wraps all child routes
    // WHEN: The user navigates directly to /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The navigation shell container is present in the DOM
    // Implementation must add data-testid="app-navigation-shell" to the AppShellLayout
    await expect(page.locator('[data-testid="app-navigation-shell"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-03: Deep Linking — Direct URL Access to /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E1-P1-03 — Deep linking: direct URL access to /contactos', () => {
  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The frontend dev server is running at http://localhost:5173
    // WHEN: The user types /contactos directly in the browser URL bar (cold navigation)

    // Network-first: set up response listener BEFORE navigation
    const navigationResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );

    await page.goto('/contactos');
    await navigationResponse;

    // THEN: The Contactos view is rendered (heading "Contactos" is visible)
    // Implementation must add data-testid="contactos-heading" to ContactosPlaceholder
    await expect(page.locator('[data-testid="contactos-heading"]')).toBeVisible();
  });

  test('should NOT redirect away from /contactos when navigated directly', async ({ page }) => {
    // GIVEN: The frontend dev server is running
    // WHEN: The user navigates directly to /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The URL stays at /contactos (no redirect to / or any other path)
    expect(page.url()).toContain('/contactos');
  });

  test('should not show a blank page or 404 error when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: TanStack Router is configured with the /contactos route
    // WHEN: The user navigates directly to /contactos

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript runtime errors and the page body is not empty
    expect(pageErrors).toHaveLength(0);
    const bodyHtml = await page.locator('body').innerHTML();
    expect(bodyHtml.trim().length).toBeGreaterThan(0);
  });

  test('should display the navigation shell (NavigationRail or NavigationBar) at /contactos', async ({ page }) => {
    // GIVEN: The pathless layout route _app.tsx wraps all child routes
    // WHEN: The user navigates directly to /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The navigation shell container is present in the DOM
    // Implementation must add data-testid="app-navigation-shell" to the AppShellLayout
    await expect(page.locator('[data-testid="app-navigation-shell"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-05: Root / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E1-P1-05 — Root index route redirects to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The index route is configured with beforeLoad redirect to /clientes
    // WHEN: The user navigates to the root URL /

    // Network-first: intercept BEFORE navigation
    const redirectComplete = page.waitForURL('**/clientes');

    await page.goto('/');
    await redirectComplete;

    // THEN: The URL is now /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('should render Clientes content (not a blank page) after root redirect', async ({ page }) => {
    // GIVEN: The router redirects / to /clientes
    // WHEN: User navigates to /
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes heading is visible (not a blank page)
    // Implementation must add data-testid="clientes-heading"
    await expect(page.locator('[data-testid="clientes-heading"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-04b: Unknown route shows not-found view (E2E layer)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E1-P1-04b — Unknown route displays not-found view (E2E)', () => {
  test('should display the not-found view for an unknown URL path', async ({ page }) => {
    // GIVEN: The TanStack Router is configured with a notFoundComponent
    // WHEN: The user navigates to an unknown route
    await page.goto('/esta-ruta-no-existe');
    await page.waitForLoadState('networkidle');

    // THEN: A not-found message is displayed in Spanish
    // Implementation must add data-testid="not-found-message" to NotFound component
    await expect(page.locator('[data-testid="not-found-message"]')).toBeVisible();
  });

  test('should keep the navigation shell visible on the not-found page', async ({ page }) => {
    // GIVEN: The notFoundComponent is registered in __root.tsx
    // WHEN: The user lands on an unknown route
    await page.goto('/ruta-completamente-desconocida');
    await page.waitForLoadState('networkidle');

    // THEN: The navigation shell remains visible (layout does not break)
    // Implementation must add data-testid="app-navigation-shell"
    await expect(page.locator('[data-testid="app-navigation-shell"]')).toBeVisible();
  });

  test('should include a link back to /clientes on the not-found page', async ({ page }) => {
    // GIVEN: NotFound component renders "Volver a Clientes" link per spec
    // WHEN: The user is on an unknown route
    await page.goto('/pagina-inexistente');
    await page.waitForLoadState('networkidle');

    // THEN: A link to /clientes is present
    // Implementation must add data-testid="not-found-back-link" to the Link component
    const backLink = page.locator('[data-testid="not-found-back-link"]');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/clientes');
  });

  test('should display "Página no encontrada" text in Spanish on unknown routes', async ({ page }) => {
    // GIVEN: All user-facing text must be in Spanish per company standard
    // WHEN: The user lands on an unknown route
    await page.goto('/ruta-no-encontrada');
    await page.waitForLoadState('networkidle');

    // THEN: The Spanish 404 message is displayed
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-01: SPA Navigation — no full page reload (E2E layer)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E1-P1-01 — SPA navigation does not trigger full page reload', () => {
  test('should navigate from /clientes to /contactos without a full page reload', async ({ page }) => {
    // GIVEN: The app is loaded at /clientes with NavigationRail visible
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // Track whether a full page reload (navigation event) occurs
    let fullPageReloadOccurred = false;
    page.on('framenavigated', (frame) => {
      // A full reload causes the main frame to navigate; SPA routing does not
      if (frame === page.mainFrame() && frame.url().includes('/contactos')) {
        // This fires for BOTH SPA navigation AND full reload — we check window identity
        // instead; if window is recreated, SPA is broken
        fullPageReloadOccurred = true;
      }
    });

    // Capture a reference marker in the window to detect if it was replaced
    await page.evaluate(() => {
      (window as Window & { __spaMarker?: boolean }).__spaMarker = true;
    });

    // WHEN: The user clicks the Contactos navigation item
    // Implementation must add data-testid="nav-item-contactos" to the nav item
    await page.click('[data-testid="nav-item-contactos"]');
    await page.waitForURL('**/contactos');

    // THEN: The URL is /contactos
    expect(page.url()).toContain('/contactos');

    // THEN: The window.__spaMarker still exists (window was NOT recreated = no full reload)
    const markerStillExists = await page.evaluate(() => {
      return (window as Window & { __spaMarker?: boolean }).__spaMarker === true;
    });
    expect(markerStillExists).toBe(true);
  });

  test('should navigate from /contactos to /clientes without a full page reload', async ({ page }) => {
    // GIVEN: The app is loaded at /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // Capture SPA identity marker
    await page.evaluate(() => {
      (window as Window & { __spaMarker?: boolean }).__spaMarker = true;
    });

    // WHEN: The user clicks the Clientes navigation item
    // Implementation must add data-testid="nav-item-clientes" to the nav item
    await page.click('[data-testid="nav-item-clientes"]');
    await page.waitForURL('**/clientes');

    // THEN: URL is /clientes and window was not recreated (SPA navigation confirmed)
    expect(page.url()).toContain('/clientes');
    const markerStillExists = await page.evaluate(() => {
      return (window as Window & { __spaMarker?: boolean }).__spaMarker === true;
    });
    expect(markerStillExists).toBe(true);
  });

  test('should keep the navigation shell mounted during route transitions', async ({ page }) => {
    // GIVEN: The app is at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user navigates to /contactos via nav item click
    await page.click('[data-testid="nav-item-contactos"]');
    await page.waitForURL('**/contactos');

    // THEN: The navigation shell is still present (not unmounted during transition)
    await expect(page.locator('[data-testid="app-navigation-shell"]')).toBeVisible();
  });

  test('should show nav items "Clientes" and "Contactos" in the navigation shell', async ({ page }) => {
    // GIVEN: The app is loaded (desktop viewport — Playwright uses Desktop Chrome by default)
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Both navigation items are visible and labeled in Spanish
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });
});
