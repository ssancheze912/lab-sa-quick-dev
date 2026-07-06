import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E tests: Client Detail View (Story 2.2, Epic 2: Client Management)
 * ATDD Acceptance Tests — RED Phase
 *
 * Covers `test-design-epic-2.md`'s TC-E2-P1-07/08/09:
 *   TC-E2-P1-09 — Non-existent clienteId shows a graceful not-found message (fully
 *                 runnable today, no dependency on the create endpoint).
 *   TC-E2-P1-07 — Click navigation updates the URL and shows the detail (FR30).
 *   TC-E2-P1-08 — Direct URL access to /clientes/:clienteId loads the correct client (FR30).
 *
 * Known Cross-Story Test Dependency (documented in Story 2.2 Task 6, same convention as
 * Story 2.1's "Known Cross-Story Test Dependency"): TC-E2-P1-07 and TC-E2-P1-08 seed data
 * via `apiHelper.createCliente(...)`, which calls `POST /api/v1/clientes` — not implemented
 * until Story 2.3. These two tests are authored correctly and ready, but their pass/fail is
 * NOT a gate for Story 2.2; they become runnable the moment Story 2.3 lands. Full coverage
 * of the detail-rendering logic (AC #1, #2) without needing `POST` is already provided by
 * `ClienteDetailView.test.tsx`'s component-level suite.
 */

test.describe('Detalle de Cliente', () => {
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

  test('TC-E2-P1-09 — muestra un mensaje de no encontrado para un clienteId inexistente', async ({
    page,
  }) => {
    // GIVEN: a syntactically well-formed clienteId that does not exist in the system
    const nonExistentId = crypto.randomUUID();

    // WHEN: the user navigates directly to /clientes/{nonExistentId}
    await page.goto('/clientes/' + nonExistentId);

    // THEN: a graceful not-found message is displayed in the detail panel (AC #3),
    // instead of a crash or blank screen
    await expect(clientesPage.notFoundMessage).toBeVisible();
  });

  test('TC-E2-P1-07 — clic en un cliente navega al detalle y actualiza la URL (FR30)', async ({
    page,
  }) => {
    // GIVEN: a seeded client and the clientes list page
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();

    // WHEN: the user clicks the client's list item
    await clientesPage.seleccionarCliente(data.nombre);

    // THEN: the right panel shows the client's Nombre and the URL updates to
    // /clientes/:clienteId without a full page reload (AC #1, FR30)
    await expect(clientesPage.detailNombre).toHaveText(data.nombre);
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}$`));
  });

  test('TC-E2-P1-08 — acceso directo a /clientes/:clienteId carga el cliente correcto (FR30)', async ({
    page,
  }) => {
    // GIVEN: a seeded client
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: the user accesses the client's detail URL directly (fresh load, no prior
    // in-app navigation)
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: the correct client's details load inside the same split-panel layout
    // (list still visible on the left) — AC #2, FR30
    await expect(clientesPage.detailNombre).toHaveText(data.nombre);
    await expect(clientesPage.listPanel).toBeVisible();
  });
});
