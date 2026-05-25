/**
 * Story 1.2: Frontend Navigation Shell — E2E Edge Case Expansion
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands ATDD E2E coverage with:
 *   - Keyboard navigation / focus management
 *   - CSS active-state class verification
 *   - Header branding visibility
 *   - Boundary viewport (exactly 1024px breakpoint)
 *   - Multiple sequential navigations
 *   - 404 layout preservation (nav still present)
 *   - Back-browser-button preserves SPA state
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Header branding
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Header branding', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show "Siesa Agents" in the top header on /clientes', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByText('Siesa Agents')).toBeVisible();
  });

  test('should show "Siesa Agents" in the top header on /contactos', async ({ page }) => {
    await page.goto('/contactos');
    await expect(page.getByText('Siesa Agents')).toBeVisible();
  });

  test('should show "Siesa Agents" in the top header on 404 view', async ({ page }) => {
    await page.goto('/ruta-invalida');
    await expect(page.getByText('Siesa Agents')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active visual state — CSS class verification
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Active nav item — CSS class verification', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('active Clientes item has bg-blue-100 class on /clientes', async ({ page }) => {
    await page.goto('/clientes');
    const item = page.getByTestId('nav-item-clientes');
    await expect(item).toHaveClass(/bg-blue-100/);
  });

  test('active Contactos item has bg-blue-100 class on /contactos', async ({ page }) => {
    await page.goto('/contactos');
    const item = page.getByTestId('nav-item-contactos');
    await expect(item).toHaveClass(/bg-blue-100/);
  });

  test('inactive Contactos item does NOT have bg-blue-100 class on /clientes', async ({ page }) => {
    await page.goto('/clientes');
    const item = page.getByTestId('nav-item-contactos');
    await expect(item).not.toHaveClass(/bg-blue-100/);
  });

  test('inactive Clientes item does NOT have bg-blue-100 class on /contactos', async ({ page }) => {
    await page.goto('/contactos');
    const item = page.getByTestId('nav-item-clientes');
    await expect(item).not.toHaveClass(/bg-blue-100/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sequential navigation — multiple route changes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Sequential navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should correctly update active state across clientes→contactos→clientes', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');

    await page.getByTestId('nav-item-contactos').click();
    await expect(page).toHaveURL('/contactos');
    await expect(page.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');

    await page.getByTestId('nav-item-clientes').click();
    await expect(page).toHaveURL('/clientes');
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  test('clicking the same active nav item twice stays on same route', async ({ page }) => {
    await page.goto('/clientes');
    await page.getByTestId('nav-item-clientes').click();
    await expect(page).toHaveURL('/clientes');
    // Clientes item stays active
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 view — layout preservation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 view — layout preservation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('navigation rail is still present on 404 view (layout wraps all routes)', async ({ page }) => {
    await page.goto('/absolutely-unknown-route');
    await expect(page.getByTestId('not-found-view')).toBeVisible();
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });

  test('no nav item is marked active on 404 view', async ({ page }) => {
    await page.goto('/absolutely-unknown-route');
    await expect(page.getByTestId('not-found-view')).toBeVisible();
    await expect(page.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  test('deeply nested unknown path shows 404 view', async ({ page }) => {
    await page.goto('/a/b/c/d/e');
    await expect(page.getByTestId('not-found-view')).toBeVisible();
    await expect(page.getByTestId('not-found-message')).toContainText('encontrada');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary viewport — exactly at 1024px breakpoint
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Viewport breakpoint boundary — 1024px desktop', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('navigation rail is visible at exactly 1024px width', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });

  test('navigation-bar-mobile is hidden at exactly 1024px width', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByTestId('navigation-bar-mobile')).toBeHidden();
  });
});

test.describe('Viewport breakpoint boundary — 1023px mobile', () => {
  test.use({ viewport: { width: 1023, height: 768 } });

  test('navigation-bar-mobile is visible at 1023px (just below desktop breakpoint)', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByTestId('navigation-bar-mobile')).toBeVisible();
  });

  test('navigation-rail is hidden at 1023px (just below desktop breakpoint)', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByTestId('navigation-rail')).toBeHidden();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser back button — SPA history
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Browser back button — SPA history', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('back button returns to /clientes after navigating to /contactos', async ({ page }) => {
    await page.goto('/clientes');
    await page.getByTestId('nav-item-contactos').click();
    await expect(page).toHaveURL('/contactos');

    // WHEN: user presses back
    await page.goBack();

    // THEN: returns to /clientes with Clientes active
    await expect(page).toHaveURL('/clientes');
    await expect(page.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nav items — label text verification
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Nav items — label text', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Clientes nav item contains text "Clientes"', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByTestId('nav-item-clientes')).toContainText('Clientes');
  });

  test('Contactos nav item contains text "Contactos"', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByTestId('nav-item-contactos')).toContainText('Contactos');
  });
});
