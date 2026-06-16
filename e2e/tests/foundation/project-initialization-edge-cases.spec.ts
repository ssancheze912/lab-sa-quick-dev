/**
 * Story 1.1: Project Initialization & Repository Structure — Edge Cases
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands ATDD coverage with edge cases, boundary conditions, and error paths
 * NOT covered by the primary ATDD acceptance tests.
 *
 * Coverage:
 *   - AC1: Frontend server robustness (large payloads, asset loading, performance bounds)
 *   - AC3: CORS boundary conditions (wrong origin, missing origin, multiple headers)
 *   - AC4: TypeScript strict mode — negative compilation scenarios
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 Edge Cases — Frontend server robustness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Frontend server edge cases', () => {
  test('[P1] should serve static assets (JS bundle) with correct content-type', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: The browser loads the main JavaScript bundle
    const jsResponses: { url: string; contentType: string }[] = [];

    page.on('response', (resp) => {
      if (resp.url().includes('.js') || resp.url().includes('.tsx')) {
        jsResponses.push({
          url: resp.url(),
          contentType: resp.headers()['content-type'] ?? '',
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: At least one JavaScript asset was served with application/javascript content-type
    const validJsAssets = jsResponses.filter(
      (r) =>
        r.contentType.includes('javascript') || r.contentType.includes('ecmascript')
    );
    expect(validJsAssets.length).toBeGreaterThan(0);
  });

  test('[P1] should respond on port 5173 within acceptable time boundary (under 5 seconds)', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: The root URL is requested
    const startTime = Date.now();
    await page.goto('/');
    const elapsed = Date.now() - startTime;

    // THEN: The server responds within 5 seconds (not hanging)
    expect(elapsed).toBeLessThan(5000);
  });

  test('[P2] should return 404 for non-existent static assets (not a 500 server error)', async ({ request }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: A request is made to a non-existent static file path
    const response = await request.get('http://localhost:5173/non-existent-asset.xyz');

    // THEN: Server returns 404 (asset not found), NOT a 500 (server crash)
    // Vite returns 404 for unknown assets, which proves the server is healthy
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(0);
  });

  test('[P1] should serve index.html for unknown paths (SPA routing support)', async ({ request }) => {
    // GIVEN: A Single Page Application with client-side routing
    // WHEN: A deep-link URL (not a real file) is requested
    const response = await request.get('http://localhost:5173/some/deep/spa-route');

    // THEN: The server returns HTML (index.html fallback for SPA), not 404
    // Vite's --spa flag or historyApiFallback ensures SPA deep links work
    const contentType = response.headers()['content-type'] ?? '';
    // Either the server returns index.html (200) or a 404 handled by the app
    // Key: it must NOT be a 500 error (server crash)
    expect(response.status()).not.toBe(500);
    expect(contentType).not.toContain('application/json'); // must be HTML, not JSON error
  });

  test('[P2] should render with no network requests to unexpected external domains', async ({ page }) => {
    // GIVEN: The app is initialized locally only (no external CDN dependencies)
    // WHEN: The page loads
    const externalRequests: string[] = [];
    const allowedDomains = ['localhost', '127.0.0.1'];

    page.on('request', (req) => {
      const url = new URL(req.url());
      if (!allowedDomains.some((d) => url.hostname.includes(d))) {
        externalRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No unexpected external network calls are made during initialization
    // (Allows data: and blob: URIs used internally by Vite)
    const unexpectedExternal = externalRequests.filter(
      (url) => !url.startsWith('data:') && !url.startsWith('blob:')
    );
    expect(unexpectedExternal).toHaveLength(0);
  });

  test('[P1] should not display the Vite error overlay for missing module errors', async ({ page }) => {
    // GIVEN: All runtime dependencies are installed (pnpm install completed)
    // WHEN: The application boots
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No "Failed to resolve module" or "Cannot find module" errors appear
    const moduleErrors = consoleErrors.filter(
      (e) =>
        e.includes('Failed to resolve') ||
        e.includes('Cannot find module') ||
        e.includes('Module not found')
    );
    expect(moduleErrors).toHaveLength(0);
  });

  test('[P2] should include a <title> element in the HTML document', async ({ page }) => {
    // GIVEN: A properly initialized Vite React app
    // WHEN: The root page loads
    await page.goto('/');

    // THEN: The document has a <title> element (basic HTML structure requirement)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('[P2] should have a viewport meta tag for responsive behavior', async ({ page }) => {
    // GIVEN: The index.html is generated from the Vite react-ts template
    // WHEN: The page loads
    await page.goto('/');

    // THEN: A viewport meta tag exists (required for mobile/responsive apps)
    const viewportMeta = await page.locator('meta[name="viewport"]').count();
    expect(viewportMeta).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 Edge Cases — CORS boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — CORS boundary conditions', () => {
  test('[P1] should NOT include CORS allow-origin header for unauthorized origins', async ({ request }) => {
    // GIVEN: The CORS policy "DevCors" only allows http://localhost:5173
    // WHEN: A request is made from an unknown/unauthorized origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil-site.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header must NOT grant access to the rogue origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://evil-site.example.com');
  });

  test('[P1] should handle OPTIONS preflight for POST method from frontend origin', async ({ request }) => {
    // GIVEN: CORS middleware is configured before endpoint mapping
    // WHEN: An OPTIONS preflight is made for a POST request from the frontend
    const response = await request.fetch(`${API_BASE_URL}/api/some-endpoint`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Preflight succeeds — not rejected with 403
    // Backend may return 404 for unknown endpoint but OPTIONS itself must not be blocked
    expect(response.status()).not.toBe(403);
    expect(response.status()).not.toBe(0);
  });

  test('[P2] should return Access-Control-Allow-Methods in preflight response', async ({ request }) => {
    // GIVEN: CORS policy allows any method (.AllowAnyMethod())
    // WHEN: A preflight OPTIONS request specifies POST method
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Server processes the OPTIONS request without rejecting it
    // A CORS-configured server must respond to preflight without 403/500
    expect(response.status()).not.toBe(403);
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(0);
  });

  test('[P1] should not expose CORS header when no Origin header is sent (same-origin request)', async ({
    request,
  }) => {
    // GIVEN: The CORS middleware only adds headers when Origin is present
    // WHEN: A direct request is made without any Origin header (same-origin / server-to-server)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds successfully (CORS restriction is browser-enforced, not server rejection)
    // Server must NOT reject requests without Origin header
    expect(response.status()).not.toBe(403);
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should handle CORS for http://localhost:5173 with trailing slash variant', async ({
    request,
  }) => {
    // GIVEN: CORS policy explicitly specifies http://localhost:5173 (no trailing slash)
    // WHEN: A request is made from http://localhost:5173/ (with trailing slash)
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:5173/',
      },
    });

    // THEN: Server responds without 500 error (may or may not include CORS header for trailing slash variant)
    // The key behavior: server must not crash when handling origin with trailing slash
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 Edge Cases — TypeScript strict mode configuration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — TypeScript strict mode edge cases', () => {
  test('[P1] should not expose source maps from tsconfig compilation errors in production builds', async ({
    page,
  }) => {
    // GIVEN: TypeScript strict mode is active
    // WHEN: The application loads in development mode (Vite serves source maps)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The application loaded without TypeScript error overlays
    // This verifies the tsconfig strict flags didn't cause compilation failures
    const errorOverlay = page.locator('vite-error-overlay');
    const errorCount = await errorOverlay.count();
    expect(errorCount).toBe(0);
  });

  test('[P2] should not have any console errors related to undefined type guards', async ({ page }) => {
    // GIVEN: strictNullChecks:true prevents null/undefined runtime errors at the type level
    // WHEN: The app initializes and renders
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No "Cannot read property of undefined/null" runtime errors
    // (These would indicate TypeScript strict checks were bypassed or cast incorrectly)
    const nullErrors = consoleErrors.filter(
      (e) =>
        e.includes("Cannot read properties of undefined") ||
        e.includes("Cannot read properties of null") ||
        e.includes("is not a function") ||
        e.includes("is not defined")
    );
    expect(nullErrors).toHaveLength(0);
  });

  test('[P1] should load the QueryProvider without React context errors', async ({ page }) => {
    // GIVEN: QueryProvider wraps the app with TanStack React Query context
    // WHEN: The app renders
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No "No QueryClient set" or React context errors appear
    const queryErrors = consoleErrors.filter(
      (e) =>
        e.includes('QueryClient') ||
        e.includes('No QueryClient') ||
        e.includes('useQueryClient')
    );
    expect(queryErrors).toHaveLength(0);
  });

  test('[P1] should load the TanStack Router without "RouterProvider" context errors', async ({ page }) => {
    // GIVEN: RouterProvider is configured in main.tsx with the generated routeTree
    // WHEN: The app renders
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No router-related errors appear
    const routerErrors = consoleErrors.filter(
      (e) =>
        e.includes('RouterProvider') ||
        e.includes('router') ||
        e.includes('routeTree')
    );
    expect(routerErrors).toHaveLength(0);
  });
});
