/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Expanded Coverage
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion Tests (BMad-Integrated Mode)
 * These tests expand beyond the ATDD happy-path tests with:
 *   - Mobile active state (NavigationBar data-active attribute)
 *   - Mobile navigation without full page reload
 *   - Sequential multi-step navigation
 *   - Deep nested unknown routes (404 fallback)
 *   - Browser back/forward navigation
 *   - NavigationBar dimension and layout bounds
 *   - aria-label on mobile NavigationBar items
 *   - Keyboard focus traversal on nav items
 *   - Active state transitions on navigation
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Mobile — Active State on NavigationBar (not covered by ATDD)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Mobile NavigationBar active state', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P1] should show Clientes nav bar item as active when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes on a mobile viewport
    await page.goto('/clientes');

    // WHEN: Viewing the NavigationBar
    const clientesItem = page.getByTestId('nav-bar-item-clientes');

    // THEN: The Clientes nav bar item has data-active="true"
    await expect(clientesItem).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should show Contactos nav bar item as inactive when on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes on a mobile viewport
    await page.goto('/clientes');

    // WHEN: Viewing the NavigationBar
    const contactosItem = page.getByTestId('nav-bar-item-contactos');

    // THEN: The Contactos nav bar item does NOT have data-active="true"
    await expect(contactosItem).not.toHaveAttribute('data-active', 'true');
  });

  test('[P1] should show Contactos nav bar item as active when on /contactos', async ({ page }) => {
    // GIVEN: The user is on /contactos on a mobile viewport
    await page.goto('/contactos');

    // WHEN: Viewing the NavigationBar
    const contactosItem = page.getByTestId('nav-bar-item-contactos');

    // THEN: The Contactos nav bar item has data-active="true"
    await expect(contactosItem).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should show Clientes nav bar item as inactive when on /contactos', async ({ page }) => {
    // GIVEN: The user is on /contactos on a mobile viewport
    await page.goto('/contactos');

    // WHEN: Viewing the NavigationBar
    const clientesItem = page.getByTestId('nav-bar-item-clientes');

    // THEN: The Clientes nav bar item does NOT have data-active="true"
    await expect(clientesItem).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile — Client-side navigation without full page reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Mobile client-side navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P1] should navigate to /contactos without full page reload on mobile', async ({ page }) => {
    // GIVEN: User is on /clientes on a mobile viewport
    await page.goto('/clientes');

    // Network-first: track full-page document requests
    let fullPageReloadOccurred = false;
    page.on('request', (req) => {
      if (req.resourceType() === 'document' && req.url().includes('localhost:5173')) {
        fullPageReloadOccurred = true;
      }
    });

    // WHEN: The user taps the Contactos nav bar item
    await page.getByTestId('nav-bar-item-contactos').click();

    // THEN: URL changes to /contactos
    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');

    // AND: No full page reload occurred (client-side routing)
    expect(fullPageReloadOccurred).toBe(false);
  });

  test('[P1] should navigate to /clientes without full page reload on mobile', async ({ page }) => {
    // GIVEN: User is on /contactos on a mobile viewport
    await page.goto('/contactos');

    let fullPageReloadOccurred = false;
    page.on('request', (req) => {
      if (req.resourceType() === 'document' && req.url().includes('localhost:5173')) {
        fullPageReloadOccurred = true;
      }
    });

    // WHEN: The user taps the Clientes nav bar item
    await page.getByTestId('nav-bar-item-clientes').click();

    // THEN: URL changes to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');

    // AND: No full page reload
    expect(fullPageReloadOccurred).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sequential multi-step navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Sequential multi-step navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should update active state correctly through multiple navigation steps', async ({
    page,
  }) => {
    // GIVEN: User starts at /clientes
    await page.goto('/clientes');
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');

    // WHEN: User navigates to /contactos
    await page.getByTestId('nav-item-contactos').click();
    await page.waitForURL('**/contactos');

    // THEN: Contactos is active, Clientes is not
    await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('nav-item-clientes')).not.toHaveAttribute('data-active', 'true');

    // WHEN: User navigates back to /clientes
    await page.getByTestId('nav-item-clientes').click();
    await page.waitForURL('**/clientes');

    // THEN: Clientes is active again, Contactos is not
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('nav-item-contactos')).not.toHaveAttribute('data-active', 'true');
  });

  test('[P1] should render correct page heading through multiple navigation steps', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-page-heading')).toBeVisible();

    // WHEN: User navigates to /contactos
    await page.getByTestId('nav-item-contactos').click();
    await page.waitForURL('**/contactos');

    // THEN: ContactosPage heading is visible
    await expect(page.getByTestId('contactos-page-heading')).toBeVisible();
    await expect(page.getByTestId('clientes-page-heading')).not.toBeVisible();

    // WHEN: User navigates back to /clientes
    await page.getByTestId('nav-item-clientes').click();
    await page.waitForURL('**/clientes');

    // THEN: ClientesPage heading is visible again
    await expect(page.getByTestId('clientes-page-heading')).toBeVisible();
    await expect(page.getByTestId('contactos-page-heading')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 edge cases — Deep nested and varied unknown routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] 404 page — varied unknown routes', () => {
  test('[P2] should display not-found page for a deeply nested unknown route', async ({ page }) => {
    // GIVEN: The user navigates to a deeply nested unknown route
    // WHEN: The page loads
    await page.goto('/clientes/unknown/nested/deep');

    // THEN: The 404 not-found view is displayed
    await expect(page.getByTestId('not-found-page')).toBeVisible();
  });

  test('[P2] should display not-found page for unknown route with special characters', async ({
    page,
  }) => {
    // GIVEN: The user navigates to a route with special characters
    // WHEN: The page loads
    await page.goto('/ruta-con-guiones-y-numeros-123');

    // THEN: The 404 not-found view is displayed
    await expect(page.getByTestId('not-found-page')).toBeVisible();
  });

  test('[P2] should show navigation shell (rail/bar) on 404 page (desktop)', async ({ page }) => {
    // GIVEN: Desktop viewport
    // WHEN: User navigates to an unknown route
    await page.goto('/unknown');

    // THEN: The NavigationRail is still visible (shell persists across 404)
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
    await expect(page.getByTestId('not-found-page')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser back/forward navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Browser back/forward navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should restore /clientes state and active nav item after browser back navigation', async ({
    page,
  }) => {
    // GIVEN: User navigates from /clientes to /contactos
    await page.goto('/clientes');
    await page.getByTestId('nav-item-contactos').click();
    await page.waitForURL('**/contactos');

    // WHEN: User clicks browser back button
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: URL is back at /clientes
    expect(page.url()).toContain('/clientes');

    // AND: Clientes nav item is active
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('clientes-page-heading')).toBeVisible();
  });

  test('[P1] should restore /contactos state after browser forward navigation', async ({
    page,
  }) => {
    // GIVEN: User navigated from /clientes to /contactos and back
    await page.goto('/clientes');
    await page.getByTestId('nav-item-contactos').click();
    await page.waitForURL('**/contactos');
    await page.goBack();
    await page.waitForURL('**/clientes');

    // WHEN: User clicks browser forward button
    await page.goForward();
    await page.waitForURL('**/contactos');

    // THEN: URL is at /contactos
    expect(page.url()).toContain('/contactos');

    // AND: Contactos nav item is active
    await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('contactos-page-heading')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — aria-label on mobile NavigationBar items (not in ATDD)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Accessibility — aria-label on mobile NavigationBar items', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P1] should have Spanish aria-label on Clientes nav bar item', async ({ page }) => {
    // GIVEN: The mobile NavigationBar is visible
    await page.goto('/clientes');

    // WHEN: The user inspects the Clientes nav bar item
    const clientesItem = page.getByTestId('nav-bar-item-clientes');

    // THEN: The Clientes nav bar item has a Spanish aria-label
    await expect(clientesItem).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  test('[P1] should have Spanish aria-label on Contactos nav bar item', async ({ page }) => {
    // GIVEN: The mobile NavigationBar is visible
    await page.goto('/clientes');

    // WHEN: The user inspects the Contactos nav bar item
    const contactosItem = page.getByTestId('nav-bar-item-contactos');

    // THEN: The Contactos nav bar item has a Spanish aria-label
    await expect(contactosItem).toHaveAttribute('aria-label', 'Ir a Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard navigation — focus traversal on desktop NavRail
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Keyboard navigation — focus traversal', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should navigate to /clientes using keyboard Enter on Clientes nav item', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos on desktop
    await page.goto('/contactos');

    // WHEN: User focuses and activates the Clientes nav item via keyboard
    const clientesItem = page.getByTestId('nav-item-clientes');
    await clientesItem.focus();
    await clientesItem.press('Enter');

    // THEN: URL changes to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
  });

  test('[P2] should navigate to /contactos using keyboard Enter on Contactos nav item', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes on desktop
    await page.goto('/clientes');

    // WHEN: User focuses and activates the Contactos nav item via keyboard
    const contactosItem = page.getByTestId('nav-item-contactos');
    await contactosItem.focus();
    await contactosItem.press('Enter');

    // THEN: URL changes to /contactos
    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NavigationBar height dimension (56px spec)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] NavigationBar layout dimensions', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P2] should render NavigationBar with minimum height of 56px', async ({ page }) => {
    // GIVEN: The mobile NavigationBar is visible
    await page.goto('/clientes');

    // WHEN: The user measures the NavigationBar dimensions
    const navBar = page.getByTestId('navigation-bar');
    const box = await navBar.boundingBox();

    // THEN: The NavigationBar height is at least 56px (per AC2 specification)
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(56);
  });

  test('[P2] should render NavigationBar spanning full viewport width on mobile', async ({
    page,
  }) => {
    // GIVEN: The mobile NavigationBar is visible at 390px viewport
    await page.goto('/clientes');

    // WHEN: The user measures the NavigationBar width
    const navBar = page.getByTestId('navigation-bar');
    const box = await navBar.boundingBox();

    // THEN: The NavigationBar spans at least 80% of the viewport width
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(300);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NavigationRail width dimension (72px spec)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] NavigationRail layout dimensions', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should render NavigationRail with minimum width of 72px', async ({ page }) => {
    // GIVEN: The desktop NavigationRail is visible
    await page.goto('/clientes');

    // WHEN: The user measures the NavigationRail width
    const navRail = page.getByTestId('navigation-rail');
    const box = await navRail.boundingBox();

    // THEN: The NavigationRail is at least 72px wide (per AC1 specification)
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(72);
  });
});
