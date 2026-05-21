import { test, expect } from '@playwright/test';

/**
 * E2E Acceptance Tests: Story 1.2 — Frontend Navigation Shell (Part 1)
 *
 * Covers:
 *   AC1 — NavigationRail (desktop) visible on left with Clientes + Contactos entries; SPA navigation (no full reload)
 *   AC2 — NavigationBar (mobile, < 1024px) visible at bottom; items accessible and tappable
 *   AC3 — Deep linking: /clientes and /contactos render directly without redirection
 *
 * See navigation-shell-ac4-ac6.spec.ts for AC4, AC5, AC6 and index redirect.
 */

test.describe('Story 1.2 — Frontend Navigation Shell (AC1–AC3)', () => {

  // ─── AC1: Desktop NavigationRail ─────────────────────────────────────────

  test('AC1 — NavigationRail is visible on the left side in desktop viewport', async ({ page }) => {
    // GIVEN: Application is loaded on a desktop browser (>= 1024px)
    await page.setViewportSize({ width: 1280, height: 800 });

    // CRITICAL: Intercept BEFORE navigation (network-first pattern)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: NavigationRail is visible
    await expect(page.getByTestId('nav-rail')).toBeVisible();
  });

  test('AC1 — NavigationRail contains "Clientes" navigation entry on desktop', async ({ page }) => {
    // GIVEN: Application loaded on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: "Clientes" nav entry is visible within the rail
    await expect(page.getByTestId('nav-item-clientes')).toBeVisible();
  });

  test('AC1 — NavigationRail contains "Contactos" navigation entry on desktop', async ({ page }) => {
    // GIVEN: Application loaded on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: "Contactos" nav entry is visible within the rail
    await expect(page.getByTestId('nav-item-contactos')).toBeVisible();
  });

  test('AC1 — Clicking "Clientes" in NavigationRail navigates to /clientes without full page reload', async ({ page }) => {
    // GIVEN: Application is loaded on a desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');

    // Detect full page reloads: a full document reload triggers 'load' on the frame,
    // whereas TanStack Router pushState navigation does NOT trigger a new document load.
    let hadFullReload = false;
    page.on('load', () => {
      hadFullReload = true;
    });
    // Reset after initial page load is complete
    hadFullReload = false;

    // WHEN: The user clicks the "Clientes" nav item
    await page.getByTestId('nav-item-clientes').click();

    // THEN: URL is /clientes and no full page reload occurred
    await expect(page).toHaveURL(/\/clientes/);
    expect(hadFullReload, 'SPA navigation should not trigger a full page reload').toBe(false);
  });

  test('AC1 — Clicking "Contactos" in NavigationRail navigates to /contactos', async ({ page }) => {
    // GIVEN: Application loaded on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');

    // WHEN: The user clicks the "Contactos" nav item
    await page.getByTestId('nav-item-contactos').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL(/\/contactos/);
  });

  // ─── AC2: Mobile NavigationBar ────────────────────────────────────────────

  test('AC2 — NavigationBar is visible at the bottom in mobile viewport (< 1024px)', async ({ page }) => {
    // GIVEN: Application is loaded on a mobile browser viewport (< 1024px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: NavigationBar is visible (not the rail)
    await expect(page.getByTestId('nav-bar')).toBeVisible();
  });

  test('AC2 — NavigationRail is NOT visible on mobile viewport (< 1024px)', async ({ page }) => {
    // GIVEN: Application loaded on a mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/');

    // THEN: NavigationRail is hidden (Tailwind hidden class)
    await expect(page.getByTestId('nav-rail')).toBeHidden();
  });

  test('AC2 — NavigationBar contains "Clientes" item that is tappable on mobile', async ({ page }) => {
    // GIVEN: Application loaded on mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');

    // WHEN: The "Clientes" item in NavigationBar is clicked
    await page.getByTestId('nav-item-clientes').click();

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('AC2 — NavigationBar contains "Contactos" item that is tappable on mobile', async ({ page }) => {
    // GIVEN: Application loaded on mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/');

    // WHEN: The "Contactos" item in NavigationBar is clicked
    await page.getByTestId('nav-item-contactos').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL(/\/contactos/);
  });

  // ─── AC3: Deep Linking ────────────────────────────────────────────────────

  test('AC3 — Direct URL /clientes renders the Clientes view without redirection', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /clientes
    await page.goto('/clientes');

    // THEN: The URL remains /clientes (no redirect to home screen)
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('AC3 — Direct URL /clientes renders the Clientes view content', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /clientes
    await page.goto('/clientes');

    // THEN: The Clientes view content is visible (not blank, not error)
    await expect(page.getByTestId('clientes-view')).toBeVisible();
  });

  test('AC3 — Direct URL /contactos renders the Contactos view without redirection', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /contactos
    await page.goto('/contactos');

    // THEN: The URL remains /contactos (no redirect)
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('AC3 — Direct URL /contactos renders the Contactos view content', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads at /contactos
    await page.goto('/contactos');

    // THEN: The Contactos view content is visible (not blank, not error)
    await expect(page.getByTestId('contactos-view')).toBeVisible();
  });
});
