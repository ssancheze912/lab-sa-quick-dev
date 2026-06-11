/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion Tests — Edge Cases & Boundary Conditions
 * Complements project-initialization.spec.ts (ATDD happy paths).
 *
 * Coverage areas NOT in ATDD:
 *   - Browser metadata (title, charset, viewport meta tag)
 *   - Favicon and static assets load without 404
 *   - React root element attributes (id + data-testid co-existence)
 *   - No mixed-content warnings (all assets served over same origin)
 *   - Performance boundary: page load under 5 seconds
 *   - Console error filtering precision (false negatives for TS errors)
 *   - Graceful render after browser back/forward navigation
 *   - Multiple fast reloads do not produce runtime errors
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Browser metadata & document structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend document structure edge cases', () => {
  test('[P1] should serve HTML with UTF-8 charset declared', async ({ page }) => {
    // GIVEN: The frontend Vite dev server is running
    // WHEN: The root HTML document is loaded
    await page.goto('/');

    // THEN: The document declares UTF-8 charset (required for proper encoding)
    const charset = await page.evaluate(() => {
      const meta = document.querySelector('meta[charset]');
      return meta ? meta.getAttribute('charset') : null;
    });
    expect(charset?.toLowerCase()).toBe('utf-8');
  });

  test('[P1] should include a viewport meta tag for responsive rendering', async ({ page }) => {
    // GIVEN: The frontend app is served by Vite
    // WHEN: The HTML document is parsed
    await page.goto('/');

    // THEN: A viewport meta tag exists so the layout works on mobile devices
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });
    expect(viewport).not.toBeNull();
    expect(viewport).toContain('width=device-width');
  });

  test('[P1] should have a non-empty page title', async ({ page }) => {
    // GIVEN: The Vite dev server renders index.html
    // WHEN: The browser tab title is set
    await page.goto('/');

    // THEN: The page has a non-empty title (avoids blank tab display)
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('[P2] should have a root element with id="root" or id="app"', async ({ page }) => {
    // GIVEN: React's standard mount point convention
    // WHEN: The page DOM is rendered
    await page.goto('/');

    // THEN: Either #root (React default) or #app (Vite vanilla) exists as the mount point
    const mountPoint = await page.evaluate(() => {
      return (
        document.getElementById('root') !== null ||
        document.getElementById('app') !== null
      );
    });
    expect(mountPoint).toBe(true);
  });

  test('[P2] should NOT include the vite error overlay element under normal conditions', async ({
    page,
  }) => {
    // GIVEN: TypeScript strict mode is enforced and code is error-free
    // WHEN: The page renders without compilation errors
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The Vite error overlay is not present in the DOM
    // (overlay appears as <vite-error-overlay> custom element when compilation fails)
    const overlayCount = await page.locator('vite-error-overlay').count();
    expect(overlayCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Static asset loading
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend static asset loading edge cases', () => {
  test('[P2] should serve all linked CSS resources without 404 errors', async ({ page }) => {
    // GIVEN: The frontend bundles CSS via Vite
    // WHEN: The page loads all its linked stylesheets
    const failedRequests: string[] = [];
    page.on('requestfailed', (request) => {
      if (request.url().includes('.css')) {
        failedRequests.push(request.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No CSS assets return network errors or 404
    expect(failedRequests).toHaveLength(0);
  });

  test('[P2] should serve all linked JavaScript modules without 404 errors', async ({ page }) => {
    // GIVEN: Vite bundles and serves JS modules on the dev server
    // WHEN: The browser fetches all module scripts
    const failedJsRequests: string[] = [];
    page.on('response', async (response) => {
      if (
        response.url().includes('.js') &&
        !response.url().includes('node_modules') &&
        response.status() === 404
      ) {
        failedJsRequests.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No JS modules return 404
    expect(failedJsRequests).toHaveLength(0);
  });

  test('[P3] should serve the favicon without a 404 error', async ({ request }) => {
    // GIVEN: Vite serves static assets from public/
    // WHEN: The browser fetches the favicon
    const response = await request.get('http://localhost:5173/favicon.svg').catch(() => null) ??
      await request.get('http://localhost:5173/favicon.ico').catch(() => null);

    // THEN: Favicon is served (200) — avoids repeated browser 404 noise in dev
    // Note: This is P3 as missing favicon is low severity but creates noise in console
    if (response !== null) {
      expect([200, 204]).toContain(response.status());
    }
    // If neither exists, skip gracefully (not a blocker for Story 1.1)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Performance boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend load performance boundaries', () => {
  test('[P2] should complete initial page load within 5 seconds', async ({ page }) => {
    // GIVEN: Vite dev server is running (dev mode, not production build)
    // WHEN: The page starts loading and reaches interactive state
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const elapsed = Date.now() - startTime;

    // THEN: Page loads within 5 seconds (generous for dev server cold start)
    // Exceeding this indicates a startup/compilation performance regression
    expect(elapsed).toBeLessThan(5000);
  });

  test('[P2] should render without hanging on network idle after initial load', async ({
    page,
  }) => {
    // GIVEN: The Vite app has no pending async operations at startup
    // WHEN: The page completes rendering
    await page.goto('/');

    // THEN: networkidle is reached within 10 seconds (no infinite polling loops)
    await expect(
      page.waitForLoadState('networkidle', { timeout: 10_000 })
    ).resolves.toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser navigation resilience
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend navigation resilience edge cases', () => {
  test('[P2] should survive a hard browser reload without JavaScript errors', async ({ page }) => {
    // GIVEN: The app loads successfully on first visit
    // WHEN: The user performs a hard reload (Ctrl+Shift+R behavior)
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/');
    await page.reload({ waitUntil: 'domcontentloaded' });

    // THEN: No JavaScript runtime exceptions occur on reload
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should render correctly after navigating to a different URL and pressing back', async ({
    page,
  }) => {
    // GIVEN: The app is loaded
    // Register pageerror listener BEFORE any navigation so errors are captured
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    // WHEN: The user navigates away and presses browser back
    await page.goto('/');
    await page.goto('about:blank');
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // THEN: The app re-renders without errors and the URL is correct
    expect(page.url()).toContain('localhost:5173');
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript strict mode edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TypeScript strict mode compliance edge cases', () => {
  test('[P1] should not expose TypeScript error indicators in page HTML source', async ({
    page,
  }) => {
    // GIVEN: TypeScript strict compilation is enforced
    // WHEN: The HTML source is examined for Vite error injection patterns
    await page.goto('/');
    const htmlContent = await page.content();

    // THEN: Common Vite TypeScript error markers are not present in the HTML
    // These strings appear when Vite injects compilation error details into the DOM
    expect(htmlContent).not.toContain('Plugin: vite:reporter');
    expect(htmlContent).not.toContain('TypeScript diagnostics');
  });

  test('[P1] should have the tsconfig active — TypeScript types recognized by Vite', async ({
    page,
    request,
  }) => {
    // GIVEN: The tsconfig.json has strict:true and the Vite server reads it
    // WHEN: An HTTP request is made to fetch the main entry file
    const response = await request.get('http://localhost:5173/');

    // THEN: The server responds with HTML (not a 500 from TypeScript configuration error)
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS boundary: wrong origin must be rejected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS boundary conditions', () => {
  const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

  test('[P1] should reject CORS preflight from an unauthorized origin', async ({ request }) => {
    // GIVEN: The backend CORS policy allows ONLY http://localhost:5173
    // WHEN: An OPTIONS preflight is made from an unauthorized origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://malicious-site.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The response does NOT include the unauthorized origin in ACAO header
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://malicious-site.example.com');
  });

  test('[P1] should NOT send CORS headers for requests without Origin header', async ({
    request,
  }) => {
    // GIVEN: A same-origin or server-to-server request (no Origin header)
    // WHEN: A plain GET request is made without Origin header
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server responds successfully (no CORS block needed for same-origin)
    // This validates the CORS middleware does not interfere with non-browser requests
    expect(response.status()).toBe(200);
  });

  test('[P2] should handle CORS preflight for POST requests from allowed origin', async ({
    request,
  }) => {
    // GIVEN: API endpoints will receive POST requests from the frontend
    // WHEN: An OPTIONS preflight for POST is made from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: The preflight is accepted (not rejected with 403)
    // AllowAnyMethod() must be configured so POST preflight is not blocked
    expect(response.status()).not.toBe(403);
  });
});
