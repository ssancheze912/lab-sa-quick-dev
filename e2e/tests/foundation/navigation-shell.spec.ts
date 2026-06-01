/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail visible on left with Clientes/Contactos, SPA navigation
 *   AC2 — Mobile: NavigationBar at bottom (viewport < 1024px), all items accessible
 *   AC3 — Deep linking: direct URL navigation renders correct view, active item highlighted
 *   AC4 — Unknown route shows graceful 404 view (no blank screen or JS crash)
 *   AC5 — Navigation between /clientes and /contactos is SPA (no full page reload)
 *   AC6 — Keyboard accessibility: Enter/Space triggers navigation on focused nav items
 */

import { test, expect } from '../../fixtures/base.fixture';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail visible on left with Clientes and Contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: Application is loaded on a desktop browser (≥ 1024px width)
    // WHEN: The user views the app at /clientes
    await page.goto('/clientes');

    // THEN: NavigationRail is visible on the left side
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });

  test('should show "Clientes" navigation entry in the desktop NavigationRail', async ({ page }) => {
    // GIVEN: Application is loaded on a desktop browser
    // WHEN: The user views the NavigationRail
    await page.goto('/clientes');

    // THEN: A Clientes navigation item is present in the rail
    await expect(page.locator('[data-item-id="clientes"]')).toBeVisible();
  });

  test('should show "Contactos" navigation entry in the desktop NavigationRail', async ({ page }) => {
    // GIVEN: Application is loaded on a desktop browser
    // WHEN: The user views the NavigationRail
    await page.goto('/clientes');

    // THEN: A Contactos navigation item is present in the rail
    await expect(page.locator('[data-item-id="contactos"]')).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when clicking Clientes in rail', async ({
    page,
  }) => {
    // GIVEN: The app is loaded on desktop at /contactos
    // Network-first: monitor navigations BEFORE any action
    const navigationRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        navigationRequests.push(req.url());
      }
    });

    await page.goto('/contactos');
    const initialDocRequests = navigationRequests.length;

    // WHEN: User clicks the Clientes item in the NavigationRail
    await page.locator('[data-item-id="clientes"]').click();
    await page.waitForURL('**/clientes**');

    // THEN: URL changed to /clientes and no new document request was made (SPA behavior)
    expect(page.url()).toContain('/clientes');
    expect(navigationRequests.length).toBe(initialDocRequests);
  });

  test('should navigate to /contactos without full page reload when clicking Contactos in rail', async ({
    page,
  }) => {
    // GIVEN: The app is loaded on desktop at /clientes
    // Network-first: monitor navigations BEFORE any action
    const navigationRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        navigationRequests.push(req.url());
      }
    });

    await page.goto('/clientes');
    const initialDocRequests = navigationRequests.length;

    // WHEN: User clicks the Contactos item in the NavigationRail
    await page.locator('[data-item-id="contactos"]').click();
    await page.waitForURL('**/contactos**');

    // THEN: URL changed to /contactos and no new document request was made (SPA behavior)
    expect(page.url()).toContain('/contactos');
    expect(navigationRequests.length).toBe(initialDocRequests);
  });

  test('should NOT display NavigationBar (mobile) on desktop viewport', async ({ page }) => {
    // GIVEN: Application loaded on desktop (≥ 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: Mobile NavigationBar is not visible at desktop breakpoint
    await expect(page.getByTestId('navigation-bar')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar at bottom (viewport < 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should display NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: Application is loaded on a mobile browser (width < 1024px)
    // WHEN: The user views the app at /clientes
    await page.goto('/clientes');

    // THEN: NavigationBar is visible at the bottom
    await expect(page.getByTestId('navigation-bar')).toBeVisible();
  });

  test('should show "Clientes" item in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Application loaded on mobile viewport
    // WHEN: The user views the NavigationBar
    await page.goto('/clientes');

    // THEN: Clientes item is accessible in the NavigationBar
    await expect(page.getByTestId('navigation-bar').getByText('Clientes')).toBeVisible();
  });

  test('should show "Contactos" item in the mobile NavigationBar', async ({ page }) => {
    // GIVEN: Application loaded on mobile viewport
    // WHEN: The user views the NavigationBar
    await page.goto('/clientes');

    // THEN: Contactos item is accessible in the NavigationBar
    await expect(page.getByTestId('navigation-bar').getByText('Contactos')).toBeVisible();
  });

  test('should navigate to /contactos when tapping Contactos in mobile NavigationBar', async ({
    page,
  }) => {
    // GIVEN: App is loaded on mobile at /clientes
    // Network-first: monitor document requests BEFORE action
    const navigationRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        navigationRequests.push(req.url());
      }
    });

    await page.goto('/clientes');
    const initialDocRequests = navigationRequests.length;

    // WHEN: User taps the Contactos item in the NavigationBar
    await page.getByTestId('navigation-bar').getByText('Contactos').click();
    await page.waitForURL('**/contactos**');

    // THEN: URL changed to /contactos without a full page reload
    expect(page.url()).toContain('/contactos');
    expect(navigationRequests.length).toBe(initialDocRequests);
  });

  test('should NOT display NavigationRail (desktop) on mobile viewport', async ({ page }) => {
    // GIVEN: Application loaded on mobile (< 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: Desktop NavigationRail is not visible at mobile breakpoint
    await expect(page.getByTestId('navigation-rail')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL navigation renders correct view + active item
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking and active navigation state', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the Clientes view when navigating directly to /clientes', async ({
    page,
  }) => {
    // GIVEN: User types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes placeholder view is rendered (not redirected elsewhere)
    await expect(page.getByTestId('clientes-placeholder')).toBeVisible();
  });

  test('should render the Contactos view when navigating directly to /contactos', async ({
    page,
  }) => {
    // GIVEN: User types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos placeholder view is rendered (not redirected elsewhere)
    await expect(page.getByTestId('contactos-placeholder')).toBeVisible();
  });

  test('should highlight the Clientes nav item as active when on /clientes', async ({ page }) => {
    // GIVEN: User navigates directly to /clientes
    // WHEN: The page loads and navigation renders
    await page.goto('/clientes');

    // THEN: The Clientes navigation item has the active indicator
    await expect(page.locator('[data-item-id="clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight the Contactos nav item as active when on /contactos', async ({ page }) => {
    // GIVEN: User navigates directly to /contactos
    // WHEN: The page loads and navigation renders
    await page.goto('/contactos');

    // THEN: The Contactos navigation item has the active indicator
    await expect(page.locator('[data-item-id="contactos"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('should redirect root / to /clientes automatically', async ({ page }) => {
    // GIVEN: User navigates to the root URL /
    // Network-first: setup BEFORE navigation
    await page.goto('/');

    // WHEN: Router processes the index route
    await page.waitForURL('**/clientes**');

    // THEN: User is redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Unknown route shows graceful 404 view
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not Found graceful view', () => {
  test('should display the not-found view when navigating to an unknown route', async ({
    page,
  }) => {
    // GIVEN: User navigates to a route that does not exist in the application
    // WHEN: The page loads
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/unknown-route-that-does-not-exist');

    // THEN: A graceful not-found view is rendered — no blank screen
    await expect(page.getByTestId('not-found-view')).toBeVisible();
    expect(runtimeErrors).toHaveLength(0);
  });

  test('should display "Página no encontrada" heading in the not-found view', async ({ page }) => {
    // GIVEN: User navigates to an unknown route
    // WHEN: The not-found component renders
    await page.goto('/this-route-does-not-exist');

    // THEN: The user sees the Spanish not-found message
    await expect(page.getByTestId('not-found-heading')).toContainText('Página no encontrada');
  });

  test('should display a back link to /clientes in the not-found view', async ({ page }) => {
    // GIVEN: The not-found view is rendered
    // WHEN: User looks for a way to return to the application
    await page.goto('/completely-unknown-path');

    // THEN: A link back to /clientes is visible and has the correct href
    const backLink = page.getByTestId('not-found-back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/clientes');
  });

  test('should not crash the application shell on unknown route (navigation shell remains visible)', async ({
    page,
  }) => {
    // GIVEN: App shell is loaded with navigation
    // WHEN: User navigates to an unknown route
    await page.goto('/unknown-route-that-does-not-exist');

    // THEN: The navigation shell (NavigationRail or NavigationBar) is still visible
    // (not a blank screen or JS crash — the shell wraps the 404 view)
    const shellVisible =
      (await page.getByTestId('navigation-rail').isVisible()) ||
      (await page.getByTestId('navigation-bar').isVisible());
    expect(shellVisible).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — SPA navigation: no full page reload between /clientes and /contactos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — SPA navigation (no full page reload)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should not trigger a document reload when navigating from /clientes to /contactos', async ({
    page,
  }) => {
    // GIVEN: App is on /clientes (desktop)
    // Network-first: track document requests BEFORE first navigation
    const documentNavigations: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        documentNavigations.push(req.url());
      }
    });

    await page.goto('/clientes');
    const documentRequestsAfterInitialLoad = documentNavigations.length;

    // WHEN: User clicks Contactos in the NavigationRail
    await page.locator('[data-item-id="contactos"]').click();
    await page.waitForURL('**/contactos**');

    // THEN: No additional document request was made (pure client-side routing)
    expect(documentNavigations.length).toBe(documentRequestsAfterInitialLoad);
  });

  test('should not trigger a document reload when navigating from /contactos to /clientes', async ({
    page,
  }) => {
    // GIVEN: App is on /contactos (desktop)
    // Network-first: track document requests BEFORE first navigation
    const documentNavigations: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        documentNavigations.push(req.url());
      }
    });

    await page.goto('/contactos');
    const documentRequestsAfterInitialLoad = documentNavigations.length;

    // WHEN: User clicks Clientes in the NavigationRail
    await page.locator('[data-item-id="clientes"]').click();
    await page.waitForURL('**/clientes**');

    // THEN: No additional document request was made (pure client-side routing)
    expect(documentNavigations.length).toBe(documentRequestsAfterInitialLoad);
  });

  test('should preserve the navigation shell across route changes (shell is not remounted)', async ({
    page,
  }) => {
    // GIVEN: App is loaded at /clientes with navigation shell visible
    await page.goto('/clientes');
    await expect(page.getByTestId('navigation-rail')).toBeVisible();

    // WHEN: User navigates to /contactos
    await page.locator('[data-item-id="contactos"]').click();
    await page.waitForURL('**/contactos**');

    // THEN: NavigationRail is still present (not destroyed and remounted — shell persists)
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Keyboard accessibility: Enter/Space triggers navigation on focused items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Keyboard accessibility (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos when pressing Enter on focused Contactos rail item', async ({
    page,
  }) => {
    // GIVEN: App is at /clientes and Contactos nav item is focused via keyboard
    await page.goto('/clientes');
    await page.locator('[data-item-id="contactos"]').focus();

    // WHEN: User presses Enter on the focused navigation item
    await page.keyboard.press('Enter');
    await page.waitForURL('**/contactos**');

    // THEN: Navigation occurs to /contactos
    expect(page.url()).toContain('/contactos');
  });

  test('should navigate to /contactos when pressing Space on focused Contactos rail item', async ({
    page,
  }) => {
    // GIVEN: App is at /clientes and Contactos nav item is focused via keyboard
    await page.goto('/clientes');
    await page.locator('[data-item-id="contactos"]').focus();

    // WHEN: User presses Space on the focused navigation item
    await page.keyboard.press('Space');
    await page.waitForURL('**/contactos**');

    // THEN: Navigation occurs to /contactos
    expect(page.url()).toContain('/contactos');
  });

  test('should navigate to /clientes when pressing Enter on focused Clientes rail item', async ({
    page,
  }) => {
    // GIVEN: App is at /contactos and Clientes nav item is focused via keyboard
    await page.goto('/contactos');
    await page.locator('[data-item-id="clientes"]').focus();

    // WHEN: User presses Enter on the focused navigation item
    await page.keyboard.press('Enter');
    await page.waitForURL('**/clientes**');

    // THEN: Navigation occurs to /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('should make NavigationRail items reachable via Tab key', async ({ page }) => {
    // GIVEN: App is loaded on desktop
    // WHEN: User navigates using Tab key from the start of the document
    await page.goto('/clientes');
    await page.keyboard.press('Tab');

    // THEN: One of the navigation rail items receives focus (keyboard navigable)
    const clientesFocused = await page
      .getByTestId('navigation-rail-item-clientes')
      .evaluate((el) => el === document.activeElement || el.contains(document.activeElement));
    const contactosFocused = await page
      .getByTestId('navigation-rail-item-contactos')
      .evaluate((el) => el === document.activeElement || el.contains(document.activeElement));

    expect(clientesFocused || contactosFocused).toBe(true);
  });
});
