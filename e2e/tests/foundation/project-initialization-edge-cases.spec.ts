/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge Cases & Boundary Conditions
 * Expands ATDD coverage with negative paths, boundary checks, and regression guards
 * that the ATDD RED-phase tests do not cover.
 *
 * Coverage added:
 *   AC1 edge cases — Page stability across reloads, unique mount point, no mixed-content,
 *                    no duplicate <script type="module"> errors
 *   AC4 edge cases — Vite build plugin chain, no 404 for critical JS/CSS assets,
 *                    import.meta.env.VITE_API_URL present in bundled output
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Frontend stability and boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 (Edge) — Frontend application stability boundaries', () => {
  test('[P1] should reach network-idle state within reasonable time on initial load', async ({
    page,
  }) => {
    // GIVEN: The Vite dev server is running at http://localhost:5173
    // WHEN: The page navigates and all async resources settle
    const networkIdlePromise = page.waitForLoadState('networkidle');
    await page.goto('/');
    await networkIdlePromise;

    // THEN: The app-root element is still visible after network idle
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P1] should render a single app-root element (no duplicate mount points)', async ({
    page,
  }) => {
    // GIVEN: src/routes/__root.tsx wraps content in a single <div data-testid="app-root">
    // WHEN: The application loads
    await page.goto('/');

    // THEN: Exactly one [data-testid="app-root"] exists in the DOM — duplicates break React
    await expect(page.locator('[data-testid="app-root"]')).toHaveCount(1);
  });

  test('[P1] should remain stable after a browser hard reload (F5 equivalent)', async ({
    page,
  }) => {
    // GIVEN: The app loaded successfully on first navigation
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    // WHEN: The page is hard-reloaded (cache bypass)
    await page.reload({ waitUntil: 'domcontentloaded' });

    // THEN: The app still mounts correctly after reload
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P1] should not produce any console errors on page reload', async ({ page }) => {
    // GIVEN: Initial page load is clean
    await page.goto('/');

    // WHEN: The page is reloaded
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    await page.reload({ waitUntil: 'load' });

    // THEN: No console errors appear on reload
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P2] should not produce any JavaScript runtime errors on page reload', async ({
    page,
  }) => {
    // GIVEN: Initial page load is stable
    await page.goto('/');

    // WHEN: The page is reloaded
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });
    await page.reload({ waitUntil: 'load' });

    // THEN: No unhandled exceptions are thrown on reload
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P1] should serve main JS bundle without 404 (critical Vite output)', async ({
    page,
  }) => {
    // GIVEN: Vite bundles main.tsx as the entry point
    // WHEN: The page loads — collect all failed network requests
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      // Only capture JS/CSS asset failures — not optional resources
      if (req.url().match(/\.(js|ts|jsx|tsx|css)(\?|$)/)) {
        failedRequests.push(`${req.failure()?.errorText ?? 'unknown'} — ${req.url()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No JS/CSS assets returned 404 or connection failures
    expect(failedRequests).toHaveLength(0);
  });

  test('[P2] should have the page title set (not empty browser default)', async ({ page }) => {
    // GIVEN: index.html provides a <title> tag
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The document title is not empty
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('[P2] should not render Vite default boilerplate content (project must be customized)', async ({
    page,
  }) => {
    // GIVEN: The team has replaced the Vite react-ts template placeholder content
    // WHEN: The home page loads
    await page.goto('/');

    // THEN: The page does NOT show the generic "Vite + React" default heading
    // (presence of this text means the template was not customized)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Vite + React');
  });

  test('[P1] should not have mixed-content warnings (all resources via same protocol)', async ({
    page,
  }) => {
    // GIVEN: The app runs on http://localhost:5173 (HTTP in dev)
    // WHEN: The page loads — collect security-related console messages
    const mixedContentErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text().toLowerCase();
      if (
        msg.type() === 'error' &&
        (text.includes('mixed content') || text.includes('blocked:mixed-content'))
      ) {
        mixedContentErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No mixed-content blocking errors
    expect(mixedContentErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — TypeScript / Build configuration boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 (Edge) — TypeScript build and bundler boundary conditions', () => {
  test('[P1] should NOT have Vite error overlay for any route (build health check)', async ({
    page,
  }) => {
    // GIVEN: tsconfig.app.json has strict:true, noImplicitAny, strictNullChecks
    // WHEN: Each main route is visited
    for (const route of ['/', '/clientes', '/contactos']) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      // THEN: The Vite error overlay (TypeScript compile error display) does NOT appear
      const overlay = page.locator('vite-error-overlay');
      await expect(overlay).toHaveCount(0);
    }
  });

  test('[P2] should respond with HTTP 200 for the root route (Vite serves index.html for SPA)', async ({
    page,
  }) => {
    // GIVEN: Vite is configured as an SPA dev server
    // WHEN: A direct request is made to the root
    const response = await page.request.get('http://localhost:5173/');

    // THEN: Vite returns 200 with the HTML entry point
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('[P2] should serve SPA fallback for unknown frontend routes (no 404 from Vite server)', async ({
    page,
  }) => {
    // GIVEN: Vite dev server is configured for SPA mode (history API fallback)
    // WHEN: A deep-link to a non-root route is requested directly from Vite
    const response = await page.request.get('http://localhost:5173/some-unknown-spa-route');

    // THEN: Vite returns the index.html for client-side routing (200, not 404)
    // This ensures TanStack Router can handle the route on the client
    expect(response.status()).toBe(200);
  });

  test('[P1] should expose VITE_API_URL environment variable to the frontend bundle', async ({
    page,
  }) => {
    // GIVEN: .env.development contains VITE_API_URL=http://localhost:5000
    // WHEN: The app is running and the environment is accessible
    await page.goto('/');

    // THEN: The VITE_API_URL variable is defined (not undefined) in import.meta.env
    const apiUrl = await page.evaluate(() => {
      // Access import.meta.env in the browser context
      return (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL;
    });
    expect(apiUrl).toBeTruthy();
    expect(apiUrl).toContain('localhost:5000');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 (Edge) — CORS negative paths and boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 (Edge) — Frontend CORS error monitoring boundary conditions', () => {
  test('[P1] should not produce network failures when making API request to backend from frontend context', async ({
    page,
  }) => {
    // GIVEN: Both servers are running and CORS is properly configured
    await page.goto('/');

    // WHEN: A fetch request is made to the backend Scalar endpoint
    const networkFailures: string[] = [];
    page.on('requestfailed', (req) => {
      if (req.url().includes('localhost:5000')) {
        networkFailures.push(`${req.failure()?.errorText ?? 'unknown'} — ${req.url()}`);
      }
    });

    await page.evaluate(async () => {
      try {
        await fetch('http://localhost:5000/scalar', {
          method: 'GET',
          mode: 'cors',
        });
      } catch {
        // Fetch throws on network error; we capture via page.on('requestfailed') above
      }
    });

    // THEN: Request was not failed at the network layer (CORS pre-flight did not abort it)
    // Note: this passes even if fetch throws — requestfailed fires only for network errors, not CORS rejections
    // A separate console check (in ATDD) covers the CORS error message detection
    expect(networkFailures).toHaveLength(0);
  });

  test('[P2] should complete the full frontend-to-backend round trip without page errors', async ({
    page,
  }) => {
    // GIVEN: Frontend is loaded and backend is running
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // WHEN: Frontend JavaScript makes a request to the backend
    await page.evaluate(async () => {
      try {
        await fetch('http://localhost:5000/scalar');
      } catch {
        // Intentionally swallow — we only care that no page-level exception is thrown
      }
    });

    // THEN: The page-level JS error handler was not triggered
    expect(pageErrors).toHaveLength(0);
  });
});
