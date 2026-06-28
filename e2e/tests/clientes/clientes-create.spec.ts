import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 2.3: Create Client (RED phase)
 *
 * Tests fail until:
 *   - POST /api/v1/clientes endpoint is implemented (backend)
 *   - ClienteForm component renders with all four fields + data-testid attributes
 *   - "Nuevo cliente" button (data-testid="btn-nuevo-cliente") is wired in /clientes route
 *   - useCreateCliente mutation invalidates ['clientes'] query (FR27 — no page reload)
 *   - Toast "Cliente creado correctamente" is displayed on success
 *   - Inline validation errors appear on empty field submission
 *   - 409 conflict surfaces as inline error on NIT field
 *
 * Test IDs:
 *   TC-E2-2-3-E2E-1 (P0) — Create client end-to-end → Nombre in left panel without reload
 */

test.describe('Story 2.3 — Create Client (E2E)', () => {
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
  // TC-E2-2-3-E2E-1 (P0) — Create client end-to-end → name in left panel, no reload
  // Risk: R-002 (invalidateQueries FR27), R-010 (toast exact text)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-3-E2E-1: should show new client Nombre in left panel immediately after creation without page reload', async ({ page }) => {
    const clientData = buildCliente({ nombre: 'Empresa E2E Create SA' });

    // GIVEN: CRITICAL — Intercept POST and GET BEFORE any navigation (network-first pattern)
    // We do NOT intercept here — we want the real backend for this P0 full-stack test.
    // The test verifies the full stack: form → POST → invalidateQueries → list refetch.

    // GIVEN: User is at /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // AND: "Nuevo cliente" button is visible in the left panel header
    await expect(page.getByTestId('btn-nuevo-cliente')).toBeVisible();

    // WHEN: User clicks "Nuevo cliente"
    await page.getByTestId('btn-nuevo-cliente').click();

    // THEN: ClienteForm opens with four required fields
    await expect(page.getByTestId('cliente-form')).toBeVisible();
    await expect(page.getByTestId('input-nombre')).toBeVisible();
    await expect(page.getByTestId('input-nit')).toBeVisible();
    await expect(page.getByTestId('input-telefono')).toBeVisible();
    await expect(page.getByTestId('input-ciudad')).toBeVisible();

    // WHEN: User fills all four required fields
    await page.getByTestId('input-nombre').fill(clientData.nombre);
    await page.getByTestId('input-nit').fill(clientData.nit);
    await page.getByTestId('input-telefono').fill(clientData.telefono);
    await page.getByTestId('input-ciudad').fill(clientData.ciudad);

    // WHEN: User clicks "Crear cliente"
    await page.getByTestId('btn-submit').click();

    // THEN: Success toast "Cliente creado correctamente" appears
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible({ timeout: 5000 });

    // AND: New client Nombre appears in the left panel list without page reload (FR27)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: clientData.nombre })
    ).toBeVisible({ timeout: 5000 });

    // Track for cleanup
    const createdCliente = await apiHelper.getClientes()
      .then((list: Array<{ id: string; nombre: string }>) =>
        list.find((c) => c.nombre === clientData.nombre)
      )
      .catch(() => null);
    if (createdCliente) createdIds.push(createdCliente.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Form validation — E2E: empty submission shows inline errors
  // ─────────────────────────────────────────────────────────────────────────

  test('should show inline validation errors when form is submitted empty', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept POST BEFORE navigation to ensure it is never called
    let postCalled = false;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User is at /clientes and opens the form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clicks "Crear cliente" without filling any field
    await page.getByTestId('btn-submit').click();

    // THEN: Inline validation errors are visible (at least one per empty required field)
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 3000 });

    // AND: POST to backend was never called (client-side Zod guard)
    expect(postCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 409 conflict — E2E: duplicate NIT shows inline error on NIT field
  // ─────────────────────────────────────────────────────────────────────────

  test('should show "El NIT/RUC ya está registrado" inline error on NIT field when backend returns 409', async ({ page }) => {
    // GIVEN: A client with a known NIT already exists
    const existingData = buildCliente({ nombre: 'Empresa Existente SA' });
    const created = await apiHelper.createCliente(existingData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept POST BEFORE navigation, returning 409 for duplicate NIT
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          }),
        });
      } else {
        route.continue();
      }
    });

    // GIVEN: User is at /clientes and opens the form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User fills the form with the duplicate NIT and submits
    await page.getByTestId('input-nombre').fill('Empresa Duplicada SA');
    await page.getByTestId('input-nit').fill(existingData.nit);
    await page.getByTestId('input-telefono').fill('3101234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit').click();

    // THEN: Inline error message "El NIT/RUC ya está registrado" appears
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Cancel button — E2E: form closes without creating client
  // ─────────────────────────────────────────────────────────────────────────

  test('should close the form when "Cancelar" button is clicked', async ({ page }) => {
    // GIVEN: CRITICAL — Intercept POST BEFORE navigation (should not be called)
    let postCalled = false;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User is at /clientes and opens the form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancel').click();

    // THEN: ClienteForm is no longer visible
    await expect(page.getByTestId('cliente-form')).not.toBeVisible({ timeout: 3000 });

    // AND: POST to backend was never called
    expect(postCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // "Nuevo cliente" button presence — available when a client is selected
  // ─────────────────────────────────────────────────────────────────────────

  test('should show "Nuevo cliente" button when a client is selected (detail route)', async ({ page }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente({ nombre: 'Empresa Para Detalle' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept routes BEFORE navigation (network-first)
    // No route intercept needed — uses real API to navigate to /clientes/:id

    // WHEN: User navigates directly to the client detail route
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    // THEN: "Nuevo cliente" button is still visible (button is in the left panel header)
    await expect(page.getByTestId('btn-nuevo-cliente')).toBeVisible({ timeout: 5000 });
  });
});
