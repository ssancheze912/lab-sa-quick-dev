/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — Routing & 404 (AC5-AC6)
 *
 * Acceptance Criteria covered:
 *   AC5 — Unknown route renders graceful 404 in Spanish with link to /clientes
 *   AC6 — Root path / redirects automatically to /clientes
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Unknown route renders 404 view in Spanish
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Unknown route renders 404 not-found view', () => {
  test('should display a 404 not-found view for an unknown route', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/unknown-route-xyz');

    // THEN: A not-found view is displayed
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('should display Spanish message "Página no encontrada" on 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/unknown-route-xyz');

    // THEN: A Spanish not-found message is shown
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('Página no encontrada');
  });

  test('should display a link to return to /clientes on the 404 view', async ({ page }) => {
    // GIVEN: The user navigates to an unknown route
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/unknown-route-xyz');

    // THEN: A link to /clientes is visible on the not-found view
    await expect(page.locator('[data-testid="not-found-back-link"]')).toBeVisible();
  });

  test('should navigate to /clientes when clicking the back link on the 404 view', async ({ page }) => {
    // GIVEN: The user is on an unknown route showing the 404 view
    await page.route('**/api/**', (route) => route.continue());
    await page.goto('/unknown-route-xyz');
    await page.locator('[data-testid="not-found-view"]').waitFor({ state: 'visible' });

    // WHEN: The user clicks the link to return to /clientes
    const navPromise = page.waitForURL('**/clientes**');
    await page.locator('[data-testid="not-found-back-link"]').click();
    await navPromise;

    // THEN: The user is taken to /clientes
    expect(page.url()).toContain('/clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Root path / redirects to /clientes', () => {
  test('should redirect / to /clientes automatically', async ({ page }) => {
    // GIVEN: The root path / is accessed
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForURL('**/clientes**');

    // THEN: The user is automatically redirected to /clientes
    expect(page.url()).toContain('/clientes');
  });

  test('should NOT display a blank screen when accessing the root path /', async ({ page }) => {
    // GIVEN: The root path / is accessed
    await page.route('**/api/**', (route) => route.continue());

    // WHEN: The page loads and redirects
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Content is visible (no blank screen)
    await expect(page.locator('[data-testid="app-root"]')).not.toBeEmpty();
  });
});
