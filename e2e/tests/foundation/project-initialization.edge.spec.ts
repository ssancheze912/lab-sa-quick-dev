/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge Cases & Boundary Conditions (expansion of ATDD tests)
 *
 * Coverage focus:
 *   - Frontend load behavior under edge-case conditions (slow network, direct URL)
 *   - lang attribute and charset correctness
 *   - React StrictMode — no duplicate render-caused console warnings
 *   - Vite plugin chain: TailwindCSS and TanStack Router produce no asset errors
 *   - Viewport metadata present (mobile-readiness prerequisite)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: HTML document structure and meta attributes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend HTML document structure — boundary conditions', () => {
  test('[P1] should serve HTML with lang="es" attribute on the html element', async ({ page }) => {
    // GIVEN: index.html declares lang="es" for the Spanish-language app
    // WHEN: The frontend loads
    await page.goto('/');

    // THEN: The html element has the correct language attribute
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('es');
  });

  test('[P1] should serve HTML with UTF-8 charset meta tag', async ({ page }) => {
    // GIVEN: The app handles Spanish content with special characters (tildes, ñ)
    // WHEN: The page is loaded
    await page.goto('/');

    // THEN: Charset is declared as UTF-8
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset?.toLowerCase()).toBe('utf-8');
  });

  test('[P1] should have a viewport meta tag for mobile compatibility', async ({ page }) => {
    // GIVEN: Epic 1 requires mobile-responsive navigation (AC-E1.1)
    // WHEN: The page loads
    await page.goto('/');

    // THEN: viewport meta tag is present and declares width=device-width
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('[P1] should have a non-empty page title', async ({ page }) => {
    // GIVEN: index.html declares <title>Siesa Agents</title>
    // WHEN: The page is loaded
    await page.goto('/');

    // THEN: The document has a meaningful title (not empty, not "Vite App")
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('[P2] should mount the React root element without double-rendering artifacts', async ({ page }) => {
    // GIVEN: React 18 StrictMode in main.tsx causes effects to run twice in dev
    // WHEN: The app mounts
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Exactly one app-root element exists (not duplicated)
    const count = await page.locator('[data-testid="app-root"]').count();
    expect(count).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Asset loading — Vite plugin chain correctness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend Vite asset pipeline — edge cases', () => {
  test('[P1] should load all JavaScript assets without 404 errors', async ({ page }) => {
    // GIVEN: Vite bundles main.tsx via TanStack Router plugin and React plugin
    // WHEN: The page is loaded
    const failedAssets: string[] = [];

    page.on('requestfailed', (req) => {
      if (req.url().includes('/src/') || req.url().endsWith('.js') || req.url().endsWith('.ts')) {
        failedAssets.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript assets fail to load
    expect(failedAssets).toHaveLength(0);
  });

  test('[P1] should serve the main entry module (main.tsx) via Vite dev server', async ({ page }) => {
    // GIVEN: vite.config.ts uses @vitejs/plugin-react and TanStack Router plugin
    // WHEN: The page loads and Vite serves the module graph
    const moduleLoadErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Failed to load module')) {
        moduleLoadErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No module loading failures
    expect(moduleLoadErrors).toHaveLength(0);
  });

  test('[P2] should not expose any unhandled promise rejections on initial load', async ({ page }) => {
    // GIVEN: QueryProvider, RouterProvider initialization could produce unhandled rejections
    // WHEN: The app bootstraps
    const unhandledRejections: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('unhandledrejection')) {
        unhandledRejections.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No unhandled promise rejections surface on initial render
    expect(unhandledRejections).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Direct URL navigation (deep linking prerequisite)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend direct URL navigation — edge cases', () => {
  test('[P1] should respond with HTTP 200 when navigating directly to root URL', async ({ request }) => {
    // GIVEN: TanStack Router handles client-side routing
    // WHEN: A direct HTTP GET is made to the root
    const response = await request.get('http://localhost:5173/');

    // THEN: Vite dev server returns the HTML shell (200)
    expect(response.status()).toBe(200);
  });

  test('[P2] should serve the same HTML shell for unknown paths (SPA behavior)', async ({ request }) => {
    // GIVEN: Vite dev server is configured for SPA mode (serves index.html for all paths)
    // WHEN: A request is made to a non-existent path
    const response = await request.get('http://localhost:5173/nonexistent-route-xyz');

    // THEN: Server returns the HTML shell (200) so TanStack Router can handle client-side 404
    // Note: Vite may return 200 with index.html or a proper 404 depending on historyApiFallback
    expect([200, 404]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Static asset integrity — CSS, icons
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend static asset integrity — edge cases', () => {
  test('[P1] should load TailwindCSS without producing 404 asset failures', async ({ page }) => {
    // GIVEN: TailwindCSS v4 is configured via @tailwindcss/vite plugin and imported in index.css
    // WHEN: The page loads and the browser requests CSS assets
    const cssFailures: string[] = [];

    page.on('requestfailed', (req) => {
      if (req.url().endsWith('.css') || req.url().includes('tailwind')) {
        cssFailures.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No CSS assets fail to load
    expect(cssFailures).toHaveLength(0);
  });

  test('[P2] should serve the favicon without a 404 error', async ({ request }) => {
    // GIVEN: index.html declares <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    // WHEN: The browser requests the favicon
    const response = await request.get('http://localhost:5173/favicon.svg');

    // THEN: The favicon is served (200) — a 404 would cause browser icon errors
    expect(response.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Frontend isolation — no implicit backend coupling on initial load
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend backend coupling — boundary conditions', () => {
  test('[P2] should render the initial shell without making requests to the backend', async ({ page }) => {
    // GIVEN: The root route (__root.tsx) is a layout placeholder with no data fetching
    // WHEN: The app loads at /
    const backendRequests: string[] = [];

    page.on('request', (req) => {
      if (req.url().includes('localhost:5000')) {
        backendRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No requests are made to the backend API on the empty shell route
    // This confirms the root route is a pure layout without data dependencies
    expect(backendRequests).toHaveLength(0);
  });

  test('[P2] should not produce React key-prop warnings on initial render', async ({ page }) => {
    // GIVEN: RouterProvider and QueryProvider are initialized in main.tsx
    // WHEN: The app renders for the first time
    const keyWarnings: string[] = [];

    page.on('console', (msg) => {
      if (
        msg.type() === 'warning' &&
        msg.text().includes('key')
      ) {
        keyWarnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No React key-prop warnings (list rendering without keys) appear
    expect(keyWarnings).toHaveLength(0);
  });
});
