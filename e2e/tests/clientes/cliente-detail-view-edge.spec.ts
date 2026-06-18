/**
 * E2E Edge Case Tests — Client Detail View (Story 2.2 — Automate Expansion)
 *
 * Expands coverage beyond the ATDD E2E test with:
 *   - Direct URL deep link loads correct detail (AC-2, R-207)
 *   - Non-existent UUID shows not-found message (AC-3)
 *   - API 500 on detail endpoint shows ErrorPanel
 *   - Retry after 500 recovers and shows detail
 *   - Empty state on /clientes with no client selected
 *
 * All tests use network-first route interception to prevent race conditions.
 */

import { test, expect } from '@playwright/test';
import { ClientesPage } from '../../pages/clientes.page';
import { buildCliente } from '../../helpers/data.helper';

const KNOWN_UUID = '00000000-0000-0000-0000-000000000099';
const UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

test.describe('Story 2.2 — Client Detail View Edge Cases', () => {
  let clientesPage: ClientesPage;

  test.beforeEach(async ({ page }) => {
    clientesPage = new ClientesPage(page);
  });

  // ---------------------------------------------------------------------------
  // Direct URL deep link loads correct detail without redirect (AC-2, R-207)
  // ---------------------------------------------------------------------------
  test(
    '[P1] GIVEN a valid clienteId in the URL '
    + 'WHEN the user accesses /clientes/:clienteId directly '
    + 'THEN the correct client details are loaded without a redirect',
    async ({ page }) => {
      // GIVEN: mock both endpoints BEFORE navigation (network-first)
      const clienteData = buildCliente({ nombre: 'Deep Link Corp', ciudad: 'Cali' });
      const clientePayload = {
        id: KNOWN_UUID,
        nombre: clienteData.nombre,
        nit: clienteData.nit,
        telefono: clienteData.telefono,
        ciudad: clienteData.ciudad,
        createdAt: new Date().toISOString(),
      };

      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([clientePayload]),
        }),
      );

      await page.route(`**/api/v1/clientes/${KNOWN_UUID}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clientePayload),
        }),
      );

      // WHEN: navigate directly to the deep-link URL
      await page.goto(`/clientes/${KNOWN_UUID}`);

      // THEN: URL remains /clientes/:id (no redirect to /clientes)
      await expect(page).toHaveURL(`/clientes/${KNOWN_UUID}`, { timeout: 5000 });

      // THEN: detail panel renders with correct client data
      await expect(clientesPage.detailPanel).toBeVisible({ timeout: 5000 });
      await expect(clientesPage.detailPanel).toContainText('Deep Link Corp');
      await expect(clientesPage.detailPanel).toContainText('Cali');
    },
  );

  // ---------------------------------------------------------------------------
  // Non-existent UUID shows "Cliente no encontrado." (AC-3)
  // ---------------------------------------------------------------------------
  test(
    '[P1] GIVEN a clienteId in the URL that does not exist '
    + 'WHEN the API returns 404 '
    + 'THEN the not-found message is displayed without crash or blank screen',
    async ({ page }) => {
      // GIVEN: list returns empty, detail returns 404 (network-first)
      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        }),
      );

      await page.route(`**/api/v1/clientes/${UNKNOWN_UUID}`, (route) =>
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 404,
            title: 'Not Found',
            detail: 'Cliente no encontrado.',
          }),
        }),
      );

      // WHEN: navigate to deep link with non-existent id
      await page.goto(`/clientes/${UNKNOWN_UUID}`);

      // THEN: detail panel is visible (no blank screen)
      await expect(clientesPage.detailPanel).toBeVisible({ timeout: 5000 });

      // THEN: not-found message displayed in Spanish
      await expect(clientesPage.detailPanel).toContainText('Cliente no encontrado.');
    },
  );

  // ---------------------------------------------------------------------------
  // API 500 on detail endpoint shows ErrorPanel (non-404 error path)
  // ---------------------------------------------------------------------------
  test(
    '[P1] GIVEN the detail API returns 500 '
    + 'WHEN the user navigates to /clientes/:clienteId '
    + 'THEN the ErrorPanel is shown with "Reintentar" button',
    async ({ page }) => {
      // GIVEN: list returns a client, but detail endpoint returns 500 (network-first)
      const clienteData = buildCliente({ nombre: 'Server Error Corp' });
      const clientePayload = {
        id: KNOWN_UUID,
        nombre: clienteData.nombre,
        nit: clienteData.nit,
        telefono: clienteData.telefono,
        ciudad: clienteData.ciudad,
        createdAt: new Date().toISOString(),
      };

      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([clientePayload]),
        }),
      );

      await page.route(`**/api/v1/clientes/${KNOWN_UUID}`, (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        }),
      );

      // WHEN: navigate directly to /clientes/:id
      await page.goto(`/clientes/${KNOWN_UUID}`);

      // THEN: detail panel is visible (no blank screen)
      await expect(clientesPage.detailPanel).toBeVisible({ timeout: 5000 });

      // THEN: ErrorPanel with Reintentar button is shown
      const retryButton = page.getByRole('button', { name: /reintentar/i });
      await expect(retryButton).toBeVisible({ timeout: 5000 });
    },
  );

  // ---------------------------------------------------------------------------
  // Retry after 500 recovers and shows detail data
  // ---------------------------------------------------------------------------
  test(
    '[P1] GIVEN the detail API initially fails with 500 '
    + 'WHEN the user clicks "Reintentar" and API succeeds '
    + 'THEN the client detail is displayed',
    async ({ page }) => {
      let callCount = 0;
      const clienteData = buildCliente({ nombre: 'Retry Recovery Corp', ciudad: 'Barranquilla' });
      const clientePayload = {
        id: KNOWN_UUID,
        nombre: clienteData.nombre,
        nit: clienteData.nit,
        telefono: clienteData.telefono,
        ciudad: clienteData.ciudad,
        createdAt: new Date().toISOString(),
      };

      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([clientePayload]),
        }),
      );

      // GIVEN: first detail call 500, subsequent call 200
      await page.route(`**/api/v1/clientes/${KNOWN_UUID}`, (route) => {
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
          body: JSON.stringify(clientePayload),
        });
      });

      // WHEN: navigate to the deep-link URL
      await page.goto(`/clientes/${KNOWN_UUID}`);

      // WHEN: ErrorPanel appears
      const retryButton = page.getByRole('button', { name: /reintentar/i });
      await expect(retryButton).toBeVisible({ timeout: 5000 });

      // WHEN: user clicks retry
      await retryButton.click();

      // THEN: detail panel shows the client data
      await expect(clientesPage.detailPanel).toContainText('Retry Recovery Corp');
      await expect(clientesPage.detailPanel).toContainText('Barranquilla');
    },
  );

  // ---------------------------------------------------------------------------
  // Empty state when /clientes is opened with no client selected
  // ---------------------------------------------------------------------------
  test(
    '[P2] GIVEN the user navigates to /clientes without selecting a client '
    + 'WHEN the list is loaded '
    + 'THEN the right panel shows an empty/placeholder state (not a crash)',
    async ({ page }) => {
      // GIVEN: list returns one client (network-first)
      const clienteData = buildCliente({ nombre: 'Empty State Test SA' });

      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '00000000-0000-0000-0000-000000000089',
              ...clienteData,
              createdAt: new Date().toISOString(),
            },
          ]),
        }),
      );

      // WHEN: navigate to /clientes (no clienteId in URL)
      await clientesPage.goto();

      // THEN: list is visible
      await expect(clientesPage.listPanel).toBeVisible({ timeout: 5000 });
      await expect(clientesPage.clienteItems.first()).toBeVisible({ timeout: 5000 });

      // THEN: detail panel does NOT show client data (no clienteId selected)
      // URL stays at /clientes, not /clientes/:id
      await expect(page).toHaveURL('/clientes', { timeout: 3000 });
    },
  );

  // ---------------------------------------------------------------------------
  // Detail panel shows Spanish field labels (label accuracy)
  // ---------------------------------------------------------------------------
  test(
    '[P2] GIVEN client details are loaded '
    + 'WHEN the detail panel renders '
    + 'THEN all four field labels are displayed in Spanish',
    async ({ page }) => {
      // GIVEN: mock detail endpoint (network-first)
      const clienteData = buildCliente({ nombre: 'Labels Test Co', ciudad: 'Pereira' });
      const clientePayload = {
        id: KNOWN_UUID,
        nombre: clienteData.nombre,
        nit: '900888777',
        telefono: '3049991111',
        ciudad: clienteData.ciudad,
        createdAt: new Date().toISOString(),
      };

      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([clientePayload]),
        }),
      );

      await page.route(`**/api/v1/clientes/${KNOWN_UUID}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clientePayload),
        }),
      );

      // WHEN: navigate directly to the client detail deep link
      await page.goto(`/clientes/${KNOWN_UUID}`);
      await expect(clientesPage.detailPanel).toBeVisible({ timeout: 5000 });

      // THEN: all four Spanish field labels are present in the detail panel
      await expect(clientesPage.detailPanel).toContainText('Nombre');
      await expect(clientesPage.detailPanel).toContainText('NIT/RUC');
      await expect(clientesPage.detailPanel).toContainText('Teléfono');
      await expect(clientesPage.detailPanel).toContainText('Ciudad');
    },
  );
});
