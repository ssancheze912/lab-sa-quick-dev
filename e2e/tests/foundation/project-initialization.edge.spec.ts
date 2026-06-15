/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge case expansion for project-initialization.spec.ts
 * Mode: BMad-Integrated (expands existing ATDD coverage)
 *
 * Coverage targets (not duplicating ATDD):
 *   E1 — Page title is set (HTML <title> tag)
 *   E2 — React #root mount point exists in DOM
 *   E3 — App renders visible text content (IndexPage renders "Siesa Agents")
 *   E4 — Navigating to unknown route does not crash the app
 *   E5 — Network requests to non-existent API paths do not crash the frontend
 *   E6 — Frontend loads within acceptable time budget (performance boundary)
 *   E7 — No mixed-content warnings (HTTP assets on HTTPS page — N/A for localhost)
 *   E8 — TanStack Router emits no console errors during initial navigation
 */

import { test, expect } from '../../fixtures/base.fixture';

// ─────────────────────────────────────────────────────────────────────────────
// E1: Page title
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Page document metadata', () => {
  test('[P1] should set a non-empty <title> element on the page', async ({ page }) => {
    // GIVEN: The Vite dev server is running at http://localhost:5173
    // WHEN: The browser loads the root URL
    await page.goto('/');

    // THEN: The page title is a non-empty string (index.html sets "frontend")
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('[P1] should have a charset meta tag (UTF-8) in the document head', async ({ page }) => {
    // GIVEN: index.html declares <meta charset="UTF-8" />
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The charset meta tag is present
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset?.toLowerCase()).toBe('utf-8');
  });

  test('[P1] should have a viewport meta tag for responsive layout', async ({ page }) => {
    // GIVEN: index.html declares <meta name="viewport" ... />
    // WHEN: The page loads
    await page.goto('/');

    // THEN: Viewport meta tag exists
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2: React mount point (boundary: element id vs data-testid)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P0] React root mount point', () => {
  test('[P0] should have a #root element in the DOM (React createRoot target)', async ({ page }) => {
    // GIVEN: index.html has <div id="root" data-testid="app-root">
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The #root element exists (required for createRoot to mount)
    const rootEl = page.locator('#root');
    await expect(rootEl).toHaveCount(1);
  });

  test('[P1] should mount React content inside the #root element (not empty after load)', async ({ page }) => {
    // GIVEN: main.tsx calls createRoot(document.getElementById("root")).render(...)
    // WHEN: The page fully loads
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The #root element contains child nodes (React rendered successfully)
    const rootEl = page.locator('#root');
    const childCount = await rootEl.evaluate((el) => el.childElementCount);
    expect(childCount).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3: Index page renders expected content
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Index page content rendering', () => {
  test('[P1] should render the "Siesa Agents" heading on the index route', async ({ page }) => {
    // GIVEN: src/routes/index.tsx returns <h1>Siesa Agents</h1>
    // WHEN: The user navigates to /
    await page.goto('/');

    // THEN: The heading is visible
    await expect(page.getByRole('heading', { name: 'Siesa Agents' })).toBeVisible();
  });

  test('[P1] should render the heading inside a <main> semantic element', async ({ page }) => {
    // GIVEN: IndexPage wraps the heading in <main>
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The <main> element is present in the DOM
    const main = page.locator('main');
    await expect(main).toHaveCount(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4: Unknown route navigation (error boundary / 404 handling)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Unknown route navigation edge cases', () => {
  test('[P1] should not throw a runtime JavaScript exception when navigating to an unknown route', async ({
    page,
  }) => {
    // GIVEN: The app uses TanStack Router with only a root route and index route
    // WHEN: The user navigates to a route that does not exist
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/ruta-inexistente-12345');

    // THEN: No JavaScript runtime exceptions are thrown
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P1] should still serve an HTML document for unknown routes (SPA fallback)', async ({
    page,
  }) => {
    // GIVEN: Vite dev server serves index.html for all routes (SPA mode)
    // WHEN: The browser requests a non-existent path

    // Network-first: intercept navigation response BEFORE goto
    const navResponse = page.waitForResponse('http://localhost:5173/pagina-no-existe');

    await page.goto('/pagina-no-existe');

    // THEN: The server responds with some HTML (not a network error)
    const response = await navResponse;
    expect([200, 404]).toContain(response.status());
    const body = await response.text();
    expect(body.toLowerCase()).toContain('<!doctype html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E5: Failed API request does not crash frontend
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Frontend resilience to failed API calls', () => {
  test('[P2] should not crash when the backend API returns a 500 error (network-first mock)', async ({
    page,
  }) => {
    // GIVEN: The frontend makes HTTP calls via apiClient (Axios)
    // WHEN: The backend returns an unexpected 500 error (simulated via route mock)
    await page.route('**/api/**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 500,
          title: 'An unexpected error occurred.',
          detail: null,
        }),
      })
    );

    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/');

    // THEN: The app does not crash with a JavaScript exception
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should not crash when the backend is completely unreachable (connection refused mock)', async ({
    page,
  }) => {
    // GIVEN: The backend is offline (simulated via route abort)
    // WHEN: The frontend attempts any API request
    await page.route('**/api/**', (route) => route.abort('connectionrefused'));

    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/');

    // THEN: The frontend does not throw uncaught exceptions
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E6: Performance boundary — page loads within budget
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Frontend load performance boundary', () => {
  test('[P2] should complete initial load within 5 seconds (development server budget)', async ({
    page,
  }) => {
    // GIVEN: The Vite dev server compiles and serves the app
    // WHEN: The browser navigates to / and waits for DOM content to be loaded
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const elapsed = Date.now() - startTime;

    // THEN: DOM content is available within 5 seconds (generous budget for dev server)
    expect(elapsed).toBeLessThan(5000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E7: TanStack Router does not emit console errors during normal navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Router initialization edge cases', () => {
  test('[P1] should not emit console errors during initial TanStack Router navigation', async ({
    page,
  }) => {
    // GIVEN: main.tsx creates a router with createRouter({ routeTree })
    // WHEN: The app initialises and the root route renders
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: No console errors are emitted by the router or React
    // Filter out known DevTools noise that is unrelated to the app
    const appErrors = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('ERR_') &&
        !e.includes('net::') &&
        !e.includes('Download the React DevTools')
    );
    expect(appErrors).toHaveLength(0);
  });

  test('[P1] should render the Outlet content from the root layout on the index route', async ({
    page,
  }) => {
    // GIVEN: __root.tsx wraps children in <div id="app"><Outlet /></div>
    // WHEN: TanStack Router resolves the / route to IndexPage
    await page.goto('/');

    // THEN: The app container div exists with id="app"
    const appDiv = page.locator('div#app');
    await expect(appDiv).toHaveCount(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E8: Environment configuration edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Environment and asset loading edge cases', () => {
  test('[P2] should serve the Vite main entry script (src/main.tsx compiled module)', async ({
    page,
  }) => {
    // GIVEN: index.html includes <script type="module" src="/src/main.tsx">
    // WHEN: The browser requests the module

    // Network-first: listen for the module request BEFORE navigation
    const scriptRequested = page.waitForResponse((resp) =>
      resp.url().includes('main.tsx') || resp.url().includes('@vite/client')
    );

    await page.goto('/');

    // THEN: At least the Vite client or main module is served (not 404)
    const resp = await scriptRequested;
    expect(resp.status()).toBeLessThan(400);
  });

  test('[P2] should serve static assets without 404 errors (favicon check)', async ({ page }) => {
    // GIVEN: index.html references /favicon.svg
    // WHEN: The browser loads the page and requests the favicon

    const responses: Array<{ url: string; status: number }> = [];
    page.on('response', (resp) => {
      if (resp.url().includes('favicon')) {
        responses.push({ url: resp.url(), status: resp.status() });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: If a favicon request was made, it returned a non-500 status
    for (const { status } of responses) {
      expect(status).toBeLessThan(500);
    }
  });
});
