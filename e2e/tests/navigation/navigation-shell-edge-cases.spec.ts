/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Error Path Tests — Automation Expansion
 * Covers scenarios NOT included in the ATDD RED phase tests:
 *   - Active state toggling when navigating between sections
 *   - Viewport boundary conditions (1023px vs 1024px)
 *   - Dynamic viewport resize mid-session
 *   - Browser back/forward navigation (history API)
 *   - Deeply nested unknown URL paths (multi-segment 404)
 *   - 404 recovery: clicking back link restores correct active state
 *   - No runtime JS errors during navigation lifecycle
 *   - Exact breakpoint: 1024px switches to desktop nav
 *   - Navigation shell renders without console errors on load
 *   - Repeated navigation to the same route (no state corruption)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Active state toggling between sections
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Active state — toggling when navigating', () => {
  test('[P1] should remove aria-current from Clientes when navigating to Contactos', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes (Clientes is active)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-link-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );

    // WHEN: User clicks Contactos
    await page.click('[data-testid="nav-link-contactos"]');
    await expect(page).toHaveURL('/contactos');

    // THEN: Clientes no longer has aria-current, Contactos has aria-current="page"
    await expect(page.locator('[data-testid="nav-link-clientes"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('[data-testid="nav-link-contactos"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('[P1] should remove aria-current from Contactos when navigating back to Clientes', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos (Contactos is active)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');
    await expect(page.locator('[data-testid="nav-link-contactos"]')).toHaveAttribute(
      'aria-current',
      'page',
    );

    // WHEN: User clicks Clientes
    await page.click('[data-testid="nav-link-clientes"]');
    await expect(page).toHaveURL('/clientes');

    // THEN: Contactos loses aria-current, Clientes gets aria-current="page"
    await expect(page.locator('[data-testid="nav-link-contactos"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('[data-testid="nav-link-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Viewport boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport boundary — 1023px (mobile) vs 1024px (desktop)', () => {
  test('[P2] should show NavigationBar (mobile) at exactly 1023px viewport width', async ({
    page,
  }) => {
    // GIVEN: Viewport is 1px below the desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The app loads
    await page.goto('/clientes');

    // THEN: NavigationBar (mobile) is shown, NavigationRail (desktop) is NOT
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P2] should show NavigationRail (desktop) at exactly 1024px viewport width', async ({
    page,
  }) => {
    // GIVEN: Viewport is exactly at the desktop breakpoint
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The app loads
    await page.goto('/clientes');

    // THEN: NavigationRail (desktop) is shown, NavigationBar (mobile) is NOT
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });

  test('[P2] should show NavigationBar on a very small viewport (320px)', async ({ page }) => {
    // GIVEN: Minimum mobile viewport width
    await page.setViewportSize({ width: 320, height: 568 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // THEN: NavigationBar is shown (mobile layout applies)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic viewport resize mid-session
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dynamic viewport resize — nav component switches', () => {
  test('[P2] should switch from NavigationRail to NavigationBar when resizing from desktop to mobile', async ({
    page,
  }) => {
    // GIVEN: User starts on a desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: Viewport is resized to mobile size
    await page.setViewportSize({ width: 390, height: 844 });
    // Trigger a resize event (some browsers may need this)
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));

    // THEN: NavigationBar becomes visible and NavigationRail becomes hidden
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P2] should switch from NavigationBar to NavigationRail when resizing from mobile to desktop', async ({
    page,
  }) => {
    // GIVEN: User starts on a mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();

    // WHEN: Viewport is resized to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));

    // THEN: NavigationRail becomes visible and NavigationBar becomes hidden
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser back/forward navigation (history API)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser history — back/forward navigation', () => {
  test('[P1] should restore /clientes view when clicking browser Back after navigating to /contactos', async ({
    page,
  }) => {
    // GIVEN: User navigates from /clientes to /contactos
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.click('[data-testid="nav-link-contactos"]');
    await expect(page).toHaveURL('/contactos');

    // WHEN: User clicks browser Back button
    await page.goBack();

    // THEN: User is back on /clientes with the Clientes view rendered
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P1] should show correct active nav entry after browser Back navigation', async ({
    page,
  }) => {
    // GIVEN: User navigated from /clientes to /contactos then back
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.click('[data-testid="nav-link-contactos"]');
    await expect(page).toHaveURL('/contactos');
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // THEN: Clientes nav link has aria-current="page" again
    await expect(page.locator('[data-testid="nav-link-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('[data-testid="nav-link-contactos"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('[P2] should restore /contactos view when clicking browser Forward after going back', async ({
    page,
  }) => {
    // GIVEN: User navigated /clientes → /contactos → back to /clientes
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await page.click('[data-testid="nav-link-contactos"]');
    await expect(page).toHaveURL('/contactos');
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // WHEN: User clicks browser Forward
    await page.goForward();

    // THEN: User is back on /contactos with the Contactos view rendered
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Deeply nested / multi-segment unknown URLs (404 edge cases)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 view — multi-segment and edge case unknown routes', () => {
  test('[P1] should display 404 view for a deeply nested unknown path', async ({ page }) => {
    // GIVEN: Unknown URL with multiple path segments
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates to a nested unknown route
    await page.goto('/ruta/muy/profunda/inexistente');

    // THEN: The 404 view is still displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-heading"]')).toHaveText(
      'Página no encontrada',
    );
  });

  test('[P1] should display 404 view for paths with special characters', async ({ page }) => {
    // GIVEN: URL with URL-encoded characters
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user navigates to a path with special chars
    await page.goto('/ruta-con-caracteres-especiales-123');

    // THEN: The 404 view is shown (router does not crash)
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P1] should navigate to /clientes and restore active state after clicking back from 404', async ({
    page,
  }) => {
    // GIVEN: User navigated from /clientes to an unknown route
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/ruta-inexistente');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: User clicks the back-to-clientes link on the 404 page
    await page.click('[data-testid="not-found-back-link"]');

    // THEN: User lands on /clientes with the Clientes view and correct active state
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-link-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('[P2] should not throw runtime JS errors when visiting unknown routes', async ({ page }) => {
    // GIVEN: The SPA is running with TanStack Router catch-all route
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user visits an unknown route
    await page.goto('/completely/unknown/path/that/does/not/exist');
    await page.waitForLoadState('networkidle');

    // THEN: No uncaught JS exceptions occurred
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Repeated navigation to same route (idempotency)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Repeated navigation — idempotency and stability', () => {
  test('[P2] should remain stable when clicking the active nav link again (same route)', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes and Clientes is active
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-link-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );

    // WHEN: User clicks the already-active Clientes nav link
    await page.click('[data-testid="nav-link-clientes"]');

    // THEN: URL stays at /clientes, view is still rendered, no crash
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-link-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('[P2] should not produce runtime errors after navigating back and forth multiple times', async ({
    page,
  }) => {
    // GIVEN: The SPA is loaded
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/**', (route) => route.continue());

    await page.goto('/clientes');

    // WHEN: User navigates back and forth 5 times
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="nav-link-contactos"]');
      await expect(page).toHaveURL('/contactos');
      await page.click('[data-testid="nav-link-clientes"]');
      await expect(page).toHaveURL('/clientes');
    }

    // THEN: No runtime errors occurred during repeated navigation
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No console errors during navigation shell lifecycle
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation shell — no runtime errors on load', () => {
  test('[P1] should not produce uncaught JS errors when loading the navigation shell', async ({
    page,
  }) => {
    // GIVEN: Clean browser session
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user loads the navigation shell on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: No uncaught JS errors
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P1] should not produce uncaught JS errors when loading the navigation shell on mobile', async ({
    page,
  }) => {
    // GIVEN: Clean mobile browser session
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The user loads the navigation shell on mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: No uncaught JS errors
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should not emit React key or DOM-attribute console errors on nav shell render', async ({
    page,
  }) => {
    // GIVEN: The navigation shell renders NAV_ITEMS with map()
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const text = msg.text();
        if (
          text.includes('key') ||
          text.includes('unknown prop') ||
          text.includes('Invalid DOM') ||
          text.includes('validateDOMNesting')
        ) {
          consoleErrors.push(text);
        }
      }
    });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: Navigation shell renders on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    // THEN: No React key or DOM nesting warnings
    expect(consoleErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile navigation accessibility edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mobile navigation — accessibility edge cases', () => {
  test('[P2] should show active state in NavigationBar on mobile for /contactos', async ({
    page,
  }) => {
    // GIVEN: Mobile viewport and user is on /contactos
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: User navigates directly to /contactos
    await page.goto('/contactos');

    // THEN: Contactos nav link in the mobile NavigationBar is marked active
    await expect(page.locator('[data-testid="nav-link-contactos"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('[data-testid="nav-link-clientes"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('[P2] should navigate client-side from mobile NavigationBar tap on Clientes', async ({
    page,
  }) => {
    // GIVEN: Mobile viewport, user is on /contactos
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');

    let fullReloadOccurred = false;
    page.on('load', () => { fullReloadOccurred = true; });
    await page.waitForLoadState('networkidle');
    fullReloadOccurred = false;

    // WHEN: User taps Clientes in the NavigationBar
    await page.tap('[data-testid="nav-link-clientes"]');

    // THEN: Client-side navigation occurs without a full page reload
    await expect(page).toHaveURL('/clientes');
    expect(fullReloadOccurred).toBe(false);
  });
});
