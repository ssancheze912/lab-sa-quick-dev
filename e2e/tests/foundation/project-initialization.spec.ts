/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Frontend Vite server starts on port 5173 with TypeScript strict mode
 *   AC3 — CORS allows requests from http://localhost:5173 to http://localhost:5000
 *   AC4 — TypeScript compiler emits zero errors with strict flags active
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Frontend server starts on port 5173 with no errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Frontend Vite server initialization', () => {
  test('should serve the frontend app on port 5173 without errors', async ({ page }) => {
    // GIVEN: A clean development machine with Node.js installed
    // WHEN: The developer runs pnpm run dev (baseURL is http://localhost:5173)

    // Network-first: register response listener BEFORE navigation
    const rootResponse = page.waitForResponse(
      (resp) => resp.url() === 'http://localhost:5173/' && resp.status() === 200
    );

    await page.goto('/');

    // THEN: The frontend application loads successfully (HTTP 200)
    const response = await rootResponse;
    expect(response.status()).toBe(200);
  });

  test('should render the root HTML document with a valid React mount point', async ({ page }) => {
    // GIVEN: The Vite dev server is running at http://localhost:5173
    // WHEN: The browser navigates to the root URL
    await page.goto('/');

    // THEN: The page contains a React root element (data-testid="app-root")
    // Implementation must add data-testid="app-root" to the #root div in index.html or App.tsx
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should load without any TypeScript compilation errors visible in the browser console', async ({ page }) => {
    // GIVEN: TypeScript strict mode is enabled in tsconfig.app.json
    // WHEN: The page loads
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // THEN: No TypeScript compilation errors appear in the console
    const tsErrors = consoleErrors.filter((e) => e.includes('[TypeScript]') || e.includes('TS'));
    expect(tsErrors).toHaveLength(0);
  });

  test('should not have any JavaScript runtime errors on initial load', async ({ page }) => {
    // GIVEN: The frontend project is initialized with all required dependencies
    // WHEN: The app renders for the first time
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/');

    // THEN: No JavaScript runtime exceptions are thrown
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: CORS allows requests from http://localhost:5173
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — CORS configuration between frontend and backend', () => {
  test('should allow frontend to reach backend health endpoint without CORS errors', async ({ page }) => {
    // GIVEN: Both frontend (5173) and backend (5000) servers are running

    const corsErrors: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        (msg.text().toLowerCase().includes('cors') ||
          msg.text().toLowerCase().includes('cross-origin') ||
          msg.text().toLowerCase().includes('access-control'))
      ) {
        corsErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      if (
        err.message.toLowerCase().includes('cors') ||
        err.message.toLowerCase().includes('cross-origin')
      ) {
        corsErrors.push(err.message);
      }
    });

    // WHEN: The frontend navigates and makes a request to the backend
    await page.goto('/');

    // Trigger a real request to the backend from the browser context (same as frontend would)
    await page.evaluate(async (apiUrl) => {
      await fetch(`${apiUrl}/scalar`, { method: 'GET' });
    }, API_BASE_URL);

    // THEN: No CORS-related errors appear in the console
    expect(corsErrors).toHaveLength(0);
  });

  test('should receive a valid HTTP response from the backend health probe without CORS blocking', async ({
    page,
    request,
  }) => {
    // GIVEN: Both servers are running
    // WHEN: A cross-origin preflight is made from http://localhost:5173 to http://localhost:5000
    // NOTE: Playwright request context tests the API directly; CORS headers must be present

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Backend responds (not blocked — 200 or redirect, not CORS-rejected 0/blocked)
    expect([200, 301, 302]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: TypeScript strict mode configuration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — TypeScript strict mode active on frontend', () => {
  test('should load the frontend without Vite TypeScript error overlay', async ({ page }) => {
    // GIVEN: tsconfig.app.json has strict:true, noImplicitAny:true, strictNullChecks:true
    // WHEN: The Vite dev server compiles and serves the app

    // Network-first: intercept BEFORE navigation
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/');
    await appLoad;

    // THEN: The Vite error overlay (TypeScript compile errors) is NOT visible
    // Vite renders compilation errors in a data-testid="vite-error-overlay" or similar overlay
    const errorOverlay = page.locator('vite-error-overlay');
    await expect(errorOverlay).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES — Expanded coverage (automate phase)
// Beyond raw ACs: defensive checks for the application shell, dev server
// behavior, and resilience against common Vite/TanStack-Router regressions.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge cases — Frontend application shell', () => {
  test('[P1] should render the home page heading with the application name', async ({ page }) => {
    // GIVEN: The Vite dev server is running and routes are wired via TanStack Router
    // WHEN: The user navigates to the root URL
    await page.goto('/');

    // THEN: The home placeholder renders the "Siesa Agents" heading
    await expect(page.getByRole('heading', { level: 1, name: /siesa agents/i })).toBeVisible();
  });

  test('[P1] should render the home page description paragraph', async ({ page }) => {
    // GIVEN: The home route component is mounted
    // WHEN: The page renders
    await page.goto('/');

    // THEN: The descriptive paragraph confirms initialization
    await expect(page.getByText(/aplicación inicializada correctamente/i)).toBeVisible();
  });

  test('[P2] should serve index.html with valid UTF-8 charset metadata', async ({ page }) => {
    // GIVEN: The Vite dev server is serving the SPA shell
    // WHEN: The browser requests the root HTML document
    const response = await page.goto('/');

    // THEN: The HTML document is returned with the UTF-8 charset declared
    expect(response).not.toBeNull();
    const body = await response!.text();
    expect(body).toMatch(/charset="utf-8"/i);
  });

  test('[P2] should declare a viewport meta tag for mobile responsiveness', async ({ page }) => {
    // GIVEN: The SPA must render on desktop and mobile (epic 1 AC-E1.1)
    // WHEN: The root HTML is requested
    await page.goto('/');

    // THEN: A viewport meta tag is present for responsive layouts
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /width=device-width/
    );
  });

  test('[P2] should expose the React root element with the expected mount id', async ({ page }) => {
    // GIVEN: main.tsx mounts React onto document.getElementById('root')
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The #root element exists and is the same as the data-testid="app-root" element
    const rootById = page.locator('#root');
    await expect(rootById).toHaveCount(1);
    await expect(rootById).toHaveAttribute('data-testid', 'app-root');
  });

  test('[P2] should load the main.tsx module script without 404 errors', async ({ page }) => {
    // GIVEN: index.html references /src/main.tsx as the entry module
    // WHEN: The browser fetches the entry module
    const failedRequests: { url: string; status: number }[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 400 && resp.url().includes('/src/')) {
        failedRequests.push({ url: resp.url(), status: resp.status() });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No source-module requests return 4xx/5xx
    expect(failedRequests).toEqual([]);
  });

  test('[P2] should not produce any browser console warnings on initial load', async ({ page }) => {
    // GIVEN: A clean implementation should not leak React/Vite/Router warnings
    // WHEN: The page loads to networkidle
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No warnings (React StrictMode + dev tooling should be clean for a fresh shell)
    // Note: filter out known harmless devtools-suggestion messages from React/Vite
    const meaningful = warnings.filter(
      (w) =>
        !w.includes('Download the React DevTools') &&
        !w.toLowerCase().includes('devtools')
    );
    expect(meaningful).toEqual([]);
  });
});

test.describe('Edge cases — Routing resilience', () => {
  test('[P2] should handle an unknown deep-link URL without a JavaScript crash', async ({
    page,
  }) => {
    // GIVEN: TanStack Router with only "/" registered in this story
    // WHEN: The user navigates to an unknown route directly
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/this-route-does-not-exist');

    // THEN: The app must not throw uncaught runtime exceptions (story 1.2 will add 404 UI)
    // We tolerate a missing UI — but never a JS crash on the shell
    expect(runtimeErrors).toEqual([]);
    await expect(page.locator('[data-testid="app-root"]')).toBeAttached();
  });

  test('[P2] should keep the app shell mounted when navigating to a deep link', async ({
    page,
  }) => {
    // GIVEN: The SPA shell renders inside #root regardless of route
    // WHEN: Navigating directly to any URL path
    await page.goto('/any/deep/path');

    // THEN: The shell (#root) is always present
    await expect(page.locator('[data-testid="app-root"]')).toBeAttached();
  });
});

test.describe('Edge cases — Dev server behavior', () => {
  test('[P2] should respond with HTML content-type for the root document', async ({ request }) => {
    // GIVEN: Vite serves the SPA index for the root URL
    // WHEN: A direct HTTP request is made (no JS execution)
    const response = await request.get('http://localhost:5173/');

    // THEN: The response is a 200 HTML document
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/text\/html/);
  });

  test('[P2] should serve the favicon without a 404 error', async ({ request }) => {
    // GIVEN: index.html references /favicon.svg
    // WHEN: The browser fetches the favicon
    const response = await request.get('http://localhost:5173/favicon.svg');

    // THEN: Favicon is served (200) — NOT 404 (regression guard against deleted asset)
    // Tolerates either the default Vite SVG favicon or a project-supplied one
    expect([200, 304]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND-DEPENDENT EDGE CASES (AC2 + AC5) — fixme
// Cannot execute in this sandbox: .NET 10 SDK is not installed and the backend
// service is not running on :5000. Marked with test.fixme() so CI / dev
// machines with the SDK installed can pick them up automatically.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Backend Scalar API documentation (deferred)', () => {
  test.fixme(
    '[P1] should serve the Scalar API reference at /scalar on port 5000',
    async ({ request }) => {
      // FIXME: Marked as fixme — backend .NET 10 SDK is not available in this sandbox.
      // The backend project files are authored but `dotnet build` / `dotnet run` cannot
      // execute here. Re-enable when running on a machine with the .NET 10 SDK installed
      // and the backend service started on http://localhost:5000.
      //
      // GIVEN: Backend is running on http://localhost:5000
      // WHEN: A GET request is made to /scalar
      // THEN: The Scalar API reference page loads (200)
      const response = await request.get(`${API_BASE_URL}/scalar`);
      expect(response.status()).toBe(200);
      const body = await response.text();
      expect(body.toLowerCase()).toContain('scalar');
    }
  );

  test.fixme(
    '[P2] should redirect or 404 cleanly for unknown backend routes (no stack traces)',
    async ({ request }) => {
      // FIXME: Backend .NET 10 SDK unavailable in this sandbox.
      // Validates AC tied to ExceptionHandlingMiddleware + Problem Details (story 1.3 NFR6).
      //
      // GIVEN: Backend is running with ExceptionHandlingMiddleware
      // WHEN: An unknown route is requested
      // THEN: The response is 404 with no .NET stack-trace leakage
      const response = await request.get(`${API_BASE_URL}/this-endpoint-does-not-exist`);
      expect([404, 405]).toContain(response.status());
      const body = await response.text();
      expect(body.toLowerCase()).not.toContain('at microsoft.aspnetcore');
      expect(body.toLowerCase()).not.toContain('stacktrace');
    }
  );
});
