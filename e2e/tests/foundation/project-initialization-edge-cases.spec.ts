/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion — Edge Cases & Boundary Conditions
 * Complements the ATDD happy-path tests in project-initialization.spec.ts
 *
 * Coverage:
 *   - Frontend page structure edge cases
 *   - Browser navigation resilience
 *   - Mobile viewport compatibility
 *   - Network error surface area
 *   - Console error filtering (false-positive elimination)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Page structure & metadata edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend page structure — edge cases', () => {
  test('[P1] should have a non-empty page title', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: The root page is loaded
    await page.goto('/');

    // THEN: The document has a non-empty title (not the default blank string)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('[P1] should set the correct HTML lang attribute', async ({ page }) => {
    // GIVEN: The frontend project is initialized with index.html
    // WHEN: The page is loaded
    await page.goto('/');

    // THEN: The html element carries a lang attribute (accessibility requirement)
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('[P1] should contain a charset meta tag in the document head', async ({ page }) => {
    // GIVEN: The Vite template generates an index.html
    // WHEN: The page loads
    await page.goto('/');

    // THEN: A UTF-8 charset meta tag is present
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset?.toLowerCase()).toBe('utf-8');
  });

  test('[P1] should include a viewport meta tag for responsive behaviour', async ({ page }) => {
    // GIVEN: The frontend is initialized
    // WHEN: The document head is examined
    await page.goto('/');

    // THEN: A viewport meta tag exists (required for mobile compatibility)
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('[P2] should render the app-root element with exactly one occurrence', async ({ page }) => {
    // GIVEN: React mounts into a single #root div
    // WHEN: The page loads
    await page.goto('/');

    // THEN: Exactly one [data-testid="app-root"] exists — duplicated mounts would indicate double-render
    await expect(page.locator('[data-testid="app-root"]')).toHaveCount(1);
  });

  test('[P2] should not render the Vite default placeholder content', async ({ page }) => {
    // GIVEN: The project was initialized from the react-ts Vite template
    // WHEN: The app renders
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The default "Vite + React" heading from the unmodified template is NOT present
    // (main.tsx and __root.tsx have replaced the default template content)
    await expect(page.getByText('Vite + React')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser navigation resilience
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend navigation resilience — edge cases', () => {
  test('[P1] should load without errors after a hard browser refresh', async ({ page }) => {
    // GIVEN: The page has been loaded at least once
    await page.goto('/');

    // WHEN: The user reloads the page (simulating Ctrl+F5)
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.reload({ waitUntil: 'networkidle' });

    // THEN: No runtime exceptions are thrown on reload
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P1] should navigate back and forward without JavaScript errors', async ({ page }) => {
    // GIVEN: The app is loaded
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: Browser back/forward buttons are used
    await page.goBack();
    await page.goForward();

    // THEN: No runtime errors accumulate
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should load the root route when navigating to a non-existent path (fallback)', async ({ page }) => {
    // GIVEN: TanStack Router is configured with a root route
    // WHEN: The user navigates to an unknown path
    await page.goto('/ruta-que-no-existe-123');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The app-root is still rendered (router handles the 404 gracefully; does NOT crash)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile viewport compatibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend mobile viewport — edge cases', () => {
  test('[P2] should render app-root on a mobile viewport (375×667)', async ({ page }) => {
    // GIVEN: A mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });

    // WHEN: The page is loaded
    await page.goto('/');

    // THEN: The app-root is visible — the app is not broken on narrow screens
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P2] should not produce horizontal scroll on a 320px viewport', async ({ page }) => {
    // GIVEN: An extremely narrow viewport (oldest supported mobile width)
    await page.setViewportSize({ width: 320, height: 568 });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The document body does not overflow horizontally
    const overflowX = await page.evaluate(() =>
      document.body.scrollWidth <= document.body.clientWidth
    );
    expect(overflowX).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Console error noise — boundary / false-positive guard
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Console error boundary — edge cases', () => {
  test('[P1] should produce no console errors of severity "error" on initial load', async ({ page }) => {
    // GIVEN: A fresh page context with no cached state
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Exclude known browser-level noise unrelated to application code
        const text = msg.text();
        const isKnownNoise =
          text.includes('favicon') ||
          text.includes('ERR_FILE_NOT_FOUND') ||
          text.includes('[HMR]');
        if (!isKnownNoise) {
          consoleErrors.push(text);
        }
      }
    });

    // WHEN: The app loads from scratch
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No application-level console errors are raised
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P1] should not log any React key-prop warnings on initial render', async ({ page }) => {
    // GIVEN: React strict mode is active
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        const text = msg.text();
        if (text.includes('key') || text.includes('Each child in a list')) {
          warnings.push(text);
        }
      }
    });

    // WHEN: The root route renders
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No React key-prop warnings appear (list renders are correct)
    expect(warnings).toHaveLength(0);
  });

  test('[P2] should not have any unhandled promise rejections on load', async ({ page }) => {
    // GIVEN: The app wires TanStack Router and React Query
    const unhandledRejections: string[] = [];
    page.on('pageerror', (err) => {
      if (err.message.includes('Unhandled') || err.message.includes('Promise')) {
        unhandledRejections.push(err.message);
      }
    });

    // WHEN: The page loads and React Query initialises
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No unhandled promise rejections surface
    expect(unhandledRejections).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend static asset loading
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend static assets — edge cases', () => {
  test('[P2] should load the main JavaScript bundle without 4xx or 5xx errors', async ({ page }) => {
    // GIVEN: Vite builds and serves the app bundle
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/src/') || response.url().endsWith('.js')) {
        if (response.status() >= 400) {
          failedRequests.push(`${response.status()} ${response.url()}`);
        }
      }
    });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No JS bundle requests returned error status codes
    expect(failedRequests).toHaveLength(0);
  });

  test('[P2] should load the CSS (TailwindCSS v4) without errors', async ({ page }) => {
    // GIVEN: TailwindCSS v4 is configured via @tailwindcss/vite plugin
    const cssErrors: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('.css') || response.url().includes('index.css')) {
        if (response.status() >= 400) {
          cssErrors.push(`${response.status()} ${response.url()}`);
        }
      }
    });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: All CSS resources load successfully
    expect(cssErrors).toHaveLength(0);
  });
});
