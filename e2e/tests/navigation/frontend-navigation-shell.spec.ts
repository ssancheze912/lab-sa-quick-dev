/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail (siesa-ui-kit) visible on left side, client-side navigation
 *   AC2 — Mobile NavigationBar at bottom, 44px touch targets
 *   AC3 — Deep linking to /clientes and /contactos renders correct view with active nav item
 *   AC4 — Unknown routes display a Spanish 404 view with link back to /clientes
 *   AC5 — Keyboard/screen-reader accessibility: Spanish aria-labels, Tab, Enter/Space
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail visible with client-side navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Desktop NavigationRail (viewport ≥ 1024px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should render NavigationRail on the left side on desktop viewport', async ({ page }) => {
    // GIVEN: Application loaded on desktop browser (viewport ≥ 1024px)
    // WHEN: The user views the app

    // Network-first: register response promise BEFORE navigation
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: NavigationRail is visible on the left side
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('should show "Clientes" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport is active
    // WHEN: The shell is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: "Clientes" nav entry is present
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should show "Contactos" entry in the NavigationRail on desktop', async ({ page }) => {
    // GIVEN: Desktop viewport is active
    // WHEN: The shell is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: "Contactos" nav entry is present
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test.fixme('should navigate to /clientes without full page reload when clicking Clientes entry', async ({ page }) => {
    // FIXME: Playwright v1.56 fires `framenavigated` for ALL navigation types including
    // history.pushState (SPA client-side navigation via TanStack Router). This makes it
    // impossible to distinguish a full document reload from a client-side navigation using
    // the framenavigated event alone. The test assertion `fullReloadDetected === false` will
    // always fail because TanStack Router's history-based navigation always triggers the event.
    // Resolution requires either: (1) modifying test assertions to not use framenavigated,
    // (2) switching to hash-based routing, or (3) upgrading to a Playwright version that
    // distinguishes pushState from document reloads.

    // GIVEN: User is on the app with desktop viewport
    // Network-first: intercept navigation BEFORE click
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // Track page navigation to ensure no full reload (no new document load)
    let fullReloadDetected = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        // A full reload would trigger framenavigated with a new document
        fullReloadDetected = true;
      }
    });

    // WHEN: User clicks the "Clientes" nav item
    await page.locator('[data-testid="nav-item-clientes"]').click();

    // THEN: URL changes to /clientes without full page reload
    await expect(page).toHaveURL('/clientes');
    // Client-side navigation means no actual document reload — the React app stays mounted
    expect(fullReloadDetected).toBe(false);
  });

  test.fixme('should navigate to /contactos without full page reload when clicking Contactos entry', async ({ page }) => {
    // FIXME: Playwright v1.56 fires `framenavigated` for ALL navigation types including
    // history.pushState (SPA client-side navigation via TanStack Router). This makes it
    // impossible to distinguish a full document reload from a client-side navigation using
    // the framenavigated event alone. The test assertion `fullReloadDetected === false` will
    // always fail because TanStack Router's history-based navigation always triggers the event.
    // Resolution requires either: (1) modifying test assertions to not use framenavigated,
    // (2) switching to hash-based routing, or (3) upgrading to a Playwright version that
    // distinguishes pushState from document reloads.

    // GIVEN: User is on /clientes
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // Track full reloads
    let fullReloadDetected = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullReloadDetected = true;
      }
    });

    // WHEN: User clicks the "Contactos" nav item
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: URL changes to /contactos without full page reload
    await expect(page).toHaveURL('/contactos');
    expect(fullReloadDetected).toBe(false);
  });

  test('should NOT show NavigationBar at bottom on desktop viewport', async ({ page }) => {
    // GIVEN: Desktop viewport ≥ 1024px
    // WHEN: The shell is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Mobile NavigationBar is hidden (not visible)
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar at bottom, 44px touch targets
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Mobile NavigationBar (viewport < 1024px)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 dimensions

  test('should render NavigationBar at bottom on mobile viewport', async ({ page }) => {
    // GIVEN: Application loaded on mobile browser (viewport < 1024px)
    // WHEN: The user views the app
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: NavigationBar is visible at the bottom
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('should show "Clientes" entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport is active
    // WHEN: The shell is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Clientes nav item is visible and tappable
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
  });

  test('should show "Contactos" entry in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport is active
    // WHEN: The shell is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Contactos nav item is visible and tappable
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });

  test('should have minimum 44px touch target height for Clientes nav item on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport is active
    // WHEN: The shell is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Clientes nav item meets minimum 44px touch target requirement (WCAG 2.5.5)
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    const boundingBox = await clientesItem.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should have minimum 44px touch target height for Contactos nav item on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport is active
    // WHEN: The shell is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: Contactos nav item meets minimum 44px touch target requirement
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const boundingBox = await contactosItem.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should NOT show NavigationRail on mobile viewport', async ({ page }) => {
    // GIVEN: Mobile viewport < 1024px
    // WHEN: The shell is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: NavigationRail is hidden (not visible on mobile)
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep linking renders correct view with active nav item
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep linking to /clientes and /contactos', () => {
  test('should render ClientesView when navigating directly to /clientes via URL', async ({ page }) => {
    // GIVEN: User types /clientes in the browser URL bar
    // Network-first: prepare before navigation
    const appLoad = page.waitForLoadState('networkidle');

    // WHEN: The page loads at /clientes directly
    await page.goto('/clientes');
    await appLoad;

    // THEN: The Clientes view is rendered
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should NOT redirect to home screen when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: User types /clientes in the URL bar
    // WHEN: The page loads
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The URL remains /clientes (no redirect to a different path)
    await expect(page).toHaveURL('/clientes');
  });

  test('should render ContactosView when navigating directly to /contactos via URL', async ({ page }) => {
    // GIVEN: User types /contactos in the browser URL bar
    // WHEN: The page loads at /contactos directly
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // THEN: The Contactos view is rendered
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });

  test('should NOT redirect to home screen when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: User types /contactos in the URL bar
    // WHEN: The page loads
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    // THEN: The URL remains /contactos (no redirect)
    await expect(page).toHaveURL('/contactos');
  });

  test('should mark Clientes nav item as active when on /clientes', async ({ page }) => {
    // GIVEN: User navigates directly to /clientes
    // WHEN: The shell renders
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The Clientes nav item has active state
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('should mark Contactos nav item as active when on /contactos', async ({ page }) => {
    // GIVEN: User navigates directly to /contactos
    // WHEN: The shell renders
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // THEN: The Contactos nav item has active state
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 not-found view with Spanish message and back link
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — 404 Not-Found view for unknown routes', () => {
  test('should display the 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    // WHEN: The page loads at /unknown
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/unknown-route-that-does-not-exist');
    await appLoad;

    // THEN: The not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display Spanish "Página no encontrada" message on unknown route', async ({ page }) => {
    // GIVEN: The user navigates to /ruta-inexistente
    // WHEN: The page loads
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/ruta-inexistente');
    await appLoad;

    // THEN: Spanish not-found message is shown
    await expect(page.locator('[data-testid="not-found-title"]')).toHaveText('Página no encontrada');
  });

  test('should display a link back to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The user is on an unknown route
    // WHEN: The 404 view is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/ruta-inexistente');
    await appLoad;

    // THEN: A link back to /clientes is present
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
  });

  test('should navigate to /clientes when clicking the back link on the 404 view', async ({ page }) => {
    // GIVEN: The user is on an unknown route and sees the 404 view
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/ruta-inexistente');
    await appLoad;

    // WHEN: The user clicks "← Ir a Clientes"
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: The user is navigated to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Keyboard and screen-reader accessibility (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Keyboard and screen-reader accessibility', () => {
  test('should have Spanish aria-label on Clientes nav item', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    // WHEN: A screen reader inspects the Clientes nav item
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The Clientes nav item has Spanish aria-label "Ir a Clientes"
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  test('should have Spanish aria-label on Contactos nav item', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    // WHEN: A screen reader inspects the Contactos nav item
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // THEN: The Contactos nav item has Spanish aria-label "Ir a Contactos"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-label', 'Ir a Contactos');
  });

  test('should make Clientes nav item reachable via Tab key', async ({ page }) => {
    // GIVEN: The navigation shell is rendered
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/clientes');
    await appLoad;

    // WHEN: Keyboard user presses Tab multiple times
    // Focus starts at body, tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // THEN: The Clientes nav item can receive focus (tab-index ≥ 0)
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    // Verify the element has a non-negative tabindex (or is naturally focusable)
    const tabIndex = await clientesItem.getAttribute('tabindex');
    // Either it's naturally focusable (null tabindex) or explicitly set
    expect(tabIndex === null || parseInt(tabIndex) >= 0).toBe(true);
  });

  test('should activate Clientes nav item via Enter key when focused', async ({ page }) => {
    // GIVEN: The Clientes nav item has keyboard focus
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    // Focus the nav item directly
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await clientesItem.focus();

    // WHEN: User presses Enter key
    await page.keyboard.press('Enter');

    // THEN: Navigation occurs to /clientes
    await expect(page).toHaveURL('/clientes');
  });

  test('should activate Clientes nav item via Space key when focused', async ({ page }) => {
    // GIVEN: The Clientes nav item has keyboard focus
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/contactos');
    await appLoad;

    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await clientesItem.focus();

    // WHEN: User presses Space key
    await page.keyboard.press('Space');

    // THEN: Navigation occurs to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});
