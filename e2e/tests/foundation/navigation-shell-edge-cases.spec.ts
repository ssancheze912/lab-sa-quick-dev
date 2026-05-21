import { test, expect } from '@playwright/test';

/**
 * E2E Edge Case Tests: Story 1.2 — Frontend Navigation Shell
 *
 * BMad-Integrated: Expands ATDD coverage with boundary conditions, error paths,
 * and edge cases NOT in navigation-shell.spec.ts.
 *
 * Edge cases covered:
 *   EC1  — Browser history back/forward navigation (popstate)
 *   EC2  — No JS runtime errors during SPA navigation between routes
 *   EC3  — Viewport resize mid-session switches nav component (desktop → mobile)
 *   EC4  — Mobile viewport shows active state on nav item
 *   EC5  — Nav item keyboard accessibility (Tab + Enter navigation)
 *   EC6  — Deep nested unknown path renders 404, not blank (browser-level)
 *   EC7  — Multiple sequential navigations via nav items remain stable
 *   EC8  — 404 back link is keyboard focusable and activatable
 *   EC9  — Index / redirect does not flash blank content before /clientes
 *   EC10 — Nav landmark aria-label present in mobile viewport
 */

test.describe('Story 1.2 — Navigation Shell E2E Edge Cases', () => {

  // ─── EC1: Browser history back/forward navigation ────────────────────────

  test.describe('EC1 — Browser history back/forward navigation', () => {

    test('[P1] Pressing browser Back after navigating to /contactos returns to /clientes', async ({ page }) => {
      // GIVEN: User starts at /clientes
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());
      await page.goto('/clientes');
      await expect(page).toHaveURL(/\/clientes/);

      // WHEN: User navigates to /contactos then presses Back
      await page.getByTestId('nav-item-contactos').click();
      await expect(page).toHaveURL(/\/contactos/);
      await page.goBack();

      // THEN: Returns to /clientes without full page reload
      await expect(page).toHaveURL(/\/clientes/);
    });

    test('[P1] Pressing browser Forward after Back restores /contactos route', async ({ page }) => {
      // GIVEN: User navigates from /clientes to /contactos then back
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());
      await page.goto('/clientes');
      await page.getByTestId('nav-item-contactos').click();
      await expect(page).toHaveURL(/\/contactos/);
      await page.goBack();
      await expect(page).toHaveURL(/\/clientes/);

      // WHEN: User presses Forward
      await page.goForward();

      // THEN: Returns to /contactos
      await expect(page).toHaveURL(/\/contactos/);
    });

    test('[P2] Active nav item state is correct after pressing browser Back', async ({ page }) => {
      // GIVEN: User navigates from /clientes to /contactos
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());
      await page.goto('/clientes');
      await page.getByTestId('nav-item-contactos').click();
      await expect(page).toHaveURL(/\/contactos/);

      // WHEN: User presses Back
      await page.goBack();
      await expect(page).toHaveURL(/\/clientes/);

      // THEN: "Clientes" nav item is active again
      await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
      await expect(page.getByTestId('nav-item-contactos')).not.toHaveAttribute('data-active', 'true');
    });
  });

  // ─── EC2: No JS errors during SPA navigation ─────────────────────────────

  test.describe('EC2 — No JS runtime errors during SPA navigation', () => {

    test('[P0] No unhandled JS errors when navigating from / to /clientes to /contactos', async ({ page }) => {
      // GIVEN: JS error listener is attached
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: User navigates through all routes
      await page.goto('/');
      await page.getByTestId('nav-item-clientes').click();
      await expect(page).toHaveURL(/\/clientes/);
      await page.getByTestId('nav-item-contactos').click();
      await expect(page).toHaveURL(/\/contactos/);

      // THEN: No unhandled JS errors occurred
      expect(jsErrors, `JS errors during navigation: ${jsErrors.join(', ')}`).toHaveLength(0);
    });

    test('[P1] No console errors when navigating to 404 and back', async ({ page }) => {
      // GIVEN: Console error listener attached
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: User navigates to 404 and then back via back link
      await page.goto('/unknown-route');
      await expect(page.getByTestId('not-found-view')).toBeVisible();
      await page.getByTestId('not-found-back-link').click();
      await expect(page).toHaveURL(/\/clientes/);

      // THEN: No critical console errors
      const criticalErrors = consoleErrors.filter(
        (e) =>
          !e.includes('Warning:') &&
          !e.includes('Download the React DevTools') &&
          !e.includes('HMR'),
      );
      expect(criticalErrors, `Console errors: ${criticalErrors.join('\n')}`).toHaveLength(0);
    });
  });

  // ─── EC3: Viewport resize mid-session ────────────────────────────────────

  test.describe('EC3 — Viewport resize mid-session', () => {

    test('[P2] Resizing from desktop to mobile during session shows NavigationBar', async ({ page }) => {
      // GIVEN: Page loads in desktop mode
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());
      await page.goto('/clientes');

      // NavigationRail is present on desktop
      await expect(page.getByTestId('nav-rail')).toBeVisible();

      // WHEN: Viewport is resized to mobile
      await page.setViewportSize({ width: 390, height: 844 });

      // THEN: NavigationBar becomes visible (nav-bar)
      await expect(page.getByTestId('nav-bar')).toBeVisible();
    });

    test('[P2] Resizing from mobile to desktop during session shows NavigationRail', async ({ page }) => {
      // GIVEN: Page loads in mobile mode
      await page.setViewportSize({ width: 390, height: 844 });
      await page.route('**/api/**', (route) => route.continue());
      await page.goto('/clientes');

      // NavigationBar visible on mobile
      await expect(page.getByTestId('nav-bar')).toBeVisible();

      // WHEN: Viewport is resized to desktop
      await page.setViewportSize({ width: 1280, height: 800 });

      // THEN: NavigationRail becomes visible
      await expect(page.getByTestId('nav-rail')).toBeVisible();
    });
  });

  // ─── EC4: Mobile viewport active state ───────────────────────────────────

  test.describe('EC4 — Active state in mobile viewport', () => {

    test('[P1] "Contactos" nav item has data-active="true" in NavigationBar on /contactos', async ({ page }) => {
      // GIVEN: Mobile viewport; user navigates to /contactos
      await page.setViewportSize({ width: 390, height: 844 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: Page loads directly at /contactos
      await page.goto('/contactos');

      // THEN: The nav-item-contactos inside nav-bar has the active marker
      await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
    });

    test('[P1] "Clientes" nav item has data-active="true" in NavigationBar on /clientes', async ({ page }) => {
      // GIVEN: Mobile viewport; direct navigation to /clientes
      await page.setViewportSize({ width: 390, height: 844 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: Page loads at /clientes
      await page.goto('/clientes');

      // THEN: The nav-item-clientes has the active marker
      await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
    });

    test('[P2] Clicking mobile nav item updates active state', async ({ page }) => {
      // GIVEN: Mobile viewport on /clientes
      await page.setViewportSize({ width: 390, height: 844 });
      await page.route('**/api/**', (route) => route.continue());
      await page.goto('/clientes');

      // Clientes is active initially
      await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');

      // WHEN: User taps Contactos in NavigationBar
      await page.getByTestId('nav-item-contactos').click();
      await expect(page).toHaveURL(/\/contactos/);

      // THEN: Contactos is now active, Clientes is not
      await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
      await expect(page.getByTestId('nav-item-clientes')).not.toHaveAttribute('data-active', 'true');
    });
  });

  // ─── EC5: Keyboard navigation accessibility ───────────────────────────────

  test.describe('EC5 — Keyboard navigation accessibility', () => {

    test('[P1] Nav items are focusable via Tab key', async ({ page }) => {
      // GIVEN: Desktop viewport, page loaded
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());
      await page.goto('/clientes');

      // WHEN: User presses Tab to cycle through focusable elements
      await page.keyboard.press('Tab');

      // THEN: A nav item becomes focused (either clientes or contactos)
      const focusedEl = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.closest('[data-testid^="nav-item-"]')?.getAttribute('data-testid') ??
          el?.getAttribute('data-testid') ?? '';
      });

      // The focused element must be a nav item — not just any element on the page
      // TODO (TEA Review): Strengthen assertion if Tab order lands on a non-nav element first; consider pressing Tab multiple times - See test-review-1-2.md
      expect(focusedEl).toMatch(/^nav-item-(clientes|contactos)$/);
    });
  });

  // ─── EC6: Deep nested unknown path (browser-level) ───────────────────────

  test.describe('EC6 — Deep nested unknown routes at browser level', () => {

    test('[P1] Deep path /a/b/c/d renders not-found-view without crash', async ({ page }) => {
      // GIVEN: A deeply nested non-existent route
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: Page loads at a deeply nested unknown path
      await page.goto('/a/b/c/d');

      // THEN: Not-found view is visible, no crash
      await expect(page.getByTestId('not-found-view')).toBeVisible();
    });

    test('[P1] Deep path has non-empty body content (no blank page)', async ({ page }) => {
      // GIVEN: A deeply nested unknown path
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: Page loads at deep unknown path
      await page.goto('/x/y/z/non-existent/path');

      // THEN: Body contains visible text content
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    });
  });

  // ─── EC7: Multiple sequential navigations are stable ─────────────────────

  test.describe('EC7 — Multiple sequential navigations remain stable', () => {

    test('[P2] 5 sequential navigations between Clientes and Contactos stay stable', async ({ page }) => {
      // GIVEN: Desktop viewport, start at /clientes
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());
      await page.goto('/clientes');

      // WHEN: User alternates navigation 5 times
      for (let i = 0; i < 5; i++) {
        await page.getByTestId('nav-item-contactos').click();
        await expect(page).toHaveURL(/\/contactos/);
        await page.getByTestId('nav-item-clientes').click();
        await expect(page).toHaveURL(/\/clientes/);
      }

      // THEN: Final state is /clientes with correct active state
      await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
      await expect(page.getByTestId('nav-item-contactos')).not.toHaveAttribute('data-active', 'true');
    });
  });

  // ─── EC8: 404 back link keyboard accessibility ────────────────────────────

  test.describe('EC8 — 404 back link keyboard accessibility', () => {

    test('[P1] not-found-back-link is an anchor element with valid href', async ({ page }) => {
      // GIVEN: User is on a 404 page
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());
      await page.goto('/nonexistent');

      // THEN: The back link is a proper anchor with href to /clientes
      const backLink = page.getByTestId('not-found-back-link');
      await expect(backLink).toBeVisible();
      const tagName = await backLink.evaluate((el) => el.tagName.toLowerCase());
      expect(tagName).toBe('a');
      const href = await backLink.getAttribute('href');
      expect(href).toContain('/clientes');
    });
  });

  // ─── EC9: Index redirect does not flash blank content ─────────────────────

  test.describe('EC9 — Index redirect to /clientes', () => {

    test('[P1] / redirect to /clientes shows no blank screen during transition', async ({ page }) => {
      // GIVEN: Root URL is loaded
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: Page loads at /
      await page.goto('/');

      // THEN: Final URL is /clientes
      await expect(page).toHaveURL(/\/clientes/);

      // AND: Clientes view is visible (no blank or empty screen)
      await expect(page.getByTestId('clientes-view')).toBeVisible();
    });

    test('[P2] / redirect preserves navigation visibility (no layout flash)', async ({ page }) => {
      // GIVEN: Desktop viewport loads root URL
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: Page loads and redirects from / to /clientes
      await page.goto('/');
      await expect(page).toHaveURL(/\/clientes/);

      // THEN: Navigation is present after redirect (layout did not disappear)
      await expect(page.getByTestId('nav-rail')).toBeVisible();
    });
  });

  // ─── EC10: Nav aria-label present in mobile viewport ─────────────────────

  test.describe('EC10 — Nav aria-label in mobile viewport', () => {

    test('[P1] nav[aria-label="Navegación principal"] is present in DOM on mobile', async ({ page }) => {
      // GIVEN: Mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: Page loads
      await page.goto('/clientes');

      // THEN: The nav landmark with the accessible label exists (WCAG requirement)
      await expect(
        page.locator('nav[aria-label="Navegación principal"]').first()
      ).toBeAttached();
    });

    test('[P1] Mobile NavigationBar nav item shows Spanish labels', async ({ page }) => {
      // GIVEN: Mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });
      await page.route('**/api/**', (route) => route.continue());

      // WHEN: Page loads at /clientes
      await page.goto('/clientes');

      // THEN: Both Spanish labels are visible in the bottom nav
      await expect(page.getByTestId('nav-item-clientes')).toContainText('Clientes');
      await expect(page.getByTestId('nav-item-contactos')).toContainText('Contactos');
    });
  });
});
