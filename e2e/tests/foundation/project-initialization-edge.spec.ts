/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Boundary Tests — Expanded Coverage
 * Complements the ATDD acceptance tests with additional edge cases,
 * error paths, and boundary conditions not covered in project-initialization.spec.ts.
 *
 * Coverage:
 *   - Frontend page metadata (title, viewport)
 *   - TanStack Router boundary: unknown routes do NOT crash the app
 *   - Frontend app-root content presence (heading rendered)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Frontend — document metadata
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend — document metadata and page shell', () => {
  test('[P1] should render the page with the correct document title', async ({ page }) => {
    // GIVEN: The Vite dev server is running and index.html has title "Siesa Agents"
    // WHEN: The root path is loaded
    await page.goto('/');

    // THEN: The document title matches the configured application title
    await expect(page).toHaveTitle('Siesa Agents');
  });

  test('[P1] should render at least one text node inside the app-root element', async ({ page }) => {
    // GIVEN: The TanStack Router root route renders an index page with heading "Siesa Agents"
    // WHEN: The app loads on the root path
    await page.goto('/');

    // THEN: The app-root wrapper contains at least one visible text descendant
    // This confirms the React tree is hydrated and the index route rendered
    const appRoot = page.locator('[data-testid="app-root"]');
    await expect(appRoot).toBeVisible();
    const text = await appRoot.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('[P2] should set a viewport meta tag in the HTML document', async ({ page }) => {
    // GIVEN: index.html includes <meta name="viewport" content="width=device-width, initial-scale=1.0">
    // WHEN: The page is loaded
    await page.goto('/');

    // THEN: The viewport meta tag is present in the DOM
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveCount(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend — TanStack Router boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend — TanStack Router boundary conditions', () => {
  test('[P2] should NOT crash when navigating to an unknown route', async ({ page }) => {
    // GIVEN: TanStack Router is configured with a root route and an index route
    // WHEN: The user navigates to a path that has no matching route definition
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/ruta-que-no-existe-12345');

    // THEN: The app does not throw a JavaScript runtime error (no white screen of death)
    // TanStack Router renders the root layout even for unmatched routes
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P2] should still render the app-root wrapper for an unknown route', async ({ page }) => {
    // GIVEN: TanStack Router root route always renders regardless of child match
    // WHEN: Navigating to a path with no matching route
    await page.goto('/pagina-inexistente-atdd');

    // THEN: The root layout wrapper (app-root) is still present in the DOM
    const appRoot = page.locator('[data-testid="app-root"]');
    await expect(appRoot).toBeVisible();
  });
});
