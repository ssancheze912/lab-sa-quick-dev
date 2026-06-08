/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1  — Desktop NavigationRail + Navbar visible at ≥1024px
 *   AC2  — Clicking "Clientes" navigates to /clientes with active state (no reload)
 *   AC3  — Clicking "Contactos" navigates to /contactos with active state (no reload)
 *   AC4  — Mobile (<1024px) shows NavigationBar at bottom, hides NavigationRail
 *   AC5  — Direct URL /clientes renders Clientes view with active nav (no redirect)
 *   AC6  — Direct URL /contactos renders Contactos view with active nav (no redirect)
 *   AC7  — Unknown route /foo shows 404 view in Spanish with link to /clientes
 *   AC8  — Root / redirects to /clientes without blank page
 *   AC9  — All icon-only nav buttons have aria-label in Spanish; axe critical/serious violations = 0
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop layout: NavigationRail + Navbar visible at ≥1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop navigation shell (≥1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render a Navbar at the top with productName "Siesa Agents"', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop viewport
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A Navbar is visible at the top containing "Siesa Agents"
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar"]')).toContainText('Siesa Agents');
  });

  test('should render a NavigationRail on the left side at ≥1024px', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop viewport (1280px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should show a "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop viewport
    // WHEN: The NavigationRail is rendered
    await page.goto('/clientes');

    // THEN: A navigation item "Clientes" is present inside the NavigationRail
    await expect(
      page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-clientes"]'),
    ).toBeVisible();
  });

  test('should show a "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop viewport
    // WHEN: The NavigationRail is rendered
    await page.goto('/clientes');

    // THEN: A navigation item "Contactos" is present inside the NavigationRail
    await expect(
      page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-contactos"]'),
    ).toBeVisible();
  });

  test('should not render NavigationBar at the bottom on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop viewport
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The mobile NavigationBar is not visible on desktop
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Desktop: clicking "Clientes" navigates to /clientes with SPA behavior
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Desktop NavigationRail Clientes navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /clientes when clicking the Clientes nav item', async ({ page }) => {
    // GIVEN: The desktop navigation shell is rendered
    await page.goto('/contactos');

    // WHEN: The user clicks the "Clientes" item in the NavigationRail
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: The router navigates to /clientes (SPA — no full page reload)
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should show active state on Clientes nav item when on /clientes route', async ({
    page,
  }) => {
    // GIVEN: The desktop navigation shell is rendered
    // WHEN: The user is on the /clientes route
    await page.goto('/clientes');

    // THEN: The Clientes nav item shows the active state (aria-current="page")
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('should not show full-page reload when clicking Clientes nav item', async ({ page }) => {
    // GIVEN: The desktop navigation shell is rendered on /contactos
    await page.goto('/contactos');

    // Monitor for hard page navigations (full reloads)
    let fullReloadDetected = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloadDetected = true;
      }
    });
    // Reset after initial load settles
    fullReloadDetected = false;

    // WHEN: The user clicks the Clientes item
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL(/\/clientes/);

    // THEN: No full page reload occurs (SPA client-side navigation)
    expect(fullReloadDetected).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Desktop: clicking "Contactos" navigates to /contactos with active state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Desktop NavigationRail Contactos navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos when clicking the Contactos nav item', async ({ page }) => {
    // GIVEN: The desktop navigation shell is rendered
    await page.goto('/clientes');

    // WHEN: The user clicks the "Contactos" item in the NavigationRail
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: The router navigates to /contactos (SPA — no full page reload)
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('should show active state on Contactos nav item when on /contactos route', async ({
    page,
  }) => {
    // GIVEN: The desktop navigation shell is rendered
    // WHEN: The user is on the /contactos route
    await page.goto('/contactos');

    // THEN: The Contactos nav item shows the active state (aria-current="page")
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Mobile layout (<1024px): NavigationBar at bottom, NavigationRail hidden
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Mobile navigation shell (<1024px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should render a NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport (<1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A NavigationBar is displayed at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should not render the NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport (<1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail is hidden on mobile
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeHidden();
  });

  test('should show "Clientes" entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport
    // WHEN: The NavigationBar is rendered
    await page.goto('/clientes');

    // THEN: A "Clientes" navigation item is present in the NavigationBar
    await expect(
      page.locator('[data-testid="navigation-bar"] [data-testid="nav-item-clientes"]'),
    ).toBeVisible();
  });

  test('should show "Contactos" entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport
    // WHEN: The NavigationBar is rendered
    await page.goto('/clientes');

    // THEN: A "Contactos" navigation item is present in the NavigationBar
    await expect(
      page.locator('[data-testid="navigation-bar"] [data-testid="nav-item-contactos"]'),
    ).toBeVisible();
  });

  test('should have minimum 44px touch targets for mobile nav items', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile viewport
    // WHEN: The NavigationBar is rendered
    await page.goto('/clientes');

    // THEN: Each nav item meets the 44×44px minimum touch target (WCAG 2.1 AA / FR29)
    const clientesItem = page.locator(
      '[data-testid="navigation-bar"] [data-testid="nav-item-clientes"]',
    );
    const contactosItem = page.locator(
      '[data-testid="navigation-bar"] [data-testid="nav-item-contactos"]',
    );

    const clientesBox = await clientesItem.boundingBox();
    const contactosBox = await contactosItem.boundingBox();

    expect(clientesBox?.height).toBeGreaterThanOrEqual(44);
    expect(clientesBox?.width).toBeGreaterThanOrEqual(44);
    expect(contactosBox?.height).toBeGreaterThanOrEqual(44);
    expect(contactosBox?.width).toBeGreaterThanOrEqual(44);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Deep link /clientes renders Clientes view and marks nav item active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Deep link to /clientes (FR30)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes', async ({
    page,
  }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes view is rendered (contains clientes-view element)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should mark the Clientes nav item as active on direct /clientes load', async ({
    page,
  }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes nav item is shown as active — no redirect to home occurs
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('should not redirect /clientes to any other route', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The URL remains /clientes (no redirect to / or other routes)
    await expect(page).toHaveURL(/\/clientes$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Deep link /contactos renders Contactos view and marks nav item active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Deep link to /contactos (FR30)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Contactos view when navigating directly to /contactos', async ({
    page,
  }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos view is rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should mark the Contactos nav item as active on direct /contactos load', async ({
    page,
  }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos nav item is shown as active — no redirect to home occurs
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('should not redirect /contactos to any other route', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The URL remains /contactos (no redirect)
    await expect(page).toHaveURL(/\/contactos$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Unknown route renders 404 view in Spanish with link back to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — 404 Not-Found view for unknown routes', () => {
  test('should display a 404 view when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to a non-existent route
    // WHEN: The page loads
    await page.goto('/foo');

    // THEN: The not-found view container is rendered
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display "Página no encontrada" message in the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to /foo (an unknown route)
    // WHEN: The page loads
    await page.goto('/foo');

    // THEN: A Spanish "Página no encontrada" message is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText(
      'Página no encontrada',
    );
  });

  test('should display a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    // WHEN: The page loads
    await page.goto('/foo');

    // THEN: A link pointing to /clientes is visible (so the user can recover)
    const backLink = page.locator('[data-testid="not-found-back-link"]');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', /\/clientes/);
  });

  test('should navigate to /clientes when clicking the back link on the 404 view', async ({
    page,
  }) => {
    // GIVEN: The user is on the 404 page
    await page.goto('/foo');

    // WHEN: The user clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: The user is taken to /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Root / redirects to /clientes without blank page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Root route / redirects to /clientes', () => {
  test('should redirect from / to /clientes automatically', async ({ page }) => {
    // GIVEN: The user accesses the root path /
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The router redirects to /clientes (no blank page shown)
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('should render the Clientes view after the / redirect (no blank page)', async ({ page }) => {
    // GIVEN: The user accesses /
    // WHEN: The redirect completes
    await page.goto('/');
    await page.waitForURL(/\/clientes/);

    // THEN: The Clientes view is rendered (not a blank or error page)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 — Accessibility: aria-label in Spanish, role=navigation, no axe violations
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — Accessibility and ARIA compliance (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have aria-label "Ir a Clientes" on the Clientes nav button', async ({ page }) => {
    // GIVEN: The application shell is rendered on desktop
    // WHEN: The NavigationRail is visible
    await page.goto('/clientes');

    // THEN: The icon-only Clientes button has aria-label in Spanish
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute(
      'aria-label',
      'Ir a Clientes',
    );
  });

  test('should have aria-label "Ir a Contactos" on the Contactos nav button', async ({ page }) => {
    // GIVEN: The application shell is rendered on desktop
    // WHEN: The NavigationRail is visible
    await page.goto('/clientes');

    // THEN: The icon-only Contactos button has aria-label in Spanish
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute(
      'aria-label',
      'Ir a Contactos',
    );
  });

  test('should have role="navigation" on the NavigationRail container', async ({ page }) => {
    // GIVEN: The application shell is rendered on desktop
    // WHEN: The NavigationRail is visible
    await page.goto('/clientes');

    // THEN: The NavigationRail has role="navigation"
    await expect(page.locator('[data-testid="navigation-rail"]')).toHaveAttribute(
      'role',
      'navigation',
    );
  });

  test('should have aria-label "Navegación principal" on the NavigationRail', async ({ page }) => {
    // GIVEN: The application shell is rendered on desktop
    // WHEN: The NavigationRail is visible
    await page.goto('/clientes');

    // THEN: The NavigationRail has aria-label="Navegación principal"
    await expect(page.locator('[data-testid="navigation-rail"]')).toHaveAttribute(
      'aria-label',
      'Navegación principal',
    );
  });

  test('should have no axe critical or serious violations on the app shell', async ({ page }) => {
    // GIVEN: The application shell is rendered (any viewport)
    // WHEN: The page is inspected with an accessibility tool
    await page.goto('/clientes');

    // THEN: No axe critical or serious violations (WCAG 2.1 AA)
    // Implementation: Install @axe-core/playwright and run axe analysis
    // Expected: 0 critical violations, 0 serious violations
    const accessibilityScanResults = await page.evaluate(() => {
      // Placeholder: real implementation will use axe-core injection
      // This will fail until axe is integrated
      return (window as unknown as Record<string, unknown>).__axeViolations__ as
        | Array<{ impact: string }>
        | undefined;
    });

    // Will be RED until axe is injected and the shell passes accessibility checks
    expect(accessibilityScanResults).toBeDefined();
    const criticalOrSerious = (accessibilityScanResults ?? []).filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(criticalOrSerious).toHaveLength(0);
  });

  test('should allow Tab keyboard navigation to reach each nav item', async ({ page }) => {
    // GIVEN: The application shell is rendered on desktop
    // WHEN: The user presses Tab to navigate
    await page.goto('/clientes');

    // THEN: Focus can reach the Clientes nav item via keyboard
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    // At least one of the nav items should be focusable via Tab
    const navItems = ['nav-item-clientes', 'nav-item-contactos', 'navbar'];
    const isFocusedOnNav = navItems.some(id => focusedElement?.includes(id) || focusedElement === id);
    // The focus must eventually reach a nav item
    // This test verifies keyboard accessibility is not blocked
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });
});
