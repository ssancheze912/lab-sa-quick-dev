import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.1: Client List & Search — ATDD (RED phase)
 *
 * Acceptance Criteria covered:
 *   AC #3 — Left panel (280px) renders scrollable client list
 *   AC #4 — Real-time client-side search filter
 *   AC #5 — EmptyState variants (no-clients / search-empty)
 *   AC #6 — ErrorPanel + Reintentar
 *
 * Aligned test cases:
 *   TC-E2-P1-08 — Dual-panel layout 280px
 *   TC-E2-P2-04 — Search matches Nombre + NIT/RUC
 *   TC-E2-P2-01 — EmptyState when zero clients
 *   TC-E2-P1-07 — ErrorPanel + Reintentar recovery
 *
 * These tests MUST fail until the ClienteListView is implemented.
 */

test.describe('Story 2.1 — Client List & Search (RED)', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const api = new ApiHelper(request);
    for (const id of createdIds) {
      await api.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── AC #3 / TC-E2-P1-08 ────────────────────────────────────────────────
  test('AC #3 — left panel exposes data-testid="client-list-panel" with width 280px', async ({
    page,
    request,
  }) => {
    // GIVEN: at least one client exists
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(buildCliente());
    createdIds.push(cliente.id);

    // Intercept BEFORE navigating
    await page.route('**/api/v1/clientes', async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: user navigates to /clientes
    await page.goto('/clientes');

    // THEN: the aside panel is 280px wide
    const panel = page.getByTestId('client-list-panel');
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box?.width).toBe(280);
  });

  // ─── AC #3 — list items expose Nombre and NIT/RUC ─────────────────────
  test('AC #3 — each client list item renders Nombre and NIT/RUC', async ({
    page,
    request,
  }) => {
    // GIVEN: a known client exists
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'ACME Solutions SAS', nit: '900111222' });
    const cliente = await api.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: user navigates to /clientes
    await page.goto('/clientes');

    // THEN: the list item shows both Nombre and NIT/RUC
    const item = page.getByTestId(`client-list-item-${cliente.id}`);
    await expect(item).toBeVisible();
    await expect(item).toContainText('ACME Solutions SAS');
    await expect(item).toContainText('900111222');
  });

  // ─── AC #4 / TC-E2-P2-04 ────────────────────────────────────────────────
  test('AC #4 — typing in the search input filters the list by nombre client-side', async ({
    page,
    request,
  }) => {
    // GIVEN: two clients exist with distinct names
    const api = new ApiHelper(request);
    const a = await api.createCliente(
      buildCliente({ nombre: 'Distribuidora ZetaUnique XYZ' })
    );
    const b = await api.createCliente(buildCliente({ nombre: 'Almacenes Beta' }));
    createdIds.push(a.id, b.id);

    // Track GET requests to assert NO extra fetch after first load
    let getCount = 0;
    await page.route('**/api/v1/clientes**', async (route) => {
      if (route.request().method() === 'GET') getCount += 1;
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: user navigates, sees both, then types a search fragment
    await page.goto('/clientes');
    await expect(page.getByTestId(`client-list-item-${a.id}`)).toBeVisible();
    await expect(page.getByTestId(`client-list-item-${b.id}`)).toBeVisible();

    const fetchesBefore = getCount;
    await page.getByTestId('client-search-input').fill('ZetaUnique');

    // THEN: only the matching client is rendered
    await expect(page.getByTestId(`client-list-item-${a.id}`)).toBeVisible();
    await expect(page.getByTestId(`client-list-item-${b.id}`)).toHaveCount(0);

    // AND: no additional GET /api/v1/clientes was fired (client-side filter)
    expect(getCount).toBe(fetchesBefore);
  });

  // ─── AC #4 — search also matches NIT/RUC ──────────────────────────────
  test('AC #4 — search input also matches by NIT/RUC, case-insensitively', async ({
    page,
    request,
  }) => {
    // GIVEN: two clients with distinct NITs
    const api = new ApiHelper(request);
    const a = await api.createCliente(buildCliente({ nit: '900111222' }));
    const b = await api.createCliente(buildCliente({ nit: '800999888' }));
    createdIds.push(a.id, b.id);

    await page.route('**/api/v1/clientes', async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: user types a NIT fragment
    await page.goto('/clientes');
    await page.getByTestId('client-search-input').fill('900111');

    // THEN: only the NIT-matching client is visible
    await expect(page.getByTestId(`client-list-item-${a.id}`)).toBeVisible();
    await expect(page.getByTestId(`client-list-item-${b.id}`)).toHaveCount(0);
  });

  // ─── AC #5 / TC-E2-P2-01 — no-clients EmptyState ─────────────────────
  test('AC #5 — when the backend returns an empty list, the no-clients EmptyState renders', async ({
    page,
  }) => {
    // GIVEN: backend returns [] (intercept BEFORE navigation)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: user navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState variant=no-clients renders with required copy
    const emptyState = page.getByTestId('empty-state-no-clients');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No hay clientes registrados');
    await expect(emptyState).toContainText('Crea el primer cliente del sistema');
  });

  // ─── AC #5 — search-empty EmptyState ────────────────────────────────
  test('AC #5 — when the cache is non-empty but search yields zero, search-empty EmptyState renders', async ({
    page,
  }) => {
    // GIVEN: backend returns 2 clients
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-1111-1111-1111-111111111111',
            nombre: 'ACME',
            nitRuc: '900111222',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-06-01T00:00:00Z',
            updatedAt: '2026-06-01T00:00:00Z',
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            nombre: 'Beta',
            nitRuc: '800999888',
            telefono: '3009998877',
            ciudad: 'Medellín',
            createdAt: '2026-06-02T00:00:00Z',
            updatedAt: '2026-06-02T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: user navigates and searches for a string with no matches
    await page.goto('/clientes');
    await page.getByTestId('client-search-input').fill('UnmatchableQuery123');

    // THEN: EmptyState variant=search-empty renders
    const emptyState = page.getByTestId('empty-state-search-empty');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No se encontró ningún cliente');
    await expect(emptyState).toContainText('Intenta con otro nombre o NIT');
  });

  // ─── AC #6 / TC-E2-P1-07 ────────────────────────────────────────────
  test('AC #6 — when the initial GET fails, ErrorPanel renders and Reintentar refetches', async ({
    page,
  }) => {
    // GIVEN: first GET returns 500, second GET returns a 1-client list
    let calls = 0;
    await page.route('**/api/v1/clientes', (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ type: 'about:blank', title: 'Error', status: 500 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '33333333-3333-3333-3333-333333333333',
            nombre: 'Recovered Client SAS',
            nitRuc: '700777666',
            telefono: '3001112233',
            ciudad: 'Cali',
            createdAt: '2026-06-03T00:00:00Z',
            updatedAt: '2026-06-03T00:00:00Z',
          },
        ]),
      });
    });

    // WHEN: user navigates → sees ErrorPanel → clicks Reintentar
    await page.goto('/clientes');
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();
    await expect(errorPanel).toContainText('No pudimos cargar los clientes');
    await expect(errorPanel).toContainText('Verifica tu conexión e intenta nuevamente');

    // NFR6: the panel MUST NOT leak technical detail (no 500, no problem detail strings)
    await expect(errorPanel).not.toContainText('500');
    await expect(errorPanel).not.toContainText('about:blank');

    await page.getByTestId('error-panel-retry').click();

    // THEN: list renders, ErrorPanel disappears
    await expect(
      page.getByTestId('client-list-item-33333333-3333-3333-3333-333333333333')
    ).toBeVisible();
    await expect(errorPanel).toHaveCount(0);
  });

  // ─── AC #7 — skeletons during pending ────────────────────────────────
  test('AC #7 — 5 skeleton placeholders render while the initial GET is pending', async ({
    page,
  }) => {
    // GIVEN: a slow GET (1.5s) so the pending state is observable
    await page.route('**/api/v1/clientes', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: user navigates
    await page.goto('/clientes');

    // THEN: the skeleton container is visible with aria-busy and 5 skeleton items
    const skeletonContainer = page.getByTestId('client-list-skeleton');
    await expect(skeletonContainer).toBeVisible();
    await expect(skeletonContainer).toHaveAttribute('aria-busy', 'true');
    await expect(skeletonContainer).toHaveAttribute('aria-label', 'Cargando clientes');
    await expect(page.getByTestId('client-list-skeleton-item')).toHaveCount(5);
  });
});
