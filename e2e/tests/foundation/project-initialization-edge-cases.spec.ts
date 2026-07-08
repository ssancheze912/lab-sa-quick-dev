/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded automation coverage - edge cases & boundary conditions
 * beyond the ATDD baseline (project-initialization.spec.ts).
 *
 * Focus: negative paths, resilience, and boundary behaviour on the
 * frontend shell that were not covered by the acceptance tests.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 edge cases — Frontend shell resilience
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge cases — Frontend shell resilience', () => {
  test('[P1] should survive multiple consecutive reloads without leaking runtime errors', async ({
    page,
  }) => {
    // GIVEN: The frontend Vite server is up
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    // WHEN: The developer reloads the shell three times in a row
    await page.goto('/');
    await page.reload();
    await page.reload();
    await page.reload();

    // THEN: No pageerror events accumulate across reloads
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should expose an <html lang> attribute so the shell is accessible', async ({
    page,
  }) => {
    // GIVEN: Vite serves index.html for the SPA shell
    await page.goto('/');

    // WHEN: The document root is inspected
    const lang = await page.locator('html').getAttribute('lang');

    // THEN: A non-empty lang attribute is present (Vite template sets it)
    expect(lang).not.toBeNull();
    expect((lang ?? '').trim().length).toBeGreaterThan(0);
  });

  test('[P2] should ship a <div id="root"> node that React can mount into', async ({ page }) => {
    // GIVEN: React 19 is bootstrapped in main.tsx via createRoot(document.getElementById('root'))
    await page.goto('/');

    // WHEN/THEN: The container React targets exists exactly once
    const rootCount = await page.locator('#root').count();
    expect(rootCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge cases — Real cross-origin requests from browser context
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge cases — Browser-issued cross-origin requests', () => {
  test('[P1] should let the browser complete a real fetch to backend /scalar (200 with body)', async ({
    page,
  }) => {
    // GIVEN: The browser is at http://localhost:5173 (baseURL)
    await page.goto('/');

    // WHEN: The frontend issues a real cross-origin fetch to the backend
    const result = await page.evaluate(async (apiUrl) => {
      const res = await fetch(`${apiUrl}/scalar`, { method: 'GET' });
      return { status: res.status, ok: res.ok };
    }, API_BASE_URL);

    // THEN: The response is 200 and .ok is true (CORS did not block the read)
    expect(result.status).toBe(200);
    expect(result.ok).toBe(true);
  });

  test('[P2] should NOT block the browser from reading response headers on cross-origin GET', async ({
    page,
  }) => {
    // GIVEN: Frontend on 5173 makes a request to backend on 5000
    await page.goto('/');

    // WHEN: The browser inspects the Content-Type header of the CORS response
    const contentType = await page.evaluate(async (apiUrl) => {
      const res = await fetch(`${apiUrl}/scalar`, { method: 'GET' });
      return res.headers.get('content-type');
    }, API_BASE_URL);

    // THEN: The header is readable (would be null if CORS blocked exposure of simple headers)
    expect(contentType ?? '').toContain('text/html');
  });
});
