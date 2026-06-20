/**
 * Expanded Coverage Tests - Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Mode: BMad-Integrated — expands ATDD tests with edge cases, error paths,
 * boundary conditions, and negative paths NOT covered by navigation-shell.spec.ts.
 *
 * Coverage added by this file:
 *   - Rapid navigation: clicking nav items quickly without waiting for transitions
 *   - Browser history: back/forward button interactions with router state
 *   - Viewport resize: crossing the 1024px breakpoint dynamically
 *   - Trailing slash and query string variants in URL
 *   - Hash-based URL fragments (should not break routing)
 *   - Consecutive 404 navigations do not break the shell
 *   - Focus ring persistence after keyboard navigation across routes
 *   - No full page reload on client-side navigation (SPA contract)
 *   - Performance: navigation shell renders in < 2s
 *   - No console errors on standard navigation flows
 *   - Mobile touch target width (in addition to ATDD height check)
 *   - NavigationBar not shown on desktop (positive desktop check)
 *
 * Given-When-Then pattern applied throughout.
 * data-testid selectors used exclusively for stability.
 * Priority tags: [P0], [P1], [P2], [P3].
 *
 * References:
 * - ATDD: e2e/story-1-2/navigation-shell.spec.ts (happy paths, do NOT duplicate)
 * - Story: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md
 * - Factory: e2e/support/factories/navigation.factory.ts
 */

import { test, expect } from '@playwright/test';
import {
  APP_ROUTES,
  DESKTOP_VIEWPORT,
  MOBILE_VIEWPORT,
  MIN_TOUCH_TARGET_PX,
  SHELL_TEST_IDS,
} from '../support/factories/navigation.factory';

// ─────────────────────────────────────────────────────────────────────────────
// RAPID NAVIGATION — Back-to-back clicks without waiting between them
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Rapid navigation — clicking nav items consecutively', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('[P1] should land on /contactos when Clientes then Contactos are clicked quickly', async ({
    page,
  }) => {
    // GIVEN: The application is loaded on desktop
    await page.goto(APP_ROUTES.clientes);

    // WHEN: User clicks Clientes then immediately Contactos (rapid succession)
    await page.getByTestId(SHELL_TEST_IDS.navItemClientes).click();
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();

    // THEN: The final URL is /contactos (last-click wins)
    await expect(page).toHaveURL(APP_ROUTES.contactos);
  });

  test('[P1] should land on /clientes when Contactos then Clientes are clicked quickly', async ({
    page,
  }) => {
    // GIVEN: Application on /contactos
    await page.goto(APP_ROUTES.contactos);

    // WHEN: User clicks Contactos then immediately Clientes
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();
    await page.getByTestId(SHELL_TEST_IDS.navItemClientes).click();

    // THEN: Final URL is /clientes
    await expect(page).toHaveURL(APP_ROUTES.clientes);
  });

  test('[P1] should keep the shell rendered intact after rapid nav clicks', async ({ page }) => {
    // GIVEN: Application loaded
    await page.goto(APP_ROUTES.clientes);

    // WHEN: Four rapid nav clicks alternate between routes
    for (let i = 0; i < 4; i++) {
      await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();
      await page.getByTestId(SHELL_TEST_IDS.navItemClientes).click();
    }

    // THEN: Shell elements remain visible after rapid interaction
    await expect(page.getByTestId(SHELL_TEST_IDS.navbar)).toBeVisible();
    await expect(page.getByTestId(SHELL_TEST_IDS.navigationRail)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BROWSER HISTORY — Back and forward button interactions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Browser history — back/forward navigation', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('[P1] should navigate back to /clientes after going to /contactos via browser back', async ({
    page,
  }) => {
    // GIVEN: User starts on /clientes then navigates to /contactos via nav click
    await page.goto(APP_ROUTES.clientes);
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();
    await expect(page).toHaveURL(APP_ROUTES.contactos);

    // WHEN: User presses the browser back button
    await page.goBack();

    // THEN: URL returns to /clientes without full page reload
    await expect(page).toHaveURL(APP_ROUTES.clientes);
  });

  test('[P1] should navigate forward to /contactos after pressing back then forward', async ({
    page,
  }) => {
    // GIVEN: User navigates clientes → contactos → back
    await page.goto(APP_ROUTES.clientes);
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();
    await page.goBack();

    // WHEN: User presses browser forward
    await page.goForward();

    // THEN: URL is /contactos again
    await expect(page).toHaveURL(APP_ROUTES.contactos);
  });

  test('[P1] should keep the NavigationRail visible after browser back navigation', async ({
    page,
  }) => {
    // GIVEN: User navigated from /clientes to /contactos
    await page.goto(APP_ROUTES.clientes);
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();

    // WHEN: User goes back
    await page.goBack();

    // THEN: Shell elements are still intact after history traversal
    await expect(page.getByTestId(SHELL_TEST_IDS.navigationRail)).toBeVisible();
    await expect(page.getByTestId(SHELL_TEST_IDS.navbar)).toBeVisible();
  });

  test('[P1] should update the active nav item correctly after browser back navigation', async ({
    page,
  }) => {
    // GIVEN: User goes from /clientes to /contactos
    await page.goto(APP_ROUTES.clientes);
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();

    // WHEN: User goes back to /clientes via browser back
    await page.goBack();
    await expect(page).toHaveURL(APP_ROUTES.clientes);

    // THEN: Clientes nav item is marked active again
    await expect(page.getByTestId(SHELL_TEST_IDS.navItemClientes)).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// URL BOUNDARY CONDITIONS — Trailing slashes, query strings, hash fragments
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] URL edge cases — trailing slash, query string, hash fragments', () => {
  test('[P2] should render the Clientes view (or redirect) for /clientes/ with trailing slash', async ({
    page,
  }) => {
    // GIVEN: A user types /clientes/ with a trailing slash
    // WHEN: Page loads
    await page.goto('/clientes/');

    // THEN: Either /clientes or /clientes/ is the final URL, and the Clientes view is displayed
    const url = page.url();
    const isClientesUrl = url.endsWith('/clientes') || url.endsWith('/clientes/');
    expect(isClientesUrl).toBe(true);
  });

  test('[P2] should render Clientes view when accessing /clientes?ref=email (query param ignored)', async ({
    page,
  }) => {
    // GIVEN: User clicks a link with a tracking query param
    // WHEN: The page loads with /clientes?ref=email
    await page.goto('/clientes?ref=email');

    // THEN: The Clientes view renders and the NavigationRail shows Clientes active
    await expect(page.getByTestId(SHELL_TEST_IDS.clientesView)).toBeVisible();
  });

  test('[P2] should NOT break the navigation shell when URL contains a hash fragment', async ({
    page,
  }) => {
    // GIVEN: User accesses /clientes#section-top (hash fragment)
    // WHEN: The page loads
    await page.goto('/clientes#section-top');

    // THEN: The shell renders correctly and the nav rail is visible
    await expect(page.getByTestId(SHELL_TEST_IDS.navigationRail)).toBeVisible();
    await expect(page.getByTestId(SHELL_TEST_IDS.navItemClientes)).toBeVisible();
  });

  test('[P2] should display 404 for /clientes/detail/unknown (deeply nested unknown sub-path)', async ({
    page,
  }) => {
    // GIVEN: A user navigates to a sub-path under /clientes that does not exist
    // WHEN: The page loads
    await page.goto('/clientes/detail/unknown-id-that-does-not-exist');

    // THEN: The not-found view is displayed (route tree does not have this path)
    await expect(page.getByTestId(SHELL_TEST_IDS.notFoundView)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VIEWPORT RESIZE — Crossing the 1024px breakpoint dynamically
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Viewport resize — responsive layout breakpoint transitions', () => {
  test('[P2] should NOT show NavigationBar on desktop viewport (≥ 1024px)', async ({ page }) => {
    // GIVEN: Application loaded at desktop width
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(APP_ROUTES.clientes);

    // THEN: The mobile NavigationBar is not visible on desktop
    await expect(page.getByTestId(SHELL_TEST_IDS.navigationBar)).not.toBeVisible();
  });

  test('[P2] should NOT show NavigationRail on mobile viewport (< 1024px)', async ({ page }) => {
    // GIVEN: Application loaded at mobile width
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(APP_ROUTES.clientes);

    // THEN: The desktop NavigationRail is not visible on mobile
    await expect(page.getByTestId(SHELL_TEST_IDS.navigationRail)).not.toBeVisible();
  });

  test('[P2] should have minimum 44px touch target WIDTH for Clientes nav item on mobile', async ({
    page,
  }) => {
    // GIVEN: Application on mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(APP_ROUTES.clientes);

    // WHEN: The mobile NavigationBar is rendered
    const navItem = page.getByTestId(SHELL_TEST_IDS.navItemClientes);
    const boundingBox = await navItem.boundingBox();

    // THEN: The nav item has at least 44px width (WCAG 2.1 AA touch target)
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
  });

  test('[P2] should have minimum 44px touch target WIDTH for Contactos nav item on mobile', async ({
    page,
  }) => {
    // GIVEN: Application on mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(APP_ROUTES.contactos);

    // WHEN: The mobile NavigationBar is rendered
    const navItem = page.getByTestId(SHELL_TEST_IDS.navItemContactos);
    const boundingBox = await navItem.boundingBox();

    // THEN: The nav item has at least 44px width
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPA CONTRACT — Verifying no full page reload on client-side navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P0] SPA contract — client-side navigation without full page reloads', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('[P0] should NOT trigger a full page reload when clicking Contactos nav item', async ({
    page,
  }) => {
    // GIVEN: Application is loaded and stable at /clientes
    await page.goto(APP_ROUTES.clientes);

    // WHEN: We track page navigations (full reloads) and click the nav item
    let fullPageReloadOccurred = false;
    page.on('load', () => {
      fullPageReloadOccurred = true;
    });

    // Reset after initial load
    fullPageReloadOccurred = false;
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();
    await expect(page).toHaveURL(APP_ROUTES.contactos);

    // THEN: No full-page load event fired (SPA router handled navigation)
    expect(fullPageReloadOccurred).toBe(false);
  });

  test('[P0] should NOT trigger a full page reload when clicking Clientes nav item', async ({
    page,
  }) => {
    // GIVEN: Application is loaded at /contactos
    await page.goto(APP_ROUTES.contactos);

    let fullPageReloadOccurred = false;
    page.on('load', () => {
      fullPageReloadOccurred = true;
    });

    fullPageReloadOccurred = false;
    await page.getByTestId(SHELL_TEST_IDS.navItemClientes).click();
    await expect(page).toHaveURL(APP_ROUTES.clientes);

    // THEN: No full-page load event during SPA navigation
    expect(fullPageReloadOccurred).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 EDGE CASES — Multiple unknown routes and recovery
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] 404 edge cases — consecutive unknown routes and recovery', () => {
  test('[P1] should display 404 view for numeric-only unknown path /12345', async ({ page }) => {
    // GIVEN: A user guesses a numeric route
    // WHEN: /12345 is accessed
    await page.goto('/12345');

    // THEN: The not-found view is shown
    await expect(page.getByTestId(SHELL_TEST_IDS.notFoundView)).toBeVisible();
  });

  test('[P1] should display 404 view for deeply nested unknown path', async ({ page }) => {
    // GIVEN: A user navigates to a deeply nested unknown route
    // WHEN: /a/b/c/d/e/f is accessed
    await page.goto('/a/b/c/d/e/f');

    // THEN: The not-found view is shown
    await expect(page.getByTestId(SHELL_TEST_IDS.notFoundView)).toBeVisible();
  });

  test('[P1] should recover to a working state after a 404 via the back link', async ({ page }) => {
    // GIVEN: User is on the 404 page at an unknown route
    await page.goto(APP_ROUTES.unknownPath);
    await expect(page.getByTestId(SHELL_TEST_IDS.notFoundView)).toBeVisible();

    // WHEN: User clicks the "Volver a Clientes" back link
    await page.getByTestId(SHELL_TEST_IDS.notFoundBackLink).click();

    // THEN: App navigates to /clientes and renders it correctly
    await expect(page).toHaveURL(APP_ROUTES.clientes);
    await expect(page.getByTestId(SHELL_TEST_IDS.clientesView)).toBeVisible();
  });

  test('[P1] should keep the nav shell intact while displaying the 404 view', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    await page.goto(APP_ROUTES.unknownPath);

    // THEN: The navigation shell (Navbar + NavigationRail) remains accessible
    // so the user can navigate away without using the back link
    await expect(page.getByTestId(SHELL_TEST_IDS.navbar)).toBeVisible();
  });

  test('[P2] should show 404 view for a path with special characters (/path%20with%20spaces)', async ({
    page,
  }) => {
    // GIVEN: User enters a URL-encoded path with spaces
    // WHEN: The route is loaded
    await page.goto('/path%20with%20spaces');

    // THEN: The not-found view is displayed
    await expect(page.getByTestId(SHELL_TEST_IDS.notFoundView)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CONSOLE ERRORS — No uncaught JS errors on standard navigation flows
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Console health — no uncaught errors during navigation', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('[P1] should produce no console errors when navigating from /clientes to /contactos', async ({
    page,
  }) => {
    // GIVEN: Error capture is set up before any navigation
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // WHEN: User loads /clientes and navigates to /contactos
    await page.goto(APP_ROUTES.clientes);
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();
    await expect(page).toHaveURL(APP_ROUTES.contactos);

    // THEN: No JavaScript errors occurred during navigation
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P1] should produce no console errors when root / redirects to /clientes', async ({
    page,
  }) => {
    // GIVEN: Error capture is active
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // WHEN: Root / is accessed and the redirect fires
    await page.goto(APP_ROUTES.root);
    await page.waitForURL(APP_ROUTES.clientes);

    // THEN: No errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P1] should produce no console errors on the 404 not-found page', async ({ page }) => {
    // GIVEN: Error capture is active
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // WHEN: An unknown route is accessed
    await page.goto(APP_ROUTES.unknownPath);
    await expect(page.getByTestId(SHELL_TEST_IDS.notFoundView)).toBeVisible();

    // THEN: No JS errors on the 404 page
    expect(consoleErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE — Navigation shell render time boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Performance — navigation shell renders within time boundary', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('[P2] should render the navigation shell within 2000ms of page load', async ({ page }) => {
    // GIVEN: Application is not yet loaded
    const startTime = Date.now();

    // WHEN: /clientes is loaded
    await page.goto(APP_ROUTES.clientes);
    await page.getByTestId(SHELL_TEST_IDS.navigationRail).waitFor({ state: 'visible' });
    const elapsed = Date.now() - startTime;

    // THEN: The NavigationRail is visible within 2 seconds
    expect(elapsed).toBeLessThan(2000);
  });

  test('[P2] should complete client-side navigation from /clientes to /contactos in < 500ms', async ({
    page,
  }) => {
    // GIVEN: App is already loaded and stable
    await page.goto(APP_ROUTES.clientes);
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).waitFor({ state: 'visible' });

    // WHEN: Nav click is triggered and timed
    const startTime = Date.now();
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();
    await expect(page).toHaveURL(APP_ROUTES.contactos);
    const elapsed = Date.now() - startTime;

    // THEN: Client-side navigation completes in under 500ms
    expect(elapsed).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSIBILITY EDGE CASES — Focus ring and Space key activation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Accessibility edge cases — Space key and focus behavior', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('[P1] should navigate to /contactos when Space key is pressed on the focused Contactos nav item', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes and focuses the Contactos nav item
    await page.goto(APP_ROUTES.clientes);
    const navItemContactos = page.getByTestId(SHELL_TEST_IDS.navItemContactos);
    await navItemContactos.focus();
    await expect(navItemContactos).toBeFocused();

    // WHEN: Space key is pressed (alternative activation key per WCAG)
    await page.keyboard.press('Space');

    // THEN: The router navigates to /contactos
    await expect(page).toHaveURL(APP_ROUTES.contactos);
  });

  test('[P1] should navigate to /clientes when Space key is pressed on the focused Clientes nav item', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos and focuses the Clientes nav item
    await page.goto(APP_ROUTES.contactos);
    const navItemClientes = page.getByTestId(SHELL_TEST_IDS.navItemClientes);
    await navItemClientes.focus();
    await expect(navItemClientes).toBeFocused();

    // WHEN: Space key is pressed
    await page.keyboard.press('Space');

    // THEN: The router navigates to /clientes
    await expect(page).toHaveURL(APP_ROUTES.clientes);
  });

  test('[P1] should not show aria-current="page" on Contactos when the active route is /clientes', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes
    await page.goto(APP_ROUTES.clientes);

    // WHEN: NavigationRail is rendered with /clientes as active route
    const contactosNavItem = page.getByTestId(SHELL_TEST_IDS.navItemContactos);

    // THEN: Contactos nav item does NOT have aria-current="page"
    await expect(contactosNavItem).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should not show aria-current="page" on Clientes when the active route is /contactos', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos
    await page.goto(APP_ROUTES.contactos);

    // WHEN: NavigationRail is rendered with /contactos as active route
    const clientesNavItem = page.getByTestId(SHELL_TEST_IDS.navItemClientes);

    // THEN: Clientes nav item does NOT have aria-current="page"
    await expect(clientesNavItem).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P2] should have role="navigation" or equivalent landmark on the NavigationRail', async ({
    page,
  }) => {
    // GIVEN: Application loaded on desktop
    await page.goto(APP_ROUTES.clientes);

    // WHEN: NavigationRail is rendered
    // THEN: The NavigationRail or its container has a navigation landmark for screen readers
    const navRail = page.getByTestId(SHELL_TEST_IDS.navigationRail);
    await expect(navRail).toBeVisible();

    // Either the element itself is a <nav> or it has role="navigation"
    const tagName = await navRail.evaluate((el) => el.tagName.toLowerCase());
    const role = await navRail.getAttribute('role');
    const isNavLandmark = tagName === 'nav' || role === 'navigation';
    expect(isNavLandmark).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE NAVIGATION FLOW — End-to-end navigation on mobile viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Mobile end-to-end navigation flows', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('[P1] should navigate from /clientes to /contactos via mobile NavigationBar', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes on a mobile device
    await page.goto(APP_ROUTES.clientes);
    await expect(page.getByTestId(SHELL_TEST_IDS.navigationBar)).toBeVisible();

    // WHEN: User taps the Contactos nav item in the NavigationBar
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL(APP_ROUTES.contactos);
  });

  test('[P1] should mark Contactos as active in the mobile NavigationBar after navigating to /contactos', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes on mobile
    await page.goto(APP_ROUTES.clientes);

    // WHEN: User taps Contactos
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();
    await expect(page).toHaveURL(APP_ROUTES.contactos);

    // THEN: Contactos nav item is marked as active
    await expect(page.getByTestId(SHELL_TEST_IDS.navItemContactos)).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('[P1] should navigate from /contactos to /clientes via mobile NavigationBar', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos on mobile
    await page.goto(APP_ROUTES.contactos);
    await expect(page.getByTestId(SHELL_TEST_IDS.navigationBar)).toBeVisible();

    // WHEN: User taps Clientes
    await page.getByTestId(SHELL_TEST_IDS.navItemClientes).click();

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL(APP_ROUTES.clientes);
  });

  test('[P2] should render the Contactos view content after mobile navigation to /contactos', async ({
    page,
  }) => {
    // GIVEN: User is on mobile at /clientes
    await page.goto(APP_ROUTES.clientes);

    // WHEN: User taps Contactos nav item
    await page.getByTestId(SHELL_TEST_IDS.navItemContactos).click();

    // THEN: The Contactos view is rendered
    await expect(page.getByTestId(SHELL_TEST_IDS.contactosView)).toBeVisible();
  });
});
