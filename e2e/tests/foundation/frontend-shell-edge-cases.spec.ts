/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * BMad-Integrated Automate Expansion — Edge Cases & Negative Paths
 * Extends ATDD coverage in `project-initialization.spec.ts` with edge cases
 * that the acceptance-level tests do NOT already cover.
 *
 * Focus areas (not duplicated from ATDD):
 *   - HTML shell metadata (lang, title, favicon)
 *   - Homepage renders expected content
 *   - No console warnings on load
 *   - Multiple navigations do not leak errors
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Frontend HTML shell metadata (i18n + document setup)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend HTML shell — metadata and localization', () => {
  test('[P1] should serve HTML with lang="es-CO" for Colombian Spanish locale', async ({ page }) => {
    // GIVEN: The frontend is initialized for the Colombian Spanish market
    // WHEN: The browser navigates to the root URL
    await page.goto('/');

    // THEN: The <html> element declares the es-CO locale for accessibility and i18n
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('es-CO');
  });

  test('[P2] should serve HTML with a non-empty document title containing "Siesa"', async ({ page }) => {
    // GIVEN: Company standard requires "Siesa" branding in the browser tab
    // WHEN: The page loads
    await page.goto('/');

    // THEN: The document title identifies the Siesa Agents CRM product
    await expect(page).toHaveTitle(/Siesa/i);
  });

  test('[P2] should reference a favicon link in the document head', async ({ page }) => {
    // GIVEN: Vite scaffolds a favicon.svg by default and the project keeps it
    // WHEN: The page loads
    await page.goto('/');

    // THEN: A favicon <link> element is present in <head>
    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon).toHaveCount(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Homepage route renders expected content (React + TanStack Router wired)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Homepage route — TanStack Router + React rendering', () => {
  test('[P1] should render an <h1> heading on the home route after redirect to /clientes', async ({ page }) => {
    // GIVEN: Story 1.2 converts `/` into a beforeLoad redirect to `/clientes`
    // WHEN: The user visits the root URL
    await page.goto('/');
    await page.waitForURL('**/clientes');

    // THEN: The Clientes view heading is visible after the redirect
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/Clientes/i);
  });

  test('[P2] should keep the React mount point stable across a page reload', async ({ page }) => {
    // GIVEN: The React app is mounted at #root via src/main.tsx
    // WHEN: The user reloads the page
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
    await page.reload();

    // THEN: The mount point re-attaches without errors
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P2 — Console cleanliness (no warnings, no unhandled promise rejections)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Console cleanliness on initial load', () => {
  test('[P2] should not emit console warnings on first paint', async ({ page }) => {
    // GIVEN: The app is in a clean state (no legacy code, no dev warnings expected)
    // WHEN: The page loads
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No console warnings are surfaced by React, Vite or TanStack libs
    // Filter out benign HMR / DevTools noise that Vite emits by design.
    const filtered = warnings.filter(
      (w) => !/vite|hmr|devtools|download the react devtools/i.test(w),
    );
    expect(filtered).toEqual([]);
  });

  test('[P2] should not emit unhandled promise rejections on load', async ({ page }) => {
    // GIVEN: All async code in providers/QueryProvider and apiClient is well-formed
    // WHEN: The page loads
    const rejections: string[] = [];
    page.on('pageerror', (err) => {
      if (/unhandled|promise/i.test(err.message)) {
        rejections.push(err.message);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No unhandled promise rejections leak to the runtime
    expect(rejections).toEqual([]);
  });
});
