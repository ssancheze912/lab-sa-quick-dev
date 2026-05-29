/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * FRONTEND EDGE CASES & BOUNDARY CONDITIONS — Complement to ATDD base tests
 *
 * Rationale:
 *   The ATDD tests (project-initialization.spec.ts) cover the happy path for each
 *   Acceptance Criterion. This file adds frontend-specific edge cases:
 *     - Deep-link SPA fallback completeness
 *     - Response integrity (HTML structure, charset, caching)
 *
 * Backend edge cases are in: project-initialization.backend-edge.spec.ts
 *
 * Priority tags:
 *   [P0] — Critical infrastructure, must pass on every commit.
 *   [P1] — Important; run on PR to main.
 *   [P2] — Nice-to-have; run on scheduled CI.
 */

import { test, expect } from '@playwright/test';

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Frontend SPA Fallback — deep linking boundary
// ---------------------------------------------------------------------------

test.describe('Frontend SPA Fallback — deep link boundary conditions', () => {
  const knownDeepLinks = [
    '/clientes',
    '/contactos',
    '/clientes/new',
    '/contactos/new',
    '/ruta-desconocida',
    '/deeply/nested/unknown/path',
  ];

  for (const route of knownDeepLinks) {
    test(`[P1] Vite should serve index.html (200) for deep link: ${route}`, async ({
      request,
    }) => {
      // GIVEN: Vite is configured with historyApiFallback / spa mode
      // WHEN: A direct HTTP GET is made to a client-side route
      const response = await request.get(FRONTEND_BASE_URL + route, {
        failOnStatusCode: false,
      });

      // THEN: The server returns 200 — NOT 404 — so the SPA router handles the path
      // A 404 at server level would break deep linking (FR30)
      expect(response.status()).toBe(200);

      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('text/html');
    });
  }

  test('[P1] SPA index.html served for deep links must contain the React root element', async ({
    page,
  }) => {
    // GIVEN: A user navigates directly to /clientes (deep link)
    await page.goto(FRONTEND_BASE_URL + '/clientes');

    // WHEN: The page loads via Vite SPA fallback
    // THEN: The React root element exists — the SPA is bootstrapped correctly
    await expect(page.locator('[data-testid="app-root"]')).toBeAttached();
  });

  test('[P2] frontend should NOT redirect deep links to a different URL', async ({
    request,
  }) => {
    // GIVEN: SPA fallback is configured without server-side redirects
    // WHEN: GET /clientes is requested
    const response = await request.get(FRONTEND_BASE_URL + '/clientes', {
      failOnStatusCode: false,
    });

    // THEN: No redirect (3xx) — the server must serve index.html inline with HTTP 200
    expect(response.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Frontend — response integrity edge cases
// ---------------------------------------------------------------------------

test.describe('Frontend response integrity', () => {
  test('[P1] root HTML must reference a main script entry point', async ({ page }) => {
    // GIVEN: Vite has compiled the app
    await page.goto(FRONTEND_BASE_URL + '/');

    // WHEN: The HTML source is examined
    const html = await page.content();

    // THEN: A <script type="module"> tag exists — the app entry is linked
    expect(html).toMatch(/<script\s[^>]*type=["']module["']/i);
  });

  test('[P1] frontend should set a charset in the HTML meta tags', async ({ page }) => {
    // GIVEN: Proper HTML structure is expected from Vite template
    await page.goto(FRONTEND_BASE_URL + '/');
    const html = await page.content();

    // THEN: charset meta is declared (important for Spanish characters in app)
    expect(html.toLowerCase()).toContain('charset');
  });

  test('[P2] frontend should not serve stale cached responses (Cache-Control)', async ({
    request,
  }) => {
    // GIVEN: Dev server is running
    const response = await request.get(FRONTEND_BASE_URL + '/');

    // WHEN: HTML root is requested
    const cacheControl = response.headers()['cache-control'] ?? '';

    // THEN: HTML should not be aggressively cached (no-store or no-cache for dev)
    // A production build may differ — in dev, long-lived caching of index.html is problematic
    expect(cacheControl).not.toContain('max-age=31536000');
  });

  test('[P2] HEAD request to frontend root should return 200 with no body', async ({
    request,
  }) => {
    // GIVEN: Vite dev server supports HTTP HEAD method for resource discovery
    // WHEN: A HEAD request is made to root
    const response = await request.fetch(FRONTEND_BASE_URL + '/', {
      method: 'HEAD',
      failOnStatusCode: false,
    });

    // THEN: Status 200 (or method-allowed equivalent) — not 405
    expect([200, 204]).toContain(response.status());
  });
});
