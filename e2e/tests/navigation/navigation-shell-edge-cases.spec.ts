/**
 * Story 1.2: Frontend Navigation Shell
 * E2E Edge Cases & Boundary Conditions
 *
 * Extends navigation-shell.spec.ts with cases NOT covered by ATDD tests:
 *   - Mobile NavigationBar active state updates on click
 *   - Mobile navigation between routes updates active item
 *   - Keyboard navigation (Tab to nav item + Enter to activate)
 *   - aria-current attribute on active items (desktop & mobile)
 *   - Product name "Siesa Agents" visible in the Navbar
 *   - 404 view for deeply nested paths
 *   - Root "/" redirect on mobile viewport
 *   - NavigationBar Contactos touch target >= 44px
 *   - Back-button browser history: navigate forward then back
 *   - No console errors on standard routes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Mobile NavigationBar — active state on navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mobile NavigationBar — active state updates on tap', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should mark "Contactos" as active in the NavigationBar after tapping it', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    await page.locator('[data-testid="nav-bar-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    await expect(page.locator('[data-testid="nav-bar-item-contactos"]')).toHaveAttribute('data-active', 'true');
  });

  test('should deactivate "Clientes" in the NavigationBar after tapping "Contactos"', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    await page.locator('[data-testid="nav-bar-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    await expect(page.locator('[data-testid="nav-bar-item-clientes"]')).not.toHaveAttribute('data-active', 'true');
  });

  test('should mark "Clientes" as active in the NavigationBar after tapping it from Contactos', async ({ page }) => {
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    await page.locator('[data-testid="nav-bar-item-clientes"]').click();
    await page.waitForURL('**/clientes');

    await expect(page.locator('[data-testid="nav-bar-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('should have Contactos mobile touch target height >= 44px', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    const contactosItem = page.locator('[data-testid="nav-bar-item-contactos"]');
    const boundingBox = await contactosItem.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should redirect from "/" to "/clientes" on mobile viewport', async ({ page }) => {
    const navigationDone = page.waitForURL('**/clientes', { timeout: 10000 });
    await page.goto('/');
    await navigationDone;
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Desktop — aria-current on active nav items
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Desktop — aria-current on NavigationRail items', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should set aria-current="page" on the Clientes rail item when on /clientes', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT set aria-current="page" on the Contactos rail item when on /clientes', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    const ariaCurrent = await contactosItem.getAttribute('aria-current');
    expect(ariaCurrent).not.toBe('page');
  });

  test('should set aria-current="page" on the Contactos rail item when on /contactos', async ({ page }) => {
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Desktop — Navbar product name visible
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Desktop — Navbar product name', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should display "Siesa Agents" in the Navbar', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Siesa Agents')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 — deeply nested unknown paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 not-found — deeply nested and unusual unknown paths', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  const unknownPaths = [
    '/admin/dashboard',
    '/api/v1/resource',
    '/foo/bar/baz/qux',
    '/ruta/muy/profunda/desconocida',
  ];

  for (const path of unknownPaths) {
    test(`should render the not-found view for deeply nested unknown path: ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser history — back-button navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser history — back-button SPA navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate back to /clientes via browser back button after going to /contactos', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    await page.goBack();
    await page.waitForURL('**/clientes');

    expect(page.url()).toContain('/clientes');
  });

  test('should restore active state on "Clientes" after navigating back via browser button', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    await page.goBack();
    await page.waitForURL('**/clientes');

    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('data-active', 'true');
  });

  test('should navigate forward via browser forward button after going back', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    await page.locator('[data-testid="nav-item-contactos"]').click();
    await page.waitForURL('**/contactos');

    await page.goBack();
    await page.waitForURL('**/clientes');

    await page.goForward();
    await page.waitForURL('**/contactos');

    expect(page.url()).toContain('/contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Desktop — keyboard navigation on NavigationRail', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate to /contactos when the Contactos nav item is focused and Enter is pressed', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    const contactosItem = page.locator('[data-testid="nav-item-contactos"]');
    await contactosItem.focus();
    await contactosItem.press('Enter');

    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');
  });

  test('should navigate to /clientes when the Clientes nav item is focused and Enter is pressed', async ({ page }) => {
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    const clientesItem = page.locator('[data-testid="nav-item-clientes"]');
    await clientesItem.focus();
    await clientesItem.press('Enter');

    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No console errors on standard routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('No unhandled JS errors on standard routes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should produce no page errors when loading /clientes', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/clientes');
    await page.waitForLoadState('networkidle');

    expect(pageErrors).toHaveLength(0);
  });

  test('should produce no page errors when loading /contactos', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/contactos');
    await page.waitForLoadState('networkidle');

    expect(pageErrors).toHaveLength(0);
  });
});
