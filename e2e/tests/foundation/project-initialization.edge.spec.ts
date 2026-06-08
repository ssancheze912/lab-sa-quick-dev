/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE Phase — Edge Cases & Negative Paths (Frontend / Browser-context)
 *
 * Expands the ATDD baseline (`project-initialization.spec.ts`) which covered
 * the happy paths for AC1, AC3, AC4. Tests in this file exercise:
 *
 *   - Reload / SPA navigation stability (P1)
 *   - Vite static assets (CSS, favicon) served without 404 (P2)
 *   - Cross-origin fetch from page context to backend (CORS edge, P1)
 *   - Page network resources never expose API secrets / env files (P1)
 *   - Frontend tolerates concurrent reloads (P2)
 *
 * All tests are deterministic (no waitForTimeout) and self-cleaning.
 * NO duplicate coverage with backend-initialization.api.* — those exercise the
 * API directly via `request`; here we go through a real browser page context.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const FRONTEND_ORIGIN = 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + AC4 (edge): Frontend resilience & static assets
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1/AC4 (edge) — Frontend resilience & assets', () => {
  test('[P1] should remount React root after a full page reload without runtime errors', async ({
    page,
  }) => {
    // GIVEN: a freshly loaded SPA with the root mounted
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    // WHEN: the user hard-reloads the page (Ctrl+R / F5 equivalent)
    await page.reload({ waitUntil: 'load' });

    // THEN: the root is still mounted and no JS error was emitted on either load
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('[P2] should load the Vite-generated favicon without HTTP 404', async ({ page }) => {
    // GIVEN: the Vite project ships a favicon referenced from index.html
    const faviconResponse = page.waitForResponse(
      (resp) => /favicon|\.svg|\.ico/.test(resp.url()) && resp.url().startsWith(FRONTEND_ORIGIN),
      { timeout: 10_000 }
    );

    // WHEN: the app loads
    await page.goto('/');

    // THEN: the favicon (or equivalent icon) responds with 200, not 404
    const response = await faviconResponse;
    expect(response.status()).toBeLessThan(400);
  });

  test('[P1] should NOT serve the .env.development file to the browser', async ({ request }) => {
    // GIVEN: the project ships a .env.development with VITE_API_URL (non-secret, but still
    // not meant to be reachable as an HTTP asset). Vite must not expose dotfiles.
    // WHEN: the browser requests /.env.development directly
    const response = await request.get(`${FRONTEND_ORIGIN}/.env.development`);

    // THEN: dotfile is not served (404, 403, or any non-200)
    expect(response.status()).not.toBe(200);
  });

  test('[P2] should not expose VITE_API_URL value inline in the served index.html', async ({
    request,
  }) => {
    // GIVEN: the frontend uses import.meta.env.VITE_API_URL only inside built JS, not raw HTML
    // WHEN: the root document is fetched
    const response = await request.get(`${FRONTEND_ORIGIN}/`);
    const body = await response.text();

    // THEN: the literal env URL is not leaked as plaintext in index.html
    // (it may appear in bundled JS, which is acceptable for a public API base URL)
    expect(body).not.toContain('VITE_API_URL=');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 (edge): CORS behaviour from real browser fetch context
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 (edge) — CORS browser-context edge cases', () => {
  test('[P0] should allow page-context fetch to /health and return JSON status ok', async ({
    page,
  }) => {
    // GIVEN: backend exposes GET /health returning { status: 'ok' } with CORS allowed
    await page.goto('/');

    // WHEN: the SPA runtime fetches /health (simulating any future feature that uses it)
    const body = await page.evaluate(async (apiUrl) => {
      const r = await fetch(`${apiUrl}/health`);
      return { status: r.status, json: await r.json() };
    }, API_BASE_URL);

    // THEN: response is 200 and matches the documented contract
    expect(body.status).toBe(200);
    expect(body.json).toEqual({ status: 'ok' });
  });

  test('[P1] should fail cleanly when page-context fetch hits an unmapped backend route', async ({
    page,
  }) => {
    // GIVEN: the backend responds with RFC 7807 JSON for unmapped routes
    await page.goto('/');

    // WHEN: the page calls a non-existent endpoint
    const result = await page.evaluate(async (apiUrl) => {
      const r = await fetch(`${apiUrl}/api/does-not-exist-edge`);
      return { status: r.status, contentType: r.headers.get('content-type') ?? '' };
    }, API_BASE_URL);

    // THEN: 404 with JSON content type (NOT HTML error page, NOT a CORS network error)
    expect(result.status).toBe(404);
    expect(result.contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 (edge): concurrent navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 (edge) — concurrent navigation', () => {
  test('[P2] should serve the app to multiple concurrent browser contexts', async ({ browser }) => {
    // GIVEN: a single Vite dev server (one process)
    // WHEN: two isolated browser contexts open the SPA at the same time
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    try {
      const page1 = await ctx1.newPage();
      const page2 = await ctx2.newPage();

      const [resp1, resp2] = await Promise.all([
        page1.goto('/'),
        page2.goto('/'),
      ]);

      // THEN: both contexts receive a 200 from the dev server
      expect(resp1?.status()).toBe(200);
      expect(resp2?.status()).toBe(200);
      await expect(page1.locator('[data-testid="app-root"]')).toBeVisible();
      await expect(page2.locator('[data-testid="app-root"]')).toBeVisible();
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});
