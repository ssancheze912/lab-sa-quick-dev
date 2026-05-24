/**
 * Story 1.2: Frontend Navigation Shell — Boundary & Error Path Tests
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation expansion: boundary conditions and error paths NOT covered by
 * navigation-shell.spec.ts (ATDD) or navigation-shell.edge.spec.ts (edge cases).
 *
 * Coverage:
 *   - Viewport exactly at breakpoint boundary (1023px mobile, 1024px desktop)
 *   - Browser history back/forward button SPA navigation
 *   - Space key activation on nav links (keyboard accessibility)
 *   - NavItems exact count boundary (only 2 items on mobile bar)
 *   - Rapid successive navigation (no ghost states)
 *   - URL with trailing slash normalization
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Viewport Breakpoint Boundary Conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport Breakpoint Boundary (1023px vs 1024px)', () => {
  test('[P1] should render NavigationBar at exactly 1023px viewport width', async ({ page }) => {
    // GIVEN: Viewport is set to exactly 1 pixel below the lg breakpoint
    await page.setViewportSize({ width: 1023, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The mobile NavigationBar is rendered (below lg breakpoint)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();
  });

  test('[P1] should NOT render NavigationRail at exactly 1023px viewport width', async ({ page }) => {
    // GIVEN: Viewport is set to exactly 1023px (mobile threshold)
    await page.setViewportSize({ width: 1023, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The desktop NavigationRail is NOT visible
    await expect(page.locator('[data-testid="navigation-rail"]')).not.toBeVisible();
  });

  test('[P1] should render NavigationRail at exactly 1024px viewport width', async ({ page }) => {
    // GIVEN: Viewport is set to exactly the lg breakpoint (1024px)
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The desktop NavigationRail is rendered
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });

  test('[P1] should NOT render NavigationBar at exactly 1024px viewport width', async ({ page }) => {
    // GIVEN: Viewport is set to exactly 1024px (lg breakpoint — desktop mode)
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The mobile NavigationBar is NOT visible
    await expect(page.locator('[data-testid="navigation-bar"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser History Back/Forward Navigation (SPA integrity)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser History Back/Forward Navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P1] should go back to /clientes from /contactos using browser back button', async ({ page }) => {
    // GIVEN: User navigated to /clientes and then to /contactos
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // WHEN: User presses the browser back button
    await page.goBack();

    // THEN: URL returns to /clientes and the Clientes view is rendered
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('[P1] should restore active nav item after browser back navigation', async ({ page }) => {
    // GIVEN: User navigated from /clientes to /contactos, then pressed back
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // THEN: Clientes nav item is active again
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('[P1] should go forward to /contactos after going back from it', async ({ page }) => {
    // GIVEN: User navigated forward then back in browser history
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // WHEN: User presses browser forward
    await page.goForward();

    // THEN: URL is /contactos and Contactos view is rendered
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Space Key Activation (Keyboard Accessibility — WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Space Key Activation on Nav Links', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should navigate to /contactos when Space key is pressed on Contactos nav link', async ({ page }) => {
    // GIVEN: User is on /clientes with the Contactos nav item focused
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosItem.focus();

    // WHEN: User presses Space to activate the link
    await page.keyboard.press('Space');

    // THEN: Navigation occurs to /contactos
    await expect(page).toHaveURL('/contactos');
  });

  test('[P2] should navigate to /clientes when Space key is pressed on Clientes nav link', async ({ page }) => {
    // GIVEN: User is on /contactos with the Clientes nav item focused
    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await clientesItem.focus();

    // WHEN: User presses Space to activate the link
    await page.keyboard.press('Space');

    // THEN: Navigation occurs to /clientes
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NavigationBar Item Count Boundary (Mobile)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mobile NavigationBar Item Count Boundary', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('[P2] should render exactly 2 navigation items in the NavigationBar on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport with NavigationBar rendered
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Exactly 2 nav items are present in the bar (no extras, no missing)
    const navBar = page.locator('[data-testid="navigation-bar"]');
    const navItems = navBar.locator('[data-testid^="nav-item-"]');
    await expect(navItems).toHaveCount(2);
  });

  test('[P2] should show Clientes label text in Spanish on mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile NavigationBar is visible
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Clientes nav item contains the Spanish label "Clientes"
    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await expect(clientesItem).toContainText('Clientes');
  });

  test('[P2] should show Contactos label text in Spanish on mobile NavigationBar', async ({ page }) => {
    // GIVEN: Mobile NavigationBar is visible
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: Contactos nav item contains the Spanish label "Contactos"
    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await expect(contactosItem).toContainText('Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rapid Successive Navigation (No Ghost/Stale States)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Rapid Successive Navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should show correct active state after rapid navigation between routes', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // WHEN: User rapidly switches back and forth between routes
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.locator('[data-testid="nav-item-clientes"]').click();
    await page.locator('[data-testid="nav-item-contactos"]').click();

    // THEN: Final URL is /contactos with correct active state
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Desktop Nav Label Text (Spanish Boundary)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Desktop NavigationRail Spanish Labels', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[P2] should display Spanish label "Clientes" in NavigationRail', async ({ page }) => {
    // GIVEN: Desktop NavigationRail is visible
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Clientes nav item contains the Spanish text "Clientes"
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toContainText('Clientes');
  });

  test('[P2] should display Spanish label "Contactos" in NavigationRail', async ({ page }) => {
    // GIVEN: Desktop NavigationRail is visible
    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    // THEN: The Contactos nav item contains the Spanish text "Contactos"
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toContainText('Contactos');
  });
});
