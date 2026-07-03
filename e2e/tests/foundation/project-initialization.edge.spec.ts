/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded coverage — Edge cases, boundary conditions, and integration checks
 * beyond the ATDD baseline (project-initialization.spec.ts).
 *
 * Priority tags:
 *   [P1] — High priority (pre-merge)
 *   [P2] — Medium priority (nightly)
 *   [P3] — Low priority (on-demand)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + AC4 edge cases — Frontend HTML shell and dev-server behavior
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1/AC4 edge — Frontend HTML shell metadata', () => {
  test('[P2] should serve index.html with the branded document title', async ({ page }) => {
    // GIVEN: The Vite dev server is running with index.html containing title "Siesa Agents CRM"
    await page.goto('/');

    // WHEN: The page finishes loading
    // THEN: document.title reflects the branded title
    await expect(page).toHaveTitle(/Siesa Agents CRM/i);
  });

  test('[P2] should declare Spanish as the document language', async ({ page }) => {
    // GIVEN: index.html sets <html lang="es"> per file list evidence
    await page.goto('/');

    // WHEN: We inspect the root HTML element
    const lang = await page.locator('html').getAttribute('lang');

    // THEN: The document is declared as Spanish
    expect(lang).toBe('es');
  });

  test('[P2] should mount a single React root element with data-testid="app-root"', async ({ page }) => {
    // GIVEN: The frontend renders __root.tsx with data-testid="app-root"
    await page.goto('/');

    // WHEN: The router mounts the root layout
    // THEN: Exactly one app-root element exists (no duplicate mounts)
    await expect(page.locator('[data-testid="app-root"]')).toHaveCount(1);
  });

  test('[P2] should serve a favicon without a 404', async ({ page }) => {
    // GIVEN: Vite auto-serves a favicon from index.html link tag
    const faviconRequests: number[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('favicon') || resp.url().endsWith('.svg')) {
        faviconRequests.push(resp.status());
      }
    });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: All favicon requests succeeded (no 404s from missing icon)
    const failed = faviconRequests.filter((s) => s >= 400);
    expect(failed).toEqual([]);
  });
});

test.describe('AC1 edge — Vite dev server signals', () => {
  test('[P2] should complete initial page load with zero failed sub-resource requests', async ({ page }) => {
    // GIVEN: All bundled JS/CSS resources are served by Vite dev server
    const failedResources: { url: string; status: number }[] = [];
    page.on('response', (resp) => {
      const status = resp.status();
      // Ignore intentional cross-origin probes; only track first-party 4xx/5xx
      if (status >= 400 && resp.url().startsWith('http://localhost:5173')) {
        failedResources.push({ url: resp.url(), status });
      }
    });

    // WHEN: The page fully loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No first-party resource returned 4xx/5xx (all bundles compiled and served)
    expect(failedResources, JSON.stringify(failedResources)).toEqual([]);
  });

  test('[P2] should load the Vite HMR client script (@vite/client)', async ({ page }) => {
    // GIVEN: Vite dev mode injects @vite/client for HMR
    const viteClientLoaded = page.waitForResponse(
      (resp) => resp.url().includes('/@vite/client') && resp.status() === 200,
      { timeout: 10_000 }
    );

    // WHEN: The page loads
    await page.goto('/');

    // THEN: The @vite/client script was requested and served — dev mode is active
    const response = await viteClientLoaded;
    expect(response.status()).toBe(200);
  });

  test('[P2] should serve JS modules with the correct MIME type', async ({ page }) => {
    // GIVEN: Vite serves ES modules that must have Content-Type application/javascript
    const jsMimeTypes: string[] = [];
    page.on('response', async (resp) => {
      const url = resp.url();
      if (
        url.startsWith('http://localhost:5173') &&
        (url.includes('main.tsx') || url.endsWith('.js') || url.includes('/src/'))
      ) {
        jsMimeTypes.push(resp.headers()['content-type'] ?? '');
      }
    });

    // WHEN: The page loads all bundled scripts
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: At least one JS resource was served AND all are JavaScript MIME types
    expect(jsMimeTypes.length).toBeGreaterThan(0);
    const nonJs = jsMimeTypes.filter((ct) => !ct.toLowerCase().includes('javascript'));
    expect(nonJs, `Non-JS MIME types: ${nonJs.join(', ')}`).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 edge — Responsive baseline (mobile viewport smoke)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge — Responsive baseline', () => {
  test('[P3] should still render app-root on a mobile viewport (baseline responsiveness)', async ({
    page,
  }) => {
    // GIVEN: The mobile-chrome project uses Pixel 5 viewport (per playwright.config.ts)
    // This test runs across all projects, so the shell must render at any size.

    await page.goto('/');

    // WHEN/THEN: app-root is visible regardless of viewport
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge — CORS negative cases (executed from the browser context)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge — Frontend->Backend fetch from browser', () => {
  test('[P1] should successfully complete a fetch() to backend /scalar from the frontend page context', async ({
    page,
  }) => {
    // GIVEN: The frontend origin (localhost:5173) is whitelisted in backend CORS
    await page.goto('/');

    // WHEN: The page's JS context issues a real cross-origin fetch
    const status = await page.evaluate(async () => {
      const r = await fetch('http://localhost:5000/scalar', {
        method: 'GET',
        redirect: 'follow',
      });
      return r.status;
    });

    // THEN: The browser did not block the request; server responded 200
    expect(status).toBe(200);
  });

  test('[P2] should not log any fetch/network errors when calling backend from the page', async ({
    page,
  }) => {
    // GIVEN: The frontend can freely call the whitelisted backend
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // WHEN: A fetch is made and awaited from the page
    await page.evaluate(async () => {
      await fetch('http://localhost:5000/scalar');
    });

    // THEN: No console.error was emitted from the fetch (no CORS/network noise)
    const relevant = consoleErrors.filter(
      (e) =>
        e.toLowerCase().includes('cors') ||
        e.toLowerCase().includes('failed to fetch') ||
        e.toLowerCase().includes('net::')
    );
    expect(relevant).toEqual([]);
  });
});
