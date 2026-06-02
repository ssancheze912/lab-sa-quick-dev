import { test, expect } from '@playwright/test';
import { NavigationShellPage } from '../../pages/navigation.page';

// Skip desktop-only viewport tests when running in a mobile project context.
// mobile-chrome has isMobile: true which causes Tailwind CSS media queries to
// respond to the device flag rather than the numeric viewport width, making
// hidden lg:flex / flex lg:hidden behave as if the viewport is mobile even at 1280px.
const DESKTOP_ONLY_SKIP = (projectName: string) =>
  projectName === 'mobile-chrome';

/**
 * Story 1.2 — Frontend Navigation Shell
 * Epic 1 — Project Foundation & Application Shell
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop (≥1024px): NavigationRail visible on left with Clientes and Contactos; SPA navigation
 *   AC2 — Mobile (<1024px): NavigationBar at bottom instead of rail; items accessible and tappable
 *   AC3 — Deep linking: direct URL /clientes and /contactos renders correct view (no redirect)
 *   AC4 — Unknown route: 404 view displayed with Spanish message
 *
 * ALL TESTS ARE IN RED (FAILING) PHASE.
 * They fail because the NavigationRail/Bar, routes, and 404 view are not yet implemented.
 *
 * Test IDs: E2E-F-01 through E2E-F-08
 *
 * Network-first pattern applied: all route interceptions registered before page.goto().
 * Selectors use data-testid for resilience; ARIA fallback used only for navigation roles.
 */

// ---------------------------------------------------------------------------
// Desktop suite — viewport ≥ 1024px (uses default Playwright Desktop Chrome)
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — NavigationRail (Desktop ≥ 1024px)', () => {
  /**
   * E2E-F-01 (P0 — AC1)
   * Given the application is loaded on a desktop browser (viewport ≥ 1024px)
   * When the user views the app
   * Then a NavigationRail is visible on the left side with "Clientes" and "Contactos" entries
   */
  test('E2E-F-01 — NavigationRail visible con entradas Clientes y Contactos en desktop', async ({
    page,
  }, testInfo) => {
    test.skip(
      DESKTOP_ONLY_SKIP(testInfo.project.name),
      'Desktop-only test: skipped in mobile-chrome project (isMobile: true affects Tailwind media queries)',
    );
    const nav = new NavigationShellPage(page);

    // GIVEN: desktop viewport (≥1024px) — enforced by project "chromium" config

    // WHEN: the app loads
    await nav.goto();

    // THEN: NavigationRail is visible (data-testid="navigation-rail")
    await expect(nav.navigationRail).toBeVisible();

    // AND: "Clientes" link is visible inside the rail
    await expect(nav.clientesLink).toBeVisible();

    // AND: "Contactos" link is visible inside the rail
    await expect(nav.contactosLink).toBeVisible();
  });

  /**
   * E2E-F-02 (P0 — AC1 — FR28)
   * Given the desktop app is loaded
   * When the user clicks the "Clientes" navigation entry
   * Then the URL changes to /clientes WITHOUT a full page reload (SPA navigation)
   */
  test('E2E-F-02 — Clic en Clientes navega a /clientes sin recarga de página', async ({
    page,
  }) => {
    const nav = new NavigationShellPage(page);
    let fullReloadOccurred = false;

    // GIVEN: intercept full-page load events before navigation
    page.on('load', () => {
      // The 'load' event fires on full page reload, not on SPA pushState navigation.
      // We expect it only during the initial goto('/') — any subsequent load event
      // means a full page reload happened (fail condition).
      fullReloadOccurred = true;
    });

    await nav.goto();
    // Reset flag after initial load — only subsequent loads are failures
    fullReloadOccurred = false;

    // WHEN: user clicks the Clientes link
    await nav.clientesLink.click();

    // THEN: URL is /clientes
    await expect(page).toHaveURL(/\/clientes/);

    // AND: no full page reload occurred (SPA navigation via pushState)
    expect(fullReloadOccurred).toBe(false);
  });

  /**
   * E2E-F-03 (P0 — AC1 — FR28)
   * Given the desktop app is loaded
   * When the user clicks the "Contactos" navigation entry
   * Then the URL changes to /contactos WITHOUT a full page reload (SPA navigation)
   */
  test('E2E-F-03 — Clic en Contactos navega a /contactos sin recarga de página', async ({
    page,
  }) => {
    const nav = new NavigationShellPage(page);
    let fullReloadOccurred = false;

    // GIVEN: intercept load events before navigation
    page.on('load', () => {
      fullReloadOccurred = true;
    });

    await nav.goto();
    fullReloadOccurred = false;

    // WHEN: user clicks the Contactos link
    await nav.contactosLink.click();

    // THEN: URL is /contactos
    await expect(page).toHaveURL(/\/contactos/);

    // AND: no full page reload occurred
    expect(fullReloadOccurred).toBe(false);
  });

  /**
   * E2E-F-01b (P1 — AC1)
   * Given the desktop app is loaded
   * When the active route is /clientes
   * Then the NavigationBar is NOT visible (desktop uses NavigationRail instead)
   */
  test('E2E-F-01b — NavigationBar NO está visible en viewport desktop', async ({ page }, testInfo) => {
    test.skip(
      DESKTOP_ONLY_SKIP(testInfo.project.name),
      'Desktop-only test: skipped in mobile-chrome project (isMobile: true affects Tailwind media queries)',
    );
    const nav = new NavigationShellPage(page);

    // GIVEN: app loaded on desktop viewport
    await nav.goto();

    // THEN: NavigationBar (mobile) is not visible
    await expect(nav.navigationBar).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Deep linking suite — direct URL navigation (AC3 / FR30)
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — Deep Linking (AC3 / FR30)', () => {
  /**
   * E2E-F-04 (P0 — AC3 — FR30)
   * Given the user types /clientes directly in the browser URL bar
   * When the page loads
   * Then the Clientes view is rendered without redirection to a home screen
   */
  test('E2E-F-04 — Deep link /clientes renderiza vista Clientes sin redirección', async ({
    page,
  }) => {
    // GIVEN + WHEN: direct navigation to /clientes (no prior app state)
    await page.goto('/clientes');

    // THEN: URL remains /clientes (no redirect happened)
    await expect(page).toHaveURL(/\/clientes$/);

    // AND: the Clientes heading/content is visible
    await expect(page.getByTestId('clientes-view')).toBeVisible();
  });

  /**
   * E2E-F-05 (P0 — AC3 — FR30)
   * Given the user types /contactos directly in the browser URL bar
   * When the page loads
   * Then the Contactos view is rendered without redirection to a home screen
   */
  test('E2E-F-05 — Deep link /contactos renderiza vista Contactos sin redirección', async ({
    page,
  }) => {
    // GIVEN + WHEN: direct navigation to /contactos (no prior app state)
    await page.goto('/contactos');

    // THEN: URL remains /contactos (no redirect happened)
    await expect(page).toHaveURL(/\/contactos$/);

    // AND: the Contactos heading/content is visible
    await expect(page.getByTestId('contactos-view')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 404 / Unknown route suite (AC4)
// ---------------------------------------------------------------------------
test.describe('Story 1.2 — Vista 404 (AC4)', () => {
  /**
   * E2E-F-08 (P2 — AC4)
   * Given the user navigates to an unknown route (e.g. /unknown)
   * When the page loads
   * Then a 404 / not-found view is displayed gracefully with a message in Spanish
   */
  test('E2E-F-08 — Ruta desconocida muestra vista 404 con mensaje en español', async ({
    page,
  }) => {
    // GIVEN + WHEN: navigate to an unknown route
    await page.goto('/ruta-que-no-existe');

    // THEN: 404 view container is visible
    await expect(page.getByTestId('not-found-view')).toBeVisible();

    // AND: Spanish message "Página no encontrada" is displayed
    await expect(page.getByText('Página no encontrada')).toBeVisible();

    // AND: link back to Clientes is available
    await expect(page.getByRole('link', { name: /ir a clientes/i })).toBeVisible();
  });

  /**
   * E2E-F-08b (P2 — AC4)
   * Given the user navigates to another unknown route (e.g. /abc)
   * When the page loads
   * Then the 404 view still appears (not just for one specific path)
   */
  test('E2E-F-08b — Cualquier ruta desconocida muestra vista 404 (catch-all)', async ({
    page,
  }) => {
    // GIVEN + WHEN: navigate to a different unknown route
    await page.goto('/abc');

    // THEN: 404 view container is visible
    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });
});
