/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — TanStack Router Edge Cases & Navigation Boundaries
 * Tests the router shell initialized in Story 1.1 (__root.tsx + index.tsx).
 * Covers unknown route handling, navigation stability, and provider integration.
 *
 * Coverage added:
 *   - TanStack Router: handles unknown routes without crashing
 *   - TanStack Router: preserves app-root wrapper on all routes
 *   - Navigation: browser back/forward history works correctly
 *   - RouterProvider: no unhandled promise rejections on navigation
 *   - Root layout: Outlet renders child routes correctly
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Unknown route handling
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TanStack Router — unknown route handling', () => {
  test('[P1] should NOT crash (no runtime error) when navigating to an unknown route', async ({
    page,
  }) => {
    // GIVEN: TanStack Router is initialized with only __root.tsx and index.tsx
    // WHEN: The user navigates to a route that does not exist
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/this-route-does-not-exist');
    await page.waitForLoadState('domcontentloaded');

    // THEN: No unhandled JavaScript errors are thrown
    expect(pageErrors).toHaveLength(0);
  });

  test('[P1] should keep the app-root wrapper visible on unknown routes', async ({ page }) => {
    // GIVEN: The root layout (__root.tsx) wraps ALL routes with [data-testid="app-root"]
    // WHEN: Navigation goes to a non-existent route
    await page.goto('/route-that-does-not-exist-123');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The root layout shell is still rendered (router didn't unmount it)
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('[P1] should NOT produce console errors when navigating to an unknown route', async ({
    page,
  }) => {
    // GIVEN: TanStack Router manages route matching
    // WHEN: An unknown route is visited
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/unknown/deeply/nested/route');
    await page.waitForLoadState('domcontentloaded');

    // THEN: Router handles the miss gracefully with no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P2] should not render blank white page on unknown route (some content must be visible)', async ({
    page,
  }) => {
    // GIVEN: Root layout always renders even without a matching child route
    // WHEN: User navigates to a completely unknown path
    await page.goto('/no-such-page');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The body is not completely empty (at minimum the layout shell renders)
    const bodyText = await page.locator('body').innerHTML();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Home route rendering
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TanStack Router — home route (index.tsx)', () => {
  test('[P0] should render the home page content at the / route', async ({ page }) => {
    // GIVEN: src/routes/index.tsx defines the HomePage component
    // WHEN: The user navigates to the root URL
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // THEN: The home page heading is visible
    await expect(page.locator('h1')).toBeVisible();
  });

  test('[P1] home page h1 should contain "Siesa Agents" (brand title)', async ({ page }) => {
    // GIVEN: index.tsx renders <h1>Siesa Agents</h1>
    // WHEN: The root route is visited
    await page.goto('/');

    // THEN: The h1 heading contains the app name
    await expect(page.locator('h1')).toContainText('Siesa Agents');
  });

  test('[P1] Outlet in __root.tsx must render the index route child component', async ({ page }) => {
    // GIVEN: __root.tsx uses <Outlet /> to render matched child routes
    // WHEN: The / route is navigated
    await page.goto('/');

    // THEN: The Outlet rendered the index route (h1 appears inside app-root)
    const h1InsideRoot = await page.locator('[data-testid="app-root"] h1').count();
    expect(h1InsideRoot).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser history navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TanStack Router — browser history navigation', () => {
  test('[P1] browser back button should work after navigating away from home', async ({ page }) => {
    // GIVEN: The user starts on the home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // WHEN: User navigates to a different URL then goes back
    await page.goto('/some-other-route');
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // THEN: User is back on the home page with the home content visible
    await expect(page.locator('h1')).toContainText('Siesa Agents');
  });

  test('[P1] should not produce runtime errors during back/forward navigation', async ({
    page,
  }) => {
    // GIVEN: SPA routing with TanStack Router
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.goto('/unknown-route-for-history');
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // THEN: Navigation history traversal does not trigger JS errors
    expect(pageErrors).toHaveLength(0);
  });

  test('[P2] app-root should remain mounted through back/forward navigation cycles', async ({
    page,
  }) => {
    // GIVEN: Root layout wraps all routes
    await page.goto('/');

    // WHEN: Back/forward navigation happens
    await page.goto('/another-route');
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // THEN: Root layout shell is still present
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Provider integration (RouterProvider + QueryProvider)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Provider integration — RouterProvider + QueryProvider', () => {
  test('[P1] should mount without "No QueryClient set" error on initial render', async ({
    page,
  }) => {
    // GIVEN: main.tsx wraps RouterProvider inside QueryProvider
    //        Order: StrictMode > QueryProvider > RouterProvider
    // WHEN: The app first renders
    const queryErrors: string[] = [];
    page.on('pageerror', (err) => {
      if (err.message.toLowerCase().includes('queryclient')) {
        queryErrors.push(err.message);
      }
    });

    await page.goto('/');

    // THEN: QueryProvider context is available to all routed components
    expect(queryErrors).toHaveLength(0);
  });

  test('[P1] should mount without "No router found" error from TanStack Router', async ({
    page,
  }) => {
    // GIVEN: RouterProvider receives the router created from routeTree.gen.ts
    // WHEN: The app loads
    const routerErrors: string[] = [];
    page.on('pageerror', (err) => {
      if (err.message.toLowerCase().includes('router')) {
        routerErrors.push(err.message);
      }
    });

    await page.goto('/');

    // THEN: No router context errors
    expect(routerErrors).toHaveLength(0);
  });

  test('[P1] should render in React StrictMode without double-mount side effects', async ({
    page,
  }) => {
    // GIVEN: main.tsx wraps everything in <StrictMode> which double-invokes renders in dev
    // WHEN: The page loads (StrictMode causes effects to fire twice in dev)
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // THEN: Double-invocation from StrictMode does not cause crashes
    // (Indicates all effects are idempotent and cleaned up correctly)
    expect(pageErrors).toHaveLength(0);

    // Verify the app is still in a valid state after StrictMode double-mount
    await expect(page.locator('[data-testid="app-root"]')).toHaveCount(1);
  });

  test('[P2] should not have duplicate ReactDOM root warnings in console', async ({ page }) => {
    // GIVEN: createRoot() is called once in main.tsx on document.getElementById('root')
    // WHEN: The app loads
    const reactRootWarnings: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        msg.type() === 'warning' &&
        (text.includes('createRoot') || text.includes('ReactDOM.render'))
      ) {
        reactRootWarnings.push(text);
      }
    });

    await page.goto('/');

    // THEN: No deprecation warnings about ReactDOM.render (old API) or duplicate roots
    expect(reactRootWarnings).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// routeTree.gen.ts auto-generation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('routeTree.gen.ts — TanStack Router plugin auto-generation', () => {
  test('[P1] should have the routeTree wired correctly (/ route navigable with no errors)', async ({
    page,
  }) => {
    // GIVEN: @tanstack/router-plugin/vite auto-generates routeTree.gen.ts from src/routes/
    //        and main.tsx imports { routeTree } from './routeTree.gen'
    // WHEN: The app loads (broken routeTree would crash at createRouter())
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Network-first: monitor for module loading errors BEFORE navigation
    await page.goto('/');

    // THEN: No errors — routeTree.gen.ts was generated and imported correctly
    expect(pageErrors).toHaveLength(0);
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});
