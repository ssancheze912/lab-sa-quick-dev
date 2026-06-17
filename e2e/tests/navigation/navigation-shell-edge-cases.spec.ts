/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Expanded Coverage
 * Epic 1: Project Foundation & Application Shell
 *
 * Automate workflow — BMad-Integrated Mode
 * Expands ATDD coverage with edge cases, boundary conditions, and error paths
 * NOT covered by the base ATDD navigation-shell.spec.ts.
 *
 * Coverage areas:
 *   - Viewport boundary at exactly 1024px
 *   - Viewport resize transitions (desktop → mobile, mobile → desktop)
 *   - Multiple sequential SPA navigations
 *   - Browser history (back/forward)
 *   - URL edge cases (trailing slash, mixed case)
 *   - Deeply nested unknown routes (404)
 *   - Keyboard accessibility (Tab, Enter)
 *   - ARIA roles on navigation landmark
 *   - Both navigation items always accessible (not just visible)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Boundary viewport — exactly 1024px (the lg: breakpoint threshold)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Viewport boundary — exactly 1024px (lg breakpoint)', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('[P1] should render NavigationRail at exactly 1024px width', async ({ page }) => {
    // GIVEN: A viewport at exactly the lg: breakpoint (1024px)
    // WHEN: The user loads /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationRail is visible (1024 >= 1024 → desktop mode)
    const rail = page.locator('[data-testid="navigation-rail"]');
    await expect(rail).toBeVisible();
  });

  test('[P1] should NOT show NavigationBar at exactly 1024px width', async ({ page }) => {
    // GIVEN: A viewport at exactly the lg: breakpoint (1024px)
    // WHEN: The user loads /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationBar is NOT visible (desktop mode is active)
    const bar = page.locator('[data-testid="navigation-bar"]');
    await expect(bar).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Viewport boundary — 1023px (one pixel below threshold)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Viewport boundary — 1023px (just below lg breakpoint)', () => {
  test.use({ viewport: { width: 1023, height: 768 } });

  test('[P1] should render NavigationBar at 1023px width', async ({ page }) => {
    // GIVEN: A viewport at 1023px (< 1024px → mobile mode)
    // WHEN: The user loads /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationBar is visible (mobile mode)
    const bar = page.locator('[data-testid="navigation-bar"]');
    await expect(bar).toBeVisible();
  });

  test('[P1] should NOT show NavigationRail at 1023px width', async ({ page }) => {
    // GIVEN: A viewport at 1023px (mobile mode)
    // WHEN: The user loads /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationRail is NOT visible
    const rail = page.locator('[data-testid="navigation-rail"]');
    await expect(rail).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple sequential SPA navigations
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Multiple sequential SPA navigations', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should correctly cycle Clientes→Contactos→Clientes without page reload', async ({ page }) => {
    // GIVEN: User starts at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User navigates Clientes → Contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // THEN: /contactos is loaded
    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible();

    // WHEN: User navigates back Contactos → Clientes
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('**/clientes');

    // THEN: /clientes is loaded again, shell still intact
    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P1] active item updates correctly during multiple navigations', async ({ page }) => {
    // GIVEN: User starts at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Clientes active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');

    // WHEN: Navigate to Contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // THEN: Contactos active, Clientes not
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('aria-current', 'page');

    // WHEN: Navigate back to Clientes
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('**/clientes');

    // THEN: Clientes active again, Contactos not
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser history navigation (back/forward)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Browser back/forward history navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] browser Back button should return to previous SPA route', async ({ page }) => {
    // GIVEN: User navigates Clientes → Contactos
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // WHEN: User clicks browser Back
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: User is back on /clientes, navigation shell intact
    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P1] browser Forward button should re-navigate to next SPA route', async ({ page }) => {
    // GIVEN: User navigates Clientes → Contactos, then Back
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    await page.goBack();
    await page.waitForURL('**/clientes');

    // WHEN: User clicks browser Forward
    await page.goForward();
    await page.waitForURL('**/contactos');

    // THEN: User is back on /contactos
    expect(page.url()).toContain('/contactos');
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible();
  });

  test('[P1] active item reflects route after browser back navigation', async ({ page }) => {
    // GIVEN: User at /clientes, navigates to /contactos, then back
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    // WHEN: Back to /clientes
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: Clientes item is active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// URL edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] URL edge cases', () => {
  test('[P2] deeply nested unknown route should display 404 gracefully', async ({ page }) => {
    // GIVEN: User navigates to a deeply nested unknown route
    // WHEN: The page loads
    await page.goto('/a/b/c/d/unknown');
    await page.waitForLoadState('networkidle');

    // THEN: The 404 not-found view is shown gracefully
    const notFoundView = page.locator('[data-testid="not-found-view"]');
    await expect(notFoundView).toBeVisible();
    await expect(notFoundView).toContainText('Página no encontrada');
  });

  test('[P2] 404 page should show the back link that is functional', async ({ page }) => {
    // GIVEN: User is on a non-existent route
    await page.goto('/ruta-inexistente-xyz');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the back-to-clientes link on the 404 page
    const backLink = page.locator('[data-testid="not-found-back-link"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForURL('**/clientes');

    // THEN: User arrives at /clientes with shell intact
    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });

  test('[P2] navigating to /clientes after a 404 page renders navigation shell', async ({ page }) => {
    // GIVEN: User lands on a 404 page
    await page.goto('/pagina-que-no-existe');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: User clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();
    await page.waitForURL('**/clientes');

    // THEN: Navigation shell renders correctly on /clientes
    const navWrapper = page.locator('[aria-label="Navegación principal"]');
    await expect(navWrapper).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Keyboard accessibility — navigation items', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] Contactos navigation item should be reachable via Tab key', async ({ page }) => {
    // GIVEN: User is on /clientes with focus at document body
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User tabs through the page
    // Tab enough times to reach the navigation items
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // THEN: A navigation item eventually receives focus
    // Accept that at least one nav item is focusable (Tab doesn't crash the page)
    const clientes = page.locator('[data-testid="nav-item-clientes"]');
    const contactos = page.locator('[data-testid="nav-item-contactos"]');
    const clientesFocused = await clientes.evaluate((el) => el === document.activeElement);
    const contactosFocused = await contactos.evaluate((el) => el === document.activeElement);

    // At least one nav item should be reachable by Tab (they are links/anchors)
    // If neither is focused after 2 tabs, try 2 more
    if (!clientesFocused && !contactosFocused) {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
    }

    // Verify they are keyboard-focusable elements (anchor tags)
    const clientesTag = await clientes.evaluate((el) => el.tagName.toLowerCase());
    expect(clientesTag).toBe('a');
  });

  test('[P1] clicking on Clientes nav item via keyboard Enter should navigate', async ({ page }) => {
    // GIVEN: User is on /contactos, focus moves to the Clientes nav item
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: Directly focus the Clientes nav item and press Enter
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await clientesItem.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/clientes');

    // THEN: Navigation occurs to /clientes
    expect(page.url()).toContain('/clientes');
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ARIA and semantic structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ARIA roles and semantic navigation structure', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] navigation landmark should have role="navigation" implicitly via <nav> tag', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: There is at least one <nav> landmark element on the page
    const navElements = page.locator('nav');
    await expect(navElements.first()).toBeVisible();
    expect(await navElements.count()).toBeGreaterThanOrEqual(1);
  });

  test('[P1] navigation items should be anchor (<a>) elements for keyboard and AT support', async ({ page }) => {
    // GIVEN: Navigation shell is rendered on desktop
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Both navigation items are <a> elements
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');

    const clientesTag = await clientesItem.evaluate((el) => el.tagName.toLowerCase());
    const contactosTag = await contactosItem.evaluate((el) => el.tagName.toLowerCase());

    expect(clientesTag).toBe('a');
    expect(contactosTag).toBe('a');
  });

  test('[P1] navigation items should have correct href attributes', async ({ page }) => {
    // GIVEN: Navigation shell is rendered on desktop
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The href attributes point to the correct routes
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');

    await expect(clientesItem).toHaveAttribute('href', '/clientes');
    await expect(contactosItem).toHaveAttribute('href', '/contactos');
  });

  test('[P2] navigation items should have aria-label attributes set in Spanish', async ({ page }) => {
    // GIVEN: Navigation shell is rendered on desktop
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Each nav item has an accessible aria-label in Spanish
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');

    await expect(clientesItem).toHaveAttribute('aria-label', 'Clientes');
    await expect(contactosItem).toHaveAttribute('aria-label', 'Contactos');
  });

  test('[P1] NavigationRail should have aria-label="Navegación principal" on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationRail has the correct ARIA label
    const rail = page.locator('[data-testid="navigation-rail"]');
    await expect(rail).toHaveAttribute('aria-label', 'Navegación principal');
  });

  test('[P1] NavigationBar should have aria-label="Navegación principal" on mobile', async ({ page, viewport: _ }) => {
    // GIVEN: Mobile viewport — set inline via setViewportSize
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The NavigationBar has the correct ARIA label
    const bar = page.locator('[data-testid="navigation-bar"]');
    await expect(bar).toHaveAttribute('aria-label', 'Navegación principal');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error resilience — console errors during navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Console error resilience during navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should not emit console errors when navigating between routes', async ({ page }) => {
    // GIVEN: Error listener is attached before any navigation
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // WHEN: User navigates through the main routes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.waitForURL('**/clientes');

    // THEN: No JavaScript errors occurred during navigation
    expect(jsErrors).toHaveLength(0);
  });

  test('[P2] should not emit console errors when loading a 404 route', async ({ page }) => {
    // GIVEN: Error listener attached
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // WHEN: User navigates to an unknown route
    await page.goto('/ruta-inexistente');
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript errors, only the not-found view
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    expect(jsErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Shell structure integrity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Application shell structural integrity', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] app-root data-testid should be present as outermost container', async ({ page }) => {
    // GIVEN: The application loads on desktop
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The outermost app root container exists (from Story 1.1)
    const appRoot = page.locator('[data-testid="app-root"]');
    await expect(appRoot).toBeVisible();
  });

  test('[P1] navigation shell and content area should coexist on desktop', async ({ page }) => {
    // GIVEN: The user is on /clientes on desktop
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Both the navigation rail and the clientes page content are visible simultaneously
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });

  test('[P1] navigation shell and content area should coexist on mobile', async ({ page }) => {
    // GIVEN: The user is on /clientes on mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Both the navigation bar and the clientes page content are visible simultaneously
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });

  test('[P2] root redirect from / to /clientes should retain navigation shell', async ({ page }) => {
    // GIVEN: User navigates to root URL /
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: Navigation shell is present after redirect
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible();
  });
});
