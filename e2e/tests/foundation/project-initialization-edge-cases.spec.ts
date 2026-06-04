/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Error Path Tests — Automation Expansion
 * Covers scenarios NOT included in the ATDD RED phase tests:
 *   - Network error recovery on initial load
 *   - Unknown route handling (SPA fallback)
 *   - Page title and meta validation
 *   - CSS/asset loading without errors
 *   - Repeated navigation stability
 *   - No unexpected console warnings on first render
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Frontend initialization boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend initialization — edge cases', () => {
  test('[P1] should serve an HTML document (not JSON or plain text) on root route', async ({
    page,
  }) => {
    // GIVEN: Vite serves the SPA shell
    // WHEN: The browser navigates to /
    const response = await page.goto('/');

    // THEN: Content-Type is text/html
    const contentType = response?.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('[P1] should have a non-empty page title on initial load', async ({ page }) => {
    // GIVEN: The Vite react-ts app is running
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The page title is not empty or undefined
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('[P1] should render without any console warnings about React key props or unknown DOM attributes', async ({
    page,
  }) => {
    // GIVEN: The app uses functional React components
    // WHEN: The app renders for the first time
    const consoleWarnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: No React key or DOM attribute warnings (common initialization mistakes)
    const reactWarnings = consoleWarnings.filter(
      (w) =>
        w.includes('key') ||
        w.includes('unknown prop') ||
        w.includes('Invalid DOM property') ||
        w.includes('validateDOMNesting'),
    );
    expect(reactWarnings).toHaveLength(0);
  });

  test('[P1] should load the main JavaScript bundle without network errors', async ({ page }) => {
    // GIVEN: Vite bundles the TypeScript source into ESM modules
    // WHEN: The page loads
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      failedRequests.push(req.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript module requests fail
    const jsBundleFailures = failedRequests.filter(
      (url) => url.endsWith('.js') || url.endsWith('.ts') || url.includes('/@fs/'),
    );
    expect(jsBundleFailures).toHaveLength(0);
  });

  test('[P2] should handle an unknown route by not crashing the SPA (404 or SPA fallback)', async ({
    page,
  }) => {
    // GIVEN: TanStack Router is configured as the router
    // WHEN: The user navigates to a non-existent route
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/ruta-que-no-existe-1234');

    // THEN: The browser does NOT throw an uncaught JS exception
    // (Router should render a 404 page or fallback — not crash)
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should remain stable after navigating back and forth from root', async ({ page }) => {
    // GIVEN: The SPA is loaded and the router is active
    // WHEN: The user navigates to / twice in sequence
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // THEN: No runtime errors after double load
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should not expose the Vite error overlay on initial clean load', async ({ page }) => {
    // GIVEN: No intentional compile errors in the source
    // WHEN: The app renders
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Vite's built-in error overlay is absent
    // This catches TypeScript errors surfaced as runtime overlays in dev mode
    const viteOverlay = page.locator('vite-error-overlay');
    await expect(viteOverlay).toHaveCount(0);
  });

  test('[P2] should load CSS without any 404 stylesheet errors', async ({ page }) => {
    // GIVEN: TailwindCSS v4 is configured via @tailwindcss/vite plugin
    // WHEN: The page loads
    const cssFailures: string[] = [];
    page.on('requestfailed', (req) => {
      if (req.resourceType() === 'stylesheet' || req.url().includes('.css')) {
        cssFailures.push(req.url());
      }
    });
    page.on('response', (res) => {
      if (
        (res.resourceType() === 'stylesheet' || res.url().includes('.css')) &&
        res.status() === 404
      ) {
        cssFailures.push(res.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No stylesheet request returns 404
    expect(cssFailures).toHaveLength(0);
  });
});
