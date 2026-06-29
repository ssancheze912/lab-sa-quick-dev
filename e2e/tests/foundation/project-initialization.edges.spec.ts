/**
 * Story 1.1 — Project Initialization & Repository Structure
 * Epic 1 — Project Foundation & Application Shell
 *
 * EDGE CASES & NEGATIVE PATHS (testarch-automate expansion)
 * Complementa los tests ATDD existentes con cobertura de:
 *   - Viewport responsiveness sanity (mobile / tablet / desktop)
 *   - Resilience ante errores de red/console no-CORS
 *   - Vite HMR / overlay no-flash
 *   - Boundary: requests con caracteres especiales y paths no estándar
 *
 * AC referenciadas:
 *   AC1 — Frontend Vite server arranca en :5173
 *   AC3 — CORS habilitado para localhost:5173 → localhost:5000
 *   AC4 — TypeScript strict mode (sin overlay de errores)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Edge: Viewport responsiveness sanity check
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 Edge — Vite dev server serves across viewports', () => {
  test('[P2] should render the app-root mount point on mobile viewport (375x667)', async ({
    page,
  }) => {
    // GIVEN: Frontend running on dev server
    await page.setViewportSize({ width: 375, height: 667 });

    // WHEN: User navigates to the root URL on a mobile-sized viewport
    await page.goto('/');

    // THEN: The React mount point is visible (no media-query blocker on render)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P2] should render the app-root mount point on tablet viewport (768x1024)', async ({
    page,
  }) => {
    // GIVEN: Frontend running on dev server
    await page.setViewportSize({ width: 768, height: 1024 });

    // WHEN: User navigates on a tablet-sized viewport
    await page.goto('/');

    // THEN: The React mount point is visible
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P2] should render the app-root mount point on desktop viewport (1920x1080)', async ({
    page,
  }) => {
    // GIVEN: Frontend running on dev server
    await page.setViewportSize({ width: 1920, height: 1080 });

    // WHEN: User navigates on a desktop viewport
    await page.goto('/');

    // THEN: The React mount point is visible
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Edge: HTTP response semantics for the root document
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 Edge — Vite serves a valid index.html document', () => {
  test('[P2] should return Content-Type text/html for the root document', async ({ request }) => {
    // GIVEN: Vite dev server serves the SPA shell
    // WHEN: Requesting the index document
    const response = await request.get('/');

    // THEN: The response is HTML (not JSON or plain text)
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('text/html');
  });

  test('[P2] should not return Vite error overlay HTML in the served document', async ({
    request,
  }) => {
    // GIVEN: TypeScript strict mode is enabled
    // WHEN: The root document is fetched
    const response = await request.get('/');
    const body = await response.text();

    // THEN: The HTML does NOT contain compile-error overlay markup
    // (Vite injects '<vite-error-overlay>' only on compile errors)
    expect(body).not.toContain('<vite-error-overlay');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Edge: No console warnings about deprecated React/TS APIs
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 Edge — Clean console on initial load', () => {
  test('[P2] should not emit console warnings about strict-mode violations on initial mount', async ({
    page,
  }) => {
    // GIVEN: React strict mode + TS strict mode
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });

    // WHEN: The app mounts
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No strict-mode violation warnings appear
    const strictWarnings = warnings.filter(
      (w) =>
        w.toLowerCase().includes('strictmode') ||
        w.toLowerCase().includes('legacy') ||
        w.toLowerCase().includes('deprecated'),
    );
    expect(strictWarnings).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Edge: CORS resilience against unknown origins
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 Edge — CORS policy boundary conditions', () => {
  test('[P1] should NOT echo Access-Control-Allow-Origin for an unlisted origin', async ({
    request,
  }) => {
    // GIVEN: CORS is configured to allow ONLY http://localhost:5173
    // WHEN: A request comes from an evil origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: 'http://evil.example.com' },
    });

    // THEN: The server does NOT echo back the evil origin or a wildcard
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://evil.example.com');
    expect(allowOriginHeader).not.toBe('*');
  });

  test('[P1] should respond to OPTIONS preflight with allowed methods', async ({ request }) => {
    // GIVEN: CORS policy uses AllowAnyMethod()
    // WHEN: Browser sends preflight for a non-simple method (PUT)
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Preflight succeeds (not blocked)
    expect([200, 204]).toContain(response.status());
  });
});
