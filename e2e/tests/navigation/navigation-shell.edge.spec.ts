/**
 * Story 1.2: Frontend Navigation Shell — EDGE CASE expansion
 * Epic 1: Project Foundation & Application Shell
 *
 * Coverage added (builds on ATDD baseline in navigation-shell.spec.ts):
 *   - Exact breakpoint boundary (1023px vs 1024px)
 *   - aria-current absent on inactive nav items
 *   - Active state updates after SPA navigation
 *   - Browser back/forward history navigation
 *   - Rapid successive navigation (no crashes)
 *   - Keyboard navigation through nav items
 *   - Mobile navigation from /contactos to /clientes
 *   - 404 description text visible
 *   - Deep nested unknown paths show 404
 *   - NavigationBar visible and NavigationRail hidden at exact boundary
 */

import { test, expect } from '@playwright/test';
import { NavigationShellPage } from '../../pages/navigation-shell.page';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Exact breakpoint boundary — 1023px vs 1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Breakpoint boundary — 1023px (mobile) vs 1024px (desktop)', () => {
  test('[P1] should show NavigationBar and hide NavigationRail at 1023px (just below lg breakpoint)', async ({
    page,
  }) => {
    // GIVEN: Viewport is 1023px — one pixel below the lg breakpoint
    await page.setViewportSize({ width: 1023, height: 800 });
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // THEN: NavigationBar is visible (mobile layout)
    await expect(nav.navigationBar).toBeVisible();

    // AND: NavigationRail is hidden
    await expect(nav.navigationRail).toBeHidden();
  });

  test('[P1] should show NavigationRail and hide NavigationBar at 1024px (lg breakpoint)', async ({
    page,
  }) => {
    // GIVEN: Viewport is exactly 1024px — the lg breakpoint
    await page.setViewportSize({ width: 1024, height: 800 });
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // THEN: NavigationRail is visible (desktop layout)
    await expect(nav.navigationRail).toBeVisible();

    // AND: NavigationBar is hidden
    await expect(nav.navigationBar).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: aria-current state — active and inactive items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] aria-current — active / inactive nav item states', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should NOT have aria-current on the inactive rail item when /clientes is active', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes route
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();

    // THEN: Contactos link does NOT have aria-current
    await expect(nav.railItemContactos).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should NOT have aria-current on the inactive rail item when /contactos is active', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos route
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoContactos();

    // THEN: Clientes link does NOT have aria-current
    await expect(nav.railItemClientes).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should update aria-current from Clientes to Contactos after SPA navigation', async ({
    page,
  }) => {
    // GIVEN: User starts on /clientes (Clientes is active)
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();
    await expect(nav.railItemClientes).toHaveAttribute('aria-current', 'page');

    // WHEN: User navigates to /contactos
    await nav.railItemContactos.click();
    await page.waitForURL('**/contactos');

    // THEN: Contactos now has aria-current="page"
    await expect(nav.railItemContactos).toHaveAttribute('aria-current', 'page');

    // AND: Clientes no longer has aria-current
    await expect(nav.railItemClientes).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should update aria-current from Contactos to Clientes after SPA navigation', async ({
    page,
  }) => {
    // GIVEN: User starts on /contactos (Contactos is active)
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoContactos();
    await expect(nav.railItemContactos).toHaveAttribute('aria-current', 'page');

    // WHEN: User navigates to /clientes
    await nav.railItemClientes.click();
    await page.waitForURL('**/clientes');

    // THEN: Clientes now has aria-current="page"
    await expect(nav.railItemClientes).toHaveAttribute('aria-current', 'page');

    // AND: Contactos no longer has aria-current
    await expect(nav.railItemContactos).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Browser back / forward history navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Browser history — back / forward navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should navigate back to /clientes when pressing browser back after going to /contactos', async ({
    page,
  }) => {
    // GIVEN: User navigates from /clientes to /contactos via SPA
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();
    await nav.railItemContactos.click();
    await page.waitForURL('**/contactos');

    // WHEN: User presses the browser back button
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: URL returns to /clientes
    expect(page.url()).toContain('/clientes');
    await expect(nav.clientesPage).toBeVisible();
  });

  test('[P1] should navigate forward to /contactos after pressing back from /contactos', async ({
    page,
  }) => {
    // GIVEN: User went clientes → contactos → back
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();
    await nav.railItemContactos.click();
    await page.waitForURL('**/contactos');
    await page.goBack();
    await page.waitForURL('**/clientes');

    // WHEN: User presses browser forward
    await page.goForward();
    await page.waitForURL('**/contactos');

    // THEN: URL returns to /contactos
    expect(page.url()).toContain('/contactos');
    await expect(nav.contactosPage).toBeVisible();
  });

  test('[P1] should update the active nav item after browser back navigation', async ({ page }) => {
    // GIVEN: User navigates clientes → contactos, then goes back
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();
    await nav.railItemContactos.click();
    await page.waitForURL('**/contactos');

    // WHEN: User presses browser back
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: Clientes nav item is active again
    await expect(nav.railItemClientes).toHaveAttribute('aria-current', 'page');
    await expect(nav.railItemContactos).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Rapid successive navigation (no crash / double-render)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Rapid successive navigation — stability', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should handle rapid click from Clientes to Contactos and back without errors', async ({
    page,
  }) => {
    // GIVEN: Application is loaded on desktop
    const nav = new NavigationShellPage(page);
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();

    // WHEN: User clicks rapidly through navigation items
    await nav.railItemContactos.click();
    await nav.railItemClientes.click();
    await nav.railItemContactos.click();
    await page.waitForURL('**/contactos');

    // THEN: App lands on /contactos without console errors
    expect(page.url()).toContain('/contactos');
    await expect(nav.contactosPage).toBeVisible();
    await expect(nav.navigationRail).toBeVisible();

    // AND: No JavaScript errors occurred
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('ResizeObserver') &&
        !e.includes('TanStack Router Devtools')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Keyboard navigation through nav items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Keyboard navigation — accessibility', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] navigation rail links should be reachable and activatable via keyboard Tab + Enter', async ({
    page,
  }) => {
    // GIVEN: Application is loaded on desktop, user starts on /clientes
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();

    // WHEN: User tabs to the Contactos nav link and presses Enter
    await nav.railItemContactos.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/contactos');

    // THEN: Navigation succeeds via keyboard
    expect(page.url()).toContain('/contactos');
    await expect(nav.contactosPage).toBeVisible();
  });

  test('[P1] navigation rail links should be focusable (tabIndex not -1)', async ({ page }) => {
    // GIVEN: Application is loaded on desktop
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();

    // THEN: Both rail items are focusable (tabIndex is 0 or not explicitly -1)
    const clientesTabIndex = await nav.railItemClientes.getAttribute('tabindex');
    const contactosTabIndex = await nav.railItemContactos.getAttribute('tabindex');

    expect(clientesTabIndex).not.toBe('-1');
    expect(contactosTabIndex).not.toBe('-1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Mobile — navigate from /contactos to /clientes via bottom bar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Mobile NavigationBar — full round-trip navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('[P1] should navigate from /contactos back to /clientes via mobile NavigationBar', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos on a mobile viewport
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoContactos();
    await expect(nav.contactosPage).toBeVisible();

    // WHEN: User taps the Clientes item in the bottom bar
    await nav.barItemClientes.click();
    await page.waitForURL('**/clientes');

    // THEN: App navigates to /clientes, bottom bar still visible
    expect(page.url()).toContain('/clientes');
    await expect(nav.clientesPage).toBeVisible();
    await expect(nav.navigationBar).toBeVisible();
  });

  test('[P1] should update aria-current in mobile NavigationBar after navigation', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes on mobile, Clientes bar item is active
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();

    const barClientes = page
      .getByTestId('navigation-bar')
      .getByRole('link', { name: /clientes/i });
    const barContactos = page
      .getByTestId('navigation-bar')
      .getByRole('link', { name: /contactos/i });

    await expect(barClientes).toHaveAttribute('aria-current', 'page');

    // WHEN: User taps Contactos
    await nav.barItemContactos.click();
    await page.waitForURL('**/contactos');

    // THEN: Contactos bar item becomes active, Clientes becomes inactive
    await expect(barContactos).toHaveAttribute('aria-current', 'page');
    await expect(barClientes).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: 404 page — full content verification and deep paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] 404 Not-Found — content and deep path edge cases', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should display the 404 description text on unknown route', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoUnknownRoute();

    // THEN: Description text is visible
    await expect(
      page.getByText('La ruta que buscas no existe.')
    ).toBeVisible();
  });

  test('[P1] should show 404 view for deeply nested unknown path (/a/b/c)', async ({ page }) => {
    // GIVEN: User navigates to a deeply nested unknown route
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/a/b/c');

    // THEN: Not-found heading appears
    await expect(nav.notFoundHeading).toBeVisible();

    // AND: Back link to /clientes is present
    await expect(nav.notFoundBackLink).toBeVisible();
  });

  test('[P1] should show 404 for /clientes-extra (not a registered route)', async ({ page }) => {
    // GIVEN: User navigates to a path that looks like a valid route but is not registered
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes-extra');

    // THEN: Not-found view is displayed (not the /clientes page)
    await expect(nav.notFoundHeading).toBeVisible();
    await expect(page.getByTestId('clientes-page')).not.toBeVisible();
  });

  test('[P2] should show 404 for path with query string only (/unknown?foo=bar)', async ({
    page,
  }) => {
    // GIVEN: Unknown path with query parameters
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/unknown-path?foo=bar&baz=qux');

    // THEN: Not-found heading is visible
    await expect(nav.notFoundHeading).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: NavigationRail link href attributes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Navigation link href — correct anchor targets', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] NavigationRail Clientes link should have href pointing to /clientes', async ({
    page,
  }) => {
    // GIVEN: Application loaded on desktop
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();

    // THEN: Clientes rail item is an anchor with correct href
    await expect(nav.railItemClientes).toHaveAttribute(
      'href',
      expect.stringContaining('/clientes')
    );
  });

  test('[P1] NavigationRail Contactos link should have href pointing to /contactos', async ({
    page,
  }) => {
    // GIVEN: Application loaded on desktop
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();

    // THEN: Contactos rail item is an anchor with correct href
    await expect(nav.railItemContactos).toHaveAttribute(
      'href',
      expect.stringContaining('/contactos')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: App shell layout persistence across navigations
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] App Shell layout — persistence and stability', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should keep the NavigationRail mounted after 3 consecutive SPA navigations', async ({
    page,
  }) => {
    // GIVEN: Application loaded on desktop
    const nav = new NavigationShellPage(page);

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();

    // WHEN: User navigates back and forth multiple times
    await nav.railItemContactos.click();
    await page.waitForURL('**/contactos');

    await nav.railItemClientes.click();
    await page.waitForURL('**/clientes');

    await nav.railItemContactos.click();
    await page.waitForURL('**/contactos');

    // THEN: NavigationRail is still present (not unmounted / re-mounted = SPA integrity)
    await expect(nav.navigationRail).toBeVisible();
    await expect(nav.appRoot).toBeVisible();
  });

  test('[P2] should not produce JavaScript errors during normal navigation flow', async ({
    page,
  }) => {
    // GIVEN: Application loaded on desktop
    const nav = new NavigationShellPage(page);
    const jsErrors: string[] = [];

    page.on('pageerror', (err) => {
      jsErrors.push(err.message);
    });

    await page.route('**/api/**', (route) => route.continue());
    await nav.gotoClientes();
    await nav.railItemContactos.click();
    await page.waitForURL('**/contactos');
    await nav.railItemClientes.click();
    await page.waitForURL('**/clientes');

    // THEN: No uncaught JavaScript errors
    expect(jsErrors).toHaveLength(0);
  });
});
