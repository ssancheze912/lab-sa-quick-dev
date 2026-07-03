import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.2 — Deep-link ATDD (RED phase)
 * Epic 2: Client Management
 *
 * TC-E2-P1-04 — Opening `/clientes/{clienteId}` directly renders the detail
 *              panel populated for that client; the AppShell + left list stay
 *              mounted and the item is highlighted (activeProps).
 * TC-E2-P1-05 — Opening `/clientes/{unknown-guid}` renders the
 *              <ClienteNotFound> panel with a Spanish message and a
 *              "Volver a la lista" link; NO JS error in the console; the
 *              AppShell chrome + list panel remain intact.
 *
 * These tests will fail until Story 2.2 delivers:
 *   • Backend GET /api/v1/clientes/{id:guid} (Tasks 1-4)
 *   • Frontend useCliente hook (Task 7)
 *   • ClienteDetailView presentation (Task 8)
 *   • _app/clientes.$clienteId.tsx route file (Task 9)
 *   • ClienteNotFound shared component (Task 10)
 *   • ClientListItem migration to <Link> with activeProps (Task 11)
 *
 * Network-first is honoured for the not-found scenario by using a random
 * well-formed GUID (no seeding needed). The happy-path scenario seeds via
 * the REST API and cleans up in `afterEach`.
 */

test.describe('Story 2.2 — Deep link a cliente detalle', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('TC-E2-P1-04 — abrir /clientes/{id} directamente renderiza el detalle', async ({
    page,
  }) => {
    // GIVEN: A persisted cliente reachable by id
    const data = buildCliente({ nombre: 'Cliente DeepLink Directo' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates directly to /clientes/{id}
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The detail article renders with the Nombre value
    const detailNombre = page.getByTestId('cliente-detail-field-nombre');
    await expect(detailNombre).toHaveText(/Cliente DeepLink Directo/i);
  });

  test('TC-E2-P1-04 — el AppShell y la lista permanecen montados al abrir /clientes/{id}', async ({
    page,
  }) => {
    // GIVEN: A persisted cliente
    const data = buildCliente({ nombre: 'Cliente DeepLink Shell' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates directly to /clientes/{id}
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('cliente-detail').waitFor();

    // THEN: The AppShell + navigation rail + list panel are all still present
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(page.getByTestId('nav-rail')).toBeVisible();
    await expect(page.getByTestId('cliente-list-panel')).toBeVisible();
  });

  test('TC-E2-P1-04 — deep-link resalta el item correspondiente en la lista (activeProps)', async ({
    page,
  }) => {
    // GIVEN: A persisted cliente
    const data = buildCliente({ nombre: 'Cliente DeepLink Highlight' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates directly to /clientes/{id}
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('cliente-detail').waitFor();

    // THEN: The matching list item is highlighted (activeProps).
    // The item is uniquely identified by its rendered Nombre text.
    const activeItem = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Cliente DeepLink Highlight' });
    const anchor = activeItem.locator('a').first();
    await expect(anchor).toHaveClass(/font-semibold/);
  });

  test('TC-E2-P1-05 — /clientes/{guid-inexistente} renderiza ClienteNotFound', async ({
    page,
  }) => {
    // GIVEN: A well-formed but non-existent GUID
    const unknownId = '00000000-0000-0000-0000-000000000000';

    // WHEN: The user navigates directly to /clientes/{unknownId}
    await page.goto(`/clientes/${unknownId}`);

    // THEN: The <ClienteNotFound> panel is visible with Spanish copy
    const notFound = page.getByTestId('cliente-not-found');
    await expect(notFound).toBeVisible();
    await expect(notFound).toContainText(/no se encontró el cliente/i);
  });

  test('TC-E2-P1-05 — el link "Volver a la lista" navega a /clientes', async ({
    page,
  }) => {
    // GIVEN: The not-found panel is rendered
    const unknownId = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/clientes/${unknownId}`);
    await page.getByTestId('cliente-not-found').waitFor();

    // WHEN: The user clicks the "Volver a la lista" link
    await page.getByTestId('cliente-not-found-back').click();

    // THEN: The URL becomes /clientes (no id segment) and the not-found panel is gone
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.getByTestId('cliente-not-found')).toHaveCount(0);
  });

  test('TC-E2-P1-05 — no debe emitir errores de consola al renderizar not-found', async ({
    page,
  }) => {
    // GIVEN: A console error collector installed BEFORE navigation
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    // Ignore expected network 404 (that is the backend's contract, not a JS bug)
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // WHEN: The user navigates to a non-existent client
    const unknownId = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/clientes/${unknownId}`);
    await page.getByTestId('cliente-not-found').waitFor();

    // THEN: No JS/console errors were logged (network 404 is fine — that's HTTP,
    //       not a JS runtime error). Filter out the expected HTTP failure text.
    const jsErrors = consoleErrors.filter(
      (msg) =>
        !/Failed to load resource.*404/i.test(msg) &&
        !/Request failed with status code 404/i.test(msg),
    );
    expect(jsErrors).toEqual([]);
  });

  test('TC-E2-P1-05 — el AppShell y el panel de lista permanecen intactos en not-found', async ({
    page,
  }) => {
    // GIVEN: A not-found deep link
    const unknownId = '00000000-0000-0000-0000-000000000000';

    // WHEN: The user opens the URL
    await page.goto(`/clientes/${unknownId}`);
    await page.getByTestId('cliente-not-found').waitFor();

    // THEN: The AppShell chrome + navigation rail + list panel remain visible
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(page.getByTestId('nav-rail')).toBeVisible();
    await expect(page.getByTestId('cliente-list-panel')).toBeVisible();
  });
});
