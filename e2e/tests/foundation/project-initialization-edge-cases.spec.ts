/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge Cases & Boundary Conditions
 * Expands ATDD coverage with error paths, config boundaries, and negative scenarios.
 *
 * Coverage focus:
 *   AC1 — Frontend initialization edge cases (duplicate errors, network issues, env config)
 *   AC3 — CORS boundary conditions (non-allowed origins, multiple error types)
 *   AC4 — TypeScript strict mode edge cases (Vite overlay, module resolution)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 Edge Cases — Frontend initialization boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 Edge Cases — Frontend initialization boundaries', () => {
  test('[P1] should serve frontend with correct Content-Type text/html', async ({ request }) => {
    // GIVEN: Vite dev server is running
    // WHEN: A direct GET request is made to the root URL
    const response = await request.get(FRONTEND_URL + '/');

    // THEN: Content-Type must include text/html (not JSON or binary)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('[P1] should include the React root div with correct id in the HTML document', async ({ request }) => {
    // GIVEN: index.html defines <div id="root" data-testid="app-root">
    // WHEN: The raw HTML is fetched from the root
    const response = await request.get(FRONTEND_URL + '/');
    const body = await response.text();

    // THEN: The HTML contains a div with id="root"
    expect(body).toContain('id="root"');
  });

  test('[P1] should include data-testid="app-root" attribute in the HTML document', async ({ request }) => {
    // GIVEN: index.html defines data-testid="app-root" for test addressability
    // WHEN: The raw HTML is fetched
    const response = await request.get(FRONTEND_URL + '/');
    const body = await response.text();

    // THEN: The HTML contains the test attribute
    expect(body).toContain('data-testid="app-root"');
  });

  test('[P2] should include a module script tag pointing to src/main.tsx', async ({ request }) => {
    // GIVEN: Vite serves the app via <script type="module" src="/src/main.tsx">
    // WHEN: The HTML is fetched
    const response = await request.get(FRONTEND_URL + '/');
    const body = await response.text();

    // THEN: A module script tag is present (Vite entry point)
    expect(body).toMatch(/type="module"/);
  });

  test('[P1] should not produce duplicate pageerror events on initial load', async ({ page }) => {
    // GIVEN: A fresh browser context
    // WHEN: The page loads and any errors are collected
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Zero runtime errors — duplicates and single errors alike are forbidden
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should have no failed network requests for core assets on initial load', async ({ page }) => {
    // GIVEN: All static assets (JS, CSS) are resolved correctly
    // WHEN: The page loads
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => failedRequests.push(req.url()));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No static asset requests fail (no 404s for JS/CSS chunks)
    const assetFailures = failedRequests.filter((url) =>
      url.includes('localhost:5173') && (url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.ts'))
    );
    expect(assetFailures).toHaveLength(0);
  });

  test('[P2] should render the app-root element without requiring backend to be reachable', async ({ page }) => {
    // GIVEN: The frontend is a SPA that should render without backend connectivity
    // WHEN: The page loads (backend may or may not be running)
    await page.goto('/');

    // THEN: The React root is mounted regardless of backend state
    await expect(page.locator('[data-testid="app-root"]')).toBeAttached();
  });

  test('[P2] should respond on unknown frontend routes with HTML (SPA fallback)', async ({ request }) => {
    // GIVEN: Vite serves a SPA — unknown paths should still return the index.html shell
    // WHEN: A request is made to a non-existent frontend route
    const response = await request.get(FRONTEND_URL + '/this-route-does-not-exist-atdd');

    // THEN: HTTP 200 with HTML (SPA fallback, not 404)
    // Note: Vite dev server serves index.html for all unknown routes
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 Edge Cases — CORS boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 Edge Cases — CORS boundary conditions', () => {
  test('[P1] should NOT return Access-Control-Allow-Origin for an untrusted origin', async ({ request }) => {
    // GIVEN: CORS policy only allows http://localhost:5173
    // WHEN: A request is made with a different origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The response does NOT echo back the untrusted origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://evil.example.com');
  });

  test('[P1] should allow POST preflight from http://localhost:5173', async ({ request }) => {
    // GIVEN: CORS policy includes AllowAnyMethod()
    // WHEN: An OPTIONS preflight is sent for a POST request from the frontend origin
    const response = await request.fetch(`${API_BASE_URL}/api/nonexistent`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight is accepted (200 or 204) — not rejected (403 or 0)
    expect([200, 204]).toContain(response.status());
  });

  test('[P1] should allow PUT preflight from http://localhost:5173', async ({ request }) => {
    // GIVEN: CORS policy includes AllowAnyMethod()
    // WHEN: An OPTIONS preflight is sent for a PUT request
    const response = await request.fetch(`${API_BASE_URL}/api/nonexistent`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight is accepted
    expect([200, 204]).toContain(response.status());
  });

  test('[P1] should allow DELETE preflight from http://localhost:5173', async ({ request }) => {
    // GIVEN: CORS policy includes AllowAnyMethod()
    // WHEN: An OPTIONS preflight is sent for a DELETE request
    const response = await request.fetch(`${API_BASE_URL}/api/nonexistent`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight is accepted
    expect([200, 204]).toContain(response.status());
  });

  test('[P1] should allow Content-Type and Authorization headers in CORS preflight', async ({ request }) => {
    // GIVEN: CORS policy includes AllowAnyHeader()
    // WHEN: A preflight with custom headers is sent
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    });

    // THEN: The preflight does not reject the custom headers (200 or 204)
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] should have Access-Control-Allow-Methods or not block any method in CORS response', async ({ request }) => {
    // GIVEN: CORS policy allows all methods
    // WHEN: An OPTIONS preflight is made with POST method request
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
      },
    });

    // THEN: Response succeeds — not a 403 forbidden
    expect(response.status()).not.toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 Edge Cases — TypeScript strict mode enforcement
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 Edge Cases — TypeScript strict mode enforcement', () => {
  test('[P1] should not show Vite error overlay after full page idle', async ({ page }) => {
    // GIVEN: TypeScript strict mode active, all files compiled
    // WHEN: The page loads and reaches networkidle state
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The Vite error overlay element (custom element "vite-error-overlay") is absent
    const overlay = page.locator('vite-error-overlay');
    await expect(overlay).toHaveCount(0);
  });

  test('[P2] should not show Vite plugin error overlay (#vite-overlay-root)', async ({ page }) => {
    // GIVEN: TypeScript strict mode is active with noImplicitAny and strictNullChecks
    // WHEN: The app loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No Vite plugin runtime error overlay (alternative selector used by some Vite versions)
    const pluginOverlay = page.locator('[data-vite-overlay]');
    await expect(pluginOverlay).toHaveCount(0);
  });

  test('[P2] should not print [TypeScript] errors in browser console after navigation', async ({ page }) => {
    // GIVEN: The frontend was compiled with strict TypeScript
    // WHEN: User navigates to root and waits for full load
    const tsErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('[TypeScript]')) {
        tsErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Zero TypeScript compilation messages reach the browser
    expect(tsErrors).toHaveLength(0);
  });

  test('[P2] should not print Vite HMR error messages in console', async ({ page }) => {
    // GIVEN: Vite HMR is active in dev mode
    // WHEN: The page loads initially (not after a file change)
    const hmrErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('hmr')) {
        hmrErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No HMR error messages on initial load
    expect(hmrErrors).toHaveLength(0);
  });
});
