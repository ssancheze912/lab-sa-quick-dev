import { test, expect } from '@playwright/test';

/**
 * Story 1.1 — Project Initialization & Repository Structure — Edge Cases
 *
 * Expands coverage beyond the GREEN ATDD suite by targeting:
 *  - Browser console warnings and React strict-mode noise
 *  - Page metadata completeness
 *  - Frontend asset integrity (JS/CSS loaded without 4xx)
 *  - Vite HMR WebSocket upgrade path does not block navigation
 *  - Performance boundary: page interactive within acceptable threshold
 *
 * Test IDs: E2E-EDGE-01 … E2E-EDGE-06
 */

const FRONTEND_ORIGIN = 'http://localhost:5173';

test.describe('Story 1.1 — Frontend Edge Cases & Boundary Conditions', () => {
  /**
   * E2E-EDGE-01 (P1 — AC 1)
   * Boundary: No broken asset requests (4xx on JS/CSS) should occur on initial load.
   * A misconfigured Vite plugin or missing import would surface as a 404 on a script chunk.
   */
  test('E2E-EDGE-01 — Ningún asset JS/CSS devuelve 4xx al cargar la app', async ({ page }) => {
    const failedAssets: string[] = [];

    page.on('response', (res) => {
      const url = res.url();
      const status = res.status();
      if (
        status >= 400 &&
        (url.includes('.js') || url.includes('.css') || url.includes('.ts'))
      ) {
        failedAssets.push(`${status} ${url}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(
      failedAssets,
      `Assets with 4xx responses: ${failedAssets.join(', ')}`
    ).toHaveLength(0);
  });

  /**
   * E2E-EDGE-02 (P1 — AC 1)
   * Boundary: React strict mode in dev causes intentional double-render — the app must
   * remain functional and not crash after the double-render cycle.
   * Detects TypeError or React invariant violations in console.
   */
  test('E2E-EDGE-02 — App no colapsa bajo React StrictMode (sin TypeError en consola)', async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Exclude known CORS or network-level messages already covered by other tests
        if (!text.includes('CORS') && !text.includes('Access-Control')) {
          runtimeErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/');
    // Wait for React hydration to complete
    await page.waitForLoadState('domcontentloaded');
    // Wait for React strict mode double-render cycle to complete
    await page.waitForLoadState('networkidle');

    const jsErrors = runtimeErrors.filter(
      (e) =>
        e.includes('TypeError') ||
        e.includes('ReferenceError') ||
        e.includes('Uncaught') ||
        e.includes('Cannot read') ||
        e.includes('is not defined')
    );

    expect(
      jsErrors,
      `Runtime JS errors detected: ${jsErrors.join(' | ')}`
    ).toHaveLength(0);
  });

  /**
   * E2E-EDGE-03 (P2 — AC 1)
   * Boundary: HTML document must include essential metadata.
   * Missing charset or viewport meta tag indicates the template was not properly initialized.
   */
  test('E2E-EDGE-03 — index.html contiene meta charset y viewport correctos', async ({
    page,
  }) => {
    await page.goto('/');

    // Charset meta tag must exist
    const charset = await page.evaluate(() => {
      const meta = document.querySelector('meta[charset]');
      return meta?.getAttribute('charset') ?? null;
    });
    expect(charset).not.toBeNull();
    expect(charset?.toLowerCase()).toBe('utf-8');

    // Viewport meta must exist for responsive design (TailwindCSS v4 requirement)
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content') ?? null;
    });
    expect(viewport).not.toBeNull();
    expect(viewport).toContain('width=device-width');
  });

  /**
   * E2E-EDGE-04 (P2 — AC 1)
   * Boundary: The #root element must contain rendered content (not be empty).
   * An empty #root means React failed to mount silently.
   */
  test('E2E-EDGE-04 — React monta correctamente: #root no está vacío', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const rootInnerHTML = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.trim() : '';
    });

    expect(
      rootInnerHTML.length,
      '#root is empty — React failed to mount'
    ).toBeGreaterThan(0);
  });

  /**
   * E2E-EDGE-05 (P2 — AC 1)
   * Boundary: Navigating to a non-existent frontend route must NOT return a hard 404.
   * Vite dev server should serve index.html for all routes (SPA fallback).
   * TanStack Router handles the 404 UI; the server itself should still return 200.
   */
  test('E2E-EDGE-05 — Ruta frontend inexistente devuelve index.html (SPA fallback activo)', async ({
    page,
  }) => {
    const response = await page.goto(`${FRONTEND_ORIGIN}/ruta-que-no-existe-spa`);

    // Vite dev server serves index.html for unknown routes — status is 200
    expect(response?.status()).toBe(200);

    // The #root must still be present (React app loaded)
    await expect(page.locator('#root')).toBeAttached();
  });

  /**
   * E2E-EDGE-06 (P2 — AC 1)
   * Boundary: Page load performance guard.
   * The frontend must become interactive within 10 seconds under dev mode.
   * Exceeding this indicates a blocking dependency or circular import.
   */
  test('E2E-EDGE-06 — Tiempo de carga inicial del frontend es menor a 10 segundos', async ({
    page,
  }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - startTime;

    expect(
      elapsed,
      `Page took ${elapsed}ms to become interactive (threshold: 10000ms)`
    ).toBeLessThan(10_000);
  });
});
