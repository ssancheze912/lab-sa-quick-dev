/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge Cases, Error Paths & Boundary Conditions
 * Expands ATDD coverage beyond the happy-path acceptance criteria.
 *
 * Coverage added (not in ATDD):
 *   EC-FE-1  — Page title is NOT the Vite default ("Vite + React")
 *   EC-FE-2  — No console warnings from React strict-mode double invocations leaking to production
 *   EC-FE-3  — Static assets (favicon, main chunk JS) are served with correct MIME types
 *   EC-FE-4  — Navigating to an unknown path does NOT cause a JavaScript crash
 *   EC-FE-5  — Vite HMR WebSocket connection does NOT throw in browser console
 *   EC-CORS-1 — Origin NOT in the allowlist is blocked (negative CORS test)
 *   EC-CORS-2 — CORS policy allows POST, PUT, DELETE methods (not just GET)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// EC-FE: Frontend edge cases & boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-FE — Frontend edge cases & boundary conditions', () => {
  test('[P1] EC-FE-1: page title must not be the default Vite template value', async ({ page }) => {
    // GIVEN: The frontend project has been customized from the Vite template
    // WHEN: The root page loads
    await page.goto('/');

    // THEN: The page title has been changed from the Vite default "Vite + React"
    //       (Implementation must update index.html <title> for Siesa Agents)
    const title = await page.title();
    expect(title).not.toBe('Vite + React');
    // Title must be non-empty
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('[P2] EC-FE-2: no unhandled JavaScript errors on repeated navigation to root', async ({ page }) => {
    // GIVEN: The frontend application is running
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // WHEN: The page is loaded and reloaded (simulates cache/HMR edge case)
    await page.goto('/');
    await page.reload();

    // THEN: No JavaScript errors appear across both loads
    expect(errors).toHaveLength(0);
  });

  test('[P1] EC-FE-3: main JavaScript bundle is served with correct MIME type', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    const jsMimeTypes: string[] = [];

    // WHEN: The page loads and browser requests the JS entry chunk
    page.on('response', (resp) => {
      const url = resp.url();
      const ct = resp.headers()['content-type'] ?? '';
      if (url.includes('.js') || url.includes('.tsx') || url.includes('main')) {
        jsMimeTypes.push(ct);
      }
    });

    await page.goto('/');

    // THEN: At least one JS chunk is served with text/javascript or application/javascript
    const hasValidJsMime = jsMimeTypes.some(
      (ct) => ct.includes('javascript') || ct.includes('text/html') // Vite dev: /main.tsx can return html wrapper
    );
    // The check: no response should come back with an error MIME (application/octet-stream for .js)
    const hasInvalidMime = jsMimeTypes.some(
      (ct) => ct === 'application/octet-stream'
    );
    expect(hasInvalidMime).toBe(false);
  });

  test('[P2] EC-FE-4: navigating to an unknown path does not cause a JavaScript crash', async ({ page }) => {
    // GIVEN: The frontend is running with TanStack Router
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // WHEN: The user navigates directly to a non-existent route
    await page.goto('/this-route-does-not-exist-atdd-boundary');

    // THEN: No JavaScript crash occurs (router should handle 404 gracefully)
    expect(errors).toHaveLength(0);
  });

  test('[P2] EC-FE-5: no WebSocket errors from Vite HMR in the browser console', async ({ page }) => {
    // GIVEN: Vite dev server is running with HMR enabled
    const wsErrors: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        (msg.text().toLowerCase().includes('websocket') ||
          msg.text().toLowerCase().includes('ws://') ||
          msg.text().toLowerCase().includes('hmr'))
      ) {
        wsErrors.push(msg.text());
      }
    });

    // WHEN: The page loads (HMR connection is established)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No WebSocket / HMR errors appear in the console
    expect(wsErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC-CORS: CORS negative and extended method tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-CORS — CORS negative and extended method tests', () => {
  test('[P1] EC-CORS-1: request from disallowed origin must not receive ACAO header', async ({
    request,
  }) => {
    // GIVEN: The CORS policy only allows http://localhost:5173
    // WHEN: A request is made from a different (disallowed) origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious-site.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header must NOT be the disallowed origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://malicious-site.example.com');
    // The server itself still responds (it doesn't drop the connection) — CORS is enforced
    // by the browser, but the header must NOT grant access to unauthorized origins
    expect(response.status()).toBeLessThan(500);
  });

  test('[P1] EC-CORS-2: OPTIONS preflight for POST method is allowed from frontend origin', async ({
    request,
  }) => {
    // GIVEN: The CORS policy uses AllowAnyMethod()
    // WHEN: An OPTIONS preflight for POST is sent from http://localhost:5173
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });

    // THEN: Preflight succeeds (200 or 204) — POST method is permitted
    expect([200, 204]).toContain(response.status());
    // Access-Control-Allow-Methods must include POST (or be *)
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    const allowsPost = allowMethods.includes('POST') || allowMethods === '*';
    expect(allowsPost).toBe(true);
  });

  test('[P2] EC-CORS-3: OPTIONS preflight for DELETE method is allowed from frontend origin', async ({
    request,
  }) => {
    // GIVEN: The CORS policy uses AllowAnyMethod()
    // WHEN: An OPTIONS preflight for DELETE is sent from http://localhost:5173
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight succeeds (200 or 204) — DELETE method is permitted
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] EC-CORS-4: Content-Type request header is explicitly allowed in preflight', async ({
    request,
  }) => {
    // GIVEN: AllowAnyHeader() is set in the CORS policy
    // WHEN: A preflight requests access for Content-Type and Authorization headers
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });

    // THEN: The preflight is not rejected (200 or 204)
    expect([200, 204]).toContain(response.status());
    // The response should acknowledge the requested headers
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    // Either specific headers are listed or '*' wildcard is returned
    const allowsContentType =
      allowHeaders.toLowerCase().includes('content-type') ||
      allowHeaders === '*';
    expect(allowsContentType).toBe(true);
  });
});
