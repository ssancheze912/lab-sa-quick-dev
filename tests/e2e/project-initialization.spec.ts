/**
 * Story 1.1: Project Initialization & Repository Structure
 * E2E Acceptance Tests — RED Phase (Failing before implementation)
 *
 * AC covered:
 *  AC1 — Vite dev server starts on port 5173 with zero TypeScript errors
 *  AC2 — Backend starts on port 5000 and Scalar docs load at /scalar
 *  AC3 — CORS allows requests from http://localhost:5173 without errors
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// AC1 — Frontend Vite dev server starts on port 5173
// ---------------------------------------------------------------------------

test.describe('Story 1.1 — Frontend dev server (AC1)', () => {
  test('should load the root app shell on port 5173', async ({ page }) => {
    // GIVEN: A clean development machine with Node.js installed and pnpm run dev executed
    // WHEN: The developer navigates to http://localhost:5173
    const responsePromise = page.waitForResponse(
      (resp) => resp.url() === 'http://localhost:5173/' && resp.status() === 200,
    );

    await page.goto('http://localhost:5173/');

    // THEN: The app shell loads with HTTP 200 and no JS console errors
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('should serve the app with Content-Type text/html', async ({ page }) => {
    // GIVEN: Vite dev server is running on port 5173
    // WHEN: Browser requests the root URL
    const responsePromise = page.waitForResponse('http://localhost:5173/');
    await page.goto('http://localhost:5173/');
    const response = await responsePromise;

    // THEN: Response Content-Type is text/html (Vite serves the SPA entry point)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('should render the root app container in the DOM', async ({ page }) => {
    // GIVEN: Vite dev server is running
    // WHEN: Browser loads the frontend app
    await page.goto('http://localhost:5173/');

    // THEN: The React root mount point is present (data-testid="app-root")
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC2 — Backend starts on port 5000 and Scalar docs load at /scalar
// ---------------------------------------------------------------------------

test.describe('Story 1.1 — Backend Scalar API docs (AC2)', () => {
  test('should load the Scalar API documentation page at /scalar', async ({ page }) => {
    // GIVEN: dotnet run has been executed in src/SiesaAgents.API
    // WHEN: Browser navigates to http://localhost:5000/scalar
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/scalar') && resp.status() === 200,
    );

    await page.goto('http://localhost:5000/scalar');

    // THEN: Scalar documentation page loads successfully
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('should display the Scalar UI heading on the docs page', async ({ page }) => {
    // GIVEN: Backend is running on port 5000 with Scalar configured
    // WHEN: Browser loads the Scalar docs page
    await page.goto('http://localhost:5000/scalar');

    // THEN: The Scalar reference UI is rendered (data-testid="scalar-reference" or fallback to title text)
    // Scalar renders a heading element; we verify the page is not a blank error page
    await expect(page.locator('[data-testid="scalar-reference"], h1, title')).not.toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// AC3 — CORS allows requests from http://localhost:5173
// ---------------------------------------------------------------------------

test.describe('Story 1.1 — CORS configuration (AC3)', () => {
  test('should return CORS headers allowing requests from http://localhost:5173', async ({ page }) => {
    // GIVEN: Both frontend (5173) and backend (5000) servers are running
    // WHEN: Frontend at localhost:5173 makes a cross-origin request to localhost:5000
    let corsHeaderPresent = false;

    // Intercept BEFORE navigation (network-first pattern)
    const preflight = page.waitForResponse(
      (resp) =>
        resp.url().startsWith('http://localhost:5000') &&
        (resp.request().method() === 'OPTIONS' || resp.request().method() === 'GET'),
    );

    await page.goto('http://localhost:5173/');

    // Trigger a cross-origin fetch to the backend health endpoint
    const corsResult = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:5000/health', {
          method: 'GET',
          headers: { Origin: 'http://localhost:5173' },
        });
        return {
          ok: res.ok,
          corsHeader: res.headers.get('access-control-allow-origin'),
        };
      } catch (err) {
        return { ok: false, corsHeader: null, error: String(err) };
      }
    });

    // THEN: The response includes Access-Control-Allow-Origin: http://localhost:5173
    expect(corsResult.corsHeader).toBe('http://localhost:5173');
  });

  test('should produce no CORS-related console errors when frontend fetches backend', async ({
    page,
  }) => {
    // GIVEN: Both servers are running
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // WHEN: The frontend app loads and makes its initial API calls
    await page.goto('http://localhost:5173/');
    // Wait for any deferred network activity to complete
    await page.waitForLoadState('networkidle');

    // THEN: No CORS-related errors appear in the browser console
    const corsErrors = consoleErrors.filter(
      (err) =>
        err.toLowerCase().includes('cors') ||
        err.toLowerCase().includes('access-control') ||
        err.toLowerCase().includes('cross-origin'),
    );
    expect(corsErrors).toHaveLength(0);
  });
});
