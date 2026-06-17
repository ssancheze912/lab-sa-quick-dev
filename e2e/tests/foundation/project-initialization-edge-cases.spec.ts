/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded Automation Tests — Edge Cases & Boundary Conditions
 * Complements the ATDD acceptance tests with error paths, boundary conditions,
 * and resilience scenarios not covered in the RED-phase ATDD suite.
 *
 * Coverage:
 *   AC1 — Frontend server edge cases (unknown routes, page refresh, HTML meta)
 *   AC3 — CORS edge cases (disallowed origins, preflight rejection)
 *   AC4 — TypeScript/runtime edge cases (console warnings threshold, performance)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 edge cases: Frontend app-shell resilience
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge cases — Frontend app-shell resilience', () => {
  test('[P1] should not crash when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The Vite dev server is running and TanStack Router is configured
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    // WHEN: The browser navigates to an arbitrary unknown path
    await page.goto('/ruta-que-no-existe-atdd-test');

    // THEN: The app does not throw a JavaScript runtime exception
    // (Router should render a fallback or 404 UI, not a crash)
    expect(runtimeErrors).toHaveLength(0);

    // AND: The app-root container is still present in the DOM
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P1] should serve the frontend correctly after a hard refresh (cache bypass)', async ({ page }) => {
    // GIVEN: The app has been loaded once
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    // WHEN: The page is hard-refreshed (bypasses browser cache — Ctrl+Shift+R equivalent)
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.reload({ waitUntil: 'networkidle' });

    // THEN: The app still renders correctly after reload
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should have an HTML title element on initial load', async ({ page }) => {
    // GIVEN: The Vite project has index.html configured
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The page has a <title> element (SEO and tab identity)
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('[P2] should serve static assets (JS bundle) with correct content type', async ({ page }) => {
    // GIVEN: Vite serves the compiled React app
    // WHEN: The root page loads, monitor JS responses

    const jsResponses: string[] = [];
    page.on('response', (resp) => {
      const ct = resp.headers()['content-type'] ?? '';
      if (resp.url().includes('.js') || resp.url().includes('/@vite') || resp.url().includes('/src/main')) {
        jsResponses.push(ct);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: At least one JavaScript resource was served
    // (Vite serves the React bundle as application/javascript or text/javascript)
    const validJsTypes = jsResponses.filter(
      (ct) => ct.includes('javascript') || ct.includes('ecmascript')
    );
    expect(validJsTypes.length).toBeGreaterThan(0);
  });

  test('[P2] should not produce excessive console warnings on initial load', async ({ page }) => {
    // GIVEN: A clean Vite + React setup with no intentional warnings
    const consoleWarnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No more than 5 warnings (threshold for "clean" initialization)
    // React StrictMode may emit a few deprecation warnings in dev mode
    expect(consoleWarnings.length).toBeLessThanOrEqual(5);
  });

  test('[P1] should load the app within a reasonable time (< 10 seconds)', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    const startTime = Date.now();

    // WHEN: The page loads to interactive
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // THEN: The app shell loads within 10 seconds (dev mode threshold)
    expect(loadTime).toBeLessThan(10_000);
  });

  test('[P2] should have a viewport-responsive meta tag in the HTML', async ({ page }) => {
    // GIVEN: index.html is configured correctly for a web app
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The viewport meta tag is present (prevents mobile scaling issues)
    const viewportMeta = await page.locator('meta[name="viewport"]').count();
    expect(viewportMeta).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge cases: CORS boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge cases — CORS boundary conditions', () => {
  const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

  test('[P1] should reject cross-origin requests from non-allowed origins', async ({ request }) => {
    // GIVEN: CORS policy only allows http://localhost:5173
    // WHEN: A request is made with a non-allowed origin header
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil-site.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header does NOT allow the evil origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://evil-site.com');
    // AND: The server still responds (CORS is a browser enforcement mechanism;
    // the server returns 200 but without allowing the origin in headers)
    // This validates the header is absent or restricted, not a network error
    expect(response.status()).not.toBe(0);
  });

  test('[P1] should handle OPTIONS preflight with disallowed method gracefully', async ({ request }) => {
    // GIVEN: CORS policy is configured
    // WHEN: An OPTIONS preflight is sent requesting a DELETE method
    // (DELETE is allowed per AllowAnyMethod — this tests boundary of "AllowAnyMethod")
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Server does not crash (responds with 200 or 204)
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] should handle requests without Origin header (non-CORS requests)', async ({ request }) => {
    // GIVEN: Some tools (curl, Postman without explicit Origin) omit the Origin header
    // WHEN: A GET request is made without an Origin header
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds normally (CORS check is skipped for non-CORS requests)
    expect(response.status()).toBe(200);
  });

  test('[P2] should not return Access-Control-Allow-Credentials for non-credentialed requests', async ({
    request,
  }) => {
    // GIVEN: The CORS policy does not explicitly set AllowCredentials
    // WHEN: A plain GET is made
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: The credentials header value, if present, should NOT be 'true'
    // (enabling credentials without explicit setup is a security concern)
    const credentialsHeader = response.headers()['access-control-allow-credentials'] ?? '';
    expect(credentialsHeader).not.toBe('true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 edge cases: TypeScript / runtime boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 edge cases — TypeScript strict mode boundary conditions', () => {
  test('[P1] should not expose Vite error overlay for any module loading failure', async ({ page }) => {
    // GIVEN: All imports in main.tsx and routes/__root.tsx are valid
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    // WHEN: The page loads and modules initialize
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Vite error overlay is absent (no module resolution errors)
    const viteOverlay = page.locator('vite-error-overlay');
    await expect(viteOverlay).toHaveCount(0);

    // AND: No page-level errors were thrown
    const moduleErrors = pageErrors.filter(
      (e) =>
        e.includes('Cannot resolve module') ||
        e.includes('Failed to fetch dynamically imported module') ||
        e.includes('SyntaxError')
    );
    expect(moduleErrors).toHaveLength(0);
  });

  test('[P2] should load React in StrictMode without double-invocation errors', async ({ page }) => {
    // GIVEN: main.tsx wraps the app in React.StrictMode
    // WHEN: The page loads (StrictMode intentionally double-invokes effects in dev)
    const strictModeErrors: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        (msg.text().includes('StrictMode') || msg.text().includes('act('))
      ) {
        strictModeErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No StrictMode-related errors (double-invocation should be silent in dev)
    expect(strictModeErrors).toHaveLength(0);
  });

  test('[P2] should have QueryProvider context available at root level', async ({ page }) => {
    // GIVEN: main.tsx wraps RouterProvider inside QueryProvider
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The React Query devtools or context is active without errors
    // Verified indirectly: app-root visible means QueryProvider mounted successfully
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    // AND: No React context errors (Missing QueryClientProvider) in console
    const contextErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('QueryClient')) {
        contextErrors.push(msg.text());
      }
    });

    // Trigger a re-render by navigating
    await page.goto('/');
    expect(contextErrors).toHaveLength(0);
  });
});
