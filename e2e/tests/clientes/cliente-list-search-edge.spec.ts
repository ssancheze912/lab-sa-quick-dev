/**
 * E2E Edge Case Tests — Client List & Search (Story 2.1 — Automate Expansion)
 *
 * Expands coverage beyond the ATDD E2E tests with:
 *   - Search clear restores full list
 *   - Retry recovers from error (E2E flow)
 *   - Search input accessible by ARIA label
 *
 * All tests use network-first route interception to prevent race conditions.
 */

import { test, expect } from '@playwright/test';
import { ClientesPage } from '../../pages/clientes.page';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.1 — Client List Edge Cases', () => {
  let clientesPage: ClientesPage;

  test.beforeEach(async ({ page }) => {
    clientesPage = new ClientesPage(page);
  });

  // -------------------------------------------------------------------------
  // Search clear restores full list
  // -------------------------------------------------------------------------
  test(
    '[P1] GIVEN the list is filtered by a search term '
    + 'WHEN the user clears the search field '
    + 'THEN all original clients are visible again',
    async ({ page }) => {
      // GIVEN: 3 clients returned from API (network-first)
      const dataA = buildCliente({ nombre: 'Cleartest Alpha SA' });
      const dataB = buildCliente({ nombre: 'Cleartest Beta Ltda' });
      const dataC = buildCliente({ nombre: 'Cleartest Gamma Co' });

      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '00000000-0000-0000-0000-000000000031', ...dataA, createdAt: new Date().toISOString() },
            { id: '00000000-0000-0000-0000-000000000032', ...dataB, createdAt: new Date().toISOString() },
            { id: '00000000-0000-0000-0000-000000000033', ...dataC, createdAt: new Date().toISOString() },
          ]),
        }),
      );

      await clientesPage.goto();
      await expect(clientesPage.clienteItems.first()).toBeVisible({ timeout: 5000 });

      // WHEN: filter to one result
      await clientesPage.buscar('Alpha');
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'Cleartest Alpha SA' }),
      ).toBeVisible();
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'Cleartest Beta Ltda' }),
      ).not.toBeVisible();

      // WHEN: user clears the search field
      await clientesPage.limpiarBusqueda();

      // THEN: all 3 clients are visible again
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'Cleartest Alpha SA' }),
      ).toBeVisible();
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'Cleartest Beta Ltda' }),
      ).toBeVisible();
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'Cleartest Gamma Co' }),
      ).toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // Search input is accessible by ARIA label
  // -------------------------------------------------------------------------
  test(
    '[P1] GIVEN the /clientes page is loaded '
    + 'WHEN the DOM is inspected '
    + 'THEN the search input is accessible via aria-label "Buscar clientes"',
    async ({ page }) => {
      // GIVEN: mock returns empty list so we're not waiting on data
      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        }),
      );

      await clientesPage.goto();

      // THEN: search input is reachable by ARIA role + label (WCAG 2.1 AA)
      const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
      await expect(searchInput).toBeVisible({ timeout: 5000 });
    },
  );

  // -------------------------------------------------------------------------
  // Retry from error restores list
  // -------------------------------------------------------------------------
  test(
    '[P1] GIVEN the API initially fails '
    + 'WHEN the user clicks "Reintentar" and the API succeeds '
    + 'THEN the client list is shown',
    async ({ page }) => {
      let callCount = 0;
      const data = buildCliente({ nombre: 'Recovery Test Corp' });

      // GIVEN: first call 500, subsequent call 200
      await page.route('**/api/v1/clientes', (route) => {
        callCount += 1;
        if (callCount === 1) {
          return route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '00000000-0000-0000-0000-000000000041', ...data, createdAt: new Date().toISOString() },
          ]),
        });
      });

      await clientesPage.goto();

      // WHEN: error panel appears
      const retryButton = page.getByRole('button', { name: /reintentar/i });
      await expect(retryButton).toBeVisible({ timeout: 5000 });

      // WHEN: user clicks retry
      await retryButton.click();

      // THEN: the list panel appears with the client
      await expect(clientesPage.listPanel).toBeVisible({ timeout: 5000 });
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'Recovery Test Corp' }),
      ).toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // Search by NIT/RUC E2E
  // -------------------------------------------------------------------------
  test(
    '[P2] GIVEN the list is loaded with clients having distinct NITs '
    + 'WHEN the user searches by a specific NIT '
    + 'THEN only the matching client remains visible',
    async ({ page }) => {
      const dataA = buildCliente({ nombre: 'NIT Alpha Co', nit: '811111111' });
      const dataB = buildCliente({ nombre: 'NIT Beta Inc', nit: '822222222' });

      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '00000000-0000-0000-0000-000000000051', ...dataA, createdAt: new Date().toISOString() },
            { id: '00000000-0000-0000-0000-000000000052', ...dataB, createdAt: new Date().toISOString() },
          ]),
        }),
      );

      await clientesPage.goto();
      await expect(clientesPage.clienteItems.first()).toBeVisible({ timeout: 5000 });

      // WHEN: search by NIT of dataA
      await clientesPage.buscar('811111111');

      // THEN: only dataA is visible
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'NIT Alpha Co' }),
      ).toBeVisible();
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'NIT Beta Inc' }),
      ).not.toBeVisible();
    },
  );
});
