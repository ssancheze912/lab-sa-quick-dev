import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 2.2: Client Detail View (RED phase)
 *
 * Tests fail until:
 *   - GET /api/v1/clientes/:id endpoint is implemented (backend)
 *   - ClienteDetailView component renders in the right panel
 *   - TanStack Router dynamic route clientes.$clienteId.tsx is wired
 *   - URL updates to /clientes/:clienteId on client selection (FR30 deep linking)
 *   - NotFoundPanel renders for unknown clienteId
 *   - data-testid attributes are present in the implementation
 *
 * Test IDs:
 *   TC-E2-2-2-E2E-1 (P1) — Navigate directly to /clientes/:id → detail panel shows Nombre + NIT
 *   TC-E2-2-2-E2E-2 (P3) — Navigate to /clientes/00000000... → not-found message rendered
 */

const UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

test.describe('Story 2.2 — Client Detail View (E2E)', () => {
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

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-1 (P1) — Direct navigation to /clientes/:id loads detail
  // Risk: R-008 (deep linking regression)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-1: should show client Nombre and NIT in detail panel when navigating directly to /clientes/:id', async ({ page }) => {
    // GIVEN: A client exists in the system with known Nombre and NIT
    const data = buildCliente({ nombre: 'Empresa Detail E2E', nit: '900999001-1' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // CRITICAL: Route intercept BEFORE navigation (network-first pattern)
    // No route intercept needed — uses real API for deep link test

    // WHEN: User navigates directly to /clientes/:id (deep link — FR30)
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    // THEN: The detail panel is visible
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // AND: Nombre is displayed in the detail panel
    await expect(
      page.getByTestId('cliente-detail-panel').getByText(data.nombre)
    ).toBeVisible();

    // AND: NIT/RUC is displayed in the detail panel
    await expect(
      page.getByTestId('cliente-detail-panel').getByText(data.nit)
    ).toBeVisible();
  });

  test('should update URL to /clientes/:clienteId when user clicks a client in the left panel', async ({ page }) => {
    // GIVEN: A client exists and the list is displayed at /clientes
    const data = buildCliente({ nombre: 'Empresa Click Navigation' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes (no deep link)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // Wait for the list to load
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks on the client item in the left panel
    await page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }).click();

    // THEN: URL updates to /clientes/:clienteId (FR30 deep linking)
    await page.waitForURL(`**/clientes/${created.id}`, { timeout: 3000 });

    // AND: The detail panel becomes visible with client information
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(
      page.getByTestId('cliente-detail-panel').getByText(data.nombre)
    ).toBeVisible();
  });

  test('should show placeholder text in right panel when no client is selected at /clientes', async ({ page }) => {
    // GIVEN: The list of clients is loaded at /clientes (no :clienteId in URL)
    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente({ nombre: 'Empresa Sin Seleccionar' })]),
      })
    );

    // WHEN: User navigates to /clientes (root, no client selected)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: The right panel shows the empty/placeholder state
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(
      page.getByTestId('cliente-detail-panel').getByText(/selecciona un cliente/i)
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-2 (P3) — Unknown clienteId shows not-found message
  // Risk: R-008 (deep linking regression)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-2: should display not-found message when navigating to /clientes/00000000-0000-0000-0000-000000000000', async ({ page }) => {
    // GIVEN: The clienteId in the URL does not correspond to any existing client
    // CRITICAL: Intercept the specific client fetch BEFORE navigation to return 404
    await page.route(`**/api/v1/clientes/${UNKNOWN_UUID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Cliente no encontrado',
          status: 404,
          detail: 'El cliente solicitado no fue encontrado.',
        }),
      })
    );

    // WHEN: User navigates directly to the non-existent client URL
    await page.goto(`/clientes/${UNKNOWN_UUID}`);
    await page.waitForURL(`**/clientes/${UNKNOWN_UUID}`);

    // THEN: The detail panel renders a not-found message (no crash, no blank panel)
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // AND: A not-found message is visible in the right panel
    await expect(
      page.getByTestId('cliente-detail-panel').getByText(/cliente no encontrado/i)
    ).toBeVisible();

    // AND: No raw error or blank panel (not-found panel, not ErrorPanel)
    await expect(
      page.getByTestId('cliente-detail-panel').getByTestId('not-found-panel')
    ).toBeVisible();
  });
});
