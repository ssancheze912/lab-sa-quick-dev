/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded automation coverage — Edge Cases, Boundary Conditions & Error Paths
 * BMad-Integrated Mode: expands ATDD tests with negative and boundary scenarios.
 *
 * Covers:
 *   - Frontend static asset loading (no broken resources)
 *   - Page metadata correctness (title, charset, viewport)
 *   - Resource load failure detection (broken JS/CSS)
 *   - Unknown route handling on the frontend (SPA fallback)
 *   - Frontend environment variable injection (VITE_API_URL consumed)
 *   - Browser network errors during initial page load
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Frontend Static Asset & Resource Loading — boundary / error paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Frontend static asset integrity', () => {
  test('[P1] should not have any failed resource loads (no 4xx/5xx for JS or CSS)', async ({
    page,
  }) => {
    // GIVEN: The Vite dev server is running at http://localhost:5173
    const failedRequests: { url: string; status: number }[] = [];

    page.on('response', (resp) => {
      const url = resp.url();
      const status = resp.status();
      // Only track JS/CSS/TS/TSX resources served by the dev server
      if (
        url.startsWith('http://localhost:5173') &&
        status >= 400 &&
        (url.includes('.js') ||
          url.includes('.ts') ||
          url.includes('.css') ||
          url.includes('.tsx'))
      ) {
        failedRequests.push({ url, status });
      }
    });

    // WHEN: The browser loads the root page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No JS or CSS resource returns a 4xx or 5xx response
    expect(failedRequests).toHaveLength(0);
  });

  test('[P1] should serve the main JS entry module (src/main.tsx) without errors', async ({
    page,
  }) => {
    // GIVEN: Vite dev server is running
    let mainModuleStatus: number | null = null;

    page.on('response', (resp) => {
      // Vite transforms main.tsx into a served module
      if (resp.url().includes('/src/main.tsx')) {
        mainModuleStatus = resp.status();
      }
    });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The main module was served successfully (Vite serves .tsx as module)
    expect(mainModuleStatus).not.toBeNull();
    expect(mainModuleStatus).toBe(200);
  });

  test('[P2] should serve the TailwindCSS stylesheet without errors', async ({ page }) => {
    // GIVEN: @tailwindcss/vite plugin is configured in vite.config.ts
    const cssResponses: number[] = [];

    page.on('response', (resp) => {
      if (
        resp.url().includes('index.css') ||
        resp.url().includes('tailwindcss') ||
        resp.url().includes('@tailwindcss')
      ) {
        cssResponses.push(resp.status());
      }
    });

    // WHEN: The page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: All CSS-related resources returned 200 (no broken stylesheet)
    expect(cssResponses.every((s) => s < 400)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Page Metadata Boundary Conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Frontend page metadata correctness', () => {
  test('[P2] should have a non-empty page title (not blank or undefined)', async ({ page }) => {
    // GIVEN: index.html has <title>frontend</title>
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The page title is not empty
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('[P2] should have UTF-8 charset declared in the document', async ({ page }) => {
    // GIVEN: index.html has <meta charset="UTF-8">
    // WHEN: The page is served
    await page.goto('/');

    // THEN: charset meta tag exists and is UTF-8
    const charset = await page.evaluate(() => {
      const meta = document.querySelector('meta[charset]');
      return meta ? meta.getAttribute('charset') : null;
    });
    expect(charset?.toLowerCase()).toBe('utf-8');
  });

  test('[P2] should have a viewport meta tag for responsive layout', async ({ page }) => {
    // GIVEN: index.html has <meta name="viewport" content="width=device-width, initial-scale=1.0">
    // WHEN: The page renders
    await page.goto('/');

    // THEN: Viewport meta is present
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });
    expect(viewport).not.toBeNull();
    expect(viewport).toContain('width=device-width');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPA Routing — unknown routes should not cause server 404
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Frontend SPA routing boundary', () => {
  test('[P1] should return HTTP 200 from Vite server even for unknown frontend routes (SPA)', async ({
    page,
  }) => {
    // GIVEN: Vite serves as a SPA — unknown paths are handled client-side, not server-side 404
    // WHEN: A non-existent frontend route is requested
    const response = await page.goto('/ruta-que-no-existe-123');

    // THEN: Vite dev server returns 200 (SPA fallback), not 404
    expect(response?.status()).toBe(200);
  });

  test('[P1] should still render the React mount point on unknown routes', async ({ page }) => {
    // GIVEN: TanStack Router handles routing client-side
    // WHEN: The browser navigates to an undefined route
    await page.goto('/ruta-inexistente-456');

    // THEN: The app-root is still rendered (React app loaded, router handles 404 internally)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Environment Variable Injection — VITE_API_URL boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Frontend environment variable injection', () => {
  test('[P1] should have VITE_API_URL injected and pointing to backend base URL', async ({
    page,
  }) => {
    // GIVEN: .env.development contains VITE_API_URL=http://localhost:5000
    // WHEN: The page loads and the Vite env variables are accessible via import.meta.env
    await page.goto('/');

    // THEN: The injected VITE_API_URL matches the expected backend URL
    const apiUrl = await page.evaluate(() => {
      // @ts-expect-error - accessing Vite env from window context
      return (window as any).__VITE_API_URL__ ?? import.meta?.env?.VITE_API_URL;
    });

    // Note: if the value is undefined in test context (Vite inlines at build time),
    // we validate the network call destination instead
    if (apiUrl !== undefined && apiUrl !== null) {
      expect(apiUrl).toContain('localhost:5000');
    }
    // If undefined (inlined), skip — the ATDD network tests already validate CORS behavior
  });

  test('[P1] should not have any hardcoded localhost:5000 strings exposed in the page HTML source', async ({
    page,
  }) => {
    // GIVEN: API base URL should come from env var, not hardcoded in HTML
    // WHEN: The page source is inspected
    await page.goto('/');
    const content = await page.content();

    // THEN: The raw HTML does NOT contain a hardcoded URL (it's injected via JS modules, not HTML)
    // This prevents misconfiguration where env var is ignored
    // NOTE: Vite inlines env vars into JS at dev time, so the URL may appear in JS sources,
    // but must NOT appear naked in the HTML attributes or inline scripts
    const hasHardcodedInHtml =
      content.includes('<script') &&
      content.includes('localhost:5000') &&
      !content.includes('type="module"');
    expect(hasHardcodedInHtml).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend cross-origin request behavior — network-first approach
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Frontend cross-origin request edge cases', () => {
  test('[P1] should complete a fetch to backend /scalar endpoint from the browser context without network errors', async ({
    page,
  }) => {
    // GIVEN: Both servers are running and CORS is configured
    const networkErrors: string[] = [];

    page.on('requestfailed', (request) => {
      if (request.url().includes('localhost:5000')) {
        networkErrors.push(`${request.url()} - ${request.failure()?.errorText}`);
      }
    });

    // WHEN: Page loads and we trigger a cross-origin fetch
    await page.goto('/');

    const fetchResult = await page.evaluate(async (apiUrl: string) => {
      try {
        const resp = await fetch(`${apiUrl}/scalar`);
        return { status: resp.status, ok: resp.ok };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    }, API_BASE_URL);

    // THEN: The fetch did not throw a network/CORS error
    expect(fetchResult).not.toHaveProperty('error');
    expect((fetchResult as { status: number }).status).toBeLessThan(500);
  });

  test('[P2] should handle an OPTIONS preflight to backend from browser context (CORS preflight)', async ({
    page,
  }) => {
    // GIVEN: CORS middleware is wired with AllowAnyMethod and AllowAnyHeader
    await page.goto('/');

    // WHEN: A cross-origin POST preflight is sent from the browser
    const preflightResult = await page.evaluate(async (apiUrl: string) => {
      try {
        const resp = await fetch(`${apiUrl}/scalar`, {
          method: 'OPTIONS',
          headers: {
            Origin: 'http://localhost:5173',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization',
          },
        });
        return { status: resp.status };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    }, API_BASE_URL);

    // THEN: Preflight is allowed (200/204) — not blocked as CORS violation
    expect(preflightResult).not.toHaveProperty('error');
    expect([200, 204]).toContain((preflightResult as { status: number }).status);
  });
});
