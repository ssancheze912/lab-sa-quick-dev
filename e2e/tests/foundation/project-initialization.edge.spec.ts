/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * EXPANDED COVERAGE — Edge Cases, Boundary Conditions & Error Paths
 * Complements: project-initialization.spec.ts (ATDD happy paths)
 *
 * These tests cover scenarios NOT present in the ATDD baseline:
 *   - HTML structural integrity (mount point, meta tags, charset)
 *   - Asset loading failure isolation (JS errors vs network errors)
 *   - Navigation resilience on root route (no redirect loops)
 *   - Multiple concurrent requests without CORS regression
 *   - Non-allowed origins should NOT receive CORS header
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// HTML Structure & Meta — boundary conditions for AC1
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Frontend HTML structural integrity', () => {
  test('[P1] should serve HTML with correct charset declaration', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: The root HTML document is fetched
    await page.goto('/');

    // THEN: The document has UTF-8 charset declared (required for international content)
    const charset = await page.evaluate(() => document.characterSet);
    expect(charset.toLowerCase()).toBe('utf-8');
  });

  test('[P1] should have a valid page title element in the HTML document', async ({ page }) => {
    // GIVEN: The Vite project is initialized with a standard index.html
    // WHEN: The root URL is loaded
    await page.goto('/');

    // THEN: A <title> element is present (required for accessibility and SEO)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('[P1] should mount the React application inside the app root element', async ({ page }) => {
    // GIVEN: main.tsx mounts the app and index.html has data-testid="app-root"
    // WHEN: The page renders
    await page.goto('/');

    // THEN: The app-root element exists in the DOM and is visible (React mounted)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P1] should not redirect the root URL to another path', async ({ page }) => {
    // GIVEN: TanStack Router is configured with a root route at /
    // WHEN: The browser navigates to /
    await page.goto('/');

    // THEN: The URL remains at / — no infinite redirect or forced redirect
    expect(page.url()).toBe('http://localhost:5173/');
  });

  test('[P2] should not have any network requests returning 5xx errors on page load', async ({
    page,
  }) => {
    // GIVEN: The frontend is initialized with all required dependencies
    // WHEN: The page loads and fetches its initial resources
    const serverErrors: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 500) {
        serverErrors.push(`${resp.status()} ${resp.url()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No frontend static assets or JS modules return 5xx responses
    expect(serverErrors).toHaveLength(0);
  });

  test('[P2] should load the main JS module without 404 errors', async ({ page }) => {
    // GIVEN: Vite builds and serves the main.tsx entry point
    // WHEN: The root page loads
    const notFoundAssets: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() === 404 && (resp.url().includes('.js') || resp.url().includes('.ts'))) {
        notFoundAssets.push(resp.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript module resolves to a 404 (all imports resolve correctly)
    expect(notFoundAssets).toHaveLength(0);
  });

  test('[P2] should not expose Vite error overlay on initial render', async ({ page }) => {
    // GIVEN: TypeScript compilation is clean
    // WHEN: The application loads
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: No Vite compilation error overlay is shown
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  });

  test('[P2] should not expose Vite runtime error marker on initial render', async ({ page }) => {
    // GIVEN: The frontend application initializes without exceptions
    // WHEN: The application loads
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: No data-vite-error attribute is present in the DOM
    await expect(page.locator('[data-vite-error]')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS boundary conditions — extending AC3
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — CORS boundary conditions', () => {
  test('[P1] should NOT return CORS header for a non-allowed origin', async ({ request }) => {
    // GIVEN: The DevCors policy only allows http://localhost:5173
    // WHEN: A request arrives with a completely different origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header does NOT echo the evil origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.example.com');
  });

  test('[P1] should allow GET requests via CORS from the permitted frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows http://localhost:5173 with any method
    // WHEN: A GET is made with the allowed origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: The response is successful (not CORS-blocked → 200 not 0/blocked)
    expect(response.status()).toBe(200);
  });

  test('[P1] OPTIONS preflight should include Access-Control-Allow-Methods header', async ({
    request,
  }) => {
    // GIVEN: AllowAnyMethod() is configured in the CORS policy
    // WHEN: A preflight OPTIONS request is sent
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });

    // THEN: The preflight response includes Access-Control-Allow-Methods
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    // AllowAnyMethod returns a wildcard or comma-separated list
    expect(allowMethods.length).toBeGreaterThan(0);
  });

  test('[P2] OPTIONS preflight should include Access-Control-Allow-Headers for Content-Type', async ({
    request,
  }) => {
    // GIVEN: AllowAnyHeader() is configured in the CORS policy
    // WHEN: A preflight requests approval for Content-Type header
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Access-Control-Allow-Headers is present in the response
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    expect(allowHeaders.length).toBeGreaterThan(0);
  });

  test('[P2] should not generate CORS errors when frontend fetches a non-existent API route', async ({
    page,
  }) => {
    // GIVEN: CORS is configured to allow all methods from http://localhost:5173
    // WHEN: The frontend makes a cross-origin request that results in a 404
    const corsErrors: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        (msg.text().toLowerCase().includes('cors') ||
          msg.text().toLowerCase().includes('access-control'))
      ) {
        corsErrors.push(msg.text());
      }
    });

    await page.goto('/');

    await page.evaluate(async (apiUrl) => {
      try {
        await fetch(`${apiUrl}/api/nonexistent-cors-test`, { method: 'GET' });
      } catch {
        // network error is acceptable; CORS error is not
      }
    }, API_BASE_URL);

    // THEN: A 404 from the API does NOT produce a CORS error (CORS should still pass for allowed origin)
    expect(corsErrors).toHaveLength(0);
  });
});
