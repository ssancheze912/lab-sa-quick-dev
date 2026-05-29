/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Error Paths
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion — Edge cases NOT covered by ATDD baseline
 *
 * Covers:
 *   - Boundary viewport (exactly 1023px vs 1024px breakpoint)
 *   - Tablet viewport (mid-range)
 *   - Browser back/forward navigation (SPA history)
 *   - Rapid successive navigation clicks
 *   - Deep unknown nested routes (AC5 extension)
 *   - Root redirect chain stability
 *   - NavigationBar mobile tap interaction
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Viewport boundary tests — exact breakpoint at lg: 1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Viewport boundary at lg breakpoint (1024px)', () => {
  test('[P1] should show NavigationBar (not Rail) at exactly 1023px width', async ({ page }) => {
    // GIVEN: The viewport is one pixel below the desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar (mobile) is shown; NavigationRail is hidden
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeHidden();
  });

  test('[P1] should show NavigationRail (not Bar) at exactly 1024px width', async ({ page }) => {
    // GIVEN: The viewport is at the exact desktop breakpoint
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationRail (desktop) is shown; NavigationBar is hidden
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tablet viewport — intermediate breakpoint
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Tablet viewport (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('[P2] should display NavigationBar (not Rail) at tablet viewport', async ({ page }) => {
    // GIVEN: The viewport is tablet-sized (768px < 1024px)
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar is visible; NavigationRail is hidden
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeHidden();
  });

  test('[P2] should navigate between routes from tablet viewport', async ({ page }) => {
    // GIVEN: Tablet user is on /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: User taps Contactos in the NavigationBar
    const navPromise = page.waitForURL('**/contactos**');
    await page.locator('[data-testid="navigation-bar"] [data-testid="nav-item-contactos"]').click();
    await navPromise;

    // THEN: URL changes to /contactos
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPA browser history — back/forward navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Browser back/forward SPA navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should restore /clientes when navigating back after going to /contactos', async ({ page }) => {
    // GIVEN: User starts at /clientes and then navigates to /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos**');

    // WHEN: User clicks browser back button
    await page.goBack();
    await page.waitForURL('**/clientes**');

    // THEN: URL returns to /clientes and Clientes content is visible
    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-shell-view"]')).toBeVisible();
  });

  test('[P1] should restore /contactos when navigating forward after going back', async ({ page }) => {
    // GIVEN: User navigated clientes → contactos, then pressed back
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos**');
    await page.goBack();
    await page.waitForURL('**/clientes**');

    // WHEN: User clicks browser forward button
    await page.goForward();
    await page.waitForURL('**/contactos**');

    // THEN: URL returns to /contactos and Contactos content is visible
    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="contactos-shell-view"]')).toBeVisible();
  });

  test('[P1] should update active highlight correctly on back navigation', async ({ page }) => {
    // GIVEN: User navigates from /clientes to /contactos and goes back
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos**');

    // WHEN: User presses back
    await page.goBack();
    await page.waitForURL('**/clientes**');

    // THEN: Clientes item is active again in the NavigationRail
    await expect(page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rapid successive clicks — race condition prevention
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Rapid successive navigation clicks', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should settle on /contactos after clicking Contactos twice rapidly', async ({ page }) => {
    // GIVEN: Desktop user is on /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: User clicks Contactos twice in rapid succession
    const navItem = page.locator('[data-testid="navigation-rail"] [data-testid="nav-item-contactos"]');
    await navItem.click();
    await navItem.click(); // second click before URL settles

    await page.waitForURL('**/contactos**');

    // THEN: URL resolves to /contactos without error
    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="contactos-shell-view"]')).toBeVisible();
  });

  test('[P2] should settle on /clientes after clicking both nav items back to back', async ({ page }) => {
    // GIVEN: Desktop user starts on /contactos
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');

    // WHEN: User clicks Clientes and immediately Contactos and back to Clientes
    const rail = page.locator('[data-testid="navigation-rail"]');
    await rail.locator('[data-testid="nav-item-clientes"]').click();
    await rail.locator('[data-testid="nav-item-contactos"]').click();
    await rail.locator('[data-testid="nav-item-clientes"]').click();

    await page.waitForURL('**/clientes**');

    // THEN: URL settles at /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Deep unknown routes — 404 edge cases (AC5 extension)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC5 — Unknown route edge cases', () => {
  test('[P1] should render 404 view for a deeply nested unknown path', async ({ page }) => {
    // GIVEN: The user navigates to a deeply nested unknown path
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes/unknown/nested/path');

    // THEN: The 404 view is displayed gracefully
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('[P1] should render 404 view for path with special characters', async ({ page }) => {
    // GIVEN: The user navigates to a route with special characters
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/ruta-desconocida-123');

    // THEN: The 404 view is displayed (not a JS error)
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P1] should show no raw error text on 404 page', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/pagina-inexistente');

    // THEN: No raw stack trace or JS error is visible to the user
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/Error:|Exception:|TypeError:|at Object\./i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect chain stability
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC6 — Root redirect edge cases', () => {
  test('[P1] should redirect / to /clientes and show Clientes content', async ({ page }) => {
    // GIVEN: Root path / is accessed
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: Page loads and redirect completes
    await page.goto('/');
    await page.waitForURL('**/clientes**');

    // THEN: Clientes shell view is visible (content rendered, not blank screen)
    await expect(page.locator('[data-testid="clientes-shell-view"]')).toBeVisible();
  });

  test('[P1] should redirect / to /clientes showing NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport, root path accessed
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: Page loads and redirect completes
    await page.goto('/');
    await page.waitForURL('**/clientes**');

    // THEN: NavigationRail is visible (layout loaded correctly after redirect)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active highlight updates on mobile NavigationBar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] AC2 — Mobile NavigationBar active state edge cases', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('[P2] should highlight Contactos as active when on /contactos from mobile', async ({ page }) => {
    // GIVEN: Mobile user navigates directly to /contactos
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: Contactos item is highlighted in NavigationBar
    await expect(page.locator('[data-testid="navigation-bar"] [data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });

  test('[P2] should highlight Clientes as active when on /clientes from mobile', async ({ page }) => {
    // GIVEN: Mobile user navigates directly to /clientes
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: Clientes item is highlighted in NavigationBar
    await expect(page.locator('[data-testid="navigation-bar"] [data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('[P2] should update active highlight after tapping Contactos on mobile', async ({ page }) => {
    // GIVEN: Mobile user starts on /clientes
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // WHEN: User taps Contactos in NavigationBar
    await page.locator('[data-testid="navigation-bar"] [data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos**');

    // THEN: Contactos item becomes active
    await expect(page.locator('[data-testid="navigation-bar"] [data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });
});
