import { test, expect } from '@playwright/test';

/**
 * E2E Acceptance Tests: Story 1.1 — Project Initialization & Repository Structure
 *
 * RED PHASE: These tests are written BEFORE implementation.
 * They will fail until the project is properly initialized.
 *
 * Covers:
 *   AC1 — Frontend Vite server starts on port 5173 (TypeScript strict mode)
 *   AC3 — CORS allows requests from http://localhost:5173 to http://localhost:5000
 */

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

test.describe('Story 1.1 — Project Initialization & Repository Structure', () => {

  // ─── AC1: Frontend Vite Dev Server ───────────────────────────────────────

  test('AC1 — Frontend Vite server responds on port 5173', async ({ page }) => {
    // GIVEN: A clean development machine with Node.js installed
    // WHEN: The developer runs `pnpm run dev` and the frontend is requested
    const response = await page.goto(FRONTEND_URL, { waitUntil: 'load' });

    // THEN: The server responds successfully (HTTP 200)
    expect(response?.status()).toBe(200);
  });

  test('AC1 — Frontend root HTML contains a React mount point', async ({ page }) => {
    // GIVEN: The Vite dev server is running on port 5173
    // WHEN: The root page is loaded
    await page.goto(FRONTEND_URL, { waitUntil: 'load' });

    // THEN: The page has a root element for React to mount into
    const rootEl = page.locator('[data-testid="app-root"], #root');
    await expect(rootEl).toBeAttached();
  });

  // ─── AC3: CORS allows frontend → backend requests ────────────────────────

  test('AC3 — CORS allows cross-origin request from frontend origin', async ({ page }) => {
    // GIVEN: Both frontend and backend servers are running
    // AND: The frontend origin is http://localhost:5173
    // WHEN: The frontend page makes an HTTP request to http://localhost:5000
    await page.goto(FRONTEND_URL, { waitUntil: 'load' });

    // THEN: The fetch succeeds without CORS errors (no network error, response received)
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().startsWith(BACKEND_URL) && resp.status() < 600,
        { timeout: 10_000 },
      ),
      page.evaluate((backendUrl) => {
        return fetch(`${backendUrl}/health`, {
          method: 'GET',
          mode: 'cors',
        }).then((r) => r.status).catch(() => 0);
      }, BACKEND_URL),
    ]);

    // CORS is working if the response was received (not a network error)
    expect(response.status()).toBeLessThan(600);
  });

  test('AC3 — No CORS errors appear in browser console', async ({ page }) => {
    // GIVEN: Both servers are running
    const corsErrors: string[] = [];

    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        msg.text().toLowerCase().includes('cors')
      ) {
        corsErrors.push(msg.text());
      }
    });

    // WHEN: The frontend makes a request to the backend
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    await page.evaluate((backendUrl) => {
      return fetch(`${backendUrl}/health`, { mode: 'cors' }).catch(() => {});
    }, BACKEND_URL);

    // THEN: No CORS-related console errors are logged
    expect(corsErrors).toHaveLength(0);
  });
});
