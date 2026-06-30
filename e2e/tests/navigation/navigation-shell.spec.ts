/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible on left side at >= 1024px with Clientes & Contactos; SPA navigation (FR28)
 *   AC2 — Mobile NavigationBar visible at bottom at < 1024px; items accessible and tappable (FR29)
 *   AC3 — Direct URL entry to /clientes or /contactos renders correct view + active nav item (FR30)
 *   AC4 — Unknown route renders a 404 view with a Spanish message
 *   AC5 — Root path / redirects automatically to /clientes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport >= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail at >= 1024px viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render a NavigationRail with a Clientes navigation entry on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // Network-first: register response listener BEFORE navigation
    await page.route('**/*', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user views the app
    // THEN: A NavigationRail is visible on the left side with a "Clientes" entry
    await expect(page.locator('[data-testid="nav-rail"]')).toBeVisible();
  });

  test('should render a NavigationRail with a Contactos navigation entry on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    await page.route('**/*', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user views the app
    // THEN: A NavigationRail contains a "Contactos" entry
    await expect(page.locator('[data-testid="nav-rail-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes link on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on desktop
    await page.route('**/*', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: The user clicks the Clientes navigation entry
    // Intercept navigation to detect SPA behavior (no full reload)
    let navigationHappened = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame() && frame.url().includes('/clientes')) {
        navigationHappened = true;
      }
    });

    await page.click('[data-testid="nav-rail-clientes"]');

    // THEN: The URL changes to /clientes without a full page reload
    await expect(page).toHaveURL('/clientes');
    // The app-root persists (no reload means the element was not destroyed and re-created)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should navigate to /contactos without full page reload when clicking Contactos link on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on desktop at /clientes
    await page.route('**/*', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user clicks the Contactos navigation entry
    await page.click('[data-testid="nav-rail-contactos"]');

    // THEN: The URL changes to /contactos without full page reload
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should NOT render a NavigationBar on desktop (only NavigationRail)', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    await page.route('**/*', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user views the app on desktop
    // THEN: The NavigationBar (mobile nav) is NOT visible
    await expect(page.locator('[data-testid="nav-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar at < 1024px viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar at < 1024px viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should render a NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    await page.route('**/*', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user views the app on mobile
    // THEN: A NavigationBar is displayed at the bottom
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
  });

  test('should render a tappable Clientes item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (< 1024px)
    await page.route('**/*', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: The user taps the Clientes navigation item
    // Use click instead of tap for cross-browser compatibility (tap requires hasTouch)
    await page.click('[data-testid="nav-bar-clientes"]');

    // THEN: Navigation to /clientes occurs
    await expect(page).toHaveURL('/clientes');
  });

  test('should render a tappable Contactos item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (< 1024px)
    await page.route('**/*', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user taps the Contactos navigation item
    // Use click instead of tap for cross-browser compatibility (tap requires hasTouch)
    await page.click('[data-testid="nav-bar-contactos"]');

    // THEN: Navigation to /contactos occurs
    await expect(page).toHaveURL('/contactos');
  });

  test('should NOT render a NavigationRail on mobile (only NavigationBar)', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (< 1024px)
    await page.route('**/*', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The user views the app on mobile
    // THEN: The NavigationRail (desktop nav) is NOT visible
    await expect(page.locator('[data-testid="nav-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Direct URL entry renders correct view + active nav item
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Direct URL navigation renders correct view (FR30)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.route('**/*', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The correct view is rendered without redirection to a home screen
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.route('**/*', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The correct view is rendered without redirection
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should highlight the Clientes nav item as active when on /clientes', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    await page.route('**/*', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The navigation is rendered
    // THEN: The Clientes navigation item appears active/highlighted
    await expect(page.locator('[data-testid="nav-rail-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('should highlight the Contactos nav item as active when on /contactos', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    await page.route('**/*', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: The navigation is rendered
    // THEN: The Contactos navigation item appears active/highlighted
    await expect(page.locator('[data-testid="nav-rail-contactos"]')).toHaveAttribute('data-active', 'true');
  });

  test('should NOT show the Contactos nav item as active when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes
    await page.route('**/*', (route) => route.continue());
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The navigation is rendered
    // THEN: The Contactos nav item is NOT active
    await expect(page.locator('[data-testid="nav-rail-contactos"]')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route shows 404 with Spanish message
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Unknown route renders 404 view in Spanish', () => {
  test('should display a 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route (e.g. /unknown)
    await page.route('**/*', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/ruta-desconocida-que-no-existe');
    await page.waitForLoadState('networkidle');

    // THEN: A 404/not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display a Spanish error message on the 404 not-found view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/*', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/pagina-inexistente');
    await page.waitForLoadState('networkidle');

    // THEN: A Spanish message is visible — "Página no encontrada" (or similar Spanish text)
    const notFoundText = page.locator('[data-testid="not-found-message"]');
    await expect(notFoundText).toBeVisible();
    const text = await notFoundText.textContent();
    // Must contain Spanish — check for expected Spanish keywords
    expect(text).toMatch(/página|no encontrada|existe/i);
  });

  test('should NOT redirect to /clientes when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/*', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/ruta-completamente-desconocida');
    await page.waitForLoadState('networkidle');

    // THEN: The URL does NOT silently redirect to /clientes — the 404 is shown at the original path
    // (or at a dedicated /404 path — but NOT silently redirected to a known route)
    expect(page.url()).not.toMatch(/\/clientes$/);
    expect(page.url()).not.toMatch(/\/contactos$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root path / redirects to /clientes', () => {
  test('should redirect automatically from / to /clientes', async ({ page }) => {
    // GIVEN: The root path / is accessed
    // Network-first: intercept BEFORE navigation
    await page.route('**/*', (route) => route.continue());

    // WHEN: The page loads at /
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The user is redirected to /clientes automatically
    await expect(page).toHaveURL('/clientes');
  });

  test('should render the Clientes view after redirect from /', async ({ page }) => {
    // GIVEN: The root path / is accessed and redirected to /clientes
    await page.route('**/*', (route) => route.continue());
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: The redirect completes
    // THEN: The Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});
