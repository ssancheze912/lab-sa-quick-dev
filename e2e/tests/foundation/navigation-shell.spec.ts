/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC3 — Deep-linking: typing /clientes or /contactos directly renders the correct
 *         view with no redirection to a home/root screen (FR30)
 *   AC4 — Navigating to "/" redirects to "/clientes"
 *
 * Test-design mapping: TC-E1-P1-02, TC-E1-P1-03 (deep-link, P1), index redirect (AC4).
 *
 * Required data-testid attributes (documented for DEV team, see ATDD checklist):
 *   - `clientes-view`  — root element of the Clientes placeholder view
 *   - `contactos-view` — root element of the Contactos placeholder view
 */

import { test, expect } from '@playwright/test';

test.describe('AC3 — Deep linking to /clientes renders directly, no redirect to home', () => {
  test('[P1] should render the Clientes view when navigating directly to /clientes', async ({ page }) => {
    // GIVEN: no prior navigation has occurred in this browser context

    // Network-first: register the response listener BEFORE navigating
    const clientesResponse = page.waitForResponse(
      (resp) => resp.url() === 'http://localhost:5173/clientes' && resp.status() === 200
    );

    // WHEN: the user types /clientes directly in the URL bar
    await page.goto('/clientes');
    await clientesResponse;

    // THEN: the correct view renders directly, with no redirect to root
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.getByTestId('clientes-view')).toBeVisible();
  });
});

test.describe('AC3 — Deep linking to /contactos renders directly, no redirect to home', () => {
  test('[P1] should render the Contactos view when navigating directly to /contactos', async ({ page }) => {
    // GIVEN: no prior navigation has occurred in this browser context

    // Network-first: register the response listener BEFORE navigating
    const contactosResponse = page.waitForResponse(
      (resp) => resp.url() === 'http://localhost:5173/contactos' && resp.status() === 200
    );

    // WHEN: the user types /contactos directly in the URL bar
    await page.goto('/contactos');
    await contactosResponse;

    // THEN: the correct view renders directly, with no redirect to root
    await expect(page).toHaveURL(/\/contactos$/);
    await expect(page.getByTestId('contactos-view')).toBeVisible();
  });
});

test.describe('AC4 — Root route redirects to /clientes', () => {
  test('[P1] should redirect from / to /clientes on load', async ({ page }) => {
    // GIVEN: the user opens the application at the root URL

    // Network-first: register the response listener BEFORE navigating
    const rootResponse = page.waitForResponse(
      (resp) => resp.url() === 'http://localhost:5173/' && resp.status() === 200
    );

    // WHEN: the app loads at "/"
    await page.goto('/');
    await rootResponse;

    // THEN: the app redirects to /clientes with no full page reload required by the user
    await page.waitForURL('**/clientes');
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.getByTestId('clientes-view')).toBeVisible();
  });
});
