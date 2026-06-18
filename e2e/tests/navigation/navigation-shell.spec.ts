/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible (≥1024px) with Clientes and Contactos entries (FR28)
 *   AC2 — Mobile NavigationBar visible (<1024px) with tappable items ≥44×44px (FR29)
 *   AC3 — Deep linking: /clientes and /contactos render correct view without redirection (FR30)
 *   AC4 — Unknown route renders 404 not-found view with link back to /clientes
 *   AC5 — Active nav item shows primary-600 border / primary-50 bg (desktop) or active indicator (mobile)
 *   AC6 — Navigation between /clientes and /contactos is client-side (no full page reload)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport ≥ 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (viewport ≥ 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render NavigationRail on the left side in desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport ≥ 1024px)
    // WHEN: The user views the app

    // Network-first: wait for page load signal BEFORE navigation
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // THEN: A NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should display Clientes navigation entry in NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The user views the NavigationRail
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // THEN: A "Clientes" entry is visible in the NavigationRail
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display Contactos navigation entry in NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The user views the NavigationRail
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // THEN: A "Contactos" entry is visible in the NavigationRail
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should NOT render NavigationBar (bottom nav) on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (≥ 1024px)
    // WHEN: The user views the app
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The mobile NavigationBar is NOT visible
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes nav item', async ({ page }) => {
    // GIVEN: The application is loaded on desktop
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/contactos');
    await appLoad;

    // WHEN: User clicks the Clientes nav item
    // Track document-type requests to detect a full page reload
    const documentRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        documentRequests.push(req.url());
      }
    });
    // Clear any document requests from initial page load
    documentRequests.length = 0;

    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL('/clientes');

    // AND: The clientes view is rendered (client-side routing, no full reload)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();

    // AND: No document (HTML) reload occurred — client-side navigation only
    expect(documentRequests).toHaveLength(0);
  });

  test('should navigate to /contactos without full page reload when clicking Contactos nav item', async ({ page }) => {
    // GIVEN: The application is loaded on desktop at /clientes
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: User clicks the Contactos nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');

    // AND: The contactos view is rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (viewport < 1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should render NavigationBar at bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    // WHEN: The user views the app
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // THEN: A NavigationBar is visible at the bottom of the screen
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT render NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on mobile (<1024px)
    // WHEN: The user views the app
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The desktop NavigationRail is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should display Clientes navigation item in mobile NavigationBar', async ({ page }) => {
    // GIVEN: Application is loaded on mobile
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Clientes item is accessible in NavigationBar
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should display Contactos navigation item in mobile NavigationBar', async ({ page }) => {
    // GIVEN: Application is loaded on mobile
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Contactos item is accessible in NavigationBar
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should have touch target height of at least 44px for Clientes nav item', async ({ page }) => {
    // GIVEN: The application is loaded on mobile
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: Measuring the touch target of the Clientes nav item
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');

    // THEN: Touch target height is ≥ 44px (WCAG 2.5.5 minimum)
    const boundingBox = await clientesItem.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should have touch target width of at least 44px for Clientes nav item', async ({ page }) => {
    // GIVEN: The application is loaded on mobile
    const appLoad = page.waitForLoadState('domcontentloaded');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: Measuring the touch target width of the Clientes nav item
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');

    // THEN: Touch target width is ≥ 44px (WCAG 2.5.5 minimum)
    const boundingBox = await clientesItem.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThanOrEqual(44);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL access (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking via direct URL access (FR30)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render ClientesView when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads

    // Network-first: set up navigation tracking BEFORE goto
    const navResponse = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await navResponse;

    // THEN: The correct Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();

    // AND: The final URL is /clientes (no redirection to home screen)
    expect(page.url()).toContain('/clientes');
  });

  test('should render ContactosView when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    const navResponse = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await navResponse;

    // THEN: The correct Contactos view is rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();

    // AND: The final URL is /contactos (no redirection)
    expect(page.url()).toContain('/contactos');
  });

  test('should highlight Clientes nav item as active when on /clientes', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    // WHEN: The page loads
    const navResponse = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await navResponse;

    // THEN: The Clientes navigation item is highlighted as active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('should highlight Contactos nav item as active when on /contactos', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    // WHEN: The page loads
    const navResponse = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await navResponse;

    // THEN: The Contactos navigation item is highlighted as active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });

  test('should redirect / to /clientes', async ({ page }) => {
    // GIVEN: The user navigates to the root path
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The browser is redirected to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route renders 404 not-found view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not Found view for unknown routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display not-found page when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route (e.g., /algo-desconocido)
    // WHEN: The page loads
    await page.goto('/algo-desconocido');

    // THEN: A 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
  });

  test('should display "Página no encontrada" text on the 404 page', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The not-found page is rendered
    await page.goto('/ruta-que-no-existe');

    // THEN: The text "Página no encontrada" is visible
    await expect(page.getByText('Página no encontrada')).toBeVisible();
  });

  test('should show a link back to /clientes on the 404 page', async ({ page }) => {
    // GIVEN: The user is on the 404 not-found page
    // WHEN: The page is rendered
    await page.goto('/ruta-inexistente');

    // THEN: A link to /clientes is visible (labeled "Ir a Clientes")
    await expect(page.locator('[data-testid="not-found-link-clientes"]')).toBeVisible();
  });

  test('should navigate to /clientes when clicking the "Ir a Clientes" link on 404 page', async ({ page }) => {
    // GIVEN: The user is on the 404 not-found page
    await page.goto('/ruta-inexistente');
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();

    // WHEN: The user clicks the "Ir a Clientes" link
    await page.locator('[data-testid="not-found-link-clientes"]').click();

    // THEN: The user is navigated to /clientes
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Active navigation item visual state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Active navigation item visual indicators', () => {
  test.describe('Desktop: primary-600 left border and primary-50 background', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('should apply active styles to Clientes nav item when on /clientes route', async ({ page }) => {
      // GIVEN: The application shell is rendered and user is on /clientes
      const navResponse = page.waitForLoadState('networkidle');
      await page.goto('/clientes');
      await navResponse;

      // WHEN: The navigation renders with the active route
      const clientesNavItem = page.locator('[data-testid="nav-item-clientes"]');

      // THEN: The Clientes nav item has the active CSS classes (primary-600 border, primary-50 bg)
      await expect(clientesNavItem).toHaveClass(/active/);
    });

    test('should NOT apply active styles to Contactos nav item when on /clientes route', async ({ page }) => {
      // GIVEN: User is on /clientes
      const navResponse = page.waitForLoadState('networkidle');
      await page.goto('/clientes');
      await navResponse;

      // THEN: The Contactos nav item does NOT have active styles
      const contactosNavItem = page.locator('[data-testid="nav-item-contactos"]');
      await expect(contactosNavItem).not.toHaveClass(/active/);
    });

    test('should apply active styles to Contactos nav item when on /contactos route', async ({ page }) => {
      // GIVEN: The user is on /contactos
      const navResponse = page.waitForLoadState('networkidle');
      await page.goto('/contactos');
      await navResponse;

      // WHEN: The navigation renders with the active route
      const contactosNavItem = page.locator('[data-testid="nav-item-contactos"]');

      // THEN: The Contactos nav item has active styles
      await expect(contactosNavItem).toHaveClass(/active/);
    });
  });

  test.describe('Mobile: active indicator in NavigationBar', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('should show active indicator on Clientes item in mobile NavigationBar when on /clientes', async ({ page }) => {
      // GIVEN: The application is loaded on mobile and user is on /clientes
      const navResponse = page.waitForLoadState('networkidle');
      await page.goto('/clientes');
      await navResponse;

      // THEN: The mobile Clientes nav item has the active attribute
      await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Client-side routing (no full page reload)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Client-side routing between /clientes and /contactos', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should not trigger a network request to reload the HTML document when navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: The application is loaded and user is at /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // Track document reload requests (full page reload = new GET for index.html)
    const documentRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        documentRequests.push(req.url());
      }
    });
    // Clear initial load records
    documentRequests.length = 0;

    // WHEN: User clicks the Contactos nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: No new document (HTML) requests occurred — client-side navigation only
    expect(documentRequests).toHaveLength(0);
  });

  test('should not trigger a network request to reload the HTML document when navigating from /contactos to /clientes', async ({ page }) => {
    // GIVEN: User is at /contactos
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    const documentRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        documentRequests.push(req.url());
      }
    });
    documentRequests.length = 0;

    // WHEN: User clicks the Clientes nav item
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await expect(page).toHaveURL('/clientes');

    // THEN: No document reload requests
    expect(documentRequests).toHaveLength(0);
  });

  test('should render the app shell (NavigationRail) without re-mounting between route changes', async ({ page }) => {
    // GIVEN: The application is loaded on desktop
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // Capture the NavigationRail element reference as identifier
    const navRailBefore = await page.locator('[data-testid="navigation-rail"]').getAttribute('data-testid');

    // WHEN: User navigates to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: NavigationRail is still rendered (persistent shell — not re-mounted)
    const navRailAfter = await page.locator('[data-testid="navigation-rail"]').getAttribute('data-testid');
    expect(navRailAfter).toBe(navRailBefore);
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });
});
