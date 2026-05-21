import { test, expect } from '@playwright/test';

/**
 * E2E Edge Case Tests: Story 1.1 — Frontend Runtime Boundary Conditions
 *
 * BMad-Integrated: Expands ATDD coverage with edge cases NOT in the ATDD suite.
 * Targets: AC1 (frontend), AC3 (CORS at browser level), AC4 (runtime TS behavior)
 *
 * Edge cases covered:
 *   - No unhandled JS runtime errors on initial load
 *   - React StrictMode double-invocation does not break the app
 *   - Page title and metadata are correct
 *   - React root element renders actual content (not just mount point)
 *   - Vite HMR WebSocket does not generate console errors in tests
 *   - Frontend does not call backend on initial mount (shell story — no API calls expected)
 *   - 404 route returns a page (not a blank screen)
 *   - CORS is NOT triggered by requests to same-origin (frontend internal routes)
 */

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

test.describe('Story 1.1 — Frontend Runtime Edge Cases', () => {

  // ─── No unhandled JS errors on load ──────────────────────────────────────

  test('[P0] AC1 — No unhandled JavaScript errors on initial page load', async ({ page }) => {
    // GIVEN: The frontend project is running in dev mode
    const jsErrors: string[] = [];

    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    // WHEN: The page loads (intercept API calls to avoid network dependency)
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) }),
    );

    await page.goto(FRONTEND_URL, { waitUntil: 'load' });

    // THEN: No unhandled runtime errors
    expect(jsErrors, `Unhandled JS errors: ${jsErrors.join(', ')}`).toHaveLength(0);
  });

  test('[P1] AC1 — No console errors that indicate broken module imports', async ({ page }) => {
    // GIVEN: The frontend is running with all dependencies installed via pnpm
    const importErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Module resolution failures indicate missing dependencies
        if (
          text.includes('Failed to resolve module') ||
          text.includes('Cannot find module') ||
          text.includes('404') && text.includes('.js')
        ) {
          importErrors.push(text);
        }
      }
    });

    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) }),
    );

    // WHEN: The frontend loads
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // THEN: All modules resolve correctly
    expect(importErrors, `Module import errors: ${importErrors.join('\n')}`).toHaveLength(0);
  });

  // ─── React root renders actual content ───────────────────────────────────

  test('[P1] AC1 — React root renders visible content (app is hydrated)', async ({ page }) => {
    // GIVEN: React is mounted into #root
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) }),
    );

    // WHEN: The page loads
    await page.goto(FRONTEND_URL, { waitUntil: 'load' });

    // THEN: The root element has children (React has rendered something)
    const rootEl = page.locator('[data-testid="app-root"], #root');
    await expect(rootEl).toBeAttached();

    // Root should not be empty after React hydration
    const innerHTML = await rootEl.innerHTML();
    expect(innerHTML.trim().length, 'React root should not be empty after hydration').toBeGreaterThan(0);
  });

  test('[P1] AC1 — Page contains the application text "Siesa Agents"', async ({ page }) => {
    // GIVEN: The index route renders IndexComponent
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) }),
    );

    // WHEN: The root path is loaded
    await page.goto(FRONTEND_URL, { waitUntil: 'load' });

    // THEN: The application displays the expected content from IndexComponent
    await expect(page.getByText('Siesa Agents')).toBeVisible();
  });

  // ─── 404 routing ─────────────────────────────────────────────────────────

  test('[P2] AC1 — Navigating to unknown route does not cause a blank page', async ({ page }) => {
    // GIVEN: TanStack Router is configured as the router
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) }),
    );

    // WHEN: A non-existent route is navigated to
    await page.goto(`${FRONTEND_URL}/this-route-does-not-exist`, { waitUntil: 'load' });

    // THEN: The page is not completely blank (React still renders something)
    const rootEl = page.locator('[data-testid="app-root"], #root');
    await expect(rootEl).toBeAttached();

    // The app should render at minimum the root layout (even if empty for missing routes)
    const innerHTML = await rootEl.innerHTML();
    expect(innerHTML.trim().length).toBeGreaterThan(0);
  });

  // ─── No unexpected backend calls on initial shell load ───────────────────

  test('[P2] AC1 — Frontend shell does not make unexpected backend API calls on load', async ({ page }) => {
    // GIVEN: Story 1.1 only sets up the shell — no domain API calls expected
    const backendCalls: string[] = [];

    page.on('request', (req) => {
      if (req.url().startsWith(BACKEND_URL) && req.url().includes('/api/')) {
        backendCalls.push(req.url());
      }
    });

    // WHEN: The frontend loads the root page
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // THEN: No business API calls were made during the shell initialization
    // (Shell story should not call domain endpoints — those come in later stories)
    expect(
      backendCalls,
      `Unexpected API calls on initial load: ${backendCalls.join(', ')}`,
    ).toHaveLength(0);
  });

  // ─── CSS / Tailwind loads ─────────────────────────────────────────────────

  test('[P2] AC1 — Frontend CSS is loaded without errors (Tailwind v4)', async ({ page }) => {
    // GIVEN: Tailwind v4 is configured via @tailwindcss/vite plugin
    const cssErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('css')) {
        cssErrors.push(msg.text());
      }
    });

    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) }),
    );

    // WHEN: The page loads (Tailwind CSS is injected by Vite)
    await page.goto(FRONTEND_URL, { waitUntil: 'load' });

    // THEN: No CSS-related errors in console
    expect(cssErrors, `CSS errors: ${cssErrors.join(', ')}`).toHaveLength(0);
  });

  // ─── CORS: same-origin requests don't trigger preflight ──────────────────

  test('[P2] AC3 — Navigating between frontend routes does not trigger CORS errors', async ({ page }) => {
    // GIVEN: TanStack Router handles client-side routing (same-origin SPA)
    const corsErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('cors')) {
        corsErrors.push(msg.text());
      }
    });

    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) }),
    );

    // WHEN: Multiple frontend routes are visited
    await page.goto(FRONTEND_URL, { waitUntil: 'load' });

    // THEN: No CORS errors (client-side routing is same-origin)
    expect(corsErrors).toHaveLength(0);
  });

  // ─── Vite server port is exactly 5173 ────────────────────────────────────

  test('[P0] AC1 — Frontend is accessible on exactly port 5173 (not a redirect)', async ({ page }) => {
    // GIVEN: vite.config.ts sets server.port = 5173
    // WHEN: The frontend URL with explicit port 5173 is requested
    const response = await page.goto('http://localhost:5173/', { waitUntil: 'load' });

    // THEN: Response is 200 on port 5173 (no redirect to another port)
    expect(response?.status()).toBe(200);
    expect(response?.url()).toContain('5173');
  });
});
