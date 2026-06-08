/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * Cross-browser end-to-end coverage for SPA navigation behavior, the index
 * redirect, active-state on the navigation rail/bar, and Spanish a11y labels.
 * These tests are intentionally FAILING until the navigation shell is built.
 *
 * Acceptance Criteria covered:
 *   AC #1 — Desktop NavigationRail shows Clientes + Contactos and clicking
 *           triggers SPA navigation (NO full page reload, FR28).
 *   AC #2 — Mobile NavigationBar visible below lg breakpoint (FR29).
 *   AC #5 — Root URL `/` redirects to `/clientes` via TanStack Router.
 *   AC #6 — Active state synchronizes with the current pathname.
 *   AC #7 — All UI text and aria-labels are in Spanish.
 *
 * Test cases owned: TC-E1-P1-01 (SPA no reload), TC-E1-P2-01 (rail desktop),
 *   TC-E1-P2-02 (bar mobile), TC-E1-P2-03 (index redirect).
 *
 * Sandbox infra note: chromium-only project (Firefox unavailable per Story 1.1).
 *   Run with: `pnpm exec playwright test --project=chromium e2e/tests/foundation`
 */

import { test, expect } from '@playwright/test';

test.describe('AC #5 — Index route redirects to /clientes (TC-E1-P2-03)', () => {
  test('navigating to / lands on /clientes and renders the Clientes view', async ({ page }) => {
    // GIVEN: the user enters the root URL
    // WHEN: the route resolves
    await page.goto('/');

    // THEN: TanStack Router redirected to /clientes (default landing route)
    await expect(page).toHaveURL(/\/clientes$/);

    // AND: the Clientes view is rendered inside the shell
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

test.describe('AC #1 — Desktop NavigationRail (TC-E1-P1-01, TC-E1-P2-01)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('TC-E1-P2-01 — desktop shell wrapper renders the rail with both nav items', async ({
    page,
  }) => {
    // GIVEN: a desktop viewport (>= 1024px)
    // WHEN: the user lands on the app
    await page.goto('/clientes');

    // THEN: the desktop shell wrapper is visible
    await expect(page.locator('[data-testid="app-shell-desktop"]')).toBeVisible();

    // AND: both Spanish nav entries are present (text labels rendered by siesa-ui-kit)
    await expect(page.getByText('Clientes', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Contactos', { exact: true }).first()).toBeVisible();
  });

  test('TC-E1-P1-01 — clicking Contactos in the rail navigates without a full page reload', async ({
    page,
  }) => {
    // GIVEN: the user is on /clientes inside the desktop shell
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();

    // AND: a sentinel attached to window to detect a hard reload
    //      (if the page reloads, the sentinel is wiped)
    await page.evaluate(() => {
      (window as unknown as { __spaSentinel: number }).__spaSentinel = 42;
    });

    // WHEN: the user clicks the Contactos entry in the desktop rail
    await page
      .locator('[data-testid="app-shell-desktop"]')
      .getByText('Contactos', { exact: true })
      .first()
      .click();

    // THEN: the URL changed to /contactos
    await expect(page).toHaveURL(/\/contactos$/);

    // AND: the Contactos view rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();

    // AND: the sentinel survived → no full page reload occurred (FR28)
    const sentinel = await page.evaluate(
      () => (window as unknown as { __spaSentinel?: number }).__spaSentinel,
    );
    expect(sentinel).toBe(42);
  });

  test('AC #7 — desktop nav container exposes Spanish ariaLabel "Navegación principal"', async ({
    page,
  }) => {
    // GIVEN: the user opens the app on a desktop viewport
    await page.goto('/clientes');

    // WHEN: the desktop shell renders
    // THEN: the rail container exposes the Spanish aria-label
    await expect(
      page.locator('[data-testid="app-shell-desktop"] [aria-label="Navegación principal"]'),
    ).toBeVisible();
  });
});

test.describe('AC #2 — Mobile NavigationBar (TC-E1-P2-02)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('TC-E1-P2-02 — mobile shell wrapper renders the bottom bar (not the rail)', async ({
    page,
  }) => {
    // GIVEN: a mobile viewport (< 1024px)
    // WHEN: the user lands on the app
    await page.goto('/clientes');

    // THEN: the mobile shell wrapper is visible
    await expect(page.locator('[data-testid="app-shell-mobile"]')).toBeVisible();

    // AND: the bottom NavigationBar is rendered with Spanish ariaLabel "Navegación inferior"
    await expect(
      page.locator('[data-testid="app-shell-mobile"] [aria-label="Navegación inferior"]'),
    ).toBeVisible();
  });

  test('AC #2 — tapping Contactos on the mobile bar navigates via the router', async ({
    page,
  }) => {
    // GIVEN: the user is on /clientes on a mobile viewport
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeHidden();

    // WHEN: the user taps the Contactos entry on the bottom bar
    await page
      .locator('[data-testid="app-shell-mobile"]')
      .getByText('Contactos', { exact: true })
      .first()
      .click();

    // THEN: the URL changed to /contactos and the Contactos view rendered
    await expect(page).toHaveURL(/\/contactos$/);
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });
});

test.describe('AC #6 — Active state syncs with current pathname', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('on /clientes, the Clientes nav item exposes the active state', async ({ page }) => {
    // GIVEN: the user is on /clientes
    await page.goto('/clientes');

    // WHEN: the desktop NavigationRail renders
    // THEN: the Clientes entry advertises an active state (aria-current="page" or data-active)
    //       The implementation may choose either; we assert at least one is present on Clientes
    //       AND that Contactos does NOT have an active marker.
    const desktop = page.locator('[data-testid="app-shell-desktop"]');
    const clientesEntry = desktop
      .locator('a, [role="menuitem"], [role="link"], button')
      .filter({ hasText: /^Clientes$/ })
      .first();
    const contactosEntry = desktop
      .locator('a, [role="menuitem"], [role="link"], button')
      .filter({ hasText: /^Contactos$/ })
      .first();

    const clientesActiveMarker = await clientesEntry.evaluate((el) =>
      el.matches('[aria-current], [data-active="true"], [data-state="active"]'),
    );
    const contactosActiveMarker = await contactosEntry.evaluate((el) =>
      el.matches('[aria-current], [data-active="true"], [data-state="active"]'),
    );

    expect(clientesActiveMarker).toBe(true);
    expect(contactosActiveMarker).toBe(false);
  });
});
