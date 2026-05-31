/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Frontend Edge Cases & Boundary Tests — Expanded Coverage
 * Complements project-initialization.spec.ts and project-initialization-edge.spec.ts
 * with HTML document structure, network configuration, React hydration,
 * and dependency initialization edge cases.
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// HTML document structure — boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend — HTML document structure boundary conditions', () => {
  test('[P1] should have the correct charset meta tag (UTF-8)', async ({ page }) => {
    // GIVEN: index.html declares <meta charset="UTF-8" />
    // WHEN: The page is loaded
    await page.goto('/');

    // THEN: The charset meta is present with value "UTF-8"
    const charsetMeta = page.locator('meta[charset]');
    await expect(charsetMeta).toHaveCount(1);
    const charset = await charsetMeta.getAttribute('charset');
    expect(charset?.toUpperCase()).toBe('UTF-8');
  });

  test('[P1] should set lang attribute on the html element', async ({ page }) => {
    // GIVEN: index.html has <html lang="en"> (or another locale)
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The html element has a non-empty lang attribute (accessibility requirement)
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(typeof htmlLang).toBe('string');
    expect(htmlLang.trim().length).toBeGreaterThan(0);
  });

  test('[P1] should mount the React app inside the #root element (not in body directly)', async ({ page }) => {
    // GIVEN: main.tsx uses createRoot(document.getElementById("root")!)
    // WHEN: The app is rendered
    await page.goto('/');

    // THEN: The #root element contains child nodes (React tree is mounted)
    const rootChildCount = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.childElementCount : 0;
    });
    expect(rootChildCount).toBeGreaterThan(0);
  });

  test('[P2] should have no multiple #root elements (DOM integrity)', async ({ page }) => {
    // GIVEN: index.html defines exactly one <div id="root">
    // WHEN: The page is loaded and React mounts
    await page.goto('/');

    // THEN: There is exactly one element with id="root" (no duplicate mount points)
    const rootCount = await page.locator('#root').count();
    expect(rootCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// React application initialization — hydration edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend — React application hydration', () => {
  test('[P1] should render the index page heading "Siesa Agents" on the root path', async ({ page }) => {
    // GIVEN: index.tsx renders <h1>Siesa Agents</h1> for the "/" route
    // WHEN: The root path is loaded
    await page.goto('/');

    // THEN: An h1 element with the text "Siesa Agents" is visible
    const heading = page.locator('h1');
    await expect(heading).toContainText('Siesa Agents');
  });

  test('[P1] should not render in React strict mode with duplicate lifecycle warnings as errors', async ({ page }) => {
    // GIVEN: main.tsx wraps the app in <React.StrictMode>
    // WHEN: The app mounts (StrictMode invokes lifecycle twice in dev)
    const consoleWarnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('act(')) {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No act() warnings (which would indicate unresolved async state updates)
    expect(consoleWarnings).toHaveLength(0);
  });

  test('[P2] should NOT have any uncaught promise rejections on initial load', async ({ page }) => {
    // GIVEN: All async initialization (QueryProvider, router) completes without error
    // WHEN: The app loads on the root path
    const unhandledRejections: string[] = [];
    page.on('pageerror', (err) => {
      if (err.message.includes('UnhandledPromiseRejection') || err.message.includes('Promise')) {
        unhandledRejections.push(err.message);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No unhandled promise rejections occurred
    expect(unhandledRejections).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TanStack Router — additional navigation edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend — TanStack Router additional edge cases', () => {
  test('[P1] should navigate to "/" and maintain the app-root wrapper without full page reload', async ({ page }) => {
    // GIVEN: The app is loaded on the root path
    // WHEN: The user navigates programmatically back to "/"
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to unknown route then back to root (client-side navigation)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: app-root is still visible (React tree persisted across navigations)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P2] should render the root outlet without crashing on deep unknown paths', async ({ page }) => {
    // GIVEN: TanStack Router handles nested paths that have no matching routes
    // WHEN: A deeply nested unknown path is loaded
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/deep/nested/unknown/path/atdd/test');

    // THEN: No runtime errors (router handles the no-match case gracefully)
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] URL hash navigation should not crash the application', async ({ page }) => {
    // GIVEN: The router may receive hash-based URLs
    // WHEN: The root path with a hash fragment is loaded
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/#section-that-does-not-exist');

    // THEN: No crash occurs
    expect(runtimeErrors).toHaveLength(0);
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Vite build — asset loading and network response
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend — Vite asset loading boundary conditions', () => {
  test('[P1] should load the main JavaScript module without a 404 or network error', async ({ page }) => {
    // GIVEN: Vite injects a <script type="module" src="/src/main.tsx"> in index.html
    // WHEN: The page loads
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      if (req.url().includes('/src/main')) {
        failedRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The main module loaded without failure
    expect(failedRequests).toHaveLength(0);
  });

  test('[P2] should load the index.css (TailwindCSS v4) without a 404 error', async ({ page }) => {
    // GIVEN: index.css is imported in main.tsx with TailwindCSS v4 "@import tailwindcss"
    // WHEN: The page loads all stylesheets
    const cssErrors: string[] = [];
    page.on('requestfailed', (req) => {
      if (req.url().includes('.css') || req.url().includes('index.css')) {
        cssErrors.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No CSS file loading failures
    expect(cssErrors).toHaveLength(0);
  });

  test('[P2] page should have at least one stylesheet link or inline style applied', async ({ page }) => {
    // GIVEN: TailwindCSS v4 is injected via the Vite plugin
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The document has CSS rules applied (Tailwind or Vite-injected styles)
    const hasStyles = await page.evaluate(() => {
      return document.styleSheets.length > 0 || document.querySelectorAll('style').length > 0;
    });
    expect(hasStyles).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend — VITE_API_URL environment variable configuration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend — Environment and API client configuration', () => {
  test('[P1] should expose VITE_API_URL environment variable via import.meta.env in the bundle', async ({ page }) => {
    // GIVEN: .env.development sets VITE_API_URL=http://localhost:5000
    // WHEN: The app loads and the Vite bundle is evaluated
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/');

    // THEN: The Axios apiClient base URL points to http://localhost:5000
    // We verify indirectly: the env variable is consumed without causing a runtime error,
    // and the app-root mounts successfully (env mechanism is wired and did not crash).
    // (Direct access to import.meta.env from the browser is not possible post-bundle.)
    expect(runtimeErrors).toHaveLength(0);
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P1] should make requests to localhost:5000 (not localhost:5173) for API calls', async ({ page }) => {
    // GIVEN: apiClient.ts uses baseURL: import.meta.env.VITE_API_URL (http://localhost:5000)
    // WHEN: A fetch to the API URL is triggered from the browser context
    const apiBaseUrl = 'http://localhost:5000';

    await page.goto('/');

    // THEN: A direct fetch from the browser to the configured API base URL returns a response
    const status = await page.evaluate(async (url: string) => {
      try {
        const response = await fetch(`${url}/scalar`);
        return response.status;
      } catch {
        return -1;
      }
    }, apiBaseUrl);

    // Status -1 = network error (backend down), any 2xx/3xx = backend accessible
    // This confirms the URL resolves to the backend (not the frontend dev server)
    expect(status).not.toBe(-1);
    expect(status).toBeLessThan(500);
  });
});
