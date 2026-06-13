/**
 * Story 1.2: Frontend Navigation Shell — Boundary & Viewport Transition Tests
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion Tests (E2E — Boundary Conditions)
 * Covers edge cases not addressed by the ATDD or edge-cases spec files:
 *
 *   - Exact breakpoint boundary viewport (1024px): NavigationRail visible, NavigationBar hidden
 *   - Just-below breakpoint boundary (1023px): NavigationBar visible, NavigationRail hidden
 *   - Window resize from desktop to mobile: responsive layout reacts correctly
 *   - Window resize from mobile to desktop: responsive layout reacts correctly
 *   - Root redirect preserves NavigationRail shell and active state
 *   - 404 page → navigate to /clientes via link, active state updates correctly
 *   - Space key activates navigation links (keyboard accessibility)
 *   - NavigationBar active state after root redirect
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint boundary — exactly at 1024px (lg: breakpoint)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Breakpoint boundary — exactly 1024px viewport width', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('[P1] should display NavigationRail at exactly 1024px viewport width', async ({ page }) => {
    // GIVEN: The viewport is exactly at the lg: breakpoint (1024px)
    // WHEN: The user views /clientes
    await page.goto('/clientes');

    // THEN: The NavigationRail is visible (lg: breakpoint is inclusive at 1024px)
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });

  test('[P1] should NOT display NavigationBar at exactly 1024px viewport width', async ({ page }) => {
    // GIVEN: The viewport is exactly at the lg: breakpoint (1024px)
    // WHEN: The user views /clientes
    await page.goto('/clientes');

    // THEN: The NavigationBar (bottom nav) is not visible
    await expect(page.getByTestId('navigation-bar')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint boundary — just below 1024px (1023px = mobile)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Breakpoint boundary — 1023px viewport (just below lg:)', () => {
  test.use({ viewport: { width: 1023, height: 768 } });

  test('[P1] should display NavigationBar at 1023px viewport width', async ({ page }) => {
    // GIVEN: The viewport is just below the lg: breakpoint (1023px)
    // WHEN: The user views /clientes
    await page.goto('/clientes');

    // THEN: The bottom NavigationBar is visible
    await expect(page.getByTestId('navigation-bar')).toBeVisible();
  });

  test('[P1] should NOT display NavigationRail at 1023px viewport width', async ({ page }) => {
    // GIVEN: The viewport is just below the lg: breakpoint (1023px)
    // WHEN: The user views /clientes
    await page.goto('/clientes');

    // THEN: The NavigationRail is not visible
    await expect(page.getByTestId('navigation-rail')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Window resize — desktop to mobile
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Window resize — desktop to mobile', () => {
  test('[P2] should switch from NavigationRail to NavigationBar when viewport shrinks below 1024px', async ({
    page,
  }) => {
    // GIVEN: Start on desktop viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/clientes');

    // Verify desktop state
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
    await expect(page.getByTestId('navigation-bar')).not.toBeVisible();

    // WHEN: Viewport is resized to mobile (390px)
    await page.setViewportSize({ width: 390, height: 844 });

    // THEN: NavigationBar becomes visible, NavigationRail is hidden
    await expect(page.getByTestId('navigation-bar')).toBeVisible();
    await expect(page.getByTestId('navigation-rail')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Window resize — mobile to desktop
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Window resize — mobile to desktop', () => {
  test('[P2] should switch from NavigationBar to NavigationRail when viewport grows above 1024px', async ({
    page,
  }) => {
    // GIVEN: Start on mobile viewport (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/clientes');

    // Verify mobile state
    await expect(page.getByTestId('navigation-bar')).toBeVisible();
    await expect(page.getByTestId('navigation-rail')).not.toBeVisible();

    // WHEN: Viewport is resized to desktop (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });

    // THEN: NavigationRail becomes visible, NavigationBar is hidden
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
    await expect(page.getByTestId('navigation-bar')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect — shell and active state after /
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Root redirect — shell active state', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should show NavigationRail after root redirect to /clientes', async ({ page }) => {
    // GIVEN: User accesses the root URL /
    // WHEN: Redirect to /clientes completes
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: NavigationRail is visible
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });

  test('[P1] should show Clientes nav item as active after root redirect', async ({ page }) => {
    // GIVEN: User accesses / and gets redirected to /clientes
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: Clientes nav item is active
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
  });

  test('[P1] should show Contactos nav item as inactive after root redirect', async ({ page }) => {
    // GIVEN: User accesses / and gets redirected to /clientes
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: Contactos nav item is NOT active
    await expect(page.getByTestId('nav-item-contactos')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect — mobile NavigationBar active state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Root redirect — mobile NavigationBar active state', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[P1] should show nav-bar-item-clientes as active after root redirect on mobile', async ({
    page,
  }) => {
    // GIVEN: User accesses / on mobile and gets redirected to /clientes
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: Mobile Clientes nav bar item is active
    await expect(page.getByTestId('nav-bar-item-clientes')).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 page → navigate via link → active state correct
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] 404 page navigation recovery', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should activate Clientes nav item after navigating from 404 to /clientes via link', async ({
    page,
  }) => {
    // GIVEN: User lands on an unknown route
    await page.goto('/unknown-page');
    await expect(page.getByTestId('not-found-page')).toBeVisible();

    // WHEN: User clicks the "Ir a Clientes" link
    await page.getByTestId('not-found-link-clientes').click();
    await page.waitForURL('**/clientes');

    // THEN: Clientes nav item is active
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('nav-item-contactos')).not.toHaveAttribute('data-active', 'true');
  });

  test('[P1] should render ClientesPage after navigating from 404 to /clientes via link', async ({
    page,
  }) => {
    // GIVEN: User is on the 404 page
    await page.goto('/not-found-route');
    await expect(page.getByTestId('not-found-page')).toBeVisible();

    // WHEN: User clicks the return link
    await page.getByTestId('not-found-link-clientes').click();
    await page.waitForURL('**/clientes');

    // THEN: ClientesPage heading is visible and not-found-page is gone
    await expect(page.getByTestId('clientes-page-heading')).toBeVisible();
    await expect(page.getByTestId('not-found-page')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard — Space key activates navigation links
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Keyboard — Space key activates navigation links', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should navigate to /contactos using Space key on Contactos nav item', async ({
    page,
  }) => {
    // GIVEN: User is on /clientes on desktop
    await page.goto('/clientes');

    // WHEN: User focuses and presses Space on the Contactos nav item
    const contactosItem = page.getByTestId('nav-item-contactos');
    await contactosItem.focus();
    await contactosItem.press('Space');

    // THEN: URL changes to /contactos
    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');
  });

  test('[P2] should navigate to /clientes using Space key on Clientes nav item', async ({
    page,
  }) => {
    // GIVEN: User is on /contactos on desktop
    await page.goto('/contactos');

    // WHEN: User focuses and presses Space on the Clientes nav item
    const clientesItem = page.getByTestId('nav-item-clientes');
    await clientesItem.focus();
    await clientesItem.press('Space');

    // THEN: URL changes to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation shell product name in header
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Navigation shell header — product name', () => {
  test('[P2] should display "Siesa Agents" in the application header on /clientes', async ({
    page,
  }) => {
    // GIVEN: The app is loaded
    await page.goto('/clientes');

    // THEN: The product name "Siesa Agents" is visible in the header
    await expect(page.getByText('Siesa Agents')).toBeVisible();
  });

  test('[P2] should display "Siesa Agents" in the application header on /contactos', async ({
    page,
  }) => {
    // GIVEN: The app is loaded at /contactos
    await page.goto('/contactos');

    // THEN: The product name persists across routes
    await expect(page.getByText('Siesa Agents')).toBeVisible();
  });
});
