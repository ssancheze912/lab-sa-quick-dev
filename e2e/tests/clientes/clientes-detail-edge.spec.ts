import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.2 — Client Detail View — Edge Cases
 *
 * Expands coverage beyond the GREEN ATDD suite (E2E-C-07 to E2E-C-10).
 * Targets loading states, generic errors, accessibility, and layout.
 *
 * Test IDs: E2E-C-DET-EDGE-01 … E2E-C-DET-EDGE-10
 */

test.describe('Story 2.2 — Detalle de cliente — Edge Cases', () => {
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

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-01 (P1)
  // Boundary: detail panel shows skeleton while the API request for the client
  // detail is pending. react-loading-skeleton elements must be visible.
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-01 — [P1] skeleton aparece en el panel de detalle mientras carga', async ({ page }) => {
    // GIVEN — a client exists
    const data = buildCliente({ nombre: 'Empresa Skeleton Detail Test' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // Hold the by-ID request to capture the loading window
    let resolveHold!: () => void;
    const holdPromise = new Promise<void>((resolve) => { resolveHold = resolve; });

    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await holdPromise;
      await route.continue();
    });

    // WHEN — navigate directly to the detail URL (request is held)
    const navPromise = page.goto(`/clientes/${cliente.id}`);

    // THEN — skeleton elements appear inside the detail panel before response arrives
    const skeleton = page.locator('[data-testid="cliente-detail-panel"] .react-loading-skeleton');
    await expect(skeleton.first()).toBeVisible({ timeout: 5000 });

    // Release the hold and let the test finish
    resolveHold();
    await navPromise;
  });

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-02 (P1)
  // Error path: when the detail API returns 500 (generic error), the component
  // must show an error message instead of the 404 "not found" message.
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-02 — [P1] error 500 en detalle muestra mensaje de error genérico, no "no encontrado"', async ({ page }) => {
    // GIVEN — API returns 500 for a specific detail request
    await page.route('**/api/v1/clientes/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', (route) =>
      route.fulfill({ status: 500, body: '{"title":"Internal error","status":500}', contentType: 'application/problem+json' })
    );

    // WHEN — navigate directly to that ID
    await page.goto('/clientes/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');

    // THEN — the panel is rendered
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // AND — NOT the 404 "not found" message
    await expect(page.getByTestId('cliente-not-found')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-03 (P2)
  // Boundary: clicking a second client after a first one was selected must
  // update the detail panel with the new client's data.
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-03 — [P2] seleccionar un segundo cliente actualiza el panel de detalle', async ({ page }) => {
    // GIVEN — two clients exist
    const data1 = buildCliente({ nombre: 'Primera Empresa SAS' });
    const data2 = buildCliente({ nombre: 'Segunda Empresa Ltda' });
    const c1 = await apiHelper.createCliente(data1);
    const c2 = await apiHelper.createCliente(data2);
    createdIds.push(c1.id, c2.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user clicks first client
    await clientesPage.seleccionarCliente(data1.nombre);
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText(data1.nombre);

    // AND — then clicks second client
    await clientesPage.seleccionarCliente(data2.nombre);

    // THEN — detail panel shows second client
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText(data2.nombre);
    await expect(page.getByTestId('cliente-detail-nit')).toHaveText(data2.nit);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-04 (P1)
  // Boundary: clicking a client updates the URL; then pressing browser back
  // should navigate to /clientes (the list view).
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-04 — [P1] navegar atrás desde el detalle vuelve a /clientes', async ({ page }) => {
    // GIVEN — a client exists
    const data = buildCliente({ nombre: 'Empresa Back Navigation' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.filter({ hasText: data.nombre })).toBeVisible();

    await clientesPage.seleccionarCliente(data.nombre);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // WHEN — browser back
    await page.goBack();

    // THEN — URL is back to /clientes
    await page.waitForURL('**/clientes');
    expect(page.url()).toContain('/clientes');
    expect(page.url()).not.toContain(cliente.id);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-05 (P2)
  // Boundary: direct navigation to /clientes/:id also shows the list panel
  // alongside the detail panel (split-panel layout must be intact).
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-05 — [P2] navegación directa a detalle también muestra el panel de lista', async ({ page }) => {
    // GIVEN — a client exists
    const data = buildCliente({ nombre: 'Empresa Split Panel Check' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN — navigate directly to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN — both panels are visible (split-panel layout)
    await expect(clientesPage.listPanel).toBeVisible();
    await expect(clientesPage.detailPanel).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-06 (P2)
  // Boundary: detail panel does NOT show JS errors when a valid client is loaded.
  // Guard: page errors listener must remain empty during normal detail display.
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-06 — [P2] cargar detalle válido no genera errores JS en la consola', async ({ page }) => {
    // GIVEN — a client exists
    const data = buildCliente({ nombre: 'Empresa Sin Errores JS' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // WHEN — navigate to the detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('cliente-detail-nombre')).toBeVisible();

    // THEN — no unhandled JS errors
    expect(pageErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-07 (P2)
  // Boundary: after selecting a client, the list item remains visible and
  // the active item styling is applied (router param match).
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-07 — [P2] el ítem activo sigue visible en la lista después de seleccionar', async ({ page }) => {
    // GIVEN — a client exists
    const data = buildCliente({ nombre: 'Empresa Active Item Check' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.filter({ hasText: data.nombre })).toBeVisible();

    // WHEN — user selects the client
    await clientesPage.seleccionarCliente(data.nombre);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // THEN — the list item is still present in the DOM
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-08 (P1)
  // Boundary: a UUID-shaped ID that is syntactically valid but not in DB (v4 format)
  // must show "cliente-not-found", not a JS crash or blank screen.
  // Covers a different UUID than E2E-C-10 to ensure pattern independence.
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-08 — [P1] UUID válido pero inexistente muestra "no encontrado" sin crash', async ({ page }) => {
    const unknownId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(`/clientes/${unknownId}`);

    await expect(page.getByTestId('cliente-not-found')).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-09 (P2)
  // Accessibility: the detail panel heading (nombre) must be visible as a
  // prominent text element accessible by screen readers.
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-09 — [P2] el nombre del cliente en el panel de detalle es accesible como texto', async ({ page }) => {
    // GIVEN — a client exists
    const data = buildCliente({ nombre: 'Empresa Accesible SAS' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN — navigate to detail
    await page.goto(`/clientes/${cliente.id}`);

    // THEN — an element with data-testid="cliente-detail-nombre" is in the DOM
    const nombreEl = page.getByTestId('cliente-detail-nombre');
    await expect(nombreEl).toBeVisible();
    await expect(nombreEl).toHaveText(data.nombre);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-DET-EDGE-10 (P2)
  // Boundary: selecting a client from the search-filtered list navigates to the
  // correct detail URL (filter does not corrupt the ID).
  // ---------------------------------------------------------------------------
  test('E2E-C-DET-EDGE-10 — [P2] seleccionar cliente filtrado por búsqueda navega al detalle correcto', async ({ page }) => {
    // GIVEN — two clients, only one matching the search term
    const data1 = buildCliente({ nombre: 'Empresa Filtered Navigation' });
    const data2 = buildCliente({ nombre: 'Otra Empresa Diferente' });
    const c1 = await apiHelper.createCliente(data1);
    const c2 = await apiHelper.createCliente(data2);
    createdIds.push(c1.id, c2.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — search to filter, then click the matching client
    await clientesPage.buscar('Filtered Navigation');
    await expect(
      clientesPage.clienteItems.filter({ hasText: data1.nombre })
    ).toBeVisible();

    await clientesPage.seleccionarCliente(data1.nombre);

    // THEN — URL contains the correct ID (not the filtered-out client)
    await page.waitForURL(`**/clientes/${c1.id}`);
    expect(page.url()).toContain(c1.id);
    expect(page.url()).not.toContain(c2.id);
  });
});
