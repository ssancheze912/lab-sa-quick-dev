/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop with "Clientes" and "Contactos"; clicking navigates
 *          without full page reload (FR28)
 *   AC2 — NavigationBar displayed at bottom on mobile viewport < 1024px; items tappable (FR29)
 *   AC3 — Direct URL access to /clientes and /contactos renders the correct view and highlights
 *          the active nav entry (FR30)
 *   AC4 — Unknown route renders a 404 view in Spanish
 *   AC5 — Root URL / redirects automatically to /clientes
 *   AC6 — Active route is visually distinguished from inactive routes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail visible with Clientes and Contactos (FR28)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail with Clientes and Contactos', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should display the NavigationRail on the left side on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // Network-first: register response listener BEFORE navigation
    const navigationResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );

    // WHEN: The user views the app
    await page.goto('/clientes');
    await navigationResponse;

    // THEN: A NavigationRail component is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display "Clientes" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail contains a "Clientes" entry
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toContainText('Clientes');
  });

  test('should display "Contactos" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail contains a "Contactos" entry
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toContainText('Contactos');
  });

  test('should navigate to /clientes without full page reload when clicking the Clientes entry', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');

    // Network-first: intercept BEFORE clicking to detect page reload
    let navigationOccurred = false;
    page.on('framenavigated', (frame) => {
      // A full page reload emits a main-frame navigation event with a new document
      if (frame === page.mainFrame()) {
        navigationOccurred = true;
      }
    });

    // Reset the flag after initial load
    await page.waitForLoadState('networkidle');
    navigationOccurred = false;

    // WHEN: The user clicks the Clientes navigation entry
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: The URL changes to /clientes without a full page reload (client-side routing)
    await expect(page).toHaveURL('/clientes');
    expect(navigationOccurred).toBe(false);
  });

  test('should navigate to /contactos without full page reload when clicking the Contactos entry', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');

    // Network-first: intercept BEFORE clicking
    let navigationOccurred = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationOccurred = true;
      }
    });

    await page.waitForLoadState('networkidle');
    navigationOccurred = false;

    // WHEN: The user clicks the Contactos navigation entry
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: The URL changes to /contactos without a full page reload (client-side routing)
    await expect(page).toHaveURL('/contactos');
    expect(navigationOccurred).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile: NavigationBar displayed at the bottom (FR29)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar at bottom (viewport < 1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should display the NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (width < 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A NavigationBar component is displayed at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT display the NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail is hidden on mobile
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeHidden();
  });

  test('should display the Clientes navigation item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationBar contains a tappable Clientes entry
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toContainText('Clientes');
  });

  test('should display the Contactos navigation item in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationBar contains a tappable Contactos entry
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toContainText('Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL access renders correct view (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking: direct URL access to /clientes and /contactos', () => {
  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered (not a redirect to another screen)
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered (not a redirect to another screen)
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should highlight the Clientes nav entry as active when /clientes is the current URL', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes navigation entry is visually highlighted as active
    const clientesNavItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesNavItem).toHaveAttribute('data-active', 'true');
  });

  test('should highlight the Contactos nav entry as active when /contactos is the current URL', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos navigation entry is visually highlighted as active
    const contactosNavItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosNavItem).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route renders a 404 view in Spanish
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Unknown route displays a 404 view in Spanish', () => {
  test('should display a 404 not-found view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/ruta-desconocida');

    // THEN: A 404 / not-found view is displayed gracefully
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display the 404 message in Spanish', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route (e.g., /unknown)
    // WHEN: The page loads
    await page.goto('/pagina-inexistente');

    // THEN: A Spanish error message is shown (e.g., "Página no encontrada")
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('should provide a link back to /clientes from the 404 view', async ({ page }) => {
    // GIVEN: The user lands on a 404 view
    // WHEN: The user sees the not-found page
    await page.goto('/ruta-invalida');

    // THEN: A link to return to the main page (/clientes) is available
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root URL / redirects automatically to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root URL / redirects to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The user accesses the root URL /
    // Network-first: register URL expectation BEFORE navigation
    const redirectPromise = page.waitForURL('/clientes');

    // WHEN: The page loads
    await page.goto('/');

    // THEN: The user is automatically redirected to /clientes
    await redirectPromise;
    await expect(page).toHaveURL('/clientes');
  });

  test('should show the Clientes view content after the redirect from /', async ({ page }) => {
    // GIVEN: The user accesses the root URL /
    // WHEN: The page loads and redirects
    await page.goto('/');
    await page.waitForURL('/clientes');

    // THEN: The Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Active route is visually distinguished from inactive routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Active route distinguished from inactive routes', () => {
  test('should mark Clientes as active and Contactos as inactive when on /clientes', async ({ page }) => {
    // GIVEN: Any navigation entry is rendered
    // WHEN: The current route is /clientes
    await page.goto('/clientes');

    // THEN: The Clientes entry has the active state
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');

    // AND: The Contactos entry does NOT have the active state
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'false');
  });

  test('should mark Contactos as active and Clientes as inactive when on /contactos', async ({ page }) => {
    // GIVEN: Any navigation entry is rendered
    // WHEN: The current route is /contactos
    await page.goto('/contactos');

    // THEN: The Contactos entry has the active state
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');

    // AND: The Clientes entry does NOT have the active state
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'false');
  });

  test('should update active state when navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: The user is on the /clientes route
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');

    // WHEN: The user navigates to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: The active state switches to Contactos
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'false');
  });
});
