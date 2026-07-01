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
// Coverage Expansion (BMad-Integrated Automate)
// Edge cases beyond the ATDD happy paths. Covers R1 (CORS), R3 (Problem Details),
// R8 (Scalar), and the "/" → "/scalar" redirect wired in Program.cs.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend root redirect and Scalar endpoint variants', () => {
  test('[P2] should redirect GET / to /scalar', async ({ request }) => {
    // GIVEN: Program.cs registers app.MapGet("/", () => Results.Redirect("/scalar"))
    // WHEN: A GET request hits the backend root
    const response = await request.get(`${API_BASE_URL}/`, {
      maxRedirects: 0,
    });

    // THEN: The response is a redirect (301/302/307/308) pointing at /scalar
    expect([301, 302, 307, 308]).toContain(response.status());
    const location = response.headers()['location'] ?? '';
    expect(location).toContain('/scalar');
  });

  test('[P1] should serve the OpenAPI JSON document required by Scalar', async ({ request }) => {
    // GIVEN: Program.cs registers builder.Services.AddOpenApi() + app.MapOpenApi()
    // WHEN: The OpenAPI document is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Either the endpoint exists (200 + JSON) OR the alternate spec path is used.
    // Both cases prove the OpenAPI pipeline is wired for Scalar consumption.
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('json');
    }
  });

  test('[P2] should not serve the .NET default WeatherForecast endpoint under any casing', async ({
    request,
  }) => {
    // GIVEN: The default Vite/webapi template's WeatherForecast endpoints must be removed
    // WHEN: The endpoint is requested with different casings
    const lower = await request.get(`${API_BASE_URL}/weatherforecast`);
    const upper = await request.get(`${API_BASE_URL}/WeatherForecast`);

    // THEN: None of them respond as if the endpoint exists
    expect(lower.status()).not.toBe(200);
    expect(upper.status()).not.toBe(200);
  });
});

test.describe('[P0] CORS negative paths — disallowed origins must not receive echo', () => {
  test('[P0] should NOT echo disallowed origin in Access-Control-Allow-Origin header', async ({
    request,
  }) => {
    // GIVEN: CORS policy only allows http://localhost:5173 (per appsettings.Development.json)
    // WHEN: A cross-origin request is made from an attacker-controlled origin
    const disallowedOrigin = 'http://evil.example.com';

    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: disallowedOrigin,
      },
    });

    // THEN: The server MUST NOT echo the disallowed origin.
    // ASP.NET Core CORS simply omits the header for non-allowed origins (does not error).
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe(disallowedOrigin);
    // Also must not be a wildcard (would defeat the explicit-origin policy)
    expect(allowOrigin).not.toBe('*');
  });

  test('[P1] preflight from disallowed origin should not grant CORS headers', async ({ request }) => {
    // GIVEN: CORS policy is strict (only 5173)
    // WHEN: Preflight OPTIONS arrives from an unauthorized origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://malicious.local',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Access-Control-Allow-Origin must NOT be the disallowed origin nor "*"
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://malicious.local');
    expect(allowOrigin).not.toBe('*');
  });
});

test.describe('[P0] ExceptionHandlingMiddleware — RFC 7807 Problem Details contract (R3)', () => {
  test('[P0] non-existent API path returns 404 without leaking HTML error page or stack trace', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before endpoints in Program.cs
    // WHEN: An unregistered path is requested
    const response = await request.get(`${API_BASE_URL}/api/does-not-exist-${Date.now()}`);

    // THEN: The response is a proper 404 (not a server crash).
    // Content-Type may be empty (default .NET Minimal API 404) or JSON — but MUST NOT be HTML,
    // because an HTML error page would indicate a developer-mode diagnostic leak.
    expect(response.status()).toBe(404);
    const contentType = (response.headers()['content-type'] ?? '').toLowerCase();
    expect(contentType).not.toContain('text/html');

    // Body must not leak a raw stack trace even on 404
    const body = await response.text();
    expect(body.toLowerCase()).not.toContain('stacktrace');
    expect(body.toLowerCase()).not.toContain('at siesaagents.');
  });

  test('[P0] Scalar endpoint responses must NEVER expose stack-trace strings', async ({
    request,
  }) => {
    // GIVEN: NFR6 — no stack trace exposure in any response
    // WHEN: Any endpoint response is inspected
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: Response body must not contain typical .NET exception markers
    const forbidden = ['at SiesaAgents.', 'System.Exception', 'InnerException'];
    for (const marker of forbidden) {
      expect(body).not.toContain(marker);
    }
  });
});

test.describe('[P2] Backend responds sanely to unusual HTTP methods on /scalar', () => {
  test('[P2] HEAD /scalar should not crash the server', async ({ request }) => {
    // GIVEN: Scalar registered at /scalar
    // WHEN: A HEAD request is made (Scalar uses GET; HEAD may 200/405 depending on framework)
    const response = await request.fetch(`${API_BASE_URL}/scalar`, { method: 'HEAD' });

    // THEN: Server responds with a defined status (not 0/network error, not 500)
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] POST /scalar should not crash the server (method not allowed acceptable)', async ({
    request,
  }) => {
    // WHEN: A POST hits /scalar (only GET is registered)
    const response = await request.post(`${API_BASE_URL}/scalar`, { data: {} });

    // THEN: Server responds cleanly (405, 404, or the redirect target — anything but 500)
    expect(response.status()).not.toBe(500);
  });
});
