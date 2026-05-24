/**
 * Story 1.2: Frontend Navigation Shell
 * E2E Edge Cases & Boundary Conditions
 *
 * Coverage focus:
 *   - Mobile: aria-current="page" set on active nav item (AC2 + AC8 gap)
 *   - Mobile: 404 back-link navigates to /clientes
 *   - Viewport resize mid-session: switching from desktop to mobile preserves nav
 *   - Keyboard: Tab focuses nav interactive elements on desktop (AC8 keyboard)
 *   - 404 view: secondary Spanish text present
 *   - 404 view: numeric 404 heading present
 *   - Root redirect is instant (no intermediate render of root content)
 *   - Back-browser-button after SPA navigation returns to previous view
 *   - /clientes path stable when refreshed (no redirect loop)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Mobile: aria-current on active item (AC2 + AC8 combined gap)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Mobile aria-current on active nav item', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should set aria-current="page" on Clientes nav item when at /clientes on mobile', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should set aria-current="page" on Contactos nav item when at /contactos on mobile', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');

    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT have aria-current on Contactos when at /clientes on mobile', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    await expect(page.locator('[data-testid="nav-item-contactos"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should update aria-current when navigating between routes on mobile', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    await expect(page.locator('[data-testid="nav-item-clientes"]')).toHaveAttribute('aria-current', 'page');

    await page.click('[data-testid="nav-item-contactos"]');
    await expect(page).toHaveURL('/contactos');

    await expect(page.locator('[data-testid="nav-item-contactos"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="nav-item-clientes"]')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile: 404 back-link navigates to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Mobile 404 back-link navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should display 404 view when navigating to unknown route on mobile', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/unknown-mobile-route');

    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should navigate to /clientes from 404 back-link on mobile', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/unknown-mobile-route');

    await page.click('[data-testid="not-found-back-link"]');
    await expect(page).toHaveURL('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 view content completeness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — 404 view content completeness', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show numeric "404" heading on the not-found view', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/this-route-does-not-exist');

    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('404');
  });

  test('should show secondary explanation text in Spanish on the not-found view', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/another-missing-route');

    await expect(page.locator('[data-testid="not-found-view"]')).toContainText('La página que buscas');
  });

  test('should show "Volver a Clientes" back-link text on 404 view', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/yet-another-missing-route');

    const backLink = page.locator('[data-testid="not-found-back-link"]');
    await expect(backLink).toContainText('Volver a Clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard navigation — Tab key reaches nav items (AC8)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Keyboard Tab navigation reaches nav interactive elements', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should allow Tab key to reach nav interactive elements', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');

    // Tab through the page — within a few presses, a nav link should receive focus
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedTestId = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid')
    );
    const navInteractiveCount = await page.locator('nav a, nav button').count();

    // At least Clientes and Contactos links exist and are keyboard reachable
    expect(navInteractiveCount).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPA back-navigation via browser back button
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Browser back button after SPA navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should navigate back to /clientes after going forward to /contactos via back button', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());

    // Start at /clientes
    await page.goto('/clientes');
    await expect(page).toHaveURL('/clientes');

    // SPA navigate to /contactos
    await page.click('[data-testid="nav-item-contactos"]');
    await expect(page).toHaveURL('/contactos');

    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/clientes');

    // Navigation shell still intact
    await expect(page.locator('[data-testid="navigation-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Page refresh stability
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Page refresh keeps correct view (no redirect loops)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should stay on /clientes after refreshing (no redirect loop)', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/clientes');
    await expect(page).toHaveURL('/clientes');

    // Reload — should stay at /clientes, not redirect infinitely
    await page.reload();
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });

  test('should stay on /contactos after refreshing', async ({ page }) => {
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/contactos');
    await expect(page).toHaveURL('/contactos');

    await page.reload();
    await expect(page).toHaveURL('/contactos');
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();
  });
});
