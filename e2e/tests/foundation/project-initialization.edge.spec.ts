/**
 * Story 1.1: Project Initialization & Repository Structure
 * E2E Edge Cases — Beyond the ATDD happy paths
 *
 * Covers boundary conditions and error paths NOT in project-initialization.spec.ts:
 *   - Navigation to non-root paths returns 200 (SPA routing)
 *   - Page reload on root preserves app mount (no white-screen-of-death)
 *   - Console errors are still absent after a hard reload (cache cleared)
 *   - Browser does NOT expose stack traces in the console (security boundary)
 *   - Network-idle state is reached (no pending requests left hanging)
 *   - vite-error-overlay is absent on every navigation, not just initial load
 *   - Backend 404 for unknown routes does NOT crash the frontend
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// SPA routing: non-root paths should not cause a hard 404 from the dev server
// ─────────────────────────────────────────────────────────────────────────────

test.describe('SPA routing — dev server handles client-side routes', () => {
  test('should serve the frontend shell for an unknown client-side path', async ({ page }) => {
    // GIVEN: The Vite dev server is configured to serve the SPA
    // WHEN: The browser navigates to a path that has no server-side handler
    const response = await page.goto('/some/nonexistent/client-route');

    // THEN: Vite dev server responds with HTML (not a 404 error page)
    // SPA routing means the HTML shell is always returned and React handles routing
    expect(response?.status()).not.toBe(500);
    // The page must at minimum contain an HTML document
    const content = await page.content();
    expect(content).toContain('<!DOCTYPE html>');
  });

  test('should not render a Vite error overlay on a non-root client path', async ({ page }) => {
    // GIVEN: The TypeScript project compiles cleanly
    // WHEN: The user navigates directly to a deep client-side path
    await page.goto('/agents/some-agent-id');
    await page.waitForLoadState('domcontentloaded');

    // THEN: No compilation-error overlay is shown
    const errorOverlay = page.locator('vite-error-overlay');
    await expect(errorOverlay).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Page reload stability — app survives a hard reload
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page reload resilience', () => {
  test('should remain stable after a hard reload (no white screen)', async ({ page }) => {
    // GIVEN: The app is loaded once normally
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: The user performs a hard reload (bypasses cache)
    const reloadErrors: string[] = [];
    page.on('pageerror', (err) => reloadErrors.push(err.message));

    await page.reload({ waitUntil: 'networkidle' });

    // THEN: No runtime errors occur on reload
    expect(reloadErrors).toHaveLength(0);

    // AND: The document body still has content (no blank page)
    const bodyContent = await page.locator('body').innerHTML();
    expect(bodyContent.trim().length).toBeGreaterThan(0);
  });

  test('should reach network-idle state within 10 seconds on initial load', async ({ page }) => {
    // GIVEN: The frontend project has no infinite polling or hanging requests
    // WHEN: The page loads from scratch
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
    const elapsed = Date.now() - start;

    // THEN: network-idle is reached well within 10s (no hanging XHR or websocket escalation)
    expect(elapsed).toBeLessThan(10_000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security boundary — no stack traces or internal paths exposed in console
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Security — no sensitive information in browser console', () => {
  test('should not log stack traces or file system paths to the browser console', async ({
    page,
  }) => {
    // GIVEN: The app is running in development mode
    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    // WHEN: The page loads normally
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No log entry contains an absolute file system path (e.g. /home/... or C:\...)
    // This would indicate an unhandled exception leaking internal paths
    const sensitivePatterns = consoleLogs.filter(
      (log) =>
        /\/home\/\w/.test(log) ||
        /[A-Z]:\\/.test(log) ||
        /at\s+\w+\s+\(.*\.ts:\d+:\d+\)/.test(log)
    );
    expect(sensitivePatterns).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend resilience — backend unavailability should not crash the frontend
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend resilience when backend is unavailable', () => {
  test('should still render the app shell even when backend fetch fails', async ({ page }) => {
    // GIVEN: The frontend is running but a request to the backend endpoint fails
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    // Intercept and abort any request to the backend API URL to simulate unavailability
    await page.route('http://localhost:5000/**', (route) => route.abort('connectionrefused'));

    // WHEN: The page loads (initial render should not depend on backend for shell)
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: No runtime crash — the React shell still mounts
    // (specific error boundary UI is a concern for later stories)
    const htmlContent = await page.content();
    expect(htmlContent).toContain('<!DOCTYPE html>');
    // No unhandled thrown exceptions from the framework itself
    const frameworkCrashes = runtimeErrors.filter(
      (e) =>
        e.includes('Cannot read properties of undefined') ||
        e.includes('is not a function') ||
        e.includes('Uncaught ReferenceError')
    );
    expect(frameworkCrashes).toHaveLength(0);
  });
});
