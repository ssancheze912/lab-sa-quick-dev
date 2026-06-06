/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * EDGE CASE expansion — built on top of ATDD baseline.
 *
 * Coverage added:
 *   - App-root visibility under different viewport sizes
 *   - No duplicate resource-load errors (missing chunk / 404 JS assets)
 *   - Network errors on initial load not swallowed silently
 *   - Multiple page navigations preserve root mount point
 *   - CSP / mixed-content console errors absent
 *   - Page title is not the default Vite placeholder
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: App-root invariant across viewport sizes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Frontend root mount — viewport edge cases', () => {
  test('[P1] should render app-root on mobile viewport (375×667)', async ({ page }) => {
    // GIVEN: A narrow mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // WHEN: The app loads
    await page.goto('/');

    // THEN: The React root is still mounted and visible
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P1] should render app-root on wide desktop viewport (1920×1080)', async ({ page }) => {
    // GIVEN: A wide desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // WHEN: The app loads
    await page.goto('/');

    // THEN: The React root is present regardless of viewport width
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P1] should render app-root on tablet viewport (768×1024)', async ({ page }) => {
    // GIVEN: A tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // WHEN: The app loads
    await page.goto('/');

    // THEN: The React root is still present
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: No broken asset loads (missing chunks, 404 JS/CSS)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Frontend asset integrity — no broken resources', () => {
  test('[P1] should not produce any HTTP 404 for JS or CSS assets on initial load', async ({
    page,
  }) => {
    // GIVEN: The Vite dev server is running and serving all module chunks
    const failedAssets: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (
        response.status() === 404 &&
        (url.endsWith('.js') || url.endsWith('.ts') || url.endsWith('.css'))
      ) {
        failedAssets.push(`404 ${url}`);
      }
    });

    // WHEN: The page loads fully
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No JS or CSS assets returned 404
    expect(failedAssets).toHaveLength(0);
  });

  test('[P1] should not log any network-error events for critical resources', async ({ page }) => {
    // GIVEN: The Vite dev server is configured correctly
    const networkFailures: string[] = [];

    page.on('requestfailed', (request) => {
      // Only track failures for JS/CSS/HTML (not optional favicon etc.)
      const url = request.url();
      if (url.includes('localhost:5173') && !url.includes('favicon')) {
        networkFailures.push(`${request.failure()?.errorText ?? 'unknown'} — ${url}`);
      }
    });

    // WHEN: The app loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No critical resource requests failed
    expect(networkFailures).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Page title is not the default Vite placeholder
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Frontend HTML meta — page title customised', () => {
  test('[P2] should not have the default "Vite + React + TS" placeholder as page title', async ({
    page,
  }) => {
    // GIVEN: The application is a production-grade project (not a scaffold demo)
    // WHEN: The app loads
    await page.goto('/');

    // THEN: Title is not the raw Vite scaffold default
    const title = await page.title();
    expect(title).not.toBe('Vite + React + TS');
    // The title must be non-empty
    expect(title.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: No mixed-content or CSP violations in console
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Frontend security — no CSP or mixed-content violations', () => {
  test('[P2] should not emit any CSP violation messages on initial load', async ({ page }) => {
    // GIVEN: The app runs on HTTP localhost (no CSP violations expected)
    const cspViolations: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text().toLowerCase();
      if (text.includes('content security policy') || text.includes('csp')) {
        cspViolations.push(msg.text());
      }
    });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No CSP-related messages appear
    expect(cspViolations).toHaveLength(0);
  });

  test('[P2] should not have any mixed-content warnings in the console', async ({ page }) => {
    // GIVEN: The dev server runs entirely on HTTP (no HTTPS↔HTTP mixing)
    const mixedContentWarnings: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text().toLowerCase();
      if (text.includes('mixed content') || text.includes('insecure')) {
        mixedContentWarnings.push(msg.text());
      }
    });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No mixed-content warnings present
    expect(mixedContentWarnings).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: App-root survives multiple navigations (SPA integrity)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Frontend SPA integrity — root survives navigation', () => {
  test('[P2] should keep the app-root present after navigating to a different route and back', async ({
    page,
  }) => {
    // GIVEN: The app is loaded at the root
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    // WHEN: Navigating to a different path (SPA route change)
    await page.goto('/clientes');

    // AND: Navigating back to root
    await page.goto('/');

    // THEN: The app-root is still present (React tree not unmounted)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});
