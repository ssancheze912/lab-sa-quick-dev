/**
 * Story 1.2: Frontend Navigation Shell
 * ATDD - RED Phase (Tests intentionally failing — implementation not yet complete)
 *
 * Acceptance Criteria covered:
 * - AC1: Desktop (>=1024px) shows NavigationRail with Clientes/Contactos entries; clicking navigates without full reload (FR28)
 * - AC2: Mobile (<1024px) shows NavigationBar at the bottom; all items are accessible and tappable (FR29)
 * - AC3: Direct URL typing to /clientes or /contactos renders the correct view without redirection (FR30)
 * - AC4: Navigating to unknown route /unknown shows a graceful 404 view with a message in Spanish
 * - AC5: All navigation links have aria-label in Spanish and are reachable via Tab key (WCAG 2.1 AA)
 * - AC6: The active route link is visually highlighted (aria-current="page") when on /clientes or /contactos
 */

import { test, expect } from '@playwright/test';

// ─── AC1: Desktop NavigationRail ─────────────────────────────────────────────

test.describe('AC1 - Desktop NavigationRail (viewport >=1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display NavigationRail on the left side when viewport is desktop', async ({
    page,
  }) => {
    // GIVEN: The application is loaded on a desktop browser (>=1024px)
    await page.goto('/clientes');

    // THEN: NavigationRail is visible on the left
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should show Clientes navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail visible
    await page.goto('/clientes');

    // THEN: "Clientes" entry exists in the NavigationRail
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should show Contactos navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail visible
    await page.goto('/clientes');

    // THEN: "Contactos" entry exists in the NavigationRail
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without a full page reload when Clientes is clicked', async ({
    page,
  }) => {
    // GIVEN: Application is loaded at /contactos on desktop
    await page.goto('/contactos');

    // WHEN: User clicks on "Clientes" in the NavigationRail
    // Detect a real full-page reload by tracking document-type requests.
    // A SPA pushState navigation does NOT trigger a new document fetch.
    let fullPageReloadCount = 0;
    page.on('request', (request) => {
      if (request.resourceType() === 'document') {
        fullPageReloadCount++;
      }
    });

    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes without a full page reload (no document request fired)
    await expect(page).toHaveURL('/clientes');
    expect(fullPageReloadCount).toBe(0);
  });

  test('should navigate to /contactos without a full page reload when Contactos is clicked', async ({
    page,
  }) => {
    // GIVEN: Application is loaded at /clientes on desktop
    await page.goto('/clientes');

    // Detect a real full-page reload by tracking document-type requests.
    // A SPA pushState navigation does NOT trigger a new document fetch.
    let fullPageReloadCount = 0;
    page.on('request', (request) => {
      if (request.resourceType() === 'document') {
        fullPageReloadCount++;
      }
    });

    // WHEN: User clicks on "Contactos" in the NavigationRail
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos without a full page reload (no document request fired)
    await expect(page).toHaveURL('/contactos');
    expect(fullPageReloadCount).toBe(0);
  });

  test('should NOT display NavigationBar at the bottom on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport (>=1024px)
    await page.goto('/clientes');

    // THEN: NavigationBar (mobile nav) is NOT visible
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─── AC2: Mobile NavigationBar ───────────────────────────────────────────────

test.describe('AC2 - Mobile NavigationBar (viewport <1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should display NavigationBar at the bottom when viewport is mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser (<1024px)
    await page.goto('/clientes');

    // THEN: NavigationBar is visible
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should show Clientes navigation item in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar visible
    await page.goto('/clientes');

    // THEN: "Clientes" item is tappable in NavigationBar
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should show Contactos navigation item in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar visible
    await page.goto('/clientes');

    // THEN: "Contactos" item is tappable in NavigationBar
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should NOT display NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport (<1024px)
    await page.goto('/clientes');

    // THEN: NavigationRail is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should navigate to /contactos when Contactos is tapped on mobile', async ({ page }) => {
    // GIVEN: Mobile user is on /clientes
    await page.goto('/clientes');

    // WHEN: User taps (clicks) the Contactos item in the NavigationBar.
    // Using click() instead of tap() ensures cross-browser compatibility
    // (tap() requires hasTouch:true which is absent in the chromium project).
    // The AC verifies navigation behaviour, not the input modality.
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');
  });
});

// ─── AC3: Deep Linking ────────────────────────────────────────────────────────

test.describe('AC3 - Deep Linking (FR30)', () => {
  test('should render ClientesPlaceholder when navigating directly to /clientes', async ({
    page,
  }) => {
    // GIVEN: User types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered (no redirection to home screen)
    await expect(page.locator('[data-testid="clientes-placeholder"]')).toBeVisible();
  });

  test('should render ContactosPlaceholder when navigating directly to /contactos', async ({
    page,
  }) => {
    // GIVEN: User types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered (no redirection to home screen)
    await expect(page.locator('[data-testid="contactos-placeholder"]')).toBeVisible();
  });

  test('should NOT redirect /clientes to a home screen on direct navigation', async ({ page }) => {
    // GIVEN: User accesses /clientes via direct URL
    await page.goto('/clientes');

    // THEN: URL stays at /clientes (no redirection occurred)
    await expect(page).toHaveURL('/clientes');
  });

  test('should NOT redirect /contactos to a home screen on direct navigation', async ({ page }) => {
    // GIVEN: User accesses /contactos via direct URL
    await page.goto('/contactos');

    // THEN: URL stays at /contactos (no redirection occurred)
    await expect(page).toHaveURL('/contactos');
  });
});

// ─── AC4: 404 Not Found Route ─────────────────────────────────────────────────

test.describe('AC4 - Unknown Route 404 View', () => {
  test('should display a not-found view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    // WHEN: The page loads with /unknown
    await page.goto('/unknown');

    // THEN: A 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display "Pagina no encontrada" message in Spanish on unknown route', async ({
    page,
  }) => {
    // GIVEN: User navigates to /unknown-route
    await page.goto('/this-route-does-not-exist');

    // THEN: A Spanish not-found message is visible
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText(
      'Página no encontrada',
    );
  });

  test('should provide a link back to Clientes on the not-found view', async ({ page }) => {
    // GIVEN: User is on the 404 page
    await page.goto('/nonexistent-path');

    // THEN: A navigation link back to Clientes is available
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
  });
});

// ─── AC5: Accessibility — WCAG 2.1 AA ────────────────────────────────────────

test.describe('AC5 - Accessibility (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('navigation landmark should have aria-label "Navegacion principal"', async ({ page }) => {
    // GIVEN: The navigation is rendered
    await page.goto('/clientes');

    // THEN: The nav element has the correct aria-label in Spanish
    await expect(
      page.locator('nav[aria-label="Navegación principal"]'),
    ).toBeAttached();
  });

  test('Clientes nav link should have aria-label "Ir a Clientes" in Spanish', async ({ page }) => {
    // GIVEN: The navigation is rendered on desktop
    await page.goto('/clientes');

    // THEN: Clientes nav item has correct Spanish aria-label
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute(
      'aria-label',
      'Ir a Clientes',
    );
  });

  test('Contactos nav link should have aria-label "Ir a Contactos" in Spanish', async ({
    page,
  }) => {
    // GIVEN: The navigation is rendered on desktop
    await page.goto('/clientes');

    // THEN: Contactos nav item has correct Spanish aria-label
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute(
      'aria-label',
      'Ir a Contactos',
    );
  });

  test('all navigation links should be reachable via Tab key', async ({ page }) => {
    // GIVEN: The navigation is rendered
    await page.goto('/clientes');

    // WHEN: User presses Tab from the start of the page
    await page.keyboard.press('Tab');

    // THEN: At least one of the nav items becomes focused (keyboard reachable)
    const focusedElement = page.locator(':focus');
    const navItemClientes = page.locator('[data-testid="nav-item-clientes"]');
    const navItemContactos = page.locator('[data-testid="nav-item-contactos"]');

    // Tab until we hit a nav item (max 10 tabs)
    let reachedNavItem = false;
    for (let i = 0; i < 10; i++) {
      const focusedTestId = await focusedElement.getAttribute('data-testid');
      if (focusedTestId === 'nav-item-clientes' || focusedTestId === 'nav-item-contactos') {
        reachedNavItem = true;
        break;
      }
      await page.keyboard.press('Tab');
    }

    expect(reachedNavItem).toBe(true);
  });
});

// ─── AC6: Active Route Highlighting ──────────────────────────────────────────

test.describe('AC6 - Active Route Highlighting', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Clientes nav link should have aria-current="page" when on /clientes', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');

    // THEN: The Clientes nav link is marked as the active/current page
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('Contactos nav link should have aria-current="page" when on /contactos', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos
    await page.goto('/contactos');

    // THEN: The Contactos nav link is marked as the active/current page
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('Clientes nav link should NOT have aria-current="page" when on /contactos', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos (Contactos is the active route)
    await page.goto('/contactos');

    // THEN: The Clientes nav link is NOT marked as current
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('Contactos nav link should NOT have aria-current="page" when on /clientes', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes (Clientes is the active route)
    await page.goto('/clientes');

    // THEN: The Contactos nav link is NOT marked as current
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('active nav link should have nav-active CSS class when on /clientes', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');

    // THEN: The Clientes nav link has the active class applied
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveClass(/nav-active/);
  });
});

// ─── Root redirect ────────────────────────────────────────────────────────────

test.describe('Root redirect', () => {
  test('should redirect / to /clientes', async ({ page }) => {
    // GIVEN: User navigates to the root URL
    await page.goto('/');

    // THEN: They are redirected to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});
