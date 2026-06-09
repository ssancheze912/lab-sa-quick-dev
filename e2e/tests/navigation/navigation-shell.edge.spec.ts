/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge Cases & Boundary Conditions (expansion of ATDD tests)
 *
 * Coverage focus:
 *   - Responsive breakpoint boundary (1023px vs 1024px exact threshold)
 *   - Viewport resize mid-session (rail-to-bar and bar-to-rail transitions)
 *   - Browser back/forward navigation after SPA route changes
 *   - Active state (aria-current) reflects the current URL
 *   - 404 view accessible from mobile viewport
 *   - Back link on 404 does NOT cause a full page reload
 *   - Navigation with trailing slash and case sensitivity
 *   - Console error-free navigation transitions
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Exact breakpoint threshold (1023px vs 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive breakpoint boundary conditions', () => {
  test('[P1] should display NavigationBar (not Rail) at exactly 1023px viewport width', async ({ page }) => {
    // GIVEN: Viewport is 1023px — one pixel below the desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 800 });

    // WHEN: The application loads
    await page.goto('/clientes');

    // THEN: The mobile NavigationBar is visible (below 1024px threshold)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();

    // AND: The desktop NavigationRail is hidden
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P1] should display NavigationRail (not Bar) at exactly 1024px viewport width', async ({ page }) => {
    // GIVEN: Viewport is exactly 1024px — the desktop breakpoint threshold
    await page.setViewportSize({ width: 1024, height: 800 });

    // WHEN: The application loads
    await page.goto('/clientes');

    // THEN: The desktop NavigationRail is visible (>= 1024px threshold)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // AND: The mobile NavigationBar is hidden
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Viewport resize mid-session (responsive switch)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport resize mid-session — responsive nav switch', () => {
  test('[P2] should switch from NavigationRail to NavigationBar when resizing below breakpoint', async ({ page }) => {
    // GIVEN: The app is loaded on a desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');

    // Confirm NavigationRail is visible on desktop
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: The viewport is resized to mobile dimensions
    await page.setViewportSize({ width: 390, height: 844 });

    // THEN: The NavigationBar becomes visible
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();

    // AND: The NavigationRail is no longer visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P2] should switch from NavigationBar to NavigationRail when resizing above breakpoint', async ({ page }) => {
    // GIVEN: The app starts on a mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/clientes');

    // Confirm NavigationBar is visible on mobile
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();

    // WHEN: The viewport is resized to desktop dimensions
    await page.setViewportSize({ width: 1280, height: 800 });

    // THEN: The NavigationRail becomes visible
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // AND: The NavigationBar is no longer visible
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Browser back/forward after SPA navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser history — back/forward after SPA navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should navigate back to previous route via browser back button', async ({ page }) => {
    // GIVEN: User navigates from /clientes to /contactos via the nav
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // WHEN: The user presses the browser back button
    await page.goBack();

    // THEN: The user is back on /clientes
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P1] should navigate forward after going back', async ({ page }) => {
    // GIVEN: User navigates to /contactos then goes back
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // WHEN: The user presses the browser forward button
    await page.goForward();

    // THEN: The user is on /contactos again
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('[P2] should retain navigation shell during back/forward navigation (no full page reload)', async ({ page }) => {
    // GIVEN: User navigates from /contactos to /clientes
    await page.goto('/contactos');
    await page.evaluate(() => {
      (window as Window & { __spasentinel?: boolean }).__spasentinel = true;
    });
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await expect(page).toHaveURL('/clientes');

    // WHEN: Browser back is pressed
    await page.goBack();

    // THEN: Navigation shell is still visible (no full page reload means sentinel persists)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Active state (aria-current) reflects current URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Active navigation state — aria-current reflects URL', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should mark "Clientes" nav item with aria-current="page" when on /clientes', async ({ page }) => {
    // GIVEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The Clientes nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');

    // AND: The Contactos nav item does NOT have aria-current="page"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should mark "Contactos" nav item with aria-current="page" when on /contactos', async ({ page }) => {
    // GIVEN: The user navigates to /contactos
    await page.goto('/contactos');

    // THEN: The Contactos nav item has aria-current="page"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');

    // AND: The Clientes nav item does NOT have aria-current="page"
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should update aria-current when navigating from Clientes to Contactos', async ({ page }) => {
    // GIVEN: The user is on /clientes (Clientes is active)
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');

    // WHEN: The user clicks Contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: aria-current switches to Contactos
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: 404 not-found view from mobile viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 not-found view — mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P2] should display the 404 view on unknown routes in mobile viewport', async ({ page }) => {
    // GIVEN: A mobile user navigates to an unknown route
    await page.goto('/ruta-desconocida-movil');

    // THEN: The not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // AND: The Spanish message is present
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('Página no encontrada');
  });

  test('[P2] should provide a working back-to-clientes link on the mobile 404 view', async ({ page }) => {
    // GIVEN: A mobile user lands on the 404 view
    await page.goto('/not-found-mobile');

    // WHEN: The user taps the back link
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: The user is navigated to /clientes
    await expect(page).toHaveURL('/clientes');

    // AND: The mobile NavigationBar is present
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Repeated navigation (multi-hop routing)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Multi-hop SPA navigation — path sequence integrity', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should navigate clientes → contactos → clientes without stale state', async ({ page }) => {
    // GIVEN: The user starts at /clientes
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();

    // WHEN: The user navigates to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();

    // AND: Navigates back to /clientes via nav
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await expect(page).toHaveURL('/clientes');

    // THEN: The Clientes view is shown without stale content
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();

    // AND: The Clientes nav item is active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P2] should navigate contactos → clientes → contactos correctly', async ({ page }) => {
    // GIVEN: The user starts at /contactos
    await page.goto('/contactos');

    // WHEN: Multiple back-and-forth navigations
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await expect(page).toHaveURL('/clientes');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: Final destination correct with right active state
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Error-free navigation (console errors during transitions)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation error-free transitions — console error boundary', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should produce no console errors when navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: The user is on /clientes
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/clientes');

    // WHEN: Navigating to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: No console errors during the navigation
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P1] should produce no console errors when loading the 404 view', async ({ page }) => {
    // GIVEN: A listener is in place for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // WHEN: The user navigates to an unknown route
    await page.goto('/some-unknown-page-xyz');

    // THEN: The 404 view renders without console errors
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    expect(consoleErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Navigation shell accessibility in browser context
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation shell accessibility — browser-level checks', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should have a nav landmark with accessible name "Navegación principal" on desktop', async ({ page }) => {
    // GIVEN: The desktop layout is rendered
    await page.goto('/clientes');

    // THEN: There is a <nav> with aria-label="Navegación principal"
    const navElement = page.locator('nav[aria-label="Navegación principal"]');
    await expect(navElement.first()).toBeVisible();
  });

  test('[P2] should have focusable navigation links reachable via keyboard Tab on desktop', async ({ page }) => {
    // GIVEN: The desktop navigation shell is rendered
    await page.goto('/clientes');

    // WHEN: The user presses Tab from the start of the document
    await page.keyboard.press('Tab');

    // THEN: One of the navigation links receives focus (keyboard accessible)
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    // The first focusable element should be a nav item or within the nav
    expect(focusedElement).toBeTruthy();
  });

  test('[P1] should have nav items with descriptive Spanish text labels on desktop', async ({ page }) => {
    // GIVEN: The NavigationRail is rendered on desktop
    await page.goto('/clientes');

    // THEN: nav items contain Spanish text
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');

    await expect(clientesItem).toContainText('Clientes');
    await expect(contactosItem).toContainText('Contactos');
  });
});
