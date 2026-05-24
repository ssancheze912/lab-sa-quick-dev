/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion — Edge Cases & Boundary Conditions
 * Complements the ATDD happy-path tests in project-initialization.spec.ts
 *
 * Coverage added:
 *   - Unknown/404 routes: graceful handling without crash
 *   - Frontend asset pipeline: JS and CSS resources load with HTTP 200
 *   - IndexPage content: renders expected heading text
 *   - app-shell wrapper: present on initial load at root
 *   - Network resilience: frontend renders even if API is unreachable
 *   - Response time boundary: initial page load under 5s
 *   - No mixed-content warnings on localhost
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Unknown route — 404 graceful handling
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Unknown routes — graceful 404 handling', () => {
  test('should not crash when navigating to a completely unknown route', async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    // TanStack Router renders the root layout even for missing routes
    await page.goto('/totally-nonexistent-path-xyz');
    await page.waitForLoadState('networkidle');

    // The React app itself must not crash (no pageerror events)
    expect(runtimeErrors).toHaveLength(0);
  });

  test('should still serve the SPA shell HTML on unknown sub-paths (SPA routing)', async ({
    request,
  }) => {
    // Vite dev server returns the index.html for all paths (SPA fallback)
    const response = await request.get('http://localhost:5173/some-unknown-path');
    // SPA fallback: 200 with HTML content (Vite dev server always returns 200 for SPA)
    // TODO (TEA Review): Determinism — conditional assertion removed; Vite SPA fallback MUST return 200. See test-review-1-1.md
    expect(response.status()).toBe(200);
    const ct = response.headers()['content-type'] ?? '';
    expect(ct).toContain('html');
  });

  test('should not display a blank white screen on unknown route', async ({ page }) => {
    await page.goto('/route-that-does-not-exist');
    await page.waitForLoadState('networkidle');

    // The #root element must be present and non-empty (app shell rendered)
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// IndexPage content — renders expected content
// ─────────────────────────────────────────────────────────────────────────────

test.describe('IndexPage — content and structure', () => {
  test('should render a visible heading with application name "Siesa Agents"', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // IndexPage renders: <h1>Siesa Agents</h1>
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Siesa Agents');
  });

  test('should render the app-shell wrapper div on initial load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // RootLayout renders <div id="app-shell">
    const shell = page.locator('#app-shell');
    await expect(shell).toBeAttached();
  });

  test('should have a non-empty document title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Asset pipeline — JS and CSS load correctly
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Asset pipeline — Vite serves JS and CSS correctly', () => {
  test('should load the main JS entry bundle without errors (non-4xx/5xx)', async ({ page }) => {
    const failedAssets: string[] = [];

    page.on('response', (resp) => {
      const url = resp.url();
      if ((url.endsWith('.js') || url.endsWith('.ts') || url.includes('/src/')) && resp.status() >= 400) {
        failedAssets.push(`${resp.status()} ${url}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(failedAssets).toHaveLength(0);
  });

  test('should not produce 404 errors for any loaded resource', async ({ page }) => {
    const notFound: string[] = [];

    page.on('response', (resp) => {
      if (resp.status() === 404 && resp.url().includes('localhost:5173')) {
        notFound.push(resp.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(notFound).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response time boundary — initial page load
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Performance boundary — initial page load', () => {
  test('should complete initial page load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const elapsed = Date.now() - startTime;
    // 5s is a generous boundary for a local Vite dev server
    expect(elapsed).toBeLessThan(5000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend resilience — works even when API is unreachable on first load
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend resilience — API unreachable on initial load', () => {
  test('should render the frontend shell even if backend requests are blocked', async ({
    page,
  }) => {
    // Block any requests to the backend API to simulate it being down
    await page.route('http://localhost:5000/**', (route) => route.abort());

    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The app shell and heading must still render — no React crash
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // No unhandled JS errors thrown by the page itself
    const criticalErrors = runtimeErrors.filter(
      (e) => !e.toLowerCase().includes('network') && !e.toLowerCase().includes('fetch')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security — no mixed content on localhost
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Security — no mixed content warnings', () => {
  test('should not generate mixed-content console warnings on initial load', async ({ page }) => {
    const mixedContentWarnings: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text().toLowerCase();
      if (msg.type() === 'warning' && (text.includes('mixed content') || text.includes('insecure'))) {
        mixedContentWarnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(mixedContentWarnings).toHaveLength(0);
  });
});
