/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop (>= 1024px); clicking navigates to /clientes or /contactos without full page reload
 *   AC2 — Mobile NavigationBar visible at bottom on viewport < 1024px; all items accessible
 *   AC3 — Deep linking to /clientes and /contactos renders correct view without redirection
 *   AC4 — Unknown route renders 404 view in Spanish with link back to /clientes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (viewport >= 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display the NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (width >= 1024px)
    // Network-first: register a route listener BEFORE navigation
    const navPromise = page.waitForSelector('[data-testid="navigation-rail"]');

    // WHEN: The user navigates to the application
    await page.goto('/clientes');

    // THEN: The NavigationRail is visible on the left side
    const nav = await navPromise;
    await expect(nav).toBeVisible();
  });

  test('should show a "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The desktop NavigationRail is rendered
    await page.goto('/clientes');

    // WHEN: The user views the navigation
    // THEN: The "Clientes" navigation entry is present
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should show a "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The desktop NavigationRail is rendered
    await page.goto('/clientes');

    // WHEN: The user views the navigation
    // THEN: The "Contactos" navigation entry is present
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes when clicking the Clientes entry without a full page reload', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser at /contactos
    await page.goto('/contactos');

    // Track navigation type: full reload resets this flag
    let fullReloadOccurred = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloadOccurred = true;
      }
    });
    // Reset after initial load
    fullReloadOccurred = false;

    // WHEN: The user clicks the "Clientes" entry in the NavigationRail
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL('/clientes');

    // AND: No full page reload occurred (client-side navigation)
    expect(fullReloadOccurred).toBe(false);
  });

  test('should navigate to /contactos when clicking the Contactos entry without a full page reload', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser at /clientes
    await page.goto('/clientes');

    let fullReloadOccurred = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloadOccurred = true;
      }
    });
    fullReloadOccurred = false;

    // WHEN: The user clicks the "Contactos" entry in the NavigationRail
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');

    // AND: No full page reload occurred
    expect(fullReloadOccurred).toBe(false);
  });

  test('should NOT display the mobile NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded with a desktop viewport (1280x800)
    await page.goto('/clientes');

    // WHEN: The user views the navigation
    // THEN: The mobile NavigationBar is NOT visible (hidden via Tailwind lg: responsive class)
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (viewport < 1024px)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 dimensions

  test('should display the NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (width < 1024px)
    const navBarPromise = page.waitForSelector('[data-testid="navigation-bar"]');

    // WHEN: The user navigates to the application
    await page.goto('/clientes');

    // THEN: The NavigationBar component is visible
    const navBar = await navBarPromise;
    await expect(navBar).toBeVisible();
  });

  test('should show a tappable "Clientes" entry in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: The mobile NavigationBar is rendered on a small viewport
    await page.goto('/clientes');

    // WHEN: The user views the navigation
    // THEN: The "Clientes" nav item is accessible and tappable
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toBeVisible();
    await expect(clientesItem).toBeEnabled();
  });

  test('should show a tappable "Contactos" entry in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: The mobile NavigationBar is rendered on a small viewport
    await page.goto('/clientes');

    // WHEN: The user views the navigation
    // THEN: The "Contactos" nav item is accessible and tappable
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toBeVisible();
    await expect(contactosItem).toBeEnabled();
  });

  test('should navigate to /contactos when tapping Contactos in mobile NavigationBar', async ({ page }) => {
    // GIVEN: The application is loaded on mobile at /clientes
    await page.goto('/clientes');

    // WHEN: The user taps the "Contactos" item in the bottom NavigationBar
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');
  });

  test('should NOT display the desktop NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded with a mobile viewport (390x844)
    await page.goto('/clientes');

    // WHEN: The user views the navigation
    // THEN: The desktop NavigationRail is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep Linking
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep Linking (FR30)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when typing /clientes directly in the URL bar', async ({ page }) => {
    // GIVEN: The user types /clientes directly into the browser URL bar (fresh navigation)
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered (no redirection to a home screen)
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render the Contactos view when typing /contactos directly in the URL bar', async ({ page }) => {
    // GIVEN: The user types /contactos directly into the browser URL bar (fresh navigation)
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered (no redirection to a home screen)
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should redirect from root / to /clientes', async ({ page }) => {
    // GIVEN: The user navigates to the root URL /
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The user is redirected to /clientes (index redirect)
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Not Found / 404 Route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Not Found (404) route', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display a 404 not-found view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/ruta-desconocida');

    // THEN: The not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display a Spanish error message on the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route /unknown
    // WHEN: The page loads
    await page.goto('/unknown');

    // THEN: The 404 view contains a message in Spanish
    const notFoundView = page.locator('[data-testid="not-found-view"]');
    await expect(notFoundView).toContainText('Página no encontrada');
  });

  test('should display a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The user is on the 404 not-found view
    await page.goto('/unknown');

    // WHEN: The user views the not-found view
    // THEN: A link back to /clientes is present and navigates correctly when clicked
    const backLink = page.locator('[data-testid="not-found-back-link"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/clientes');
  });
});
