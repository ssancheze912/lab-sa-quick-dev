import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.2: Client Detail View — ATDD (RED phase)
 *
 * Acceptance Criteria covered (UI legs):
 *   AC #4 — Click list item → URL becomes /clientes/{id}, right pane shows ClienteDetailView
 *   AC #5 — Cold deep link /clientes/{id} → list + detail render together; data loads via TanStack Query
 *   AC #6 — Deep link to non-existent id → graceful ClienteNotFound + "Volver a la lista"
 *   AC #7 — Skeleton in pending state with role=status / aria-busy
 *   AC #9 — DescriptionList with 4 pairs (Nombre, NIT/RUC, Teléfono, Ciudad)
 *   AC #10 — Switch selection: no extra GET /api/v1/clientes (list cache reused)
 *
 * Aligned test cases (test-design-epic-2.md):
 *   TC-E2-P1-01 — Deep link to client detail (UI leg)
 *   R7         — Deep link to non-existent id renders not-found UI without console errors
 *
 * These tests MUST fail until the ClienteDetailView, ClienteNotFound, and the
 * `/clientes/$clienteId` route are implemented (Tasks 7, 10, 11).
 */

test.describe('Story 2.2 — Client Detail View Deep Link (RED)', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const api = new ApiHelper(request);
    for (const id of createdIds) {
      await api.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── AC #5 / TC-E2-P1-01 ────────────────────────────────────────────────
  test('AC #5 — cold deep link /clientes/{id} renders the detail card with 4 fields', async ({
    page,
    request,
  }) => {
    // GIVEN: a client exists with known values
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(
      buildCliente({
        nombre: 'ACME Detail Test SAS',
        nit: '900555444',
        telefono: '3001112233',
        ciudad: 'Cali',
      })
    );
    createdIds.push(cliente.id);

    // Intercept BEFORE navigating (network-first)
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: user pastes the deep link directly into the browser
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: the detail card renders with the 4 expected pairs
    const detailCard = page.getByTestId('cliente-detail-card');
    await expect(detailCard).toBeVisible();
    await expect(detailCard).toContainText('ACME Detail Test SAS');
    await expect(detailCard).toContainText('Nombre');
    await expect(detailCard).toContainText('NIT/RUC');
    await expect(detailCard).toContainText('900555444');
    await expect(detailCard).toContainText('Teléfono');
    await expect(detailCard).toContainText('3001112233');
    await expect(detailCard).toContainText('Ciudad');
    await expect(detailCard).toContainText('Cali');
  });

  // ─── AC #5 — list panel mounts alongside detail on cold deep link ───────
  test('AC #5 — cold deep link mounts the left list panel AND the right detail panel together', async ({
    page,
    request,
  }) => {
    // GIVEN: a client exists
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(buildCliente());
    createdIds.push(cliente.id);

    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });
    await page.route('**/api/v1/clientes', async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: cold-load the deep link
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: both panels are visible in the same tick
    await expect(page.getByTestId('client-list-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-card')).toBeVisible();
  });

  // ─── AC #4 — click list item → URL updates + detail renders ─────────────
  test('AC #4 — clicking a list item navigates to /clientes/{id} and renders the detail', async ({
    page,
    request,
  }) => {
    // GIVEN: a client exists
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(
      buildCliente({ nombre: 'Selectable Client', nit: '900222111' })
    );
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: user navigates to /clientes and clicks the item
    await page.goto('/clientes');
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: URL is updated to /clientes/{id} and detail card renders
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}$`));
    await expect(page.getByTestId('cliente-detail-card')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-card')).toContainText('Selectable Client');
  });

  // ─── AC #4 — selected item carries aria-current="true" ──────────────────
  test('AC #4 — clicked item is visually marked as selected with aria-current="true"', async ({
    page,
    request,
  }) => {
    // GIVEN: a client exists
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(buildCliente());
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: user clicks the list item
    await page.goto('/clientes');
    const item = page.getByTestId(`client-list-item-${cliente.id}`);
    await item.click();

    // THEN: that item has aria-current="true"
    await expect(item).toHaveAttribute('aria-current', 'true');
  });

  // ─── AC #6 / R7 — deep link to non-existent id → not-found UI ───────────
  test('AC #6 / R7 — deep link to non-existent id renders ClienteNotFound and "Volver a la lista"', async ({
    page,
  }) => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Intercept BEFORE navigating — backend returns 404 Problem Details
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
          title: 'Cliente no encontrado',
          status: 404,
          instance: `/api/v1/clientes/${nonExistentId}`,
          detail: null,
        }),
      })
    );

    // Capture console errors — there MUST be none
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // WHEN: cold deep-link the missing id
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: ClienteNotFound renders with exact Spanish copy
    const notFound = page.getByTestId('cliente-not-found');
    await expect(notFound).toBeVisible();
    await expect(notFound).toContainText('Cliente no encontrado');
    await expect(notFound).toContainText(
      'El cliente que buscas no existe o fue eliminado'
    );
    await expect(
      page.getByRole('button', { name: 'Volver a la lista' })
    ).toBeVisible();

    // AND: NO console error and NO leakage of underlying 404 / Problem Details
    expect(consoleErrors).toHaveLength(0);
    const notFoundText = (await notFound.textContent()) ?? '';
    expect(notFoundText).not.toMatch(/404|about:blank|section-6\.5\.4/i);
  });

  // ─── AC #6 — clicking "Volver a la lista" navigates back to /clientes ───
  test('AC #6 — clicking "Volver a la lista" navigates back to /clientes', async ({
    page,
  }) => {
    const nonExistentId = '11111111-1111-1111-1111-111111111111';

    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
          title: 'Cliente no encontrado',
          status: 404,
          instance: `/api/v1/clientes/${nonExistentId}`,
          detail: null,
        }),
      })
    );
    await page.route('**/api/v1/clientes', async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: user lands on a missing id, then clicks "Volver a la lista"
    await page.goto(`/clientes/${nonExistentId}`);
    await page.getByRole('button', { name: 'Volver a la lista' }).click();

    // THEN: URL goes back to /clientes (no clienteId segment)
    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.getByTestId('client-list-panel')).toBeVisible();
  });

  // ─── AC #10 — switching selection does NOT refetch the list ─────────────
  test('AC #10 — switching selection between two clients does NOT refetch GET /api/v1/clientes', async ({
    page,
    request,
  }) => {
    // GIVEN: two clients exist
    const api = new ApiHelper(request);
    const a = await api.createCliente(
      buildCliente({ nombre: 'Cliente Alpha SAS' })
    );
    const b = await api.createCliente(
      buildCliente({ nombre: 'Cliente Beta SAS' })
    );
    createdIds.push(a.id, b.id);

    // Spy: count GET /api/v1/clientes (list) — must NOT increase after first load
    let listCallCount = 0;
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') listCallCount += 1;
      const response = await route.fetch();
      return route.fulfill({ response });
    });
    // Per-id calls go through normally
    await page.route('**/api/v1/clientes/*', async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: user navigates, clicks A, then clicks B
    await page.goto('/clientes');
    await expect(page.getByTestId(`client-list-item-${a.id}`)).toBeVisible();
    const callsAfterListLoad = listCallCount;

    await page.getByTestId(`client-list-item-${a.id}`).click();
    await expect(page.getByTestId('cliente-detail-card')).toContainText(
      'Cliente Alpha SAS'
    );

    await page.getByTestId(`client-list-item-${b.id}`).click();
    await expect(page.getByTestId('cliente-detail-card')).toContainText(
      'Cliente Beta SAS'
    );

    // THEN: list endpoint was NOT called again after the first load
    expect(listCallCount).toBe(callsAfterListLoad);
  });

  // ─── AC #7 — skeleton renders while detail GET is pending ──────────────
  test('AC #7 — skeleton renders with role="status" while detail GET is pending', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const cliente = await api.createCliente(buildCliente());
    createdIds.push(cliente.id);

    // Delay the detail call so the skeleton is observable
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const response = await route.fetch();
      return route.fulfill({ response });
    });
    await page.route('**/api/v1/clientes', async (route) => {
      const response = await route.fetch();
      return route.fulfill({ response });
    });

    // WHEN: cold-load deep link
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: skeleton renders with the expected a11y attributes
    const skeleton = page.getByTestId('cliente-detail-skeleton');
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toHaveAttribute('role', 'status');
    await expect(skeleton).toHaveAttribute('aria-busy', 'true');
    await expect(skeleton).toHaveAttribute('aria-label', 'Cargando cliente');
  });
});
