import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E tests: Story 2.2 — Client Detail View
 *
 * Covers TC-E2-P1-06 (deep link loads the correct client, real seeded data,
 * full stack) and TC-E2-P1-07 (non-existent clienteId shows a graceful
 * not-found UI with zero console errors) — the two P1 test-design scenarios
 * mapped to Story 2.2 in test-design-epic-2.md (risk R7).
 *
 * RED PHASE: routes/_app/clientes.$clienteId.tsx, ClienteDetailView and the
 * `GET /api/v1/clientes/{id}` endpoint do not exist yet (Story 2.2, Tasks 1-4).
 *
 * These tests exercise the real backend (seeded via ApiHelper), not mocked
 * network responses — TC-E2-P1-06 explicitly validates the full-stack path
 * (frontend deep link -> real endpoint -> real DB record).
 */

test.describe('Story 2.2 — Client Detail View', () => {
  let clientesPage: ClientesPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('TC-E2-P1-06 — should load and display the correct client when navigating directly to /clientes/:clienteId', async () => {
    // GIVEN: a client is seeded via the real API
    const data = buildCliente({ nombre: 'Comercial Andina Detalle SAS' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: the user navigates directly to /clientes/{uuid} (no prior in-app navigation)
    await clientesPage.gotoDetail(cliente.id);

    // THEN: the correct client details render (Nombre, NIT/RUC, Teléfono, Ciudad)
    await expect(clientesPage.detailPanel).toBeVisible();
    await expect(clientesPage.detailPanel.getByText(data.nombre)).toBeVisible();
    await expect(clientesPage.detailPanel.getByText(data.nit)).toBeVisible();
    await expect(clientesPage.detailPanel.getByText(data.telefono)).toBeVisible();
    await expect(clientesPage.detailPanel.getByText(data.ciudad)).toBeVisible();
  });

  test('TC-E2-P1-06 — should not redirect to /clientes root when deep-linking to an existing client', async ({ page }) => {
    // GIVEN: a client is seeded via the real API
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: the user navigates directly to /clientes/{uuid}
    await clientesPage.gotoDetail(cliente.id);

    // THEN: the URL remains at the deep-linked detail route (no redirect to /clientes root)
    expect(page.url()).toContain(`/clientes/${cliente.id}`);
  });

  test('TC-E2-P1-07 — should show a graceful not-found UI for a well-formed but non-existent clienteId', async () => {
    // GIVEN: a UUID that does not match any client record
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: the user navigates to /clientes/{nonExistentId}
    await clientesPage.gotoDetail(nonExistentId);

    // THEN: a graceful not-found message renders — no blank page, no crash
    await expect(clientesPage.detailNotFound).toBeVisible();
  });

  test('TC-E2-P1-07 — should log zero console errors when the clienteId does not exist', async ({ page }) => {
    // GIVEN: a console error listener attached before navigation (R7 risk mitigation)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: the user navigates to the non-existent client's URL
    await clientesPage.gotoDetail(nonExistentId);
    await expect(clientesPage.detailNotFound).toBeVisible();

    // THEN: zero console error entries were logged (no unhandled JS error)
    expect(consoleErrors).toHaveLength(0);
  });

  test('AC #4 — should show the empty/default state on /clientes when no client is selected', async () => {
    // GIVEN: at least one client exists in the system
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: the user navigates to /clientes without selecting any client
    await clientesPage.goto();

    // THEN: the right panel shows the empty/default "no client selected" state
    await expect(clientesPage.detailEmptyState).toBeVisible();
  });
});
