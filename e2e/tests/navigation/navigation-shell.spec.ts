/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible on viewport >= 1024px, SPA navigation to /clientes and /contactos
 *   AC2 — Mobile NavigationBar visible on viewport < 1024px, tappable items, WCAG 44x44px touch targets
 *   AC3 — Direct URL access to /clientes and /contactos renders correct view + active nav state
 *   AC4 — Unknown route renders graceful 404 view with back-link to /clientes
 *   AC5 — Root / redirects to /clientes without full page reload
 *   AC6 — Accessibility: aria-label in Spanish, aria-current="page" on active route, <nav> landmark
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport >= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail on viewport >= 1024px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: Application is loaded on a desktop browser (viewport >= 1024px)
    // Network-first: register load state BEFORE navigation
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The user views the app

    // THEN: NavigationRail is visible with data-testid="nav-rail"
    await expect(page.locator('[data-testid="nav-rail"]')).toBeVisible();
  });

  test('should show "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The user views the navigation rail

    // THEN: "Clientes" navigation item is visible
    await expect(page.locator('[data-testid="nav-rail"]').getByText('Clientes')).toBeVisible();
  });

  test('should show "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The user views the navigation rail

    // THEN: "Contactos" navigation item is visible
    await expect(page.locator('[data-testid="nav-rail"]').getByText('Contactos')).toBeVisible();
  });

  test('should navigate to /clientes without a full page reload when clicking Clientes', async ({ page }) => {
    // GIVEN: Desktop browser with app loaded on /contactos
    // Network-first: intercept BEFORE navigation to detect SPA behavior
    let navigationCount = 0;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame() && frame.url().includes('/clientes')) {
        navigationCount++;
      }
    });

    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // WHEN: The user clicks the "Clientes" entry in NavigationRail
    await page.locator('[data-testid="nav-rail"]').getByText('Clientes').click();

    // THEN: URL changes to /clientes without a full page reload (SPA navigation)
    await expect(page).toHaveURL(/\/clientes/);
    expect(navigationCount).toBeLessThanOrEqual(1); // SPA: no extra full-page navigations
  });

  test('should navigate to /contactos without a full page reload when clicking Contactos', async ({ page }) => {
    // GIVEN: Desktop browser with app loaded on /clientes
    // Network-first: prepare navigation listener BEFORE initial load
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The user clicks the "Contactos" entry in NavigationRail
    await page.locator('[data-testid="nav-rail"]').getByText('Contactos').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('should NOT display mobile NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The navigation shell renders

    // THEN: Mobile NavigationBar is hidden (Tailwind lg:hidden / not visible)
    const navBar = page.locator('[data-testid="nav-bar"]');
    await expect(navBar).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar on viewport < 1024px', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test('should display mobile NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: Application loaded on a mobile browser (viewport < 1024px)
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The user views the app

    // THEN: Mobile NavigationBar is visible with data-testid="nav-bar"
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
  });

  test('should show "Clientes" item in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The user views the bottom navigation bar

    // THEN: "Clientes" item is accessible and visible
    await expect(page.locator('[data-testid="nav-bar"]').getByText('Clientes')).toBeVisible();
  });

  test('should show "Contactos" item in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The user views the bottom navigation bar

    // THEN: "Contactos" item is accessible and visible
    await expect(page.locator('[data-testid="nav-bar"]').getByText('Contactos')).toBeVisible();
  });

  test('should navigate to /contactos when tapping Contactos in mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile browser with app loaded at /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The user taps the "Contactos" item in the mobile NavigationBar
    await page.locator('[data-testid="nav-bar"]').getByText('Contactos').tap();

    // THEN: URL changes to /contactos (SPA, no full reload)
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('Clientes nav item touch target should meet WCAG 2.1 AA minimum size (44x44px)', async ({ page }) => {
    // GIVEN: Mobile viewport rendering the NavigationBar
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The touch target size of "Clientes" item is measured
    const clientesItem = page.locator('[data-testid="nav-bar"]').getByText('Clientes');
    const box = await clientesItem.boundingBox();

    // THEN: Touch target is at least 44x44px (WCAG 2.1 AA)
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('Contactos nav item touch target should meet WCAG 2.1 AA minimum size (44x44px)', async ({ page }) => {
    // GIVEN: Mobile viewport rendering the NavigationBar
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The touch target size of "Contactos" item is measured
    const contactosItem = page.locator('[data-testid="nav-bar"]').getByText('Contactos');
    const box = await contactosItem.boundingBox();

    // THEN: Touch target is at least 44x44px (WCAG 2.1 AA)
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should NOT display desktop NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The navigation shell renders

    // THEN: Desktop NavigationRail is hidden (Tailwind hidden lg:flex)
    const navRail = page.locator('[data-testid="nav-rail"]');
    await expect(navRail).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Direct URL access renders correct view + active nav state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Direct URL access and active navigation state', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render /clientes view when URL /clientes is typed directly', async ({ page }) => {
    // GIVEN: User types /clientes directly in browser URL bar
    // Network-first: prepare state BEFORE navigation
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The page loads

    // THEN: Clientes view is rendered (data-testid="clientes-view")
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render /contactos view when URL /contactos is typed directly', async ({ page }) => {
    // GIVEN: User types /contactos directly in browser URL bar
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // WHEN: The page loads

    // THEN: Contactos view is rendered (data-testid="contactos-view")
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should NOT redirect when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: User types /clientes in browser address bar
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The page loads

    // THEN: URL remains /clientes — no redirect to home screen
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should NOT redirect when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: User types /contactos in browser address bar
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // WHEN: The page loads

    // THEN: URL remains /contactos — no redirect
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('should show Clientes nav item as active when on /clientes route', async ({ page }) => {
    // GIVEN: Direct navigation to /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The navigation shell is inspected

    // THEN: The "Clientes" nav item has aria-current="page" indicating active state
    const clientesNavItem = page.locator('[data-testid="nav-rail"] [aria-current="page"]');
    await expect(clientesNavItem).toBeVisible();
    await expect(clientesNavItem).toContainText('Clientes');
  });

  test('should show Contactos nav item as active when on /contactos route', async ({ page }) => {
    // GIVEN: Direct navigation to /contactos
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // WHEN: The navigation shell is inspected

    // THEN: The "Contactos" nav item has aria-current="page" indicating active state
    const contactosNavItem = page.locator('[data-testid="nav-rail"] [aria-current="page"]');
    await expect(contactosNavItem).toBeVisible();
    await expect(contactosNavItem).toContainText('Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 Not Found view for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 graceful not-found view', () => {
  test('should display 404 not-found view for unknown route /unknown', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown');
    await appLoad;

    // WHEN: The page loads

    // THEN: The 404 not-found view is displayed (data-testid="not-found-view")
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display "Página no encontrada" message on 404 view', async ({ page }) => {
    // GIVEN: User navigates to a non-existent route
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/ruta-que-no-existe');
    await appLoad;

    // WHEN: The 404 view renders

    // THEN: A user-friendly message in Spanish is shown
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('Página no encontrada');
  });

  test('should display a back-link to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: User is on an unknown route showing the 404 view
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/pagina-inexistente');
    await appLoad;

    // WHEN: The user looks for navigation back to a known section

    // THEN: A link with text "Ir a Clientes" is visible and points to /clientes
    const backLink = page.locator('[data-testid="not-found-view"] a');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Ir a Clientes');
    await expect(backLink).toHaveAttribute('href', /\/clientes/);
  });

  test('should navigate to /clientes when clicking the back-link on 404 view', async ({ page }) => {
    // GIVEN: User is on the 404 not-found view
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-page');
    await appLoad;

    // WHEN: The user clicks "Ir a Clientes" link
    await page.locator('[data-testid="not-found-view"] a').click();

    // THEN: User is navigated to /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root URL redirect to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: User accesses root URL /
    // Network-first: intercept BEFORE navigation to track redirects
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/');
    await appLoad;

    // WHEN: The page loads

    // THEN: URL is /clientes (router redirected without full page reload)
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should render clientes-view after root redirect to /clientes', async ({ page }) => {
    // GIVEN: User accesses root URL /
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/');
    await appLoad;

    // WHEN: The redirect resolves to /clientes

    // THEN: The Clientes view is displayed
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should NOT perform a full page reload during root redirect', async ({ page }) => {
    // GIVEN: SPA router is initialized
    // Network-first: count full-page navigations BEFORE goto
    const fullReloads: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloads.push(frame.url());
      }
    });

    // WHEN: Root / is accessed and redirected to /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/');
    await appLoad;

    // THEN: The final URL is /clientes
    await expect(page).toHaveURL(/\/clientes/);
    // The router redirect should be a client-side navigation, not a second server request
    // Only the initial HTML load counts as a full framenavigation
    expect(fullReloads.length).toBeLessThanOrEqual(2); // initial + optional SPA push
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Accessibility: aria-label, aria-current, <nav> landmark
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Accessibility requirements (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have a <nav> landmark element wrapping the navigation shell', async ({ page }) => {
    // GIVEN: Navigation shell is rendered on desktop
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The navigation is inspected for semantic HTML

    // THEN: A <nav> element exists (navigation landmark for screen readers)
    const navElement = page.locator('nav');
    await expect(navElement.first()).toBeVisible();
  });

  test('should have aria-label in Spanish on the navigation element', async ({ page }) => {
    // GIVEN: Navigation shell rendered on desktop
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The <nav> element is inspected for accessibility attributes

    // THEN: The nav landmark has aria-label="Navegación principal" in Spanish
    const navWithLabel = page.locator('nav[aria-label="Navegación principal"]');
    await expect(navWithLabel).toBeVisible();
  });

  test('should mark the active route link with aria-current="page"', async ({ page }) => {
    // GIVEN: User is on /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The navigation links are inspected for aria attributes

    // THEN: The active /clientes link has aria-current="page"
    const activeLink = page.locator('[aria-current="page"]');
    await expect(activeLink).toBeVisible();
  });

  test('should update aria-current="page" when navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: User starts at /clientes with Clientes marked as aria-current="page"
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The user navigates to /contactos
    await page.locator('[data-testid="nav-rail"]').getByText('Contactos').click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: The Contactos link now has aria-current="page"
    const activeLink = page.locator('[data-testid="nav-rail"] [aria-current="page"]');
    await expect(activeLink).toContainText('Contactos');
  });

  test('nav links should have meaningful aria-label attributes', async ({ page }) => {
    // GIVEN: Navigation shell rendered with nav items
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: Individual nav links are inspected

    // THEN: Each nav link has a non-empty aria-label attribute
    const navLinks = page.locator('[data-testid="nav-rail"] a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const ariaLabel = await navLinks.nth(i).getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel!.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + AC6 — App shell structure with data-testid="app-shell"
// ─────────────────────────────────────────────────────────────────────────────

test.describe('App shell structure', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render app-shell wrapper element', async ({ page }) => {
    // GIVEN: Navigation shell is loaded
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The DOM is inspected

    // THEN: The app shell wrapper with data-testid="app-shell" is present
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('should render main content area alongside NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with navigation shell
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: The layout is inspected

    // THEN: A <main> element is visible alongside the nav rail (Outlet renders inside main)
    await expect(page.locator('main')).toBeVisible();
  });
});
