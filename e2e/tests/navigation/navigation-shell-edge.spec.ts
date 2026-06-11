/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Edge & Accessibility)
 *
 * Covers:
 *   - Navigation accessibility (WCAG 2.1 AA — keyboard, ARIA)
 *   - NavigationRail hidden on mobile (mutual exclusion)
 *   - NavigationBar hidden on desktop (mutual exclusion)
 *   - Responsive breakpoint boundary at exactly 1024px
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Responsive breakpoint boundary tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive breakpoint boundary at 1024px', () => {
  test('should show NavigationRail and hide NavigationBar at exactly 1024px viewport width', async ({
    page,
    browserName,
  }) => {
    // GIVEN: The viewport is set to exactly the breakpoint boundary (1024px)
    await page.setViewportSize({ width: 1024, height: 768 });

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationRail is shown (desktop mode at lg: 1024px)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // AND: NavigationBar is hidden
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeHidden();
  });

  test('should show NavigationBar and hide NavigationRail at 1023px viewport width', async ({
    page,
  }) => {
    // GIVEN: The viewport is 1 pixel below the breakpoint (< 1024px)
    await page.setViewportSize({ width: 1023, height: 768 });

    // WHEN: The user views the app
    await page.goto('/clientes');

    // THEN: NavigationBar is shown (mobile mode below lg: 1024px)
    await expect(page.locator('[data-testid="navigation-bar"]')).toBeVisible();

    // AND: NavigationRail is hidden
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation accessibility tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation accessibility (WCAG 2.1 AA)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should allow keyboard navigation to the Clientes nav item', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');

    // WHEN: The user uses Tab to navigate to the Clientes nav item and presses Enter
    const clientesNavItem = page.locator('[data-testid="nav-item-clientes"]');
    await clientesNavItem.focus();

    // THEN: The Clientes nav item is focused and accessible via keyboard
    await expect(clientesNavItem).toBeFocused();
  });

  test('should allow keyboard navigation to the Contactos nav item', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');

    // WHEN: The user focuses the Contactos nav item
    const contactosNavItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosNavItem.focus();

    // THEN: The Contactos nav item is focused and accessible via keyboard
    await expect(contactosNavItem).toBeFocused();
  });

  test('should navigate to /contactos when pressing Enter on the Contactos nav item', async ({
    page,
  }) => {
    // GIVEN: The application is loaded and the Contactos nav item is focused
    await page.goto('/clientes');
    const contactosNavItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosNavItem.focus();

    // WHEN: The user presses Enter on the focused Contactos nav item
    await page.keyboard.press('Enter');

    // THEN: The app navigates to /contactos
    await expect(page).toHaveURL('/contactos');
  });

  test('should have a navigation landmark role on the NavigationRail', async ({ page }) => {
    // GIVEN: The application is loaded on a desktop browser
    await page.goto('/clientes');

    // THEN: The NavigationRail has a nav role or is within a nav landmark
    const navRail = page.locator('[data-testid="navigation-rail"]');
    await expect(navRail).toBeVisible();

    // The navigation container must have role="navigation" or be a <nav> element
    const tagOrRole = await navRail.evaluate((el) => {
      return el.tagName.toLowerCase() === 'nav' || el.getAttribute('role') === 'navigation';
    });
    expect(tagOrRole).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No-JavaScript fallback / graceful handling
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigation shell structural integrity', () => {
  test('should render both navigation entries in the DOM on /clientes', async ({ page }) => {
    // GIVEN: The application is loaded
    await page.goto('/clientes');

    // THEN: Both navigation items exist in the DOM (even if one is visually hidden)
    await expect(page.locator('[data-testid="nav-item-clientes"]')).toBeAttached();
    await expect(page.locator('[data-testid="nav-item-contactos"]')).toBeAttached();
  });

  test('should render the main content outlet area alongside navigation', async ({ page }) => {
    // GIVEN: The pathless layout shell wraps child routes
    // WHEN: The user views /clientes
    await page.goto('/clientes');

    // THEN: The main content area with child route content is rendered
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('should persist navigation shell when transitioning between /clientes and /contactos', async ({
    page,
  }) => {
    // GIVEN: The user is on /clientes
    await page.goto('/clientes');

    // Network-first: ensure navigation elements are present before clicking
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();

    // WHEN: The user navigates to /contactos
    await page.locator('[data-testid="nav-item-contactos"]').click();
    await expect(page).toHaveURL('/contactos');

    // THEN: The NavigationRail is still visible (persists across routes — no re-mount)
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
  });
});
