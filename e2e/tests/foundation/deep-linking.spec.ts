/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Task 6)
 * These tests are intentionally FAILING until the navigation shell + routes
 * (clientes / contactos / NotFound) are implemented.
 *
 * Acceptance Criteria covered:
 *   AC #3 — Deep linking to /clientes and /contactos renders inside the shell
 *           with no redirect to home (FR30 / AC-E1.3).
 *   AC #4 — Unknown routes render a 404 view inside the persistent shell.
 *
 * Test cases owned: TC-E1-P1-02, TC-E1-P1-03, TC-E1-P1-04 (deep-link slice).
 *
 * Sandbox infra note: chromium-only project (Firefox unavailable per Story 1.1).
 *   Run with: `pnpm exec playwright test --project=chromium e2e/tests/foundation`
 */

import { test, expect } from '@playwright/test';

test.describe('AC #3 — Deep linking to feature routes (FR30, AC-E1.3)', () => {
  test('TC-E1-P1-02 — directly opening /clientes renders the Clientes view without redirect', async ({
    page,
  }) => {
    // GIVEN: the user enters http://localhost:5173/clientes directly in the URL bar
    //        (network-first: register the document response listener BEFORE navigating)
    const clientesDocResponse = page.waitForResponse(
      (resp) => resp.url().includes('/clientes') && resp.request().resourceType() === 'document',
    );

    // WHEN: the page loads
    await page.goto('/clientes');
    await clientesDocResponse;

    // THEN: the Clientes view renders inside the persistent shell
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();

    // AND: the URL stayed at /clientes (no redirect to / or any home screen)
    await expect(page).toHaveURL(/\/clientes$/);
  });

  test('TC-E1-P1-03 — directly opening /contactos renders the Contactos view without redirect', async ({
    page,
  }) => {
    // GIVEN: the user enters http://localhost:5173/contactos directly in the URL bar
    const contactosDocResponse = page.waitForResponse(
      (resp) => resp.url().includes('/contactos') && resp.request().resourceType() === 'document',
    );

    // WHEN: the page loads
    await page.goto('/contactos');
    await contactosDocResponse;

    // THEN: the Contactos view renders inside the persistent shell
    await expect(page.locator('[data-testid="contactos-view"]')).toBeVisible();

    // AND: the URL stayed at /contactos
    await expect(page).toHaveURL(/\/contactos$/);
  });

  test('deep link to /clientes keeps the navigation shell visible (AC #3, #1)', async ({
    page,
  }) => {
    // GIVEN: a desktop viewport so the desktop NavigationRail wrapper is active
    await page.setViewportSize({ width: 1280, height: 800 });

    // WHEN: the user deep-links to /clientes
    await page.goto('/clientes');

    // THEN: the persistent shell desktop wrapper is rendered along with the view
    await expect(page.locator('[data-testid="app-shell-desktop"]')).toBeVisible();
    await expect(page.locator('[data-testid="clientes-view"]')).toBeVisible();
  });
});

test.describe('AC #4 — Unknown routes render 404 inside the shell', () => {
  test('TC-E1-P1-04 — opening /ruta-inexistente renders the NotFound view', async ({ page }) => {
    // GIVEN: the user navigates to an unknown route
    // WHEN: the page loads
    await page.goto('/ruta-inexistente');

    // THEN: the 404 view is rendered gracefully
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });

  test('404 view exposes Spanish copy and a CTA back to /clientes (AC #4, #7)', async ({
    page,
  }) => {
    // GIVEN: the user navigates to an unknown route
    await page.goto('/otra-ruta-que-no-existe');

    // WHEN: the NotFound view renders
    const notFound = page.locator('[data-testid="not-found-view"]');

    // THEN: the Spanish heading is shown
    await expect(notFound.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();

    // AND: the CTA link points to /clientes
    const cta = notFound.getByRole('link', { name: 'Ir a Clientes' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/clientes');
  });

  test('NotFound view keeps the navigation shell visible (AC #4)', async ({ page }) => {
    // GIVEN: a desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // WHEN: the user deep-links to an unknown route
    await page.goto('/no-existe-tampoco');

    // THEN: the shell + NotFound view both render (user still sees nav)
    await expect(page.locator('[data-testid="app-shell-desktop"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-view"]')).toBeVisible();
  });
});
