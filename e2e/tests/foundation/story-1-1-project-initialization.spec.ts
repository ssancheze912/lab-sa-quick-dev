/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * Tests are intentionally FAILING until implementation is complete.
 * Covers ONLY the acceptance criteria for Story 1.1 (AC1 and AC4 — frontend).
 *
 * AC1 — pnpm run dev starts Vite server on port 5173 with no errors,
 *        TypeScript strict mode enabled in tsconfig.app.json
 * AC4 — TypeScript compiler emits zero errors with strict:true, noImplicitAny:true,
 *        strictNullChecks:true active
 *
 * Test level: E2E (Playwright, browser-driven)
 * Pattern: Given-When-Then with network-first intercepts before navigation
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Frontend Vite server starts on port 5173 with no errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Frontend Vite server starts on port 5173', () => {
  test('should respond with HTTP 200 on the root path', async ({ page }) => {
    // GIVEN: A clean development machine with Node.js and .NET 10 installed,
    //        and pnpm run dev has been executed in the frontend/ directory
    // WHEN: A browser navigates to http://localhost:5173/

    // Network-first: listen for the root navigation response BEFORE navigating
    const rootResponsePromise = page.waitForResponse(
      (resp) => resp.url().startsWith('http://localhost:5173') && resp.status() === 200
    );

    await page.goto('/', { waitUntil: 'commit' });
    const rootResponse = await rootResponsePromise;

    // THEN: The frontend application is served with HTTP 200
    expect(rootResponse.status()).toBe(200);
  });

  test('should render the React root mount point (data-testid="app-root")', async ({ page }) => {
    // GIVEN: The Vite dev server is running at http://localhost:5173
    // WHEN: The browser navigates to the root URL and the DOM is ready
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // THEN: A React root element with data-testid="app-root" is visible
    // Implementation must add data-testid="app-root" to the root div in index.html or main.tsx
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should serve a valid HTML document with a non-empty page title', async ({ page }) => {
    // GIVEN: Vite dev server on port 5173
    // WHEN: Navigating to the root URL
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // THEN: The page has a title (confirms Vite compiled index.html successfully)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have no JavaScript runtime exceptions on initial page load', async ({ page }) => {
    // GIVEN: The frontend project is initialized with all required dependencies
    // WHEN: The app renders for the first time

    // Network-first: attach error listeners BEFORE navigation
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // THEN: No JavaScript runtime exceptions are thrown during initial render
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: TypeScript strict mode — zero compiler errors at runtime
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — TypeScript strict mode active (strict:true, noImplicitAny:true, strictNullChecks:true)', () => {
  test('should not show Vite TypeScript error overlay on the root page', async ({ page }) => {
    // GIVEN: tsconfig.app.json has strict:true, noImplicitAny:true, strictNullChecks:true configured
    // WHEN: The Vite dev server compiles and serves the app

    // Network-first: register load state waiter BEFORE navigating
    await page.goto('/', { waitUntil: 'networkidle' });

    // THEN: The Vite compilation error overlay element is NOT present in the DOM
    // Vite renders TypeScript errors in a <vite-error-overlay> custom element
    const viteErrorOverlay = page.locator('vite-error-overlay');
    await expect(viteErrorOverlay).toHaveCount(0);
  });

  test('should not emit TypeScript compilation error messages in the browser console', async ({ page }) => {
    // GIVEN: TypeScript strict mode is enabled in tsconfig.app.json
    // WHEN: The page loads and Vite processes TypeScript files

    // Network-first: attach console listener BEFORE navigation
    const tsCompileErrors: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        (msg.text().includes('[TypeScript]') ||
          msg.text().includes('TS') ||
          msg.text().includes('tsc'))
      ) {
        tsCompileErrors.push(msg.text());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // THEN: No TypeScript compilation error messages appear in the browser console
    expect(tsCompileErrors).toHaveLength(0);
  });
});
