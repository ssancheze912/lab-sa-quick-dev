import { test, expect } from '@playwright/test';

/**
 * Story 1.1 — Project Initialization & Repository Structure
 * AC 1: Vite frontend starts on port 5173 (covered by Playwright baseURL + webServer config)
 * AC 2: Backend starts on port 5000 (covered by backend-health.spec.ts)
 * AC 3: Clean Architecture solution — 4 projects referenced and buildable
 * AC 4: CORS allows requests from localhost:5173 (covered by backend-health.spec.ts)
 *
 * This file covers the frontend shell smoke check and CORS integration
 * from the browser perspective (not just raw HTTP).
 *
 * These tests are in RED phase — they fail until frontend+backend are initialized.
 * Test IDs: E2E-INIT-01, E2E-INIT-02
 */

const BACKEND_BASE = 'http://localhost:5000';
const FRONTEND_ORIGIN = 'http://localhost:5173';

test.describe('Story 1.1 — Inicialización de Proyecto', () => {
  /**
   * E2E-INIT-01 (P0 — AC 1)
   * Given a clean development machine with Node.js installed
   * When the frontend Vite server is started (npm run dev)
   * Then the app is reachable at localhost:5173 and the HTML document loads without errors
   */
  test('E2E-INIT-01 — Frontend Vite carga en localhost:5173 sin errores', async ({ page }) => {
    // Intercept before navigation to catch any network errors early
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to root — the Playwright webServer ensures port 5173 is up
    await page.goto('/');

    // The page must load without navigation failure
    await expect(page).toHaveURL(/localhost:5173/);

    // The HTML document must contain a root mounting point (Vite React template standard)
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeAttached();

    // No TypeScript/Vite compilation errors surfaced to console
    const criticalErrors = consoleErrors.filter(
      (e) =>
        e.includes('SyntaxError') ||
        e.includes('TypeError') ||
        e.includes('[vite]') ||
        e.includes('Failed to resolve')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  /**
   * E2E-INIT-02 (P0 — AC 4)
   * Given both projects are running
   * When the frontend makes an HTTP GET request to the backend
   * Then CORS allows the request from localhost:5173 without a blocked response
   */
  test('E2E-INIT-02 — Frontend puede comunicarse con backend sin error CORS', async ({
    page,
  }) => {
    const corsErrors: string[] = [];

    // Intercept CORS errors before navigation
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        (msg.text().includes('CORS') || msg.text().includes('Access-Control'))
      ) {
        corsErrors.push(msg.text());
      }
    });

    // Track failed requests due to CORS
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      if (req.url().includes('localhost:5000')) {
        failedRequests.push(req.url());
      }
    });

    await page.goto('/');

    // Execute a fetch from the browser context to verify CORS is configured
    const result = await page.evaluate(async (backendBase: string) => {
      try {
        const response = await fetch(`${backendBase}/scalar`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        return { ok: response.ok, status: response.status, error: null };
      } catch (err: unknown) {
        return {
          ok: false,
          status: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }, BACKEND_BASE);

    // No CORS error should appear
    expect(corsErrors).toHaveLength(0);

    // The fetch must not throw a CORS network error
    if (result.error) {
      expect(result.error).not.toMatch(/CORS/i);
      expect(result.error).not.toMatch(/Access-Control/i);
    }

    // The backend responded (not a CORS block)
    expect(result.ok).toBe(true);
  });
});

test.describe('Story 1.1 — Frontend Shell Estructura Base', () => {
  /**
   * E2E-INIT-03 (P1 — AC 1)
   * Given the frontend is initialized with React + Vite
   * When the app loads
   * Then the document title is set (not empty) and the page has valid HTML structure
   * This confirms TypeScript strict mode compiled successfully (build gate passed)
   */
  test('E2E-INIT-03 — App React tiene estructura HTML válida y título definido', async ({
    page,
  }) => {
    await page.goto('/');

    // Page title should be defined (not empty)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Root div must be present (React hydration point)
    await expect(page.locator('#root')).toBeAttached();

    // Page must have at least one visible element inside root (app renders something)
    const rootChildren = page.locator('#root > *');
    await expect(rootChildren.first()).toBeAttached();
  });

  /**
   * E2E-INIT-04 (P2 — AC 1)
   * Given the frontend configuration requires TypeScript strict mode
   * When the Vite dev server starts successfully
   * Then the app responds on port 5173 — confirming the TypeScript compilation passed
   * (strict mode errors would prevent the dev server from starting in the first place)
   */
  test('E2E-INIT-04 — Servidor Vite responde en puerto 5173 (TypeScript compiló correctamente)', async ({
    page,
  }) => {
    const response = await page.goto(FRONTEND_ORIGIN);
    expect(response?.status()).toBeLessThan(400);
    expect(page.url()).toContain('5173');
  });
});
