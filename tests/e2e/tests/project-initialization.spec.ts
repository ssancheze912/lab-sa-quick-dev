/**
 * E2E Tests — Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Scope: Validate that frontend Vite dev server is reachable, responds with correct
 * HTTP status, delivers a React entry point, and that CORS headers are present
 * when the backend is called from the frontend origin.
 *
 * Test level selection rationale:
 *   - E2E tests cover the "both servers running" and cross-origin integration ACs.
 *   - API-level tests (tests/api) cover backend-specific ACs (Scalar, CORS preflight,
 *     Problem Details) without loading the full browser stack.
 *   - Unit tests (tests/unit) cover the pure, framework-agnostic initialization checks
 *     (tsconfig strict mode, project references, package.json scripts).
 *
 * Priority tags:
 *   [P0] — Critical infrastructure, must pass on every commit.
 *   [P1] — Important but not blocking CI on commit (run on PR to main).
 */

import { test, expect } from '@playwright/test';

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// AC-1: Frontend Vite server starts and delivers valid HTML
// ---------------------------------------------------------------------------

test.describe('Frontend Vite Dev Server — AC-1', () => {
  test('[P0] should respond with HTTP 200 on root route', async ({ request }) => {
    // GIVEN: The Vite dev server is running on port 5173
    // WHEN: A GET / request is made
    const response = await request.get(FRONTEND_BASE_URL + '/');

    // THEN: The server returns 200
    expect(response.status()).toBe(200);
  });

  test('[P0] should serve an HTML document with a React mount point', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    await page.goto(FRONTEND_BASE_URL + '/');

    // WHEN: The page is loaded
    // THEN: A #root div exists (standard React/Vite mount point)
    await expect(page.locator('#root')).toBeAttached();
  });

  test('[P1] should inject the Vite HMR client script in development mode', async ({ page }) => {
    // GIVEN: The Vite dev server is running in development mode
    await page.goto(FRONTEND_BASE_URL + '/');

    // WHEN: The HTML is inspected
    const html = await page.content();

    // THEN: The Vite HMR script tag is present
    expect(html).toContain('@vite/client');
  });

  test('[P1] should return a Content-Type of text/html for the root route', async ({ request }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: GET / is requested
    const response = await request.get(FRONTEND_BASE_URL + '/');

    // THEN: Content-Type header starts with text/html
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });
});

// ---------------------------------------------------------------------------
// AC-2: Backend .NET 10 server starts and Scalar docs load
// ---------------------------------------------------------------------------

test.describe('Backend .NET API Server — AC-2', () => {
  test('[P0] should respond with HTTP 200 on /scalar', async ({ request }) => {
    // GIVEN: The .NET backend is running on port 5000
    // WHEN: GET /scalar is requested
    const response = await request.get(BACKEND_BASE_URL + '/scalar');

    // THEN: The Scalar documentation page loads
    expect(response.status()).toBe(200);
  });

  test('[P1] should serve the Scalar documentation with HTML content', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /scalar is requested
    const response = await request.get(BACKEND_BASE_URL + '/scalar');

    // THEN: Content-Type is text/html (Scalar serves an SPA)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('[P1] should NOT expose Swagger UI (swagger/index.html must be 404)', async ({ request }) => {
    // GIVEN: The backend is running without Swagger (company standard)
    // WHEN: GET /swagger/index.html is requested
    const response = await request.get(BACKEND_BASE_URL + '/swagger/index.html', {
      failOnStatusCode: false,
    });

    // THEN: The endpoint does not exist
    expect(response.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// AC-3: CORS — frontend origin allowed by backend
// ---------------------------------------------------------------------------

test.describe('CORS Configuration — AC-3', () => {
  test('[P0] should include Access-Control-Allow-Origin for localhost:5173 on OPTIONS preflight', async ({
    request,
  }) => {
    // GIVEN: The backend CORS policy is configured for localhost:5173
    // WHEN: A CORS preflight (OPTIONS) request is made from the frontend origin
    const response = await request.fetch(BACKEND_BASE_URL + '/api/', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      failOnStatusCode: false,
    });

    // THEN: The backend allows the frontend origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin === 'http://localhost:5173' || allowOrigin === '*').toBe(true);
  });

  test('[P1] should NOT include CORS headers for disallowed origins', async ({ request }) => {
    // GIVEN: CORS is restricted to localhost:5173
    // WHEN: A preflight request is made from an untrusted origin
    const response = await request.fetch(BACKEND_BASE_URL + '/api/', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://evil.example.com',
        'Access-Control-Request-Method': 'GET',
      },
      failOnStatusCode: false,
    });

    // THEN: The disallowed origin is not reflected back
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.example.com');
  });

  test('[P1] GET request from frontend origin should not be blocked by CORS', async ({
    page,
  }) => {
    // GIVEN: Both servers are running
    await page.goto(FRONTEND_BASE_URL + '/');

    // WHEN: The frontend makes a fetch to the backend within the browser context
    const backendUrl = BACKEND_BASE_URL + '/scalar';
    const result = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url, { method: 'GET', mode: 'cors' });
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    }, backendUrl);

    // THEN: The request succeeds without a CORS error
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases & boundary conditions
// ---------------------------------------------------------------------------

test.describe('Edge Cases — Project Initialization', () => {
  test('[P1] frontend should return 200 for unknown routes (SPA fallback)', async ({ request }) => {
    // GIVEN: Vite is configured with history API fallback
    // WHEN: A non-existent route is requested directly
    const response = await request.get(FRONTEND_BASE_URL + '/ruta-que-no-existe');

    // THEN: Vite serves index.html (200) so the SPA router can handle the 404
    // (SPA apps must not return 404 at the server level for deep links)
    expect(response.status()).toBe(200);
  });

  test('[P2] backend root path should not expose a 500 unhandled error', async ({ request }) => {
    // GIVEN: The backend is running with a global exception middleware
    // WHEN: GET / is requested (no dedicated route)
    const response = await request.get(BACKEND_BASE_URL + '/', {
      failOnStatusCode: false,
    });

    // THEN: The response is NOT an unhandled 500 — 404 or 200 are both acceptable
    expect(response.status()).not.toBe(500);
  });

  test('[P2] backend should respond within 3 seconds on /scalar (startup health)', async ({
    request,
  }) => {
    // GIVEN: The backend has completed startup
    // WHEN: GET /scalar is timed
    const start = Date.now();
    const response = await request.get(BACKEND_BASE_URL + '/scalar');
    const elapsed = Date.now() - start;

    // THEN: Response arrives within 3 seconds (server is not hanging)
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  });

  test('[P2] frontend should respond within 3 seconds on initial load (dev server health)', async ({
    request,
  }) => {
    // GIVEN: Vite dev server has completed startup
    // WHEN: GET / is timed
    const start = Date.now();
    const response = await request.get(FRONTEND_BASE_URL + '/');
    const elapsed = Date.now() - start;

    // THEN: Response arrives within 3 seconds
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  });
});
