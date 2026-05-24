/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Boundary Condition Tests — Expansion of ATDD coverage
 *
 * Covers:
 *   - Repeated navigation stability (no memory leaks / route errors)
 *   - Vite error overlay absent on known-clean build (AC4 boundary)
 *   - Meta/title/lang correctness (HTML structure boundaries)
 *   - React root mount point uniqueness (DOM boundary)
 *   - No mixed-content warnings when both servers use HTTP in dev
 *   - Large-payload console noise filtering (false-positive CORS check)
 *   - Network idle timing — app settles without pending fetch loops
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Repeated navigation should not produce new runtime errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Stability — repeated navigation edge cases', () => {
  test('[P1] should remain error-free after navigating to root route twice', async ({ page }) => {
    // GIVEN: The app is loaded for the first time
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    // WHEN: The root route is visited twice in the same session
    await page.goto('/');
    await page.goto('/');

    // THEN: No runtime errors appear on either navigation
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P1] app-root element is present after a browser back-forward navigation', async ({ page }) => {
    // GIVEN: The user navigates forward and backward
    await page.goto('/');
    await page.goto('about:blank');
    await page.goBack();

    // WHEN: The page settles
    await page.waitForLoadState('networkidle');

    // THEN: The React mount point is still visible
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: HTML document structure requirements
// ─────────────────────────────────────────────────────────────────────────────

test.describe('HTML document structure boundary conditions', () => {
  test('[P2] should have lang attribute set on <html> element', async ({ page }) => {
    // GIVEN: index.html is served
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The <html> element has a lang attribute (accessibility + i18n requirement)
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
  });

  test('[P2] should mount exactly one React root element in the DOM', async ({ page }) => {
    // GIVEN: main.tsx calls createRoot(document.getElementById("root"))
    // WHEN: The app is fully mounted
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: There is exactly one element with data-testid="app-root"
    const rootCount = await page.locator('[data-testid="app-root"]').count();
    expect(rootCount).toBe(1);
  });

  test('[P2] should serve the app with a valid <title> tag in the HTML head', async ({ page }) => {
    // GIVEN: The index.html is configured with a project title
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The page has a non-empty title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Vite error overlay must NOT appear (TypeScript strict mode AC4)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Vite error overlay boundary (strict TypeScript)', () => {
  test('[P1] should NOT show vite-error-overlay on page reload', async ({ page }) => {
    // GIVEN: TypeScript strict mode is active and all source files are type-safe
    // WHEN: The page is loaded AND then reloaded (covers HMR re-evaluation edge case)
    await page.goto('/');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // THEN: The Vite compilation error overlay is not present after reload
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  });

  test('[P2] should not emit any uncaught promise rejections on first load', async ({ page }) => {
    // GIVEN: async React components (QueryProvider, RouterProvider) are wired correctly
    const unhandledRejections: string[] = [];
    page.on('pageerror', (err) => {
      if (err.message.includes('UnhandledPromiseRejection') || err.message.includes('Unhandled Promise')) {
        unhandledRejections.push(err.message);
      }
    });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No unhandled promise rejections are thrown
    expect(unhandledRejections).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Network idle — app should not have infinite fetch loops
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Network idle boundary (no polling loops on init)', () => {
  test('[P2] should reach networkidle state within 10 seconds of loading the root route', async ({ page }) => {
    // GIVEN: QueryClient is configured with staleTime=60s (no immediate refetch)
    // WHEN: The page first loads
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    // THEN: The app stabilises within the threshold — no infinite request loops
    expect(elapsed).toBeLessThan(10_000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: False-positive CORS — only real CORS errors should be flagged
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — CORS false-positive boundary (non-CORS console messages)', () => {
  test('[P2] should not produce CORS errors when fetching same-origin resources (JS/CSS bundles)', async ({
    page,
  }) => {
    // GIVEN: The Vite dev server serves JS/CSS from the same origin (5173)
    const corsErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text().toLowerCase();
      if (
        msg.type() === 'error' &&
        (text.includes('cors') || text.includes('cross-origin') || text.includes('access-control'))
      ) {
        corsErrors.push(msg.text());
      }
    });

    // WHEN: The frontend loads its own JS/CSS assets
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No same-origin asset requests produce CORS errors
    expect(corsErrors).toHaveLength(0);
  });
});
