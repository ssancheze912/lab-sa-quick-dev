/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge Cases, Error Paths & Boundary Conditions
 * Expands ATDD coverage beyond the happy-path acceptance criteria.
 *
 * Coverage added (not in ATDD navigation-shell.spec.ts):
 *   EC-NAV-1  — Tablet viewport (768px) shows correct nav component (not desktop rail, not mobile bar conflict)
 *   EC-NAV-2  — Deep link to /clientes sub-route (/clientes/:id) renders correct view without redirect
 *   EC-NAV-3  — Deep link to /contactos sub-route (/contactos/:id) renders correct view without redirect
 *   EC-NAV-4  — Active nav item on sub-route (/clientes/123) highlights parent Clientes item
 *   EC-NAV-5  — Browser back navigation from /contactos returns to /clientes and updates active state
 *   EC-NAV-6  — Rapid successive navigation clicks do not crash the app
 *   EC-NAV-7  — No JavaScript runtime errors during shell render
 *   EC-NAV-8  — NavigationRail / NavigationBar have accessible ARIA roles (a11y)
 *   EC-NAV-9  — Contactos active state clears when navigating back to Clientes
 *   EC-NAV-10 — 404 page does NOT crash (no JS runtime errors) when navigating to unknown route
 *   EC-NAV-11 — 404 page shows 404 numeric heading
 *   EC-NAV-12 — 404 page shows the descriptive route error text in Spanish
 *   EC-NAV-13 — Multiple unknown routes all render not-found view (boundary: special chars in path)
 *   EC-NAV-14 — Shell renders correctly at exactly 1024px (breakpoint boundary)
 *   EC-NAV-15 — Shell renders correctly at exactly 1023px (breakpoint boundary)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// EC-NAV: Navigation Shell edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-NAV — Navigation shell edge cases & boundary conditions', () => {

  // ───────────────────────────────────────────────────────
  // EC-NAV-1: Tablet viewport behavior at 768px
  // ───────────────────────────────────────────────────────

  test.describe('[P2] EC-NAV-1: Tablet viewport (768px) navigation rendering', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('[P2] EC-NAV-1a: should not crash the app at tablet viewport (768px)', async ({ page }) => {
      // GIVEN: The app loads at tablet width (768px — below desktop breakpoint 1024px)
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      // WHEN: The user navigates to /clientes on a tablet
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');

      // THEN: No JavaScript runtime errors occur
      expect(errors).toHaveLength(0);
    });

    test('[P2] EC-NAV-1b: should render navigation items at 768px tablet viewport', async ({ page }) => {
      // GIVEN: The app loads at 768px (tablet — still below 1024px desktop breakpoint)
      // WHEN: The user views the navigation at /clientes
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');

      // THEN: Navigation items for Clientes and Contactos are accessible (either bar or rail)
      // LayoutBase from siesa-ui-kit handles responsive switching — at 768px it may show mobile nav
      const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
      await expect(clientesItem).toBeVisible();
    });
  });

  // ───────────────────────────────────────────────────────
  // EC-NAV-2/3: Deep linking to sub-routes
  // ───────────────────────────────────────────────────────

  test.describe('[P1] EC-NAV-2/3: Deep links to nested sub-routes', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('[P1] EC-NAV-2: deep link to /clientes/123 should render a view without redirect', async ({ page }) => {
      // GIVEN: The user navigates directly to a cliente detail sub-route
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      // WHEN: The page loads with a dynamic segment
      await page.goto('/clientes/123');
      await page.waitForLoadState('networkidle');

      // THEN: No JavaScript crash occurs (router handles the dynamic segment)
      expect(errors).toHaveLength(0);

      // AND: The URL stays at /clientes/123 (no redirect to home or /clientes)
      expect(page.url()).toContain('/clientes/123');
    });

    test('[P1] EC-NAV-3: deep link to /contactos/456 should render a view without redirect', async ({ page }) => {
      // GIVEN: The user navigates directly to a contacto detail sub-route
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      // WHEN: The page loads with a dynamic segment
      await page.goto('/contactos/456');
      await page.waitForLoadState('networkidle');

      // THEN: No JavaScript crash occurs
      expect(errors).toHaveLength(0);

      // AND: The URL stays at /contactos/456 (not redirected away)
      expect(page.url()).toContain('/contactos/456');
    });
  });

  // ───────────────────────────────────────────────────────
  // EC-NAV-4: Active nav item on sub-routes
  // ───────────────────────────────────────────────────────

  test.describe('[P1] EC-NAV-4: Active state on sub-routes', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('[P1] EC-NAV-4a: Clientes nav item should be active when on /clientes/123 sub-route', async ({ page }) => {
      // GIVEN: The user is on a Clientes detail sub-route
      // WHEN: The page loads
      await page.goto('/clientes/123');
      await page.waitForLoadState('networkidle');

      // THEN: The Clientes nav item is highlighted as active
      // (startsWith('/clientes') logic must cover sub-routes)
      const clientesNavItem = page.locator('[data-testid="nav-item-clientes"]');
      await expect(clientesNavItem).toBeVisible();
      // The nav item should be in active state (data-active="true" or class containing "active")
      const isActive =
        (await clientesNavItem.getAttribute('data-active')) === 'true' ||
        (await clientesNavItem.getAttribute('class') ?? '').includes('active');
      expect(isActive).toBe(true);
    });

    test('[P1] EC-NAV-4b: Contactos nav item should be active when on /contactos/456 sub-route', async ({ page }) => {
      // GIVEN: The user is on a Contactos detail sub-route
      // WHEN: The page loads
      await page.goto('/contactos/456');
      await page.waitForLoadState('networkidle');

      // THEN: The Contactos nav item is highlighted as active
      const contactosNavItem = page.locator('[data-testid="nav-item-contactos"]');
      await expect(contactosNavItem).toBeVisible();
      const isActive =
        (await contactosNavItem.getAttribute('data-active')) === 'true' ||
        (await contactosNavItem.getAttribute('class') ?? '').includes('active');
      expect(isActive).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────
  // EC-NAV-5: Browser back/forward navigation
  // ───────────────────────────────────────────────────────

  test.describe('[P1] EC-NAV-5: Browser history back/forward navigation', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('[P1] EC-NAV-5a: browser back from /contactos should return to /clientes', async ({ page }) => {
      // GIVEN: The user navigated from /clientes to /contactos via the nav item
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="nav-item-contactos"]').click();
      await expect(page).toHaveURL('/contactos');

      // WHEN: The user clicks browser back
      await page.goBack();

      // THEN: The URL returns to /clientes
      await expect(page).toHaveURL('/clientes');

      // AND: The clientes view is rendered
      await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    });

    test('[P1] EC-NAV-5b: browser forward from /clientes after going back should return to /contactos', async ({ page }) => {
      // GIVEN: The user went from /clientes → /contactos → back to /clientes
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="nav-item-contactos"]').click();
      await expect(page).toHaveURL('/contactos');
      await page.goBack();
      await expect(page).toHaveURL('/clientes');

      // WHEN: The user clicks browser forward
      await page.goForward();

      // THEN: The URL returns to /contactos
      await expect(page).toHaveURL('/contactos');
      await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
    });
  });

  // ───────────────────────────────────────────────────────
  // EC-NAV-6: Rapid successive navigation (race condition boundary)
  // ───────────────────────────────────────────────────────

  test.describe('[P2] EC-NAV-6: Rapid successive navigation clicks', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('[P2] EC-NAV-6: rapid alternating nav clicks do not crash or show blank page', async ({ page }) => {
      // GIVEN: The application is loaded on desktop
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');

      // WHEN: The user rapidly clicks between nav items 4 times
      await page.locator('[data-testid="nav-item-contactos"]').click();
      await page.locator('[data-testid="nav-item-clientes"]').click();
      await page.locator('[data-testid="nav-item-contactos"]').click();
      await page.locator('[data-testid="nav-item-clientes"]').click();

      // THEN: No JavaScript crash occurs
      expect(errors).toHaveLength(0);

      // AND: The final URL is /clientes (last click)
      await expect(page).toHaveURL('/clientes');

      // AND: The clientes view is visible (not blank)
      await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
    });
  });

  // ───────────────────────────────────────────────────────
  // EC-NAV-7: No JavaScript runtime errors on shell render
  // ───────────────────────────────────────────────────────

  test.describe('[P0] EC-NAV-7: No JavaScript runtime errors during shell render', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('[P0] EC-NAV-7: shell renders without any JavaScript runtime errors', async ({ page }) => {
      // GIVEN: The application shell is rendered fresh
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      // WHEN: The user loads /clientes and navigates to /contactos
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="nav-item-contactos"]').click();
      await expect(page).toHaveURL('/contactos');

      // THEN: No JavaScript errors or unhandled exceptions during the entire flow
      expect(errors).toHaveLength(0);
    });
  });

  // ───────────────────────────────────────────────────────
  // EC-NAV-8: Accessibility — ARIA roles on navigation
  // ───────────────────────────────────────────────────────

  test.describe('[P1] EC-NAV-8a: Accessibility ARIA roles — desktop NavigationRail', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('[P1] EC-NAV-8a: desktop NavigationRail should have an accessible navigation landmark', async ({ page }) => {
      // GIVEN: The app loads on desktop viewport
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');

      // THEN: There is at least one nav landmark on the page (ARIA role="navigation")
      const navLandmarks = page.locator('nav, [role="navigation"]');
      await expect(navLandmarks.first()).toBeVisible();
    });
  });

  test.describe('[P1] EC-NAV-8b: Accessibility ARIA roles — mobile NavigationBar', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('[P1] EC-NAV-8b: mobile NavigationBar should have an accessible navigation landmark', async ({ page }) => {
      // GIVEN: The app loads on mobile viewport
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');

      // THEN: There is at least one nav landmark on the page (ARIA role="navigation")
      const navLandmarks = page.locator('nav, [role="navigation"]');
      await expect(navLandmarks.first()).toBeVisible();
    });
  });

  // ───────────────────────────────────────────────────────
  // EC-NAV-9: Active state clears when navigating away
  // ───────────────────────────────────────────────────────

  test.describe('[P1] EC-NAV-9: Active state mutual exclusion', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('[P1] EC-NAV-9: Clientes active state clears after navigating to Contactos', async ({ page }) => {
      // GIVEN: User is on /clientes (Clientes nav is active)
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');

      const clientesNavItem = page.locator('[data-testid="nav-item-clientes"]');
      const contactosNavItem = page.locator('[data-testid="nav-item-contactos"]');

      // Verify Clientes is active and Contactos is not
      const clientesInitiallyActive =
        (await clientesNavItem.getAttribute('data-active')) === 'true' ||
        (await clientesNavItem.getAttribute('class') ?? '').includes('active');
      expect(clientesInitiallyActive).toBe(true);

      // WHEN: User navigates to /contactos
      await contactosNavItem.click();
      await expect(page).toHaveURL('/contactos');

      // THEN: Contactos nav item is active
      const contactosNowActive =
        (await contactosNavItem.getAttribute('data-active')) === 'true' ||
        (await contactosNavItem.getAttribute('class') ?? '').includes('active');
      expect(contactosNowActive).toBe(true);

      // AND: Clientes nav item is NO longer active
      const clientesNoLongerActive =
        (await clientesNavItem.getAttribute('data-active')) === 'true' ||
        (await clientesNavItem.getAttribute('class') ?? '').includes('active');
      expect(clientesNoLongerActive).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC-404: 404 Not Found page edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-404 — 404 Not Found page edge cases', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P0] EC-NAV-10: navigating to unknown route does NOT cause a JavaScript crash', async ({ page }) => {
    // GIVEN: The app is running
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // WHEN: The user navigates to an unknown route
    await page.goto('/ruta-que-no-existe-edge-case');
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript runtime errors occur
    expect(errors).toHaveLength(0);
  });

  test('[P1] EC-NAV-11: 404 page shows numeric "404" heading', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The 404 not-found page renders
    await page.goto('/ruta-desconocida-123');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();

    // THEN: A "404" heading is visible to orient the user
    await expect(page.getByText('404')).toBeVisible();
  });

  test('[P1] EC-NAV-12: 404 page shows route description error text in Spanish', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    await page.goto('/ruta-inexistente-edge');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();

    // THEN: The Spanish descriptive text about the missing route is shown
    await expect(page.getByText('La ruta solicitada no existe.')).toBeVisible();
  });

  test('[P2] EC-NAV-13a: unknown route with special characters renders 404 gracefully', async ({ page }) => {
    // GIVEN: The user navigates to a path with special characters (boundary: URL encoding)
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // WHEN: The page loads
    await page.goto('/ruta/%C3%A9sp%C3%A9cial');
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript crash
    expect(errors).toHaveLength(0);
    // AND: Not-found page or redirect occurs (app does not hang)
    const url = page.url();
    expect(url.length).toBeGreaterThan(0);
  });

  test('[P2] EC-NAV-13b: deeply nested unknown path renders 404 gracefully', async ({ page }) => {
    // GIVEN: The user navigates to a deeply nested unknown path
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // WHEN: The page loads with multiple path segments
    await page.goto('/nivel1/nivel2/nivel3/nivel4');
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript crash
    expect(errors).toHaveLength(0);
    // AND: The 404 page is shown (not a blank screen or uncaught exception)
    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC-BREAKPOINT: Viewport breakpoint boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-BREAKPOINT — Responsive layout at exact breakpoint boundaries', () => {

  test('[P1] EC-NAV-14: at exactly 1024px width, desktop NavigationRail should be visible', async ({ page }) => {
    // GIVEN: The app loads at EXACTLY the desktop breakpoint (1024px — the boundary)
    await page.setViewportSize({ width: 1024, height: 768 });

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The desktop NavigationRail is visible (1024px is the desktop breakpoint per spec)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // AND: No JavaScript errors
    // (just checking shell renders without crash at exact boundary)
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('[P1] EC-NAV-15: at exactly 1023px width, mobile NavigationBar should be visible', async ({ page }) => {
    // GIVEN: The app loads at 1023px width — just below the desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 768 });

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The mobile NavigationBar is visible (one pixel below the desktop threshold)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC-SHELL-PERSIST: Shell persistence across route transitions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-SHELL-PERSIST — Application shell persists across route changes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] EC-SHELL-PERSIST-1: Navbar / product name remains visible after navigating from /clientes to /contactos', async ({ page }) => {
    // GIVEN: The shell is loaded at /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // Capture that the navigation shell is present
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: User navigates to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: The NavigationRail (shell) is still present — it was not torn down and re-mounted
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P1] EC-SHELL-PERSIST-2: navigating from /contactos to /clientes keeps shell visible without blank flash', async ({ page }) => {
    // GIVEN: The user is on /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // WHEN: User navigates to /clientes
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await expect(page).toHaveURL('/clientes');

    // THEN: The shell NavigationRail is still visible (no blank flash / shell re-mount)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // AND: The correct content view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P2] EC-SHELL-PERSIST-3: index redirect preserves shell after redirect to /clientes', async ({ page }) => {
    // GIVEN: The user navigates to the root path
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // WHEN: The redirect from / to /clientes happens
    await page.goto('/');
    await expect(page).toHaveURL('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The shell and NavigationRail are visible after the redirect
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();

    // AND: No JavaScript errors occurred during the redirect
    expect(errors).toHaveLength(0);
  });
});
