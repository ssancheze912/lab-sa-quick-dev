/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible with Clientes and Contactos entries, SPA navigation
 *   AC2 — Mobile NavigationBar visible at bottom, touch targets >= 44px
 *   AC3 — Deep linking to /clientes and /contactos works without redirection
 *   AC4 — Unknown routes show 404 view with Spanish message and link to /clientes
 *   AC5 — Root path / redirects automatically to /clientes
 *   AC6 — Active navigation item is visually highlighted (primary-50 bg, primary-700 text)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail visible with Clientes and Contactos, SPA navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    // WHEN: The user navigates to the app
    await page.goto('/clientes');

    // THEN: NavigationRail wrapper is visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should render Clientes navigation item in NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: Clientes nav item is visible
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should render Contactos navigation item in NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: Contactos nav item is visible
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes nav item', async ({ page }) => {
    // GIVEN: Desktop viewport, user is on the app
    // WHEN: User clicks the Clientes nav item
    await page.goto('/contactos');

    // Track full-page navigations (SPA navigation should NOT trigger this)
    let fullPageNavigation = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullPageNavigation = true;
      }
    });

    // Reset flag after initial load is done
    fullPageNavigation = false;

    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL(/\/clientes/);
    // AND: No full page reload occurred (SPA navigation)
    expect(fullPageNavigation).toBe(false);
  });

  test('should navigate to /contactos without full page reload when clicking Contactos nav item', async ({ page }) => {
    // GIVEN: Desktop viewport, user is on /clientes
    // WHEN: User clicks the Contactos nav item
    await page.goto('/clientes');

    let fullPageNavigation = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullPageNavigation = true;
      }
    });
    fullPageNavigation = false;

    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos without full page reload
    await expect(page).toHaveURL(/\/contactos/);
    expect(fullPageNavigation).toBe(false);
  });

  test('should NOT display NavigationBar on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar (bottom bar) is NOT visible on desktop
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar visible at bottom, touch targets >= 44px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should display NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    // WHEN: The user navigates to the app
    await page.goto('/clientes');

    // THEN: NavigationBar is visible
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should render Clientes nav item in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    // WHEN: The user views the NavigationBar
    await page.goto('/clientes');

    // THEN: Clientes nav item is accessible
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should render Contactos nav item in NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    // WHEN: The user views the NavigationBar
    await page.goto('/clientes');

    // THEN: Contactos nav item is accessible
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should have Clientes touch target height of at least 44px on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    // WHEN: Measuring the Clientes nav item touch target
    await page.goto('/clientes');

    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const box = await clientesItem.boundingBox();

    // THEN: Touch target is at minimum 44px height (FR29)
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should have Contactos touch target height of at least 44px on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    // WHEN: Measuring the Contactos nav item touch target
    await page.goto('/clientes');

    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const box = await contactosItem.boundingBox();

    // THEN: Touch target is at minimum 44px height (FR29)
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should NOT display NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationRail is NOT visible on mobile
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: /clientes and /contactos render without redirection
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking', () => {
  test('should render Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: User types /clientes in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered (no redirect to home)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should render Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: User types /contactos in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered (no redirect to home)
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('should not redirect /clientes to any other route', async ({ page }) => {
    // GIVEN: User directly accesses /clientes
    // WHEN: Page loads
    await page.goto('/clientes');

    // THEN: Final URL is /clientes (not home or any other route)
    expect(page.url()).toMatch(/\/clientes$/);
  });

  test('should not redirect /contactos to any other route', async ({ page }) => {
    // GIVEN: User directly accesses /contactos
    // WHEN: Page loads
    await page.goto('/contactos');

    // THEN: Final URL is /contactos
    expect(page.url()).toMatch(/\/contactos$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown routes show 404 view in Spanish with link to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not-Found view', () => {
  test('should display not-found view for unknown route /desconocido', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/desconocido');

    // THEN: The 404 view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display Spanish not-found message "Página no encontrada"', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/ruta-que-no-existe');

    // THEN: Spanish message is visible
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('Página no encontrada');
  });

  test('should display a link back to /clientes on 404 view', async ({ page }) => {
    // GIVEN: User is on a 404 view
    // WHEN: The page renders
    await page.goto('/desconocido');

    // THEN: A link pointing to /clientes is visible
    const link = page.locator('[data-testid="not-found-view"] a[href="/clientes"]');
    await expect(link).toBeVisible();
  });

  test('should navigate to /clientes when clicking the back link on 404 view', async ({ page }) => {
    // GIVEN: User is on a 404 page
    await page.goto('/ruta-invalida');

    // WHEN: User clicks the "Ir a Clientes" link
    await page.locator('[data-testid="not-found-view"] a[href="/clientes"]').click();

    // THEN: User is redirected to /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root path / redirects automatically to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Root redirect', () => {
  test('should automatically redirect / to /clientes', async ({ page }) => {
    // GIVEN: User accesses the root path /
    // WHEN: The page loads
    await page.goto('/');

    // THEN: User is redirected to /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should render Clientes view after redirect from /', async ({ page }) => {
    // GIVEN: User accesses the root path /
    // WHEN: Redirect occurs
    await page.goto('/');

    // THEN: Clientes view content is visible
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Active navigation item is visually highlighted
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Active navigation item highlight', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should apply aria-current="page" to Clientes nav item when on /clientes', async ({ page }) => {
    // GIVEN: User is on /clientes
    // WHEN: The NavigationRail renders
    await page.goto('/clientes');

    // THEN: Clientes nav item has aria-current="page" (active state indicator)
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toHaveAttribute('aria-current', 'page');
  });

  test('should apply aria-current="page" to Contactos nav item when on /contactos', async ({ page }) => {
    // GIVEN: User is on /contactos
    // WHEN: The NavigationRail renders
    await page.goto('/contactos');

    // THEN: Contactos nav item has aria-current="page"
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark Contactos as active when on /clientes', async ({ page }) => {
    // GIVEN: User is on /clientes
    // WHEN: The NavigationRail renders
    await page.goto('/clientes');

    // THEN: Contactos nav item does NOT have aria-current="page"
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).not.toHaveAttribute('aria-current', 'page');
  });

  test('should NOT mark Clientes as active when on /contactos', async ({ page }) => {
    // GIVEN: User is on /contactos
    // WHEN: The NavigationRail renders
    await page.goto('/contactos');

    // THEN: Clientes nav item does NOT have aria-current="page"
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).not.toHaveAttribute('aria-current', 'page');
  });

  test('should update active nav item when navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: User is on /clientes with Clientes active
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');

    // WHEN: User clicks Contactos nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: Contactos becomes active, Clientes is no longer active
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — ARIA labels in Spanish on navigation items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — Navigation ARIA labels', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have aria-label in Spanish on Clientes nav item', async ({ page }) => {
    // GIVEN: Desktop viewport
    // WHEN: The NavigationRail renders
    await page.goto('/clientes');

    // THEN: Clientes nav item has Spanish aria-label
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const ariaLabel = await clientesItem.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    // aria-label must be in Spanish (contain "Clientes" or "Ir a Clientes")
    expect(ariaLabel!.toLowerCase()).toMatch(/clientes/i);
  });

  test('should have aria-label in Spanish on Contactos nav item', async ({ page }) => {
    // GIVEN: Desktop viewport
    // WHEN: The NavigationRail renders
    await page.goto('/clientes');

    // THEN: Contactos nav item has Spanish aria-label
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const ariaLabel = await contactosItem.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel!.toLowerCase()).toMatch(/contactos/i);
  });
});
