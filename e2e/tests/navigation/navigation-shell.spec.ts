/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail visible with Clientes and Contactos; SPA navigation (FR28)
 *   AC2 — Mobile (< 1024px): NavigationBar at bottom, items tappable (FR29)
 *   AC3 — Deep linking to /clientes and /contactos renders correct view; active item highlighted (FR30)
 *   AC4 — Unknown route shows 404 view with link back to /clientes
 *   AC5 — Root / redirects automatically to /clientes
 */

import { test, expect } from '@playwright/test';
import { NavigationShellPage } from '../../pages/navigation-shell.page';

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Desktop NavigationRail — SPA navigation without full page reload (FR28)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (FR28)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display NavigationRail on desktop viewport', async ({ page }) => {
    // GIVEN: Application loaded on a desktop browser (>= 1024px)
    const nav = new NavigationShellPage(page);

    // Network-first: intercept BEFORE navigation
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: NavigationRail is visible on the left side
    await expect(nav.navigationRail).toBeVisible();
  });

  test('should display Clientes entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Application loaded on a desktop browser
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: "Clientes" navigation entry is visible in the rail
    await expect(nav.railItemClientes).toBeVisible();
  });

  test('should display Contactos entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Application loaded on a desktop browser
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: "Contactos" navigation entry is visible in the rail
    await expect(nav.railItemContactos).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes rail item', async ({ page }) => {
    // GIVEN: Application loaded on desktop, user is on /contactos
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');

    // Track navigation events to detect full page reload
    let fullReload = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame() && frame.url().includes('/clientes')) {
        // SPA navigation does not trigger framenavigated; if it does it is a full reload
        fullReload = true;
      }
    });

    // WHEN: User clicks the Clientes navigation item
    await nav.railItemClientes.click();
    await page.waitForURL('**/clientes');

    // THEN: URL changes to /clientes without a full page reload
    expect(page.url()).toContain('/clientes');
    expect(fullReload).toBe(false);
  });

  test('should navigate to /contactos without full page reload when clicking Contactos rail item', async ({ page }) => {
    // GIVEN: Application loaded on desktop, user is on /clientes
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    let fullReload = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame() && frame.url().includes('/contactos')) {
        fullReload = true;
      }
    });

    // WHEN: User clicks the Contactos navigation item
    await nav.railItemContactos.click();
    await page.waitForURL('**/contactos');

    // THEN: URL changes to /contactos without a full page reload
    expect(page.url()).toContain('/contactos');
    expect(fullReload).toBe(false);
  });

  test('should have accessible navigation container with aria-label on desktop', async ({ page }) => {
    // GIVEN: Application loaded on desktop
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: Navigation has aria-label="Navegación principal" for WCAG 2.1 AA compliance
    await expect(nav.navContainer).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Mobile NavigationBar at bottom (FR29)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (FR29)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should display NavigationBar at bottom on mobile viewport (< 1024px)', async ({ page }) => {
    // GIVEN: Application loaded on a mobile browser viewport (< 1024px)
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The user views the app
    // THEN: NavigationBar is displayed (not NavigationRail)
    await expect(nav.navigationBar).toBeVisible();
  });

  test('should hide NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Application loaded on mobile viewport
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: Mobile viewport is active
    // THEN: NavigationRail is not visible (hidden via responsive CSS)
    await expect(nav.navigationRail).toBeHidden();
  });

  test('should display Clientes entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Application loaded on mobile viewport
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The user views the app on mobile
    // THEN: "Clientes" item is accessible and tappable in the bottom bar
    await expect(nav.barItemClientes).toBeVisible();
  });

  test('should display Contactos entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Application loaded on mobile viewport
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: The user views the app on mobile
    // THEN: "Contactos" item is accessible and tappable in the bottom bar
    await expect(nav.barItemContactos).toBeVisible();
  });

  test('should navigate to /contactos when tapping Contactos in mobile NavigationBar', async ({ page }) => {
    // GIVEN: Application loaded on mobile, user is on /clientes
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: User taps the Contactos navigation item in the bottom bar
    await nav.barItemContactos.tap();
    await page.waitForURL('**/contactos');

    // THEN: App navigates to /contactos
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Deep linking renders correct view; active item highlighted (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking and active navigation state (FR30)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: User types /clientes directly in the browser URL bar
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await nav.gotoClientes();

    // THEN: The Clientes view is rendered (data-testid="clientes-page")
    await expect(nav.clientesPage).toBeVisible();
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: User types /contactos directly in the browser URL bar
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await nav.gotoContactos();

    // THEN: The Contactos view is rendered (data-testid="contactos-page")
    await expect(nav.contactosPage).toBeVisible();
  });

  test('should highlight the Clientes nav item as active when on /clientes route', async ({ page }) => {
    // GIVEN: User is on the /clientes route
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();

    // WHEN: The page is loaded
    // THEN: The Clientes nav item has aria-current="page" (active state indication)
    await expect(nav.railItemClientes).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight the Contactos nav item as active when on /contactos route', async ({ page }) => {
    // GIVEN: User is on the /contactos route
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoContactos();

    // WHEN: The page is loaded
    // THEN: The Contactos nav item has aria-current="page" (active state indication)
    await expect(nav.railItemContactos).toHaveAttribute('aria-current', 'page');
  });

  test('should not redirect /clientes to home screen (deep linking preserved)', async ({ page }) => {
    // GIVEN: User navigates directly to /clientes
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: URL remains /clientes — not redirected to /
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
    expect(page.url()).not.toMatch(/\/$/); // must not be root /
  });

  test('should not redirect /contactos to home screen (deep linking preserved)', async ({ page }) => {
    // GIVEN: User navigates directly to /contactos
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: URL remains /contactos — not redirected to /
    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Unknown route shows 404 not-found view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not-Found view for unknown routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display a not-found view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: User navigates to an unknown route (e.g. /unknown)
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await nav.gotoUnknownRoute();

    // THEN: A 404 / not-found view is displayed (heading "Página no encontrada")
    await expect(nav.notFoundHeading).toBeVisible();
  });

  test('should display a link back to /clientes in the not-found view', async ({ page }) => {
    // GIVEN: User is on an unknown route
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoUnknownRoute();

    // WHEN: Not-found view is rendered
    // THEN: A link "Ir a Clientes" is present and points to /clientes
    await expect(nav.notFoundBackLink).toBeVisible();
    await expect(nav.notFoundBackLink).toHaveAttribute('href', expect.stringContaining('/clientes'));
  });

  test('should navigate back to /clientes when clicking the back link on not-found view', async ({ page }) => {
    // GIVEN: User is viewing the not-found page
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoUnknownRoute();

    // WHEN: User clicks the "Ir a Clientes" link
    await nav.notFoundBackLink.click();
    await page.waitForURL('**/clientes');

    // THEN: App navigates back to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Root / redirects automatically to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root redirect to /clientes', () => {
  test('should redirect the browser from / to /clientes automatically', async ({ page }) => {
    // GIVEN: User accesses the application root /
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: Browser is redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('should render the Clientes view after redirect from /', async ({ page }) => {
    // GIVEN: User accesses the application root /
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());

    // WHEN: Root / is accessed and redirect happens
    await nav.gotoRoot();
    await page.waitForURL('**/clientes');

    // THEN: The Clientes view is rendered after redirect
    await expect(nav.clientesPage).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-cutting: App root container and shell layout
// ─────────────────────────────────────────────────────────────────────────────

test.describe('App Shell — Layout and global container', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render app-root container wrapping the entire application', async ({ page }) => {
    // GIVEN: Application is loaded
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: Any page is rendered
    // THEN: The data-testid="app-root" container is present (required by __root.tsx)
    await expect(nav.appRoot).toBeVisible();
  });
});
