/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Test Automation Expansion (testarch-automate) — GREEN phase
 * Expands beyond the ATDD suite (e2e/tests/foundation/project-initialization.spec.ts)
 * with edge cases and boundary conditions not covered there: response headers,
 * document metadata, network-error boundaries, and reload stability.
 *
 * Acceptance Criteria covered: AC1, AC4 (frontend shell correctness)
 */

import { test, expect } from '@playwright/test';

test.describe('Frontend shell — response and document metadata edge cases', () => {
  test('[P1] should serve the root document with a text/html content type', async ({ page }) => {
    // GIVEN: the Vite dev server is running
    // WHEN: the root document is requested (network-first: listen before navigating)
    const rootResponsePromise = page.waitForResponse(
      (resp) => resp.url() === 'http://localhost:5173/' && resp.request().resourceType() === 'document'
    );

    await page.goto('/');
    const response = await rootResponsePromise;

    // THEN: the response declares an HTML content type
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('[P2] should render the project-configured document title, not the Vite template default', async ({
    page,
  }) => {
    // GIVEN: index.html sets <title>Siesa Agents CRM</title>
    // WHEN: the page loads
    await page.goto('/');

    // THEN: the title reflects the project, not the generic "Vite + React" scaffold default
    await expect(page).toHaveTitle('Siesa Agents CRM');
  });
});

test.describe('Frontend shell — network and reload boundary conditions', () => {
  test('[P1] should not produce any failed (4xx/5xx) network responses during initial load', async ({
    page,
  }) => {
    // GIVEN: a fresh browser context
    const failedResponses: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 400) {
        failedResponses.push(`${resp.status()} ${resp.url()}`);
      }
    });

    // WHEN: the app loads fully (network-idle = all initial requests settled)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: every asset/document/module request succeeded
    expect(failedResponses).toEqual([]);
  });

  test('[P2] should keep the app-root element mounted after a full page reload', async ({ page }) => {
    // GIVEN: the app has already rendered once
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    // WHEN: the page is fully reloaded (boundary: re-bootstrapping the React tree)
    await page.reload();

    // THEN: the shell mounts again without leaving a blank/broken page
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});
