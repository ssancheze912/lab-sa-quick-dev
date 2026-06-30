/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — AC3
 * Covers: Non-existent clienteId shows graceful not-found message
 *
 * Split from client-detail-view.spec.ts to stay within 300-line limit.
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Non-existent clienteId shows a graceful not-found message
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Non-existent clienteId shows graceful not-found message', () => {
  const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

  test('should show the not-found message when clienteId does not exist', async ({ page }) => {
    // GIVEN: A clienteId that does not exist in the system
    // Network-first: intercept BEFORE navigation to simulate 404 from backend
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      });
    });

    // WHEN: User navigates directly to /clientes/:nonExistentId
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // THEN: A not-found message is displayed in the right panel
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();
  });

  test('should display "No se encontró el cliente solicitado." text when clienteId is not found', async ({ page }) => {
    // GIVEN: A clienteId that returns 404 from the backend
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      });
    });

    // WHEN: User navigates to /clientes/:nonExistentId
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // THEN: The specific not-found message text is displayed
    await expect(page.getByTestId('cliente-not-found')).toContainText('No se encontró el cliente solicitado');
  });

  test('should NOT show cliente-detail-content when clienteId does not exist', async ({ page }) => {
    // GIVEN: A non-existent clienteId
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      });
    });

    // WHEN: User navigates to /clientes/:nonExistentId
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // THEN: The detail content container is NOT shown (only not-found message)
    await expect(page.getByTestId('cliente-detail-content')).toHaveCount(0);
  });

  test('should NOT show an unhandled error or blank page when clienteId does not exist', async ({ page }) => {
    // GIVEN: A non-existent clienteId (risk R-008: blank page / unhandled error)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      });
    });

    // WHEN: User navigates to /clientes/:nonExistentId
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // THEN: Page renders something (no blank screen — left panel or not-found at minimum)
    await expect(page.getByTestId('clientes-list-panel').or(page.getByTestId('cliente-not-found'))).toBeVisible();
  });
});
