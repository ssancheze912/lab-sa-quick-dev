/**
 * Story 1.1: Project Initialization & Repository Structure
 * E2E Tests — RED phase (all tests must fail until implementation is complete)
 *
 * AC1: Frontend Vite server starts on port 5173 with TypeScript strict mode
 * AC4: TypeScript compiler emits zero errors with strict flags active
 */

import { test, expect } from '@playwright/test';

test.describe('Story 1.1 — Frontend Initialization', () => {
  /**
   * AC1 — Given a clean dev machine with Node.js and .NET 10 installed,
   *        When the developer runs the frontend init commands,
   *        Then `pnpm run dev` starts the Vite server on port 5173 with no errors
   */
  test('AC1 — frontend serves the root HTML document on port 5173', async ({ page }) => {
    // GIVEN: The Vite dev server is expected to be running on port 5173
    // WHEN: A browser navigates to the root URL
    const response = await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

    // THEN: The server responds with HTTP 200
    expect(response?.status()).toBe(200);
  });

  test('AC1 — root page contains a valid HTML document with a root mount point', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: Navigating to root
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

    // THEN: A <div id="root"> element is present (Vite react-ts default)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('AC1 — page title is set (confirms Vite compiled index.html successfully)', async ({ page }) => {
    // GIVEN: Vite dev server on port 5173
    // WHEN: Navigating to root
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

    // THEN: Page title is not empty (confirms successful compile)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  /**
   * AC4 — Given the frontend project is initialized,
   *        When the TypeScript compiler runs,
   *        Then zero errors with strict flags enabled
   *
   * This test validates the TS config is correctly wired by verifying the
   * dev server serves without compilation errors (Vite surfaces TS errors in browser).
   */
  test('AC4 — no TypeScript compilation errors overlay is shown on the root page', async ({ page }) => {
    // GIVEN: Vite dev server with TypeScript strict mode enabled
    // WHEN: Navigating to root URL
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // THEN: Vite error overlay is NOT present (means zero TS compile errors)
    const viteErrorOverlay = page.locator('vite-error-overlay');
    await expect(viteErrorOverlay).toHaveCount(0);
  });
});
