import { test, expect } from '@playwright/test';
import { NavigationShellPage } from '../../pages/navigation.page';

/**
 * Story 1.2 — Frontend Navigation Shell — Mobile Tests
 * Epic 1 — Project Foundation & Application Shell
 *
 * Acceptance Criteria covered:
 *   AC2 — Mobile (<1024px): NavigationBar at bottom instead of rail; items accessible and tappable
 *
 * These tests MUST run under the "mobile-chrome" Playwright project (Pixel 5 — 393×851px).
 * To run only mobile tests:
 *   npx playwright test navigation-shell-mobile --project=mobile-chrome
 *
 * ALL TESTS ARE IN RED (FAILING) PHASE.
 * They fail because NavigationBar component and mobile layout are not yet implemented.
 *
 * Test IDs: E2E-F-06, E2E-F-07
 *
 * Network-first pattern applied throughout.
 * Selectors use data-testid for resilience.
 */

// Force mobile viewport for all tests in this file
test.use({ viewport: { width: 393, height: 851 } });

test.describe('Story 1.2 — NavigationBar (Mobile <1024px)', () => {
  /**
   * E2E-F-06 (P1 — AC2)
   * Given the application is loaded on a mobile browser viewport (< 1024px)
   * When the user views the app
   * Then a NavigationBar is displayed at the bottom (NOT a NavigationRail)
   */
  test('E2E-F-06 — NavigationBar visible en viewport móvil (Pixel 5) en lugar de NavigationRail', async ({
    page,
  }) => {
    const nav = new NavigationShellPage(page);

    // GIVEN: mobile viewport (393×851 — Pixel 5 equivalent)

    // WHEN: the app loads
    await nav.goto();

    // THEN: NavigationBar is visible at the bottom
    await expect(nav.navigationBar).toBeVisible();

    // AND: NavigationRail is NOT visible on mobile
    await expect(nav.navigationRail).not.toBeVisible();
  });

  /**
   * E2E-F-07a (P1 — AC2)
   * Given the mobile app is loaded
   * When the user views the NavigationBar
   * Then the "Clientes" item is visible and tappable (touch target ≥ 44px)
   */
  test('E2E-F-07a — Ítem Clientes en NavigationBar es visible y tiene área táctil adecuada', async ({
    page,
  }) => {
    const nav = new NavigationShellPage(page);

    // GIVEN: mobile viewport, app loaded
    await nav.goto();

    // WHEN: NavigationBar is rendered
    await expect(nav.navigationBar).toBeVisible();

    // THEN: Clientes link is visible
    await expect(nav.clientesLink).toBeVisible();

    // AND: touch target height ≥ 44px (WCAG 2.5.5 minimum tap target)
    const clientesBoundingBox = await nav.clientesLink.boundingBox();
    expect(clientesBoundingBox).not.toBeNull();
    expect(clientesBoundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  /**
   * E2E-F-07b (P1 — AC2)
   * Given the mobile app is loaded
   * When the user views the NavigationBar
   * Then the "Contactos" item is visible and tappable (touch target ≥ 44px)
   */
  test('E2E-F-07b — Ítem Contactos en NavigationBar es visible y tiene área táctil adecuada', async ({
    page,
  }) => {
    const nav = new NavigationShellPage(page);

    // GIVEN: mobile viewport, app loaded
    await nav.goto();

    // WHEN: NavigationBar is rendered
    await expect(nav.navigationBar).toBeVisible();

    // THEN: Contactos link is visible
    await expect(nav.contactosLink).toBeVisible();

    // AND: touch target height ≥ 44px
    const contactosBoundingBox = await nav.contactosLink.boundingBox();
    expect(contactosBoundingBox).not.toBeNull();
    expect(contactosBoundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  /**
   * E2E-F-07c (P1 — AC2)
   * Given the mobile app is loaded and NavigationBar is visible
   * When the user taps "Clientes" in the NavigationBar
   * Then the URL changes to /clientes
   */
  test('E2E-F-07c — Tapping Clientes en NavigationBar navega a /clientes', async ({ page }) => {
    const nav = new NavigationShellPage(page);

    // GIVEN: mobile viewport, app loaded
    await nav.goto();
    await expect(nav.navigationBar).toBeVisible();

    // WHEN: user taps Clientes
    await nav.clientesLink.tap();

    // THEN: URL is /clientes
    await expect(page).toHaveURL(/\/clientes$/);
  });

  /**
   * E2E-F-07d (P1 — AC2)
   * Given the mobile app is loaded and NavigationBar is visible
   * When the user taps "Contactos" in the NavigationBar
   * Then the URL changes to /contactos
   */
  test('E2E-F-07d — Tapping Contactos en NavigationBar navega a /contactos', async ({ page }) => {
    const nav = new NavigationShellPage(page);

    // GIVEN: mobile viewport, app loaded
    await nav.goto();
    await expect(nav.navigationBar).toBeVisible();

    // WHEN: user taps Contactos
    await nav.contactosLink.tap();

    // THEN: URL is /contactos
    await expect(page).toHaveURL(/\/contactos$/);
  });
});
