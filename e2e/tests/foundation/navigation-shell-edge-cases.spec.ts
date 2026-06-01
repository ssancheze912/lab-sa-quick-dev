/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATION EXPANSION — Edge Cases & Boundary Conditions
 * Expands ATDD coverage with error paths, boundary conditions,
 * and negative cases not covered in the ATDD RED-phase tests.
 *
 * Focus areas:
 *   - Viewport breakpoint boundary (exactly 1024px)
 *   - Rapid successive navigation (race conditions)
 *   - Browser back/forward history navigation
 *   - Active state correctness after in-app navigation
 *   - 404 view back-link navigation functionality
 *   - Multiple unknown route formats (nested, query string, hash)
 *   - Console errors during navigation lifecycle
 *   - Active item correctness after root redirect
 *   - Navigation shell stability (no runtime errors across routes)
 */

import { test, expect } from '../../fixtures/base.fixture';

// ─────────────────────────────────────────────────────────────────────────────
// Viewport breakpoint boundary — exactly 1024px (lg: breakpoint edge)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Viewport breakpoint boundary — 1024px edge', () => {
  test('[P1] should display NavigationRail (not NavigationBar) at exactly 1024px width', async ({
    page,
  }) => {
    // GIVEN: lg: breakpoint is defined at 1024px (Tailwind default)
    // WHEN: The app loads at exactly the breakpoint width
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/clientes');

    // THEN: NavigationRail is visible (≥ 1024px triggers lg: class) and NavigationBar is hidden
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
    await expect(page.getByTestId('navigation-bar')).not.toBeVisible();
  });

  test('[P1] should display NavigationBar (not NavigationRail) at 1023px width', async ({
    page,
  }) => {
    // GIVEN: lg: breakpoint requires width ≥ 1024px; 1023px is strictly below
    // WHEN: The app loads at one pixel below the breakpoint
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.goto('/clientes');

    // THEN: NavigationBar is visible and NavigationRail is hidden (mobile layout)
    await expect(page.getByTestId('navigation-bar')).toBeVisible();
    await expect(page.getByTestId('navigation-rail')).not.toBeVisible();
  });

  test('[P2] should switch navigation layout when viewport is resized across the 1024px breakpoint', async ({
    page,
  }) => {
    // GIVEN: App starts on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await expect(page.getByTestId('navigation-rail')).toBeVisible();

    // WHEN: Viewport is resized to mobile width
    await page.setViewportSize({ width: 390, height: 844 });

    // THEN: NavigationBar becomes visible and NavigationRail is hidden
    await expect(page.getByTestId('navigation-bar')).toBeVisible();
    await expect(page.getByTestId('navigation-rail')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rapid successive navigation (race conditions / debounce)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Rapid successive navigation — race condition boundaries', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should stabilize on the final route after rapid alternating navigation', async ({
    page,
  }) => {
    // GIVEN: App is loaded at /clientes
    await page.goto('/clientes');

    // WHEN: User rapidly clicks between Contactos and Clientes in quick succession
    await page.locator('[data-item-id="contactos"]').click();
    await page.locator('[data-item-id="clientes"]').click();
    await page.locator('[data-item-id="contactos"]').click();

    // THEN: URL stabilizes on the last clicked route (/contactos) without crash
    await page.waitForURL('**/contactos**');
    expect(page.url()).toContain('/contactos');
  });

  test('[P1] should not throw JavaScript errors during rapid navigation', async ({ page }) => {
    // GIVEN: App is loaded and runtime error monitoring is active
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/clientes');

    // WHEN: User navigates rapidly between routes
    await page.locator('[data-item-id="contactos"]').click();
    await page.locator('[data-item-id="clientes"]').click();
    await page.locator('[data-item-id="contactos"]').click();
    await page.waitForURL('**/contactos**');

    // THEN: No JavaScript runtime errors occurred
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P1] should not produce console errors during rapid navigation', async ({ page }) => {
    // GIVEN: Console error monitoring is active before navigation
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/clientes');

    // WHEN: User performs three rapid navigations
    await page.locator('[data-item-id="contactos"]').click();
    await page.locator('[data-item-id="clientes"]').click();
    await page.waitForURL('**/clientes**');

    // THEN: No console errors are emitted
    expect(consoleErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser back/forward history navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Browser history — back/forward navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should navigate back to /clientes when using browser back after going to /contactos', async ({
    page,
  }) => {
    // GIVEN: User starts at /clientes then navigates to /contactos
    await page.goto('/clientes');
    await page.locator('[data-item-id="contactos"]').click();
    await page.waitForURL('**/contactos**');

    // WHEN: User presses the browser back button
    await page.goBack();
    await page.waitForURL('**/clientes**');

    // THEN: URL returns to /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('[P1] should update active navigation item after browser back navigation', async ({
    page,
  }) => {
    // GIVEN: User navigates from /clientes to /contactos via nav item
    await page.goto('/clientes');
    await page.locator('[data-item-id="contactos"]').click();
    await page.waitForURL('**/contactos**');
    await expect(page.locator('[data-item-id="contactos"]')).toHaveAttribute('aria-current', 'page');

    // WHEN: User presses the browser back button
    await page.goBack();
    await page.waitForURL('**/clientes**');

    // THEN: The Clientes nav item becomes active again
    await expect(page.locator('[data-item-id="clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should navigate forward after browser back (history preserved)', async ({ page }) => {
    // GIVEN: User navigates from /clientes to /contactos and then goes back
    await page.goto('/clientes');
    await page.locator('[data-item-id="contactos"]').click();
    await page.waitForURL('**/contactos**');
    await page.goBack();
    await page.waitForURL('**/clientes**');

    // WHEN: User presses the browser forward button
    await page.goForward();
    await page.waitForURL('**/contactos**');

    // THEN: URL returns to /contactos (forward history preserved)
    expect(page.url()).toContain('/contactos');
  });

  test('[P1] should not cause full page reload on browser back navigation (SPA history)', async ({
    page,
  }) => {
    // GIVEN: Track document requests from the start
    const documentRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') documentRequests.push(req.url());
    });

    await page.goto('/clientes');
    const requestsAfterInitialLoad = documentRequests.length;

    // Navigate forward then back
    await page.locator('[data-item-id="contactos"]').click();
    await page.waitForURL('**/contactos**');
    await page.goBack();
    await page.waitForURL('**/clientes**');

    // THEN: No additional document requests were made (SPA — no hard reloads)
    expect(documentRequests.length).toBe(requestsAfterInitialLoad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active state correctness after in-app navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Active navigation state — correctness after route changes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should switch active item from Clientes to Contactos after navigation', async ({
    page,
  }) => {
    // GIVEN: User is at /clientes; Clientes is active
    await page.goto('/clientes');
    await expect(page.locator('[data-item-id="clientes"]')).toHaveAttribute('aria-current', 'page');

    // WHEN: User navigates to /contactos
    await page.locator('[data-item-id="contactos"]').click();
    await page.waitForURL('**/contactos**');

    // THEN: Contactos is now active and Clientes is no longer active
    await expect(page.locator('[data-item-id="contactos"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-item-id="clientes"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('[P1] should show Clientes as active after redirect from root /', async ({ page }) => {
    // GIVEN: User navigates to root / which redirects to /clientes
    await page.goto('/');
    await page.waitForURL('**/clientes**');

    // THEN: Clientes nav item is marked as active (redirect sets correct active state)
    await expect(page.locator('[data-item-id="clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('[P2] should not have both items active simultaneously', async ({ page }) => {
    // GIVEN: User navigates between routes
    await page.goto('/clientes');

    // WHEN: The navigation shell renders
    // THEN: Only one item is active at a time (mutual exclusivity)
    const clientesActive = await page
      .getByTestId('navigation-rail-item-clientes')
      .getAttribute('aria-current');
    const contactosActive = await page
      .getByTestId('navigation-rail-item-contactos')
      .getAttribute('aria-current');

    // At /clientes: clientes=page, contactos should not be page simultaneously
    const bothActive = clientesActive === 'page' && contactosActive === 'page';
    expect(bothActive).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 view back-link functionality
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] 404 view — back-link navigation behavior', () => {
  test('[P1] should navigate to /clientes when clicking the back link in the 404 view', async ({
    page,
  }) => {
    // GIVEN: User landed on an unknown route and sees the 404 view
    await page.goto('/unknown-route-xyz');
    await expect(page.getByTestId('not-found-back-link')).toBeVisible();

    // WHEN: User clicks the back link
    await page.getByTestId('not-found-back-link').click();
    await page.waitForURL('**/clientes**');

    // THEN: User is taken to /clientes (functional recovery link)
    expect(page.url()).toContain('/clientes');
  });

  test('[P1] should render the Clientes view (not 404) after clicking back link', async ({
    page,
  }) => {
    // GIVEN: User is on the 404 view
    await page.goto('/missing-page');

    // WHEN: User clicks the back link and arrives at /clientes
    await page.getByTestId('not-found-back-link').click();
    await page.waitForURL('**/clientes**');

    // THEN: The Clientes placeholder view is rendered (not still showing 404)
    await expect(page.getByTestId('clientes-placeholder')).toBeVisible();
    await expect(page.getByTestId('not-found-view')).not.toBeVisible();
  });

  test('[P2] should not crash when navigating back from 404 to known route', async ({ page }) => {
    // GIVEN: Runtime error monitoring is active
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    // WHEN: User visits an unknown route then uses the back link
    await page.goto('/this-does-not-exist');
    await page.getByTestId('not-found-back-link').click();
    await page.waitForURL('**/clientes**');

    // THEN: No runtime errors occurred during this navigation flow
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple unknown route formats — deeply nested, query string, hash
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] 404 — Multiple unknown route formats', () => {
  test('[P2] should display 404 view for deeply nested unknown route', async ({ page }) => {
    // GIVEN: A deeply nested route that does not exist
    // WHEN: User navigates to /a/b/c/d/e
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/a/b/c/d/e');

    // THEN: 404 view is shown without a crash
    await expect(page.getByTestId('not-found-view')).toBeVisible();
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should display 404 view for route with query parameters but no matching path', async ({
    page,
  }) => {
    // GIVEN: An unknown path with query parameters
    // WHEN: User navigates to /unknown?foo=bar&baz=qux
    await page.goto('/unknown?foo=bar&baz=qux');

    // THEN: 404 view is shown (query params do not match a valid route)
    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });

  test('[P2] should display 404 view for route with hash fragment but no matching path', async ({
    page,
  }) => {
    // GIVEN: An unknown path with a hash fragment
    // WHEN: User navigates to /nonexistent#section-one
    await page.goto('/nonexistent#section-one');

    // THEN: 404 view is shown
    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });

  test('[P2] should render the 404 view shell (heading visible) for an all-numeric unknown route', async ({
    page,
  }) => {
    // GIVEN: An unknown numeric-segment route (edge case for route matching)
    // WHEN: User navigates to /12345
    await page.goto('/12345');

    // THEN: 404 heading is visible
    await expect(page.getByTestId('not-found-heading')).toBeVisible();
    await expect(page.getByTestId('not-found-heading')).toContainText('Página no encontrada');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Console error monitoring across the navigation lifecycle
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Navigation lifecycle — no console errors', () => {
  test('[P1] should not emit console errors when loading /clientes directly', async ({ page }) => {
    // GIVEN: Console error monitoring active from the start
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // WHEN: User navigates directly to /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: No console errors during mount and render
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P1] should not emit console errors when loading /contactos directly', async ({ page }) => {
    // GIVEN: Console error monitoring active
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // WHEN: User navigates directly to /contactos
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: No console errors during mount and render
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P1] should not emit console errors when the index redirect / → /clientes executes', async ({
    page,
  }) => {
    // GIVEN: Console error monitoring active
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // WHEN: User navigates to root / (triggers redirect beforeLoad)
    await page.goto('/');
    await page.waitForURL('**/clientes**');
    await page.waitForLoadState('networkidle');

    // THEN: No console errors during redirect and mount
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P2] should not emit console errors when visiting an unknown route', async ({ page }) => {
    // GIVEN: Console error monitoring active
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // WHEN: User navigates to an unknown route
    await page.goto('/page-that-does-not-exist');
    await page.waitForLoadState('networkidle');

    // THEN: No console errors during 404 rendering
    expect(consoleErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile navigation — active state and additional tap scenarios
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Mobile NavigationBar — active state and additional edge cases', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P1] should highlight Contactos as active in NavigationBar when on /contactos', async ({
    page,
  }) => {
    // GIVEN: User navigates directly to /contactos on mobile
    await page.goto('/contactos');

    // THEN: The Contactos bar item is marked active (aria-current set by siesa-ui-kit)
    await expect(page.getByTestId('navigation-bar').getByText('Contactos')).toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should highlight Clientes as active in NavigationBar when on /clientes', async ({
    page,
  }) => {
    // GIVEN: User navigates directly to /clientes on mobile
    await page.goto('/clientes');

    // THEN: The Clientes bar item is marked active (aria-current set by siesa-ui-kit)
    await expect(page.getByTestId('navigation-bar').getByText('Clientes')).toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should navigate to /clientes when tapping Clientes in mobile NavigationBar', async ({
    page,
  }) => {
    // GIVEN: App is on /contactos on mobile
    const documentRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') documentRequests.push(req.url());
    });

    await page.goto('/contactos');
    const requestsAfterLoad = documentRequests.length;

    // WHEN: User taps the Clientes item in the NavigationBar
    await page.getByTestId('navigation-bar').getByText('Clientes').click();
    await page.waitForURL('**/clientes**');

    // THEN: URL changed to /clientes without a document reload
    expect(page.url()).toContain('/clientes');
    expect(documentRequests.length).toBe(requestsAfterLoad);
  });

  test('[P2] should not crash when tapping nav items rapidly on mobile', async ({ page }) => {
    // GIVEN: Runtime error monitoring active on mobile viewport
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/clientes');

    // WHEN: User taps rapidly between nav items
    await page.getByTestId('navigation-bar').getByText('Contactos').click();
    await page.getByTestId('navigation-bar').getByText('Clientes').click();
    await page.waitForURL('**/clientes**');

    // THEN: No runtime errors
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard accessibility — additional edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Keyboard accessibility — additional edge cases', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should navigate between rail items using Tab key (sequential focus order)', async ({
    page,
  }) => {
    // GIVEN: App is loaded at /clientes
    await page.goto('/clientes');

    // WHEN: User presses Tab twice from start of document
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // THEN: One of the navigation rail items has focus after two Tabs
    // (Both items should be reachable via sequential Tab navigation)
    const clientesFocused = await page
      .getByTestId('navigation-rail-item-clientes')
      .evaluate((el) => el === document.activeElement || el.contains(document.activeElement));
    const contactosFocused = await page
      .getByTestId('navigation-rail-item-contactos')
      .evaluate((el) => el === document.activeElement || el.contains(document.activeElement));

    expect(clientesFocused || contactosFocused).toBe(true);
  });

  test('[P1] should make mobile nav items reachable via Tab on mobile viewport', async ({
    page,
  }) => {
    // GIVEN: App loaded on mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/clientes');

    // WHEN: User presses Tab to move focus
    await page.keyboard.press('Tab');

    // THEN: One of the mobile navigation bar items receives focus
    // siesa-ui-kit NavigationBar renders items as <button> inside the <nav> container
    const navBarContainer = page.getByTestId('navigation-bar');
    const clientesFocused = await navBarContainer
      .getByText('Clientes')
      .evaluate((el) => el === document.activeElement || el.contains(document.activeElement));
    const contactosFocused = await navBarContainer
      .getByText('Contactos')
      .evaluate((el) => el === document.activeElement || el.contains(document.activeElement));

    expect(clientesFocused || contactosFocused).toBe(true);
  });

  test('[P2] focused navigation item should have a visible focus ring (not outline: none)', async ({
    page,
  }) => {
    // GIVEN: WCAG 2.1 AA requires visible focus indicators
    await page.goto('/clientes');
    await page.locator('[data-item-id="clientes"]').focus();

    // WHEN: The focused element is inspected for outline style
    const outlineStyle = await page
      .getByTestId('navigation-rail-item-clientes')
      .evaluate((el) => window.getComputedStyle(el).outlineStyle);

    // THEN: Outline is not explicitly hidden (none would be an accessibility failure)
    // Note: siesa-ui-kit may use box-shadow for focus rings — this checks for outline suppression
    expect(outlineStyle).not.toBe('none');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation shell structural integrity — data-testid presence
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Navigation shell — structural data-testid contracts', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] not-found view should have data-testid="not-found-view" on the container', async ({
    page,
  }) => {
    // GIVEN: E2E tests rely on data-testid="not-found-view" for assertions
    // WHEN: An unknown route is visited
    await page.goto('/does-not-exist');

    // THEN: The container has the expected test ID
    await expect(page.getByTestId('not-found-view')).toBeVisible();
  });

  test('[P1] not-found heading should have data-testid="not-found-heading"', async ({ page }) => {
    // GIVEN: E2E tests rely on data-testid="not-found-heading"
    await page.goto('/does-not-exist');

    // THEN: The heading element is addressable by its test ID
    await expect(page.getByTestId('not-found-heading')).toBeVisible();
  });

  test('[P1] not-found back link should have data-testid="not-found-back-link" and href="/clientes"', async ({
    page,
  }) => {
    // GIVEN: E2E tests rely on data-testid="not-found-back-link" with href contract
    await page.goto('/does-not-exist');

    const backLink = page.getByTestId('not-found-back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/clientes');
  });

  test('[P1] clientes placeholder should have data-testid="clientes-placeholder"', async ({
    page,
  }) => {
    // GIVEN: E2E AC3 tests rely on data-testid="clientes-placeholder"
    await page.goto('/clientes');

    await expect(page.getByTestId('clientes-placeholder')).toBeVisible();
  });

  test('[P1] contactos placeholder should have data-testid="contactos-placeholder"', async ({
    page,
  }) => {
    // GIVEN: E2E AC3 tests rely on data-testid="contactos-placeholder"
    await page.goto('/contactos');

    await expect(page.getByTestId('contactos-placeholder')).toBeVisible();
  });
});
