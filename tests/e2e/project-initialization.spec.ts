/**
 * ATDD - Story 1.1: Project Initialization & Repository Structure
 * RED PHASE - These tests are expected to FAIL until implementation is complete.
 *
 * Acceptance Criteria covered:
 * - AC1: Frontend Vite server starts on port 5173, TypeScript strict mode enabled
 * - AC4: TypeScript compiles with zero errors (strict, noImplicitAny, strictNullChecks)
 *
 * Test level: E2E (browser-level verification of frontend startup and TS config)
 */

import { test, expect } from '@playwright/test';

test.describe('Story 1.1 - Frontend Initialization (AC1, AC4)', () => {
  test('AC1 - should load Vite app at http://localhost:5173 without errors', async ({ page }) => {
    // GIVEN: A clean dev machine with Node.js and pnpm installed and `pnpm run dev` executed
    // WHEN: The browser navigates to the Vite dev server
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // THEN: The page loads without JavaScript runtime errors
    expect(pageErrors).toHaveLength(0);
  });

  test('AC1 - should respond with HTTP 200 from Vite dev server on port 5173', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: A request is made to the root URL
    const response = await page.goto('http://localhost:5173', { waitUntil: 'load' });

    // THEN: The server responds with status 200
    expect(response?.status()).toBe(200);
  });

  test('AC1 - should serve an HTML document from the Vite dev server', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: The browser navigates to the app root
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

    // THEN: The document contains a root mounting point for the React app
    const rootElement = page.locator('[data-testid="app-root"]');
    await expect(rootElement).toBeAttached();
  });

  test('AC4 - should not expose TypeScript compilation errors in the browser console', async ({ page }) => {
    // GIVEN: The Vite app has been compiled with strict TypeScript settings
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // WHEN: The page loads in the browser
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // THEN: No TypeScript-related errors appear in the console
    const tsErrors = consoleErrors.filter((e) =>
      e.toLowerCase().includes('typeerror') ||
      e.toLowerCase().includes('ts(') ||
      e.toLowerCase().includes('cannot find module')
    );
    expect(tsErrors).toHaveLength(0);
  });

  test('AC1 - should load the React application without crashing', async ({ page }) => {
    // GIVEN: The Vite dev server is running with the React app
    // WHEN: The root route is loaded
    // THEN: A <script type="module"> tag is present (Vite ESM entry point)
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    const moduleScripts = await page.locator('script[type="module"]').count();
    expect(moduleScripts).toBeGreaterThan(0);
  });
});
