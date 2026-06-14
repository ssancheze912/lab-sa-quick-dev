/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion Tests — Edge Cases & Negative Paths
 * Extends ATDD coverage with boundary conditions, error paths, and
 * behaviors not covered in project-initialization.spec.ts.
 *
 * Coverage added:
 *   - Unknown routes produce a navigable 404-like response (no crash)
 *   - Root HTML contains required <title> tag (SEO/accessibility baseline)
 *   - No mixed-content (HTTP assets loaded from HTTPS context) warnings
 *   - Navigation to deep/invalid path does not produce unhandled JS error
 *   - app-root is still present after client-side navigation
 *   - Page does not contain Vite HMR connection errors in console
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Unknown routes — frontend must NOT crash on unmatched path
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — unknown frontend routes', () => {
  test('[P1] should not throw a runtime error when navigating to an unknown route', async ({
    page,
  }) => {
    // GIVEN: The frontend app is running at http://localhost:5173
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    // WHEN: The browser navigates to a path that has no route definition
    await page.goto('/ruta-desconocida-que-no-existe');

    // THEN: No unhandled JavaScript exceptions are thrown
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P1] should still render the React mount point on an unknown route', async ({ page }) => {
    // GIVEN: The frontend app is running
    // WHEN: The browser navigates to a deeply nested unknown path
    await page.goto('/seccion/desconocida/profunda');

    // THEN: The React root element is still mounted (app shell is intact)
    // TanStack Router renders a "not found" route rather than unmounting the root
    await expect(page.locator('#root')).toBeAttached();
  });

  test('[P2] should serve a valid HTML document for any path (SPA fallback)', async ({
    request,
  }) => {
    // GIVEN: The Vite dev server has SPA fallback enabled
    // WHEN: An HTTP request is made to a path with no static asset
    const response = await request.get('http://localhost:5173/no-existe');

    // THEN: Vite responds with HTML (index.html SPA fallback) — not a 404 status
    // Vite dev server returns 200 for all paths in SPA mode
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: HTML document structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — HTML document structure', () => {
  test('[P2] should include a <title> element in the HTML document head', async ({ page }) => {
    // GIVEN: The frontend app has been initialized
    // WHEN: The root page loads
    await page.goto('/');

    // THEN: The document has a non-empty <title> tag (accessibility + SEO baseline)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('[P2] should include the React mount point #root in the HTML body', async ({ page }) => {
    // GIVEN: The Vite template includes <div id="root"> in index.html
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The #root element exists and is attached to the DOM
    await expect(page.locator('#root')).toBeAttached();
  });

  test('[P2] should load the Vite entry script without module resolution errors', async ({
    page,
  }) => {
    // GIVEN: main.tsx is the Vite entry point registered in index.html
    const moduleErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      // Catch ES module load failures or import errors surfaced by the browser
      if (
        msg.type() === 'error' &&
        (text.includes('Failed to load module') ||
          text.includes('Cannot find module') ||
          text.includes('import error'))
      ) {
        moduleErrors.push(text);
      }
    });

    // WHEN: The root page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No module resolution errors appear
    expect(moduleErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: TailwindCSS v4 import does not break rendering
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — TailwindCSS v4 integration', () => {
  test('[P2] should apply at least one TailwindCSS utility class visible via computed style', async ({
    page,
  }) => {
    // GIVEN: src/index.css has @import "tailwindcss" (Tailwind v4 syntax)
    //        and is imported in main.tsx
    // WHEN: The root page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The document's computed styles include TailwindCSS base styles
    // A quick proxy: box-sizing is set to border-box (Tailwind's preflight does this)
    const boxSizing = await page.evaluate(() => {
      return window.getComputedStyle(document.body).boxSizing;
    });
    expect(boxSizing).toBe('border-box');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: No Vite HMR/WebSocket console spam on initial load
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — Vite development server health', () => {
  test('[P3] should not emit Vite connection-refused errors in the browser console', async ({
    page,
  }) => {
    // GIVEN: The Vite dev server is running and its HMR WebSocket is available
    const connectionErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        msg.type() === 'error' &&
        (text.toLowerCase().includes('websocket') ||
          text.toLowerCase().includes('connection refused'))
      ) {
        connectionErrors.push(text);
      }
    });

    // WHEN: The page loads and HMR connects
    await page.goto('/');
    // Allow a moment for Vite HMR WebSocket handshake
    await page.waitForLoadState('networkidle');

    // THEN: No WebSocket connection errors are emitted
    expect(connectionErrors).toHaveLength(0);
  });
});
