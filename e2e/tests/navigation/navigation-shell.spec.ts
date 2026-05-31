/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail + Navbar visible (≥ 1024px)
 *   AC2 — Desktop: clicking "Clientes" navigates to /clientes without full reload, item active
 *   AC3 — Desktop: clicking "Contactos" navigates to /contactos without full reload, item active
 *   AC4 — Mobile: NavigationBar (bottom) visible instead of rail (< 1024px), 44px touch targets
 *   AC5 — Deep link /clientes renders Clientes view with nav shell (no redirect)
 *   AC6 — Deep link /contactos renders Contactos view with nav shell (no redirect)
 *   AC7 — Unknown route renders 404 view in Spanish with link to home
 *   AC8 — Root / redirects automatically to /clientes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail + Navbar visible on desktop viewport (≥ 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop navigation shell visible on desktop viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display the Navbar with productName "Siesa Agents" on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport ≥ 1024px)
    // Network-first: intercept before navigation
    const appResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );

    // WHEN: The user views the app
    await page.goto('/clientes');
    await appResponse;

    // THEN: A Navbar with productName="Siesa Agents" is visible at the top (64px)
    const navbar = page.getByTestId('navbar');
    await expect(navbar).toBeVisible();
    await expect(navbar).toContainText('Siesa Agents');
  });

  test('should display the NavigationRail on the left side on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport ≥ 1024px
    // Network-first
    const appResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );

    // WHEN: The user views the app at /clientes
    await page.goto('/clientes');
    await appResponse;

    // THEN: NavigationRail is visible on the left side (collapsed 72px icon-only)
    const navRail = page.getByTestId('navigation-rail');
    await expect(navRail).toBeVisible();
  });

  test('should show "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport ≥ 1024px, NavigationRail is visible
    await page.goto('/clientes');

    // THEN: "Clientes" navigation entry is present in the rail
    const clientesItem = page.getByTestId('nav-item-clientes');
    await expect(clientesItem).toBeVisible();
    await expect(clientesItem).toContainText('Clientes');
  });

  test('should show "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport ≥ 1024px, NavigationRail is visible
    await page.goto('/clientes');

    // THEN: "Contactos" navigation entry is present in the rail
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).toBeVisible();
    await expect(contactosItem).toContainText('Contactos');
  });

  test('should NOT display the NavigationBar (mobile bottom nav) on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport ≥ 1024px
    await page.goto('/clientes');

    // THEN: Mobile bottom NavigationBar is NOT visible on desktop
    const navBar = page.getByTestId('navigation-bar');
    await expect(navBar).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Desktop: clicking "Clientes" navigates client-side, item shown as active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — NavigationRail: Clientes entry navigates without full page reload', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /clientes on clicking Clientes without a full page reload', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/contactos');

    // Track full-page navigation events (frame navigation = reload indicator)
    const fullReloads: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloads.push(frame.url());
      }
    });

    // WHEN: The user clicks the "Clientes" entry in the NavigationRail
    const clientesItem = page.getByTestId('nav-item-clientes');
    await clientesItem.click();

    // THEN: Browser navigates to /clientes (URL updated)
    await page.waitForURL('**/clientes**');
    expect(page.url()).toContain('/clientes');

    // AND: It was client-side (no HTML reload — the frame navigation should only be the initial load)
    // TanStack Router pushes history via pushState, so framenavigated only fires on hard reloads
    const hardReloads = fullReloads.filter((url) => url.includes('/clientes'));
    expect(hardReloads).toHaveLength(0);
  });

  test('should mark the "Clientes" item as active (aria-current="page") after navigation', async ({ page }) => {
    // GIVEN: Desktop browser, user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The "Clientes" nav item has aria-current="page" attribute indicating it is active (FR28)
    const clientesItem = page.getByTestId('nav-item-clientes');
    await expect(clientesItem).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark "Contactos" as active when on /clientes route', async ({ page }) => {
    // GIVEN: User is at /clientes
    await page.goto('/clientes');

    // THEN: Contactos nav item does NOT have aria-current="page"
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Desktop: clicking "Contactos" navigates client-side, item shown as active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — NavigationRail: Contactos entry navigates without full page reload', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos on clicking Contactos without a full page reload', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser, starting from /clientes
    await page.goto('/clientes');

    const fullReloads: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloads.push(frame.url());
      }
    });

    // WHEN: The user clicks the "Contactos" entry in the NavigationRail
    const contactosItem = page.getByTestId('nav-item-contactos');
    await contactosItem.click();

    // THEN: Browser navigates to /contactos
    await page.waitForURL('**/contactos**');
    expect(page.url()).toContain('/contactos');

    // AND: No full page reload occurred (client-side routing)
    const hardReloads = fullReloads.filter((url) => url.includes('/contactos'));
    expect(hardReloads).toHaveLength(0);
  });

  test('should mark the "Contactos" item as active (aria-current="page") after navigation', async ({ page }) => {
    // GIVEN: Desktop browser, user navigates to /contactos
    await page.goto('/contactos');

    // THEN: The "Contactos" nav item has aria-current="page" (FR28)
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark "Clientes" as active when on /contactos route', async ({ page }) => {
    // GIVEN: User is at /contactos
    await page.goto('/contactos');

    // THEN: Clientes nav item does NOT have aria-current="page"
    const clientesItem = page.getByTestId('nav-item-clientes');
    await expect(clientesItem).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Mobile: NavigationBar (bottom) visible instead of NavigationRail (< 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Mobile: NavigationBar (bottom nav) on viewport < 1024px', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone SE / Pixel 5

  test('should display NavigationBar (bottom nav) on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile browser viewport (< 1024px)
    // Network-first: intercept before navigation
    const appResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );

    // WHEN: The user views the app
    await page.goto('/clientes');
    await appResponse;

    // THEN: A NavigationBar (bottom navigation) is displayed (FR29)
    const navBar = page.getByTestId('navigation-bar');
    await expect(navBar).toBeVisible();
  });

  test('should NOT display the NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport (< 1024px)
    await page.goto('/clientes');

    // THEN: NavigationRail is NOT visible (hidden or absent on mobile)
    const navRail = page.getByTestId('navigation-rail');
    await expect(navRail).toBeHidden();
  });

  test('should show "Clientes" item accessible in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport, NavigationBar visible
    await page.goto('/clientes');

    // THEN: Clientes item is visible and accessible in bottom nav
    const clientesItem = page.getByTestId('nav-item-clientes');
    await expect(clientesItem).toBeVisible();
    await expect(clientesItem).toContainText('Clientes');
  });

  test('should show "Contactos" item accessible in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport, NavigationBar visible
    await page.goto('/clientes');

    // THEN: Contactos item is visible and accessible in bottom nav
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).toBeVisible();
    await expect(contactosItem).toContainText('Contactos');
  });

  test('should have minimum 44px touch targets for NavigationBar items (WCAG 2.1 AA, FR29)', async ({ page }) => {
    // GIVEN: Mobile viewport, NavigationBar items rendered
    await page.goto('/clientes');

    // THEN: Each navigation item meets 44px minimum touch target height (WCAG 2.1 AA)
    const clientesItem = page.getByTestId('nav-item-clientes');
    const contactosItem = page.getByTestId('nav-item-contactos');

    const clientesBox = await clientesItem.boundingBox();
    const contactosBox = await contactosItem.boundingBox();

    expect(clientesBox).not.toBeNull();
    expect(contactosBox).not.toBeNull();

    // Minimum 44px height required
    expect(clientesBox!.height).toBeGreaterThanOrEqual(44);
    expect(contactosBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should navigate to /contactos on tapping Contactos in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport, user at /clientes
    await page.goto('/clientes');

    // WHEN: User taps "Contactos" in the NavigationBar
    const contactosItem = page.getByTestId('nav-item-contactos');
    await contactosItem.tap();

    // THEN: Navigates to /contactos without full reload (FR29)
    await page.waitForURL('**/contactos**');
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Deep link: /clientes renders correctly without redirect (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Deep linking: direct URL /clientes renders without redirect', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view on direct URL /clientes without any redirect', async ({ page }) => {
    // GIVEN: User types /clientes directly in the browser URL bar
    // WHEN: The page loads
    // Network-first: wait for response before asserting URL
    const appResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );
    await page.goto('/clientes');
    await appResponse;

    // THEN: URL remains /clientes (no redirect to another URL) — FR30
    expect(page.url()).toContain('/clientes');
    expect(page.url()).not.toContain('/unknown');
    expect(page.url()).not.toMatch(/\/$(?!clientes)/);
  });

  test('should show the navigation shell when loading /clientes via direct URL', async ({ page }) => {
    // GIVEN: Direct navigation to /clientes
    await page.goto('/clientes');

    // THEN: Navigation shell (NavRail or NavBar) is present
    const navbar = page.getByTestId('navbar');
    await expect(navbar).toBeVisible();
  });

  test('should render the Clientes placeholder content at /clientes', async ({ page }) => {
    // GIVEN: Direct navigation to /clientes
    await page.goto('/clientes');

    // THEN: The Clientes view content is rendered (placeholder page)
    const clientesView = page.getByTestId('clientes-page');
    await expect(clientesView).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Deep link: /contactos renders correctly without redirect (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Deep linking: direct URL /contactos renders without redirect', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Contactos view on direct URL /contactos without any redirect', async ({ page }) => {
    // GIVEN: User types /contactos directly in the browser URL bar
    const appResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );

    // WHEN: The page loads
    await page.goto('/contactos');
    await appResponse;

    // THEN: URL remains /contactos (no redirect) — FR30
    expect(page.url()).toContain('/contactos');
  });

  test('should show the navigation shell when loading /contactos via direct URL', async ({ page }) => {
    // GIVEN: Direct navigation to /contactos
    await page.goto('/contactos');

    // THEN: Navigation shell is present
    const navbar = page.getByTestId('navbar');
    await expect(navbar).toBeVisible();
  });

  test('should render the Contactos placeholder content at /contactos', async ({ page }) => {
    // GIVEN: Direct navigation to /contactos
    await page.goto('/contactos');

    // THEN: The Contactos view content is rendered (placeholder page)
    const contactosView = page.getByTestId('contactos-page');
    await expect(contactosView).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Unknown route: 404 view displayed gracefully with Spanish message and link
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Unknown route renders 404 not-found view gracefully', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render a 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: User navigates to a non-existent route
    // WHEN: The page loads at /unknown
    const appResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );
    await page.goto('/unknown-route-that-does-not-exist');
    await appResponse;

    // THEN: A not-found view is displayed (no blank screen, no crash)
    const notFoundView = page.getByTestId('not-found-page');
    await expect(notFoundView).toBeVisible();
  });

  test('should display the 404 message in Spanish: "Página no encontrada"', async ({ page }) => {
    // GIVEN: Unknown route /unknown
    await page.goto('/unknown-route-atdd-test');

    // THEN: Spanish 404 message is shown
    await expect(page.getByText('Página no encontrada')).toBeVisible();
  });

  test('should display a link to return to the home section from the 404 view', async ({ page }) => {
    // GIVEN: Unknown route displayed
    await page.goto('/unknown-route-atdd-test');

    // THEN: A link "Volver a Clientes" is present and points to /clientes
    const backLink = page.getByTestId('not-found-back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Volver a Clientes');
    await expect(backLink).toHaveAttribute('href', expect.stringContaining('/clientes'));
  });

  test('should navigate to /clientes when clicking the return link from 404 view', async ({ page }) => {
    // GIVEN: 404 view is displayed
    await page.goto('/unknown-route-atdd-test');

    // WHEN: User clicks the return link
    const backLink = page.getByTestId('not-found-back-link');
    await backLink.click();

    // THEN: User is taken to /clientes
    await page.waitForURL('**/clientes**');
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Root / redirects automatically to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Root / redirects automatically to /clientes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should redirect from / to /clientes automatically on page load', async ({ page }) => {
    // GIVEN: The app is loaded at / (root)
    // Network-first: set up response intercept before navigation
    const appResponse = page.waitForResponse(
      (resp) => resp.url().includes('localhost:5173') && resp.status() === 200
    );

    // WHEN: The page renders
    await page.goto('/');
    await appResponse;

    // THEN: The user is automatically redirected to /clientes (beforeLoad redirect)
    await page.waitForURL('**/clientes**');
    expect(page.url()).toContain('/clientes');
  });

  test('should render the Clientes view (not a blank page) after redirect from /', async ({ page }) => {
    // GIVEN: App loaded at /
    await page.goto('/');
    await page.waitForURL('**/clientes**');

    // THEN: Clientes page content is visible (not blank)
    const clientesView = page.getByTestId('clientes-page');
    await expect(clientesView).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WCAG Accessibility: ARIA labels on navigation items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — ARIA labels on navigation items (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have ARIA labels in Spanish on navigation items', async ({ page }) => {
    // GIVEN: App loaded at /clientes
    await page.goto('/clientes');

    // THEN: Navigation items have descriptive ARIA labels in Spanish
    const clientesItem = page.getByTestId('nav-item-clientes');
    const contactosItem = page.getByTestId('nav-item-contactos');

    // aria-label must be set in Spanish
    const clientesAriaLabel = await clientesItem.getAttribute('aria-label');
    const contactosAriaLabel = await contactosItem.getAttribute('aria-label');

    expect(clientesAriaLabel).not.toBeNull();
    expect(contactosAriaLabel).not.toBeNull();
    // Labels must be in Spanish (contain Spanish text)
    expect(clientesAriaLabel).toMatch(/[Cc]lientes/);
    expect(contactosAriaLabel).toMatch(/[Cc]ontactos/);
  });
});
