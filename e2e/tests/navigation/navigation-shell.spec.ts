/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail (siesa-ui-kit) visible at >= 1024px with Clientes/Contactos entries
 *   AC2 — Mobile NavigationBar visible at < 1024px with minimum 44px touch targets
 *   AC3 — Deep linking: direct URL access to /clientes and /contactos renders correct view with active nav
 *   AC4 — Client-side navigation: no full page reload when navigating between routes
 *   AC5 — Unknown route shows 404 not-found view with Spanish message and back link
 *   AC6 — Root path / redirects automatically to /clientes
 *   AC7 — Accessibility: ARIA labels in Spanish, nav landmark marked correctly
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport >= 1024px)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail visible at >= 1024px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the app shell wrapper on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // WHEN: The user navigates to the root URL
    await page.goto('/clientes');

    // THEN: The app-shell wrapper is visible
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('should display NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A NavigationRail component is visible (siesa-ui-kit renders data-testid="navigation-rail")
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should show Clientes entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail visible
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationRail contains a Clientes navigation entry
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"]')
    ).toBeVisible();
  });

  test('should show Contactos entry in the NavigationRail', async ({ page }) => {
    // GIVEN: Desktop viewport with NavigationRail visible
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationRail contains a Contactos navigation entry
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]')
    ).toBeVisible();
  });

  test('should navigate to /clientes without full page reload when Clientes entry is clicked', async ({ page }) => {
    // GIVEN: Desktop viewport, user is already on /contactos
    await page.goto('/contactos');

    // Network-first: intercept document requests BEFORE clicking (full page reload = new HTML document request)
    const htmlRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        htmlRequests.push(req.url());
      }
    });

    // WHEN: User clicks the Clientes navigation entry
    await page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"]').click();

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL('/clientes');

    // AND: No full page reload occurred (no new HTML document request)
    const reloadRequests = htmlRequests.filter((url) => url.includes('localhost:5173'));
    expect(reloadRequests).toHaveLength(0);
  });

  test('should navigate to /contactos without full page reload when Contactos entry is clicked', async ({ page }) => {
    // GIVEN: Desktop viewport, user is on /clientes
    await page.goto('/clientes');

    // Network-first: intercept document requests BEFORE clicking
    const htmlRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        htmlRequests.push(req.url());
      }
    });

    // WHEN: User clicks the Contactos navigation entry
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');

    // AND: No full page reload occurred
    const reloadRequests = htmlRequests.filter((url) => url.includes('localhost:5173'));
    expect(reloadRequests).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar visible at < 1024px with 44px touch targets
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar visible at < 1024px', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 equivalent

  test('should display NavigationBar at the bottom on mobile viewport', async ({ page }) => {
    // GIVEN: The application is loaded on a mobile browser viewport (< 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: A NavigationBar component is visible at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should NOT display NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport (< 1024px)
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: The NavigationRail is hidden (not visible, may still be in DOM)
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should show Clientes entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar visible
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar contains a Clientes navigation entry
    await expect(
      page.locator('[data-testid="navigation-bar"] [aria-label="Clientes"]')
    ).toBeVisible();
  });

  test('should show Contactos entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar visible
    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar contains a Contactos navigation entry
    await expect(
      page.locator('[data-testid="navigation-bar"] [aria-label="Contactos"]')
    ).toBeVisible();
  });

  test('should have Clientes navigation item with minimum 44px touch target height', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar visible
    // WHEN: The user views the Clientes navigation item
    await page.goto('/clientes');

    const clientesItem = page.locator('[data-testid="navigation-bar"] [aria-label="Clientes"]');

    // THEN: The touch target height is at least 44px (WCAG 2.5.5)
    const box = await clientesItem.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should have Contactos navigation item with minimum 44px touch target height', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar visible
    // WHEN: The user views the Contactos navigation item
    await page.goto('/clientes');

    const contactosItem = page.locator('[data-testid="navigation-bar"] [aria-label="Contactos"]');

    // THEN: The touch target height is at least 44px (WCAG 2.5.5)
    const box = await contactosItem.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking: direct URL access renders correct view with active nav state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking to /clientes and /contactos', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render the clientes view when /clientes is accessed directly', async ({ page }) => {
    // GIVEN: The user types /clientes directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should render the contactos view when /contactos is accessed directly', async ({ page }) => {
    // GIVEN: The user types /contactos directly in the browser URL bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The contactos view is rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should mark Clientes navigation item as active when on /clientes route', async ({ page }) => {
    // GIVEN: The user navigates directly to /clientes
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The Clientes navigation item has aria-current="page"
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"][aria-current="page"]')
    ).toBeVisible();
  });

  test('should mark Contactos navigation item as active when on /contactos route', async ({ page }) => {
    // GIVEN: The user navigates directly to /contactos
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The Contactos navigation item has aria-current="page"
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"][aria-current="page"]')
    ).toBeVisible();
  });

  test('should NOT redirect to home when /clientes is accessed directly', async ({ page }) => {
    // GIVEN: The user types /clientes in the browser address bar
    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The URL remains /clientes (no redirect to home or other path)
    await expect(page).toHaveURL('/clientes');
  });

  test('should NOT redirect to home when /contactos is accessed directly', async ({ page }) => {
    // GIVEN: The user types /contactos in the browser address bar
    // WHEN: The page loads
    await page.goto('/contactos');

    // THEN: The URL remains /contactos (no redirect to home or other path)
    await expect(page).toHaveURL('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Active state updates when navigating between routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Active navigation state updates on route change', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should update active state to Contactos after clicking Contactos from /clientes', async ({ page }) => {
    // GIVEN: The user is on the /clientes route
    await page.goto('/clientes');

    // WHEN: They click the Contactos navigation item
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();

    // THEN: The URL changes to /contactos
    await expect(page).toHaveURL('/contactos');

    // AND: The Contactos navigation item is now marked as active
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"][aria-current="page"]')
    ).toBeVisible();
  });

  test('should remove active state from Clientes after navigating to Contactos', async ({ page }) => {
    // GIVEN: The user is on /clientes (Clientes is active)
    await page.goto('/clientes');

    // WHEN: They click the Contactos navigation item
    await page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: The Clientes navigation item is NO longer marked as active
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"][aria-current="page"]')
    ).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Unknown route shows 404 not-found view with Spanish message
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — 404 not-found view for unknown routes', () => {
  test('should display the not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads
    await page.goto('/ruta-inexistente');

    // THEN: A 404 / not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display a Spanish-language not-found message', async ({ page }) => {
    // GIVEN: The user navigates to a non-existent route
    // WHEN: The page loads
    await page.goto('/ruta-inexistente');

    // THEN: A Spanish-language "Página no encontrada" message is shown
    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('Página no encontrada');
  });

  test('should show a back link to /clientes on the 404 page', async ({ page }) => {
    // GIVEN: The user lands on the 404 page
    // WHEN: The page renders
    await page.goto('/ruta-inexistente');

    // THEN: A link to /clientes is visible ("Ir a Clientes")
    await expect(
      page.locator('[data-testid="not-found-view"] a[href="/clientes"]')
    ).toBeVisible();
  });

  test('should navigate to /clientes when the back link on the 404 page is clicked', async ({ page }) => {
    // GIVEN: The user is on the 404 page
    await page.goto('/ruta-inexistente');

    // WHEN: They click the "Ir a Clientes" back link
    await page.locator('[data-testid="not-found-view"] a[href="/clientes"]').click();

    // THEN: The user is taken to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Root path / redirects automatically to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Root path / redirects to /clientes', () => {
  test('should redirect / to /clientes automatically', async ({ page }) => {
    // GIVEN: The root path / is accessed
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The user is automatically redirected to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('should render the clientes view after root redirect', async ({ page }) => {
    // GIVEN: The root path / is accessed
    // WHEN: The redirect resolves
    await page.goto('/');
    await expect(page).toHaveURL('/clientes');

    // THEN: The clientes view is rendered (not a blank page)
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Accessibility: ARIA labels in Spanish, nav landmark
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Accessibility: ARIA labels in Spanish and nav landmark', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have a nav landmark with aria-label="Navegación principal"', async ({ page }) => {
    // GIVEN: The application shell is rendered
    // WHEN: Any screen reader traverses the navigation
    await page.goto('/clientes');

    // THEN: The navigation landmark is marked with aria-label="Navegación principal"
    await expect(
      page.locator('nav[aria-label="Navegación principal"]')
    ).toBeVisible();
  });

  test('should have Spanish aria-label on the Clientes navigation item (desktop)', async ({ page }) => {
    // GIVEN: The application is rendered on desktop
    // WHEN: The screen reader traverses the navigation
    await page.goto('/clientes');

    // THEN: The Clientes item has aria-label="Clientes" in Spanish
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Clientes"]')
    ).toBeVisible();
  });

  test('should have Spanish aria-label on the Contactos navigation item (desktop)', async ({ page }) => {
    // GIVEN: The application is rendered on desktop
    // WHEN: The screen reader traverses the navigation
    await page.goto('/clientes');

    // THEN: The Contactos item has aria-label="Contactos" in Spanish
    await expect(
      page.locator('[data-testid="navigation-rail"] [aria-label="Contactos"]')
    ).toBeVisible();
  });

  test('should have Spanish aria-label on the Clientes navigation item (mobile)', async ({ page }) => {
    // GIVEN: The application is rendered on mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    // WHEN: The user views the NavigationBar
    await page.goto('/clientes');

    // THEN: The Clientes item in NavigationBar has aria-label="Clientes"
    await expect(
      page.locator('[data-testid="navigation-bar"] [aria-label="Clientes"]')
    ).toBeVisible();
  });

  test('should have Spanish aria-label on the Contactos navigation item (mobile)', async ({ page }) => {
    // GIVEN: The application is rendered on mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    // WHEN: The user views the NavigationBar
    await page.goto('/clientes');

    // THEN: The Contactos item in NavigationBar has aria-label="Contactos"
    await expect(
      page.locator('[data-testid="navigation-bar"] [aria-label="Contactos"]')
    ).toBeVisible();
  });

  test('should have all interactive navigation elements reachable via keyboard Tab', async ({ page }) => {
    // GIVEN: The application shell is rendered on desktop
    await page.goto('/clientes');

    // WHEN: The user presses Tab to navigate the page
    await page.keyboard.press('Tab');

    // THEN: Focus lands on a navigation element (Clientes or Contactos)
    const focusedElement = page.locator(':focus');
    const ariaLabel = await focusedElement.getAttribute('aria-label');
    // The focused element should be a navigation item — Clientes or Contactos (or skip-link)
    // Implementation must ensure Tab key reaches navigation items
    expect(ariaLabel).toBeTruthy();
  });
});
