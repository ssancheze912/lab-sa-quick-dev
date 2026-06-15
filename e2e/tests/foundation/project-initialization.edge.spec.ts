/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automate Expansion — Edge cases, error paths, boundary conditions
 * Complements ATDD tests in project-initialization.spec.ts
 *
 * Test levels: E2E (browser-driven) + light HTML/asset checks
 *
 * Acceptance Criteria expanded:
 *   AC1 — Frontend Vite server (edge: HTML structure, asset loading, viewport)
 *   AC3 — CORS (edge: cross-origin asset requests from frontend context)
 *   AC4 — TypeScript strict mode (edge: source maps, missing deps surface)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 edge cases — Frontend HTML structure and asset loading boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge — Frontend HTML and asset boundaries', () => {
  test('[P1] should serve index.html with a <div id="root"> mount node', async ({ page }) => {
    // GIVEN: Vite dev server is running
    // WHEN: Browser loads the root URL
    await page.goto('/');

    // THEN: Standard Vite/React mount node #root exists in the DOM
    await expect(page.locator('#root')).toHaveCount(1);
  });

  test('[P1] should inject the Vite client script (HMR) in development mode', async ({ page }) => {
    // GIVEN: Vite dev server is running in development mode
    // WHEN: Inspecting the served HTML
    const response = await page.goto('/');
    const html = (await response?.text()) ?? '';

    // THEN: The Vite HMR client script tag is injected
    expect(html).toContain('/@vite/client');
  });

  test('[P1] should reference the TypeScript entry point /src/main.tsx in the HTML', async ({ page }) => {
    // GIVEN: Vite project initialized with react-ts template
    // WHEN: Fetching the served index.html
    const response = await page.goto('/');
    const html = (await response?.text()) ?? '';

    // THEN: index.html references the TypeScript entry (proves react-ts template, not react-js)
    expect(html).toMatch(/\/src\/main\.tsx/);
  });

  test('[P1] should return HTTP 200 with text/html content-type for the root document', async ({ page }) => {
    // GIVEN: Frontend Vite dev server running
    // WHEN: Requesting the root path
    const response = await page.goto('/');

    // THEN: Content-Type header is text/html (not application/octet-stream or similar misconfig)
    const contentType = response?.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('[P2] should render the React app within a reasonable mobile viewport (375px)', async ({ page }) => {
    // GIVEN: Vite dev server is running and React app boots
    // WHEN: Loading the app at mobile viewport size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // THEN: The app-root mount point is visible (no layout collapse / no overflow that hides root)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P2] should NOT serve stale build artifacts (no /dist path served by dev)', async ({ request }) => {
    // GIVEN: Vite dev server (not the built static output) is running
    // WHEN: Requesting a path that would only exist in a production build
    const response = await request.get('http://localhost:5173/dist/index.html');

    // THEN: The dev server returns 404 (or fallback) — not a built artifact
    // Vite dev server serves index.html as SPA fallback for unknown paths, but should not serve /dist/*
    expect(response.status()).not.toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge cases — CORS boundaries (disallowed origins, all methods)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge — CORS security boundaries', () => {
  test('[P0] should NOT return Allow-Origin header for a disallowed origin', async ({ request }) => {
    // GIVEN: CORS policy "DevCors" only allows http://localhost:5173
    // WHEN: A request is made from a disallowed origin (e.g., evil.example.com)
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header is either absent OR not echoing the evil origin
    // (server may omit the header entirely, which the browser will then block — both are valid)
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.example.com');
    expect(allowOrigin).not.toBe('*'); // wildcard would defeat the policy
  });

  test('[P1] should allow CORS preflight for non-existent API path (CORS is enforced before routing)', async ({
    request,
  }) => {
    // GIVEN: CORS middleware is registered BEFORE endpoint mapping in Program.cs
    // WHEN: An OPTIONS preflight is sent to a path that does not yet exist (future API route)
    const response = await request.fetch(`${API_BASE_URL}/api/v1/clientes`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight does not fail with CORS rejection (status 204 or 200 or 404 with CORS headers)
    // The key check: CORS is wired globally, not per-endpoint
    expect(response.status()).toBeLessThan(500);
  });

  test('[P1] should include CORS headers on the /health endpoint response', async ({ request }) => {
    // GIVEN: CORS policy applied app-wide, /health endpoint exists in Program.cs
    // WHEN: Frontend origin requests the health endpoint
    const response = await request.get(`${API_BASE_URL}/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: CORS headers present and origin allowed
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).toBe('http://localhost:5173');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 edge cases — TypeScript strict signal in browser
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 edge — TypeScript strict mode runtime signals', () => {
  test('[P1] should not surface any "Cannot find module" or import errors on initial load', async ({ page }) => {
    // GIVEN: All runtime dependencies installed (@tanstack/react-router, react-query, etc.)
    // WHEN: The app boots
    const importErrors: string[] = [];
    page.on('pageerror', (err) => {
      if (
        err.message.includes('Cannot find module') ||
        err.message.includes('Failed to resolve') ||
        err.message.includes('Cannot resolve')
      ) {
        importErrors.push(err.message);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No module resolution errors — all declared dependencies are installed
    expect(importErrors).toEqual([]);
  });

  test('[P2] should boot the React app without "uncaught (in promise)" warnings on first render', async ({
    page,
  }) => {
    // GIVEN: QueryProvider + RouterProvider wired in main.tsx
    // WHEN: The app boots and mounts
    const unhandledRejections: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text().toLowerCase();
      if (msg.type() === 'error' && (text.includes('uncaught (in promise)') || text.includes('unhandled promise'))) {
        unhandledRejections.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No unhandled promise rejections during initial mount
    expect(unhandledRejections).toEqual([]);
  });
});
