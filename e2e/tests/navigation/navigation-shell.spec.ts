/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop (≥1024px): NavigationRail visible on left, client-side routing to /clientes and /contactos (FR28)
 *   AC2 — Mobile (<1024px): NavigationBar (bottom nav) displayed, touch targets ≥44×44px (FR29)
 *   AC3 — Deep-linking: direct URL /clientes and /contactos renders correct view without redirection (FR30)
 *   AC4 — Unknown route: 404 view displayed with link to return to /clientes
 *   AC5 — Root redirect: / redirects automatically to /clientes
 *   AC6 — Active nav item state: active item shows highlighted state, inactive item shows default state
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport ≥1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (viewport ≥1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display NavigationRail on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport ≥1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A NavigationRail is visible on the left side
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });

  test('should show Clientes entry in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail contains a "Clientes" entry
    await expect(page.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('should show Contactos entry in NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail contains a "Contactos" entry
    await expect(page.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes nav item', async ({
    page,
  }) => {
    // GIVEN: The application is loaded on a desktop browser and user is on /contactos
    await page.goto('/contactos');

    // Network-first: track full-page navigation (document requests) — must NOT happen on SPA nav
    let fullPageReloadOccurred = false;
    const baseUrl = new URL(page.url()).origin;
    page.on('request', (req) => {
      if (req.resourceType() === 'document' && req.url().startsWith(baseUrl)) {
        fullPageReloadOccurred = true;
      }
    });

    // WHEN: The user clicks the Clientes nav item
    await page.getByTestId('nav-item-clientes').click();

    // THEN: URL changes to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');

    // AND: No full page reload occurred (client-side routing)
    expect(fullPageReloadOccurred).toBe(false);
  });

  test('should navigate to /contactos without full page reload when clicking Contactos nav item', async ({
    page,
  }) => {
    // GIVEN: The application is loaded on a desktop browser and user is on /clientes
    await page.goto('/clientes');

    // Network-first: track full-page navigation (document requests)
    let fullPageReloadOccurred = false;
    const baseUrl = new URL(page.url()).origin;
    page.on('request', (req) => {
      if (req.resourceType() === 'document' && req.url().startsWith(baseUrl)) {
        fullPageReloadOccurred = true;
      }
    });

    // WHEN: The user clicks the Contactos nav item
    await page.getByTestId('nav-item-contactos').click();

    // THEN: URL changes to /contactos
    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');

    // AND: No full page reload occurred (client-side routing)
    expect(fullPageReloadOccurred).toBe(false);
  });

  test('should NOT display NavigationBar (bottom nav) on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport ≥1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The bottom NavigationBar is not visible (hidden via CSS)
    await expect(page.getByTestId('navigation-bar')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport <1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (viewport <1024px)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 dimensions

  test('should display bottom NavigationBar on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (<1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A bottom NavigationBar is displayed
    await expect(page.getByTestId('navigation-bar')).toBeVisible();
  });

  test('should show Clientes entry in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationBar contains a "Clientes" entry
    await expect(page.getByTestId('nav-bar-item-clientes')).toBeVisible();
  });

  test('should show Contactos entry in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationBar contains a "Contactos" entry
    await expect(page.getByTestId('nav-bar-item-contactos')).toBeVisible();
  });

  test('should have minimum 44×44px touch target for Clientes nav bar item', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    // WHEN: The user views the NavigationBar
    await page.goto('/clientes');

    // THEN: The Clientes touch target is at least 44×44px
    const clientesItem = page.getByTestId('nav-bar-item-clientes');
    const box = await clientesItem.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should have minimum 44×44px touch target for Contactos nav bar item', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser
    // WHEN: The user views the NavigationBar
    await page.goto('/clientes');

    // THEN: The Contactos touch target is at least 44×44px
    const contactosItem = page.getByTestId('nav-bar-item-contactos');
    const box = await contactosItem.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should NOT display NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (<1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail is not visible (hidden via CSS)
    await expect(page.getByTestId('navigation-rail')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep-linking: direct URL navigation (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep-linking: direct URL navigation', () => {
  test('should render ClientesPage when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The ClientesPage is rendered (contains "Clientes" heading)
    await expect(page.getByTestId('clientes-page-heading')).toBeVisible();
  });

  test('should render ContactosPage when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The ContactosPage is rendered (contains "Contactos" heading)
    await expect(page.getByTestId('contactos-page-heading')).toBeVisible();
  });

  test('should NOT redirect to home screen when accessing /clientes directly', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The URL remains /clientes (no redirection away)
    expect(page.url()).toContain('/clientes');
  });

  test('should NOT redirect to home screen when accessing /contactos directly', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The URL remains /contactos (no redirection away)
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route: 404 not-found view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Unknown route: 404 not-found view', () => {
  test('should display not-found view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route /unknown
    // WHEN: The page loads
    await page.goto('/unknown');

    // THEN: A 404/not-found view is displayed
    await expect(page.getByTestId('not-found-page')).toBeVisible();
  });

  test('should display "Página no encontrada" message on unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The 404 page renders
    await page.goto('/unknown-route-xyz');

    // THEN: The Spanish not-found message is visible
    await expect(page.getByText('Página no encontrada')).toBeVisible();
  });

  test('should display a link to return to /clientes on the 404 page', async ({ page }) => {
    // GIVEN: The user is on the 404 not-found page
    // WHEN: The page renders
    await page.goto('/ruta-inexistente');

    // THEN: A link "Ir a Clientes" is visible
    await expect(page.getByTestId('not-found-link-clientes')).toBeVisible();
  });

  test('should navigate to /clientes when clicking the return link on the 404 page', async ({
    page,
  }) => {
    // GIVEN: The user is on the 404 not-found page
    await page.goto('/unknown');

    // WHEN: The user clicks the "Ir a Clientes" link
    await page.getByTestId('not-found-link-clientes').click();

    // THEN: The user is navigated to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root redirect: / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root redirect: / redirects to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The application root URL / is accessed
    // WHEN: The page loads
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: The user is redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('should render ClientesPage content after root redirect', async ({ page }) => {
    // GIVEN: The application root URL / is accessed
    // WHEN: The redirect to /clientes completes
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: The ClientesPage heading is visible
    await expect(page.getByTestId('clientes-page-heading')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Active nav item state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Active nav item state on desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show Clientes nav item as active when on /clientes route', async ({ page }) => {
    // GIVEN: The user is on /clientes
    // WHEN: Viewing the NavigationRail
    await page.goto('/clientes');

    // THEN: The Clientes nav item has the active state attribute
    const clientesItem = page.getByTestId('nav-item-clientes');
    await expect(clientesItem).toHaveAttribute('data-active', 'true');
  });

  test('should show Contactos nav item as inactive when on /clientes route', async ({ page }) => {
    // GIVEN: The user is on /clientes
    // WHEN: Viewing the NavigationRail
    await page.goto('/clientes');

    // THEN: The Contactos nav item does NOT have the active state
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).not.toHaveAttribute('data-active', 'true');
  });

  test('should show Contactos nav item as active when on /contactos route', async ({ page }) => {
    // GIVEN: The user is on /contactos
    // WHEN: Viewing the NavigationRail
    await page.goto('/contactos');

    // THEN: The Contactos nav item has the active state attribute
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).toHaveAttribute('data-active', 'true');
  });

  test('should show Clientes nav item as inactive when on /contactos route', async ({ page }) => {
    // GIVEN: The user is on /contactos
    // WHEN: Viewing the NavigationRail
    await page.goto('/contactos');

    // THEN: The Clientes nav item does NOT have the active state
    const clientesItem = page.getByTestId('nav-item-clientes');
    await expect(clientesItem).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — aria-label on icon-only nav buttons (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — aria-label on icon-only nav buttons', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have Spanish aria-label on Clientes nav rail item', async ({ page }) => {
    // GIVEN: The desktop NavigationRail is visible
    // WHEN: The user inspects the Clientes nav item
    await page.goto('/clientes');

    // THEN: The Clientes nav item has a Spanish aria-label
    const clientesItem = page.getByTestId('nav-item-clientes');
    await expect(clientesItem).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  test('should have Spanish aria-label on Contactos nav rail item', async ({ page }) => {
    // GIVEN: The desktop NavigationRail is visible
    // WHEN: The user inspects the Contactos nav item
    await page.goto('/clientes');

    // THEN: The Contactos nav item has a Spanish aria-label
    const contactosItem = page.getByTestId('nav-item-contactos');
    await expect(contactosItem).toHaveAttribute('aria-label', 'Ir a Contactos');
  });
});
