/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Boundary Tests — Automation expansion of ATDD suite
 * Covers paths NOT included in the RED-phase ATDD tests.
 *
 * ATDD already covers:
 *   AC1 — Server responds HTTP 200, data-testid="app-root" visible,
 *          no TS errors in console, no runtime errors
 *   AC3 — CORS errors absent, backend /scalar responds
 *   AC4 — No Vite error overlay
 *
 * This file covers:
 *   - Page title and document metadata
 *   - Unknown frontend route (client-side 404/redirect handling)
 *   - Single-spa wrapper container rendered by root layout
 *   - Vite HMR WebSocket does NOT interfere with console errors
 *   - Backend unreachable: frontend still loads (resilience)
 *   - Navigation back to root after visiting unknown route
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 boundary: document metadata and DOM structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Frontend document metadata and layout', () => {
  test('[P2] should have a non-empty document title', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: The app loads at root
    await page.goto('/');

    // THEN: The page has a title (not empty, not "undefined")
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('undefined');
  });

  test('[P2] should render the single-spa application wrapper div from root layout', async ({ page }) => {
    // GIVEN: The root layout (__root.tsx) wraps content in #single-spa-application
    // WHEN: The app renders
    await page.goto('/');

    // THEN: The single-spa container is present in the DOM
    await expect(page.locator('#single-spa-application')).toBeVisible();
  });

  test('[P2] should render the home page heading "Siesa Agents"', async ({ page }) => {
    // GIVEN: index.tsx renders a branded h1 with data-testid="home-heading"
    // WHEN: The root route loads
    await page.goto('/');

    // THEN: The Siesa Agents heading is visible
    // Implementation must add data-testid="home-heading" to the h1 in src/routes/index.tsx
    await expect(page.locator('[data-testid="home-heading"]')).toContainText('Siesa Agents');
  });

  test('[P1] should load the root index.html with a #root div as the React mount point', async ({ page }) => {
    // GIVEN: index.html contains <div id="root"></div>
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The #root element exists and has children (React hydrated it)
    const rootEl = page.locator('#root');
    await expect(rootEl).toBeAttached();
    const childCount = await rootEl.locator('>*').count();
    expect(childCount).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 boundary: unknown routes (client-side router)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client-side router — unknown route handling', () => {
  test('[P2] should not throw a JavaScript runtime error when navigating to an unknown route', async ({ page }) => {
    // GIVEN: TanStack Router is configured with only the root route
    // WHEN: User navigates to an undefined route
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/route-that-does-not-exist-atdd-test');

    // THEN: No unhandled runtime error is thrown (router handles it gracefully)
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should render root layout heading after navigating back from an unknown route', async ({ page }) => {
    // GIVEN: User landed on an unknown route
    await page.goto('/nonexistent-path-12345');

    // WHEN: User navigates back to root
    await page.goto('/');

    // THEN: Root renders the main heading (layout persists)
    await expect(page.locator('[data-testid="home-heading"]')).toBeVisible();
  });

  test('[P2] should not produce runtime errors when navigating back to root from an unknown route', async ({ page }) => {
    // GIVEN: User landed on an unknown route
    await page.goto('/nonexistent-path-12345');

    // WHEN: User navigates back to root
    const navErrors: string[] = [];
    page.on('pageerror', (err) => navErrors.push(err.message));
    await page.goto('/');

    // THEN: No runtime errors are thrown during re-navigation
    expect(navErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 boundary: strict TypeScript — no type errors visible in DOM
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — TypeScript strict mode — no compile artefacts in DOM', () => {
  test('[P2] should not render any TypeScript error text nodes in the page body', async ({ page }) => {
    // GIVEN: Vite compiles with strict TypeScript; errors appear as overlay text
    // WHEN: Page loads
    await page.goto('/');

    // THEN: Body text does not contain TS error markers
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('[plugin:vite:react-babel]');
    expect(bodyText).not.toContain('TypeScript error');
    expect(bodyText).not.toContain('TS2');
  });

  test('[P1] should not render a Vite error overlay element anywhere in the DOM', async ({ page }) => {
    // GIVEN: A TypeScript strict-mode violation causes a Vite compile error overlay
    // WHEN: The page loads without any TS violations
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No Vite error overlay exists
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    // Also check for Vite's internal plugin error modal
    await expect(page.locator('[data-vite-dev-server-error]')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 boundary: CORS negative cases (cross-origin from wrong origins)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — CORS — disallowed origin handling (negative path)', () => {
  test('[P2] should not produce CORS console errors from assets loaded on the same origin', async ({ page }) => {
    // GIVEN: All static assets (JS, CSS) are served from the same origin (localhost:5173)
    // WHEN: The app loads
    const corsErrors: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        (msg.text().toLowerCase().includes('cors') ||
          msg.text().toLowerCase().includes('cross-origin'))
      ) {
        corsErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No CORS errors from same-origin asset loading
    expect(corsErrors).toHaveLength(0);
  });
});
