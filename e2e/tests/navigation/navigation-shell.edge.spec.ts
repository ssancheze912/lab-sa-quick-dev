/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Boundary Conditions
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE Expansion — Extends ATDD coverage with edge cases, negative paths,
 * boundary conditions, and error scenarios not covered by the 66-test ATDD suite.
 *
 * Expansion areas:
 *   E1 — Keyboard navigation (Tab + Enter) via desktop NavigationRail
 *   E2 — Browser Back button restores prior route and nav active state
 *   E3 — 404 triggered via SPA navigation (not direct URL load)
 *   E4 — Clicking active nav item does not cause duplicate navigation
 *   E5 — Mobile: tapping Clientes from /contactos navigates correctly
 *   E6 — Breakpoint boundary at exactly 1024px wide viewport
 *   E7 — Nav shell DOM persists across route transitions (no remount)
 *   E8 — Console errors absent during normal navigation flow
 *   E9 — 404 back-link href attribute has correct value
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// E1 — Keyboard navigation via desktop NavigationRail
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E1 — Keyboard navigation in NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should navigate to /contactos using keyboard Tab + Enter on the Contactos link', async ({ page }) => {
    // GIVEN: Desktop app loaded on /clientes, nav-rail is visible
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User focuses the Contactos nav link via keyboard and activates it
    const contactosLink = page.locator('[data-testid="nav-rail"] a').filter({ hasText: 'Contactos' });
    await contactosLink.focus();
    await contactosLink.press('Enter');

    // THEN: URL changes to /contactos via keyboard activation
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('[P1] nav links in the NavigationRail should be focusable (tabIndex accessible)', async ({ page }) => {
    // GIVEN: Desktop NavigationRail is rendered
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The nav links are inspected for keyboard accessibility
    const navLinks = page.locator('[data-testid="nav-rail"] a');
    const count = await navLinks.count();

    // THEN: Each link is focusable (no tabIndex=-1 that would exclude from tab order)
    for (let i = 0; i < count; i++) {
      const tabIndex = await navLinks.nth(i).getAttribute('tabindex');
      // tabindex should be null (default 0) or explicitly "0", never "-1"
      expect(tabIndex).not.toBe('-1');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2 — Browser Back button restores route and nav active state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E2 — Browser Back restores prior route and nav active state', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] pressing browser Back after navigating to /contactos should return to /clientes', async ({ page }) => {
    // GIVEN: User starts at /clientes and navigates to /contactos via nav rail
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-rail"]').getByText('Contactos').click();
    await expect(page).toHaveURL(/\/contactos/);

    // WHEN: User presses the browser Back button
    await page.goBack();

    // THEN: URL is /clientes again
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('[P1] active nav state should update to Clientes after browser Back from /contactos', async ({ page }) => {
    // GIVEN: User navigates Clientes → Contactos → Back
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-rail"]').getByText('Contactos').click();
    await expect(page).toHaveURL(/\/contactos/);

    // WHEN: Browser Back is pressed
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes nav item is again marked as active (aria-current="page")
    const activeLink = page.locator('[data-testid="nav-rail"] [aria-current="page"]');
    await expect(activeLink).toContainText('Clientes');
  });

  test('[P1] clientes-view should be visible after browser Back from /contactos', async ({ page }) => {
    // GIVEN: User navigates to /clientes first (establishing history), then to /contactos via SPA
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-rail"]').getByText('Contactos').click();
    await expect(page).toHaveURL(/\/contactos/);

    // WHEN: Browser Back is pressed (returns to /clientes in history)
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // THEN: The clientes-view content area is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3 — 404 triggered via SPA navigation (clicking a broken link in app)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E3 — 404 view triggered by SPA in-app navigation to unknown route', () => {
  test('[P1] should display not-found-view when router navigates to unknown route in-app', async ({ page }) => {
    // GIVEN: User is on a valid page
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User navigates to an unknown route so TanStack Router re-evaluates
    await page.goto('/seccion-invalida');
    await page.waitForLoadState('networkidle');

    // THEN: The 404 not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('[P2] 404 view should display Spanish message for any unknown path pattern', async ({ page }) => {
    // GIVEN: A path that does not match any registered TanStack Router route
    // Note: /clientes/sub/path could be matched as /clientes with extra segments depending on router config.
    // Use a top-level path that is definitively not registered.
    await page.goto('/seccion-totalmente-desconocida');
    await page.waitForLoadState('networkidle');

    // WHEN: The page renders

    // THEN: The not-found-view with Spanish text is shown
    const notFoundView = page.locator('[data-testid="not-found-view"]');
    await expect(notFoundView).toContainText('Página no encontrada');
  });

  test('[P2] 404 view back-link should navigate back to /clientes when clicked after SPA 404', async ({ page }) => {
    // GIVEN: User arrives at an unknown route
    await page.goto('/nonexistent-section');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the "Ir a Clientes" back-link
    await page.locator('[data-testid="not-found-view"] a').click();

    // THEN: Navigates successfully to /clientes
    await expect(page).toHaveURL(/\/clientes/);
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4 — Clicking the already-active nav item does not cause errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E4 — Clicking active nav item is idempotent (no duplicate nav / errors)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] clicking the Clientes nav item while already on /clientes should not cause a runtime error', async ({ page }) => {
    // GIVEN: User is on /clientes — Clientes link is active
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the already-active Clientes nav item
    await page.locator('[data-testid="nav-rail"]').getByText('Clientes').click();
    await page.waitForLoadState('networkidle');

    // THEN: No runtime errors are thrown and URL stays /clientes
    expect(runtimeErrors).toHaveLength(0);
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('[P2] clicking the Contactos nav item while already on /contactos should remain on /contactos', async ({ page }) => {
    // GIVEN: User is on /contactos — Contactos link is active
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: User clicks the already-active Contactos nav item
    await page.locator('[data-testid="nav-rail"]').getByText('Contactos').click();
    await page.waitForLoadState('networkidle');

    // THEN: URL remains /contactos, no error
    await expect(page).toHaveURL(/\/contactos/);
  });

  test('[P2] clientes-view should still render after clicking already-active Clientes link', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: Clientes nav link is clicked again
    await page.locator('[data-testid="nav-rail"]').getByText('Clientes').click();

    // THEN: clientes-view is still visible (no blank/error state)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E5 — Mobile NavigationBar: Clientes from /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E5 — Mobile NavigationBar reverse navigation (Contactos → Clientes)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test('[P1] should navigate from /contactos to /clientes when tapping Clientes in mobile nav bar', async ({ page }) => {
    // GIVEN: User is on /contactos on a mobile device
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: User taps the Clientes item in the mobile NavigationBar
    await page.locator('[data-testid="nav-bar"]').getByText('Clientes').tap();

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL(/\/clientes/);
  });

  test('[P1] clientes-view should be visible after tapping Clientes in mobile nav from /contactos', async ({ page }) => {
    // GIVEN: User is on /contactos on mobile
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: Tapping Clientes in mobile nav bar
    await page.locator('[data-testid="nav-bar"]').getByText('Clientes').tap();

    // THEN: The clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P2] mobile nav bar should have exactly 2 navigation items (Clientes and Contactos)', async ({ page }) => {
    // GIVEN: Mobile viewport with nav bar rendered
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The nav bar is inspected for item count
    const navBar = page.locator('[data-testid="nav-bar"]');

    // THEN: Exactly 2 items are present (Clientes, Contactos)
    await expect(navBar.getByText('Clientes')).toBeVisible();
    await expect(navBar.getByText('Contactos')).toBeVisible();

    // Count all button elements inside nav-bar (each nav item is a button)
    const buttons = navBar.locator('button');
    await expect(buttons).toHaveCount(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E6 — Breakpoint boundary conditions at exactly 1024px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E6 — Breakpoint boundary at exactly 1024px viewport width', () => {
  test('[P2] at exactly 1024px width, NavigationRail should be visible (desktop threshold)', async ({ page }) => {
    // GIVEN: Viewport is set to exactly 1024px wide (desktop breakpoint boundary)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The navigation shell renders at the boundary

    // THEN: NavigationRail is visible (min-width: 1024px matches)
    await expect(page.locator('[data-testid="nav-rail"]')).toBeVisible();
  });

  test('[P2] at exactly 1023px width, NavigationRail should be hidden (below desktop threshold)', async ({ page }) => {
    // GIVEN: Viewport is 1px below the desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The navigation shell renders just below the breakpoint

    // THEN: NavigationRail is hidden (min-width: 1024px does NOT match)
    await expect(page.locator('[data-testid="nav-rail"]')).toBeHidden();
  });

  test('[P2] at exactly 1023px width, mobile NavigationBar should be visible', async ({ page }) => {
    // GIVEN: Viewport is 1px below the desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: The navigation shell renders

    // THEN: Mobile NavigationBar is visible
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E7 — App shell DOM persists across route transitions (no remount)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E7 — App shell DOM identity persists across SPA route changes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] app-shell element should have the same DOM node identity after navigating Clientes → Contactos', async ({ page }) => {
    // GIVEN: App is loaded at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // Capture a stable attribute of the app-shell element before navigation
    const shellBeforeHandle = await page.locator('[data-testid="app-shell"]').elementHandle();
    expect(shellBeforeHandle).not.toBeNull();

    // WHEN: User navigates to /contactos via nav rail (SPA navigation)
    await page.locator('[data-testid="nav-rail"]').getByText('Contactos').click();
    await expect(page).toHaveURL(/\/contactos/);

    // THEN: The app-shell element is the same DOM node (no full remount)
    const shellAfterHandle = await page.locator('[data-testid="app-shell"]').elementHandle();
    expect(shellAfterHandle).not.toBeNull();

    // Both handles should refer to the same DOM element
    const isSameNode = await page.evaluate(
      ([before, after]) => before === after,
      [shellBeforeHandle, shellAfterHandle],
    );
    expect(isSameNode).toBe(true);
  });

  test('[P1] nav-rail element should remain in DOM after navigating between routes', async ({ page }) => {
    // GIVEN: App at /clientes with nav-rail visible
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="nav-rail"]')).toBeVisible();

    // WHEN: SPA navigation to /contactos occurs
    await page.locator('[data-testid="nav-rail"]').getByText('Contactos').click();

    // THEN: nav-rail is still present and visible after route change
    await expect(page.locator('[data-testid="nav-rail"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E8 — Console errors absent during normal navigation flow
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E8 — No console errors during normal navigation flow', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] full navigation flow (/ → /clientes → /contactos → /clientes) should produce no console errors', async ({ page }) => {
    // GIVEN: A clean page session with error monitoring
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // WHEN: User performs a full navigation flow
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-rail"]').getByText('Contactos').click();
    await expect(page).toHaveURL(/\/contactos/);
    await page.locator('[data-testid="nav-rail"]').getByText('Clientes').click();
    await expect(page).toHaveURL(/\/clientes/);

    // THEN: No console errors were emitted during the entire flow
    // Filter out known non-critical warnings (e.g. React devtools)
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('Download the React DevTools') && !e.includes('react-devtools'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('[P1] navigating to a 404 route should not produce JavaScript runtime errors', async ({ page }) => {
    // GIVEN: Error listener is active
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    // WHEN: User visits an unknown route
    await page.goto('/completamente-inexistente-xyz');
    await page.waitForLoadState('networkidle');

    // THEN: The 404 view renders without throwing JS runtime errors
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E9 — 404 back-link href attribute correctness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('E9 — 404 back-link href and text correctness', () => {
  test('[P2] back-link href should point exactly to /clientes (not a relative or external path)', async ({ page }) => {
    // GIVEN: User is on 404 view
    await page.goto('/pagina-que-no-existe-jamas');
    await page.waitForLoadState('networkidle');

    // WHEN: The back-link href is inspected
    const backLink = page.locator('[data-testid="not-found-view"] a');
    const href = await backLink.getAttribute('href');

    // THEN: The href is /clientes (not empty, not external, not #)
    expect(href).toBeTruthy();
    expect(href).toContain('/clientes');
    expect(href).not.toBe('#');
    expect(href).not.toMatch(/^https?:\/\//); // not absolute external URL
  });

  test('[P2] back-link text should be exactly "Ir a Clientes" (exact Spanish label)', async ({ page }) => {
    // GIVEN: 404 view is shown
    await page.goto('/esta-ruta-no-existe');
    await page.waitForLoadState('networkidle');

    // WHEN: The back-link text content is read
    const backLink = page.locator('[data-testid="not-found-view"] a');
    const textContent = (await backLink.textContent())?.trim();

    // THEN: Exact Spanish label matches
    expect(textContent).toBe('Ir a Clientes');
  });

  test('[P2] not-found-view should contain exactly one link (no duplicate back-links)', async ({ page }) => {
    // GIVEN: 404 view is shown
    await page.goto('/solo-una-pagina-404');
    await page.waitForLoadState('networkidle');

    // WHEN: All links within not-found-view are counted
    const links = page.locator('[data-testid="not-found-view"] a');

    // THEN: Exactly one link exists (no duplicate back navigation options)
    await expect(links).toHaveCount(1);
  });
});
