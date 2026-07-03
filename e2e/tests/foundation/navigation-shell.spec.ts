/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until Story 1.2 is implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop LayoutBase (Navbar + NavigationRail) with Clientes/Contactos entries
 *   AC2 — Mobile NavigationBar (bottom nav), NavigationRail hidden below lg breakpoint
 *   AC3 — Deep linking to /clientes and /contactos renders correct views
 *   AC4 — 404 fallback rendered inside persistent shell
 *   AC5 — Index `/` redirects (in-app) to `/clientes` via TanStack Router
 *   AC6 — siesa-ui-kit styles present (indirect via visible shell chrome)
 *
 * Related test cases from Epic 1 test design:
 *   TC-E1-P1-01 (SPA nav no reload), TC-E1-P1-02 (deep link /clientes),
 *   TC-E1-P1-03 (deep link /contactos), TC-E1-P1-04 (404 fallback),
 *   TC-E1-P2-01 (rail visible desktop), TC-E1-P2-02 (bar visible mobile),
 *   TC-E1-P2-03 (index redirect).
 *
 * Selector conventions:
 *   - Only data-testid selectors (see Task 1 of story).
 *   - No hard waits; use explicit locator.waitFor / expect(...).toBeVisible().
 *   - Network-first: no external API calls exercised by this story.
 */

import { test, expect } from '@playwright/test';

const isMobileProject = (projectName: string) => projectName === 'mobile-chrome';

// ─────────────────────────────────────────────────────────────────────────────
// AC #1 — Desktop Navigation Shell (viewport ≥ 1024px)
// TC-E1-P2-01 (rail visible desktop), TC-E1-P1-01 (SPA nav no reload)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #1 — Desktop navigation shell', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), 'Desktop-only ACs');
  });

  test('[P1] should mount the persistent AppShell wrapper', async ({ page }) => {
    // GIVEN: The app is loaded on a desktop viewport (≥ 1024px)
    await page.goto('/clientes');

    // WHEN: The router resolves the _app layout
    // THEN: The AppShell wrapper is present in the DOM
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('[P1] should render NavigationRail visible on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport (Playwright chromium project default is 1280x720)
    await page.goto('/clientes');

    // WHEN: The shell mounts
    // THEN: The desktop NavigationRail wrapper is visible
    await expect(page.locator('[data-testid="nav-rail"]')).toBeVisible();
  });

  test('[P1] should display the "Siesa Agents" product name in the Navbar', async ({ page }) => {
    // GIVEN: LayoutBase is configured with productName="Siesa Agents"
    await page.goto('/clientes');

    // WHEN: The desktop shell renders
    // THEN: The product name is visible somewhere in the shell chrome
    await expect(page.locator('[data-testid="app-shell"]')).toContainText('Siesa Agents');
  });

  test('[P1] should render the "Clientes" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: The NavigationRail has two entries: Clientes and Contactos
    await page.goto('/clientes');

    // WHEN: The rail is rendered
    // THEN: A rail entry labelled "Clientes" (accessible name) exists
    const clientesLink = page.getByRole('link', { name: /clientes/i }).or(
      page.getByRole('button', { name: /clientes/i }),
    );
    await expect(clientesLink.first()).toBeVisible();
  });

  test('[P1] should render the "Contactos" navigation entry in the NavigationRail', async ({ page }) => {
    // GIVEN: The NavigationRail has two entries: Clientes and Contactos
    await page.goto('/clientes');

    // WHEN: The rail is rendered
    // THEN: A rail entry labelled "Contactos" (accessible name) exists
    const contactosLink = page.getByRole('link', { name: /contactos/i }).or(
      page.getByRole('button', { name: /contactos/i }),
    );
    await expect(contactosLink.first()).toBeVisible();
  });

  test('[P1] should navigate to /contactos without a full page reload (TC-E1-P1-01)', async ({ page }) => {
    // GIVEN: The user is on /clientes with a sentinel installed on window
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await page.evaluate(() => {
      // @ts-expect-error — test-only sentinel
      window.__spaReloadSentinel = 'preserved';
    });

    // WHEN: The user clicks the "Contactos" nav entry
    await page
      .getByRole('link', { name: /contactos/i })
      .or(page.getByRole('button', { name: /contactos/i }))
      .first()
      .click();

    // THEN: The URL updates to /contactos
    await expect(page).toHaveURL(/\/contactos$/);
  });

  test('[P1] should preserve the SPA sentinel after clicking Contactos (no reload)', async ({ page }) => {
    // GIVEN: A sentinel is installed on window before navigation
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await page.evaluate(() => {
      // @ts-expect-error — test-only sentinel
      window.__spaReloadSentinel = 'preserved';
    });

    // WHEN: The user navigates in-app to /contactos
    await page
      .getByRole('link', { name: /contactos/i })
      .or(page.getByRole('button', { name: /contactos/i }))
      .first()
      .click();
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();

    // THEN: The sentinel is still present — proving no full page reload occurred
    const sentinel = await page.evaluate(() => {
      // @ts-expect-error — test-only sentinel
      return window.__spaReloadSentinel;
    });
    expect(sentinel).toBe('preserved');
  });

  test('[P1] should render the Contactos placeholder view after navigation', async ({ page }) => {
    // GIVEN: /clientes is the starting route
    await page.goto('/clientes');

    // WHEN: The user clicks Contactos
    await page
      .getByRole('link', { name: /contactos/i })
      .or(page.getByRole('button', { name: /contactos/i }))
      .first()
      .click();

    // THEN: The Contactos placeholder view renders
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC #2 — Mobile Navigation Shell (viewport < 1024px, minimum 375px)
// TC-E1-P2-02 (nav bar visible mobile)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #2 — Mobile navigation shell', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), 'Mobile-only ACs (Pixel 5 project)');
  });

  test('[P1] should render the mobile NavigationBar wrapper', async ({ page }) => {
    // GIVEN: The mobile-chrome project uses Pixel 5 viewport (width 393px, < lg 1024px)
    await page.goto('/clientes');

    // WHEN: The shell mounts
    // THEN: The mobile NavigationBar wrapper is visible
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
  });

  test('[P1] should hide the desktop NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport is active (< lg breakpoint)
    await page.goto('/clientes');

    // WHEN: The shell mounts
    // THEN: The NavigationRail wrapper is either not visible or absent (hidden by lg:block)
    await expect(page.locator('[data-testid="nav-rail"]')).toBeHidden();
  });

  test('[P1] should render the "Clientes" NavigationBar item', async ({ page }) => {
    // GIVEN: The mobile NavigationBar has Clientes and Contactos entries
    await page.goto('/contactos');

    // WHEN: The bar renders
    // THEN: A tappable Clientes entry is present with Spanish accessible name
    const clientesTap = page
      .locator('[data-testid="nav-bar"]')
      .getByRole('link', { name: /clientes/i })
      .or(page.locator('[data-testid="nav-bar"]').getByRole('button', { name: /clientes/i }));
    await expect(clientesTap.first()).toBeVisible();
  });

  test('[P1] should render the "Contactos" NavigationBar item', async ({ page }) => {
    // GIVEN: The mobile NavigationBar has Clientes and Contactos entries
    await page.goto('/clientes');

    // WHEN: The bar renders
    // THEN: A tappable Contactos entry is present with Spanish accessible name
    const contactosTap = page
      .locator('[data-testid="nav-bar"]')
      .getByRole('link', { name: /contactos/i })
      .or(page.locator('[data-testid="nav-bar"]').getByRole('button', { name: /contactos/i }));
    await expect(contactosTap.first()).toBeVisible();
  });

  test('[P1] should enforce a minimum tap target height of 44px on NavigationBar items', async ({ page }) => {
    // GIVEN: WCAG 2.1 AA minimum tap target = 44px (per company-standards.md)
    await page.goto('/clientes');

    // WHEN: The mobile NavigationBar items render
    const firstItem = page
      .locator('[data-testid="nav-bar"]')
      .locator('a, button')
      .first();
    await firstItem.waitFor({ state: 'visible' });

    // THEN: The item's rendered height is at least 44 pixels
    const box = await firstItem.boundingBox();
    expect(box, 'NavigationBar item must produce a bounding box').not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('[P1] should navigate via NavigationBar without a full page reload', async ({ page }) => {
    // GIVEN: A sentinel is installed on window before navigation
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await page.evaluate(() => {
      // @ts-expect-error — test-only sentinel
      window.__spaReloadSentinel = 'preserved';
    });

    // WHEN: The user taps Contactos in the mobile NavigationBar
    await page
      .locator('[data-testid="nav-bar"]')
      .getByRole('link', { name: /contactos/i })
      .or(page.locator('[data-testid="nav-bar"]').getByRole('button', { name: /contactos/i }))
      .first()
      .click();

    // THEN: The URL updates to /contactos AND the sentinel survives (no reload)
    await expect(page).toHaveURL(/\/contactos$/);
    const sentinel = await page.evaluate(() => {
      // @ts-expect-error — test-only sentinel
      return window.__spaReloadSentinel;
    });
    expect(sentinel).toBe('preserved');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC #3 — Deep linking to /clientes and /contactos
// TC-E1-P1-02, TC-E1-P1-03
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #3 — Deep linking to placeholder routes', () => {
  test('[P1] should render Clientes view when opening /clientes directly (TC-E1-P1-02)', async ({ page }) => {
    // GIVEN: A fresh browser context (no prior navigation)
    // WHEN: User types /clientes directly in URL bar
    await page.goto('/clientes');

    // THEN: The Clientes placeholder view renders (no redirect to /)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await expect(page).toHaveURL(/\/clientes$/);
  });

  test('[P1] should render Contactos view when opening /contactos directly (TC-E1-P1-03)', async ({ page }) => {
    // GIVEN: A fresh browser context
    // WHEN: User types /contactos directly in URL bar
    await page.goto('/contactos');

    // THEN: The Contactos placeholder view renders (no redirect)
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
    await expect(page).toHaveURL(/\/contactos$/);
  });

  test('[P1] should show the Clientes h1 heading in Spanish on deep link', async ({ page }) => {
    // GIVEN: The Clientes placeholder has an <h1>Clientes</h1>
    // WHEN: Deep-linking to /clientes
    await page.goto('/clientes');

    // THEN: The Spanish h1 heading is present
    await expect(page.getByRole('heading', { level: 1, name: /^clientes$/i })).toBeVisible();
  });

  test('[P1] should show the Contactos h1 heading in Spanish on deep link', async ({ page }) => {
    // GIVEN: The Contactos placeholder has an <h1>Contactos</h1>
    // WHEN: Deep-linking to /contactos
    await page.goto('/contactos');

    // THEN: The Spanish h1 heading is present
    await expect(page.getByRole('heading', { level: 1, name: /^contactos$/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC #4 — 404 fallback rendered inside persistent shell
// TC-E1-P1-04
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #4 — 404 not-found view within persistent shell', () => {
  test('[P1] should render NotFoundView for unknown routes (TC-E1-P1-04)', async ({ page }) => {
    // GIVEN: The router has notFoundComponent wired to NotFoundView
    // WHEN: User navigates to an unknown route
    await page.goto('/ruta-que-no-existe');

    // THEN: The NotFoundView is rendered
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P1] should keep the persistent AppShell visible on 404', async ({ page }) => {
    // GIVEN: notFoundComponent is set on the _app route so the shell persists
    // WHEN: User navigates to an unknown route
    await page.goto('/ruta-que-no-existe');

    // THEN: The AppShell wrapper is still mounted
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('[P1] should display the Spanish 404 message', async ({ page }) => {
    // GIVEN: NotFoundView shows "La página solicitada no existe"
    // WHEN: User navigates to an unknown route
    await page.goto('/ruta-que-no-existe');

    // THEN: The Spanish 404 copy is visible
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText(
      /la página solicitada no existe/i,
    );
  });

  test('[P1] should expose a link back to /clientes from the NotFoundView', async ({ page }) => {
    // GIVEN: NotFoundView renders a Button linking to /clientes labelled "Ir a Clientes"
    // WHEN: User is on the 404 page
    await page.goto('/ruta-que-no-existe');

    // THEN: A visible link/button with the "Ir a Clientes" label exists
    await expect(
      page
        .locator('[data-testid="not-found-view"]')
        .getByRole('link', { name: /ir a clientes/i })
        .or(
          page
            .locator('[data-testid="not-found-view"]')
            .getByRole('button', { name: /ir a clientes/i }),
        )
        .first(),
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC #5 — Index route `/` redirects to `/clientes`
// TC-E1-P2-03
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #5 — Index route redirect to /clientes', () => {
  test('[P1] should redirect from `/` to `/clientes` (TC-E1-P2-03)', async ({ page }) => {
    // GIVEN: The `/` route has beforeLoad → throw redirect({ to: '/clientes' })
    // WHEN: User visits the root of the app
    await page.goto('/');

    // THEN: The URL resolves to /clientes and the Clientes view renders
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P1] should not render any pre-redirect landing content at `/`', async ({ page }) => {
    // GIVEN: index.tsx has NO component export — only beforeLoad redirect
    // WHEN: User visits `/`
    await page.goto('/');
    await expect(page).toHaveURL(/\/clientes$/);

    // THEN: The old "Siesa Agents CRM" landing placeholder body is NOT visible
    // (the story explicitly removes the pre-existing placeholder content)
    await expect(
      page.getByText('Aplicación inicializada. Las funcionalidades se habilitarán'),
    ).toHaveCount(0);
  });
});
