/**
 * Story 1.2: Frontend Navigation Shell — Edge Case & Boundary E2E Tests
 *
 * Expands ATDD coverage with:
 * - Viewport boundary conditions at exact breakpoint (1023px / 1024px)
 * - Runtime in-page viewport resize nav transitions
 * - Keyboard Enter activation of nav links
 * - Not-found back link navigates to /clientes
 * - Multiple successive SPA navigations: zero document fetches
 * - Root redirect preserves SPA behaviour (no page reload)
 * - Deep-link URL bar access at various paths
 * - Browser back/forward history button SPA navigation
 */

import { test, expect } from '@playwright/test';

// ─── Viewport Boundary Conditions ────────────────────────────────────────────

test.describe('Viewport boundary: exact breakpoint (1023px vs 1024px)', () => {
  test('should show NavigationRail at exactly 1024px (desktop boundary inclusive)', async ({
    page,
  }) => {
    // GIVEN: Viewport is exactly at the desktop breakpoint
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/clientes');

    // THEN: NavigationRail visible, NavigationBar absent
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });

  test('should show NavigationBar at exactly 1023px (mobile boundary exclusive)', async ({
    page,
  }) => {
    // GIVEN: Viewport is one pixel below the desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 800 });
    await page.goto('/clientes');

    // THEN: NavigationBar visible, NavigationRail absent
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('should show NavigationBar at 320px (minimum mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/clientes');

    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });
});

// ─── In-Page Viewport Resize Transitions ─────────────────────────────────────

test.describe('In-page viewport resize transitions', () => {
  test('NavigationRail should switch to NavigationBar on resize from desktop to mobile', async ({
    page,
  }) => {
    // GIVEN: App loaded at desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: Viewport resizes to mobile
    await page.setViewportSize({ width: 375, height: 812 });

    // THEN: NavigationBar appears, NavigationRail disappears
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('NavigationBar should switch to NavigationRail on resize from mobile to desktop', async ({
    page,
  }) => {
    // GIVEN: App loaded at mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/clientes');
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();

    // WHEN: Viewport resizes to desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    // THEN: NavigationRail appears, NavigationBar disappears
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });

  test('nav items should remain accessible after resize', async ({ page }) => {
    // GIVEN: Desktop, then resized to mobile
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');
    await page.setViewportSize({ width: 375, height: 812 });

    // THEN: Both nav items still visible in NavigationBar
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeVisible();
  });
});

// ─── Keyboard Activation ──────────────────────────────────────────────────────

test.describe('Keyboard: Enter key activates navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos when Enter is pressed on the focused Contactos link', async ({
    page,
  }) => {
    // GIVEN: Desktop app on /clientes
    await page.goto('/clientes');

    // WHEN: Focus the Contactos link and press Enter
    await page.locator('[data-testid="nav-item-contactos"]').focus();
    await page.keyboard.press('Enter');

    // THEN: URL changes to /contactos
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-placeholder"]')).toBeVisible();
  });

  test('should navigate to /clientes when Enter is pressed on the focused Clientes link', async ({
    page,
  }) => {
    // GIVEN: Desktop app on /contactos
    await page.goto('/contactos');

    // WHEN: Focus the Clientes link and press Enter
    await page.locator('[data-testid="nav-item-clientes"]').focus();
    await page.keyboard.press('Enter');

    // THEN: URL changes to /clientes
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-placeholder"]')).toBeVisible();
  });

  test('Enter key navigation should not trigger a full page reload', async ({ page }) => {
    // GIVEN: Desktop, on /clientes
    await page.goto('/clientes');

    let fullPageReloadCount = 0;
    page.on('request', (req) => {
      if (req.resourceType() === 'document') fullPageReloadCount++;
    });

    // WHEN: Press Enter on the Contactos link
    await page.locator('[data-testid="nav-item-contactos"]').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/contactos');

    // THEN: No document request was fired
    expect(fullPageReloadCount).toBe(0);
  });
});

// ─── Not-Found Back Link ──────────────────────────────────────────────────────

test.describe('Not-found back link behaviour', () => {
  test('clicking the back link from 404 page should navigate to /clientes', async ({ page }) => {
    // GIVEN: User is on the 404 page
    await page.goto('/a-totally-nonexistent-route');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    // WHEN: User clicks the back link
    await page.locator('[data-testid="not-found-back-link"]').click();

    // THEN: Navigates to /clientes
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-placeholder"]')).toBeVisible();
  });

  test('back link navigation from 404 should NOT trigger a full page reload', async ({ page }) => {
    // GIVEN: User is on the 404 page
    await page.goto('/not-found-route');
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();

    let fullPageReloadCount = 0;
    page.on('request', (req) => {
      if (req.resourceType() === 'document') fullPageReloadCount++;
    });

    // WHEN: Clicks back link
    await page.locator('[data-testid="not-found-back-link"]').click();
    await expect(page).toHaveURL('/clientes');

    // THEN: No full page reload
    expect(fullPageReloadCount).toBe(0);
  });

  test('should display 404 view for deeply nested unknown path', async ({ page }) => {
    // GIVEN: User navigates to a deeply nested unknown path
    await page.goto('/a/b/c/d/not/a/real/route');

    // THEN: 404 view is displayed with Spanish message
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText(
      'Página no encontrada',
    );
  });
});

// ─── Multiple Successive SPA Navigations ──────────────────────────────────────

test.describe('Multiple successive SPA navigations: zero full page reloads', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('three successive nav clicks should not trigger any document requests', async ({ page }) => {
    // GIVEN: App at /clientes
    await page.goto('/clientes');

    let fullPageReloadCount = 0;
    page.on('request', (req) => {
      if (req.resourceType() === 'document') fullPageReloadCount++;
    });

    // WHEN: Navigate clientes → contactos → clientes → contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    await page.locator('[data-testid="nav-item-clientes"]').click();
    await expect(page).toHaveURL('/clientes');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: No document requests were fired during any of the SPA navigations
    expect(fullPageReloadCount).toBe(0);
  });

  test('active state updates correctly across multiple successive navigations', async ({ page }) => {
    // GIVEN: App at /clientes
    await page.goto('/clientes');

    // Clientes is initially active
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );

    // Navigate to contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );

    // Navigate back to clientes
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

// ─── Browser History: Back / Forward Navigation ───────────────────────────────

test.describe('Browser back/forward history', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('browser back button should return to previous route without a full page reload', async ({
    page,
  }) => {
    // GIVEN: User navigates from /clientes to /contactos
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    let fullPageReloadCount = 0;
    page.on('request', (req) => {
      if (req.resourceType() === 'document') fullPageReloadCount++;
    });

    // WHEN: User presses browser back
    await page.goBack();

    // THEN: Returns to /clientes without a full page reload
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-placeholder"]')).toBeVisible();
    expect(fullPageReloadCount).toBe(0);
  });

  test('browser forward button should restore next route without a full page reload', async ({
    page,
  }) => {
    // GIVEN: User navigated forward then used back button
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    let fullPageReloadCount = 0;
    page.on('request', (req) => {
      if (req.resourceType() === 'document') fullPageReloadCount++;
    });

    // WHEN: User presses browser forward
    await page.goForward();

    // THEN: Returns to /contactos without a full page reload
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-placeholder"]')).toBeVisible();
    expect(fullPageReloadCount).toBe(0);
  });

  test('active nav state should reflect current route after browser back navigation', async ({
    page,
  }) => {
    // GIVEN: Navigate clientes → contactos → back
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // THEN: Clientes is active again after going back
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

// ─── Root Redirect SPA Behaviour ─────────────────────────────────────────────

test.describe('Root redirect "/" is a SPA redirect (no document refetch)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('root redirect should not cause a second document request after initial load', async ({
    page,
  }) => {
    // The initial page.goto('/') itself fires one document request.
    // The SPA redirect from / to /clientes should NOT fire another one.
    let documentRequests: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'document') documentRequests.push(req.url());
    });

    await page.goto('/');
    await expect(page).toHaveURL('/clientes');

    // THEN: Only one document request (the initial load), not two
    expect(documentRequests.length).toBe(1);
  });
});

// ─── Accessibility: nav landmark present on all routes ────────────────────────

test.describe('Accessibility: nav landmark persists across routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('navigation landmark should be present on /clientes', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeAttached();
  });

  test('navigation landmark should be present on /contactos', async ({ page }) => {
    await page.goto('/contactos');
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeAttached();
  });

  test('navigation landmark should persist after SPA navigation', async ({ page }) => {
    await page.goto('/clientes');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: Navigation landmark is still present after navigation
    await expect(page.locator('nav[aria-label="Navegación principal"]')).toBeAttached();
  });
});
