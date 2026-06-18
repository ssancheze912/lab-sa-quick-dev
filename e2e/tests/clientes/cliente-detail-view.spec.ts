/**
 * E2E Test — Client Detail View (Story 2.2)
 * RED phase: test fails until ClienteDetailView and /clientes/:clienteId route are implemented.
 *
 * Acceptance Criteria covered:
 *   AC-1: clicking a client item in the left panel shows full detail in the right panel
 *         AND URL updates to /clientes/:clienteId (FR30 deep linking)
 *
 * Test matrix (test-design-epic-2.md — Story 2.2):
 *   E-01 — After click, URL updates to /clientes/{uuid}; assert client data visible (P1, R-207)
 *
 * Network-first strategy: ALL route interceptions are registered BEFORE page.goto()
 * to prevent race conditions (network-first.md pattern).
 */

import { test, expect } from '@playwright/test';
import { ClientesPage } from '../../pages/clientes.page';
import { buildCliente } from '../../helpers/data.helper';

const KNOWN_UUID = '00000000-0000-0000-0000-000000000099';

test.describe('Story 2.2 — Client Detail View', () => {
  let clientesPage: ClientesPage;

  test.beforeEach(async ({ page }) => {
    clientesPage = new ClientesPage(page);
  });

  // ---------------------------------------------------------------------------
  // E-01 — Click client item → URL updates + detail panel shows data (P1, R-207)
  // ---------------------------------------------------------------------------
  test(
    '[2.2-E2E-001][P1] GIVEN the client list is displayed '
    + 'WHEN the user clicks a client item in the left panel '
    + 'THEN the right panel shows the complete client details '
    + 'AND the URL updates to /clientes/:clienteId',
    async ({ page }) => {
      // GIVEN: mock list endpoint BEFORE navigation (network-first)
      const clienteData = buildCliente({ nombre: 'Detail View Corp', ciudad: 'Medellín' });
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

      // GIVEN: mock individual detail endpoint BEFORE navigation (network-first)
      await page.route(`**/api/v1/clientes/${KNOWN_UUID}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clientePayload),
        }),
      );

      // WHEN: user navigates to /clientes
      await clientesPage.goto();

      // WHEN: user clicks on the first client item in the list
      await expect(clientesPage.clienteItems.first()).toBeVisible({ timeout: 5000 });
      await clientesPage.clienteItems.first().click();

      // THEN: URL updates to /clientes/:clienteId (FR30 deep link)
      await expect(page).toHaveURL(`/clientes/${KNOWN_UUID}`, { timeout: 5000 });

      // THEN: right panel (data-testid="cliente-detail-panel") is visible
      await expect(clientesPage.detailPanel).toBeVisible({ timeout: 5000 });

      // THEN: all four client fields are displayed in the right panel
      await expect(clientesPage.detailPanel).toContainText('Detail View Corp');
      await expect(clientesPage.detailPanel).toContainText(clienteData.nit);
      await expect(clientesPage.detailPanel).toContainText(clienteData.telefono);
      await expect(clientesPage.detailPanel).toContainText('Medellín');
    },
  );
});
