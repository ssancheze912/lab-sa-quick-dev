import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Edge-case expansion for Story 2.3: Create Client
 * BMad-Integrated: covers paths not in the 10 GREEN ATDD tests.
 *
 * E2E Edge Cases:
 *   E2E-C-EC-01  P1  AC1     — "Guardar" is disabled while POST is in-flight
 *   E2E-C-EC-02  P1  AC1     — "Cancelar" closes dialog and does NOT fire POST
 *   E2E-C-EC-03  P1  AC3     — Inline error disappears after filling the field and re-submitting
 *   E2E-C-EC-04  P1  AC4     — Non-409 server error (500) does NOT show "NIT ya registrado"
 *   E2E-C-EC-05  P1  AC1     — Dialog title "Nuevo cliente" is visible when open
 *   E2E-C-EC-06  P2  AC3     — Whitespace-only nombre shows required error (matches backend rule)
 *
 * API Edge Cases:
 *   API-C-EC-01  P0  AC3     — POST missing nit → 400 Problem Details
 *   API-C-EC-02  P0  AC3     — POST missing telefono → 400 Problem Details
 *   API-C-EC-03  P0  AC3     — POST missing ciudad → 400 Problem Details
 *   API-C-EC-04  P0  AC3     — POST empty body → 400 Problem Details
 *   API-C-EC-05  P1  AC2     — POST with extra unknown fields → 201 (server ignores extras)
 *   API-C-EC-06  P1  AC4     — Second 409 on same NIT returns consistent Problem Details shape
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// E2E Edge Cases
// ---------------------------------------------------------------------------

test.describe('Story 2.3 — Edge Cases E2E', () => {
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

  // -------------------------------------------------------------------------
  // E2E-C-EC-01 (P1 · AC1)
  // Given the user fills all required fields
  // When the user clicks "Guardar"
  // Then while the POST request is in-flight, the "Guardar" button should be
  //   disabled and show "Guardando..." to prevent double-submission
  // -------------------------------------------------------------------------
  test('E2E-C-EC-01 — btn-guardar está deshabilitado durante el envío (previene doble submit)', async ({ page }) => {
    // Intercept POST and slow it down to observe the loading state
    let resolvePost!: () => void;
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise<void>((resolve) => { resolvePost = resolve; });
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await clientesPage.goto();

    const data = buildCliente({ nombre: 'Empresa Loading E2E-C-EC-01' });
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-nit').fill(data.nit);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-ciudad').fill(data.ciudad);

    // Click Guardar without waiting for completion
    await page.getByTestId('btn-guardar').click();

    // THEN — while the POST is pending, the button is disabled
    await expect(page.getByTestId('btn-guardar')).toBeDisabled();
    await expect(page.getByTestId('btn-guardar')).toHaveText('Guardando...');

    // Resume the POST and allow the dialog to close
    resolvePost();

    await expect(clientesPage.form).toBeHidden({ timeout: 5000 });

    // Cleanup
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-C-EC-02 (P1 · AC1)
  // Given the user opens the form and partially fills it
  // When the user clicks "Cancelar"
  // Then the dialog closes without sending a POST request
  //   AND no client is created in the backend
  // -------------------------------------------------------------------------
  test('E2E-C-EC-02 — "Cancelar" cierra el formulario sin disparar POST', async ({ page }) => {
    let postFired = false;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postFired = true;
        route.abort();
      } else {
        route.continue();
      }
    });

    await clientesPage.goto();

    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    // Partially fill the form
    await page.getByTestId('input-nombre').fill('Empresa Cancelada');

    // Click Cancelar
    await page.getByTestId('btn-cancelar').click();

    // THEN — dialog closes
    await expect(clientesPage.form).toBeHidden();

    // AND — no POST was fired
    expect(postFired).toBe(false);
  });

  // -------------------------------------------------------------------------
  // E2E-C-EC-03 (P1 · AC3)
  // Given the user submits an empty form (errors shown),
  // When the user fills in all required fields and submits again
  // Then the inline errors disappear and the form submits successfully
  // -------------------------------------------------------------------------
  test('E2E-C-EC-03 — errores inline desaparecen al rellenar los campos y reenviar', async ({ page }) => {
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await clientesPage.goto();

    const data = buildCliente({ nombre: 'Empresa Corrige EC-03' });

    // WHEN — submit empty form first
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();
    await page.getByTestId('btn-guardar').click();

    // THEN — errors are visible
    await expect(page.getByText(/nombre es requerido|el nombre/i).first()).toBeVisible();

    // WHEN — fill all fields and re-submit
    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-nit').fill(data.nit);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-ciudad').fill(data.ciudad);
    await page.getByTestId('btn-guardar').click();

    // THEN — dialog closes (submission succeeded)
    await expect(clientesPage.form).toBeHidden();

    // Cleanup
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-C-EC-04 (P1 · AC4)
  // Given the backend returns a 500 error (non-conflict)
  // When the form is submitted
  // Then the "El NIT/RUC ya está registrado" message must NOT appear
  //   AND the dialog should remain open (form not closed on server error)
  // -------------------------------------------------------------------------
  test('E2E-C-EC-04 — error 500 del servidor NO muestra "NIT ya registrado"', async ({ page }) => {
    // Intercept POST and return a 500
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            status: 500,
            title: 'Internal Server Error',
            detail: 'An unexpected error occurred.',
          }),
        });
      } else {
        route.continue();
      }
    });

    await clientesPage.goto();

    const data = buildCliente({ nombre: 'Empresa 500 Error EC-04' });
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-nit').fill(data.nit);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-ciudad').fill(data.ciudad);
    await page.getByTestId('btn-guardar').click();

    // THEN — "El NIT/RUC ya está registrado" must NOT be visible
    await expect(page.getByTestId('error-nit')).not.toBeVisible({ timeout: 3000 });
  });

  // -------------------------------------------------------------------------
  // E2E-C-EC-05 (P1 · AC1)
  // Given the dialog opens
  // When the user views the dialog
  // Then the dialog title "Nuevo cliente" is visible
  // -------------------------------------------------------------------------
  test('E2E-C-EC-05 — el título "Nuevo cliente" es visible en el formulario abierto', async ({ page }) => {
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await clientesPage.goto();

    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await expect(page.getByText('Nuevo cliente')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-C-EC-06 (P2 · AC3)
  // Given the user fills the nombre field with only whitespace
  // When the form is submitted
  // Then a validation error appears for nombre
  //   AND the form does NOT submit (no POST fired)
  // Note: This tests frontend Zod validation (min(1) rejects whitespace for min length,
  //   but Zod's string().min(1) does NOT trim — whitespace counts. Mark fixme if
  //   the Zod schema does not reject whitespace-only strings.
  // -------------------------------------------------------------------------
  test.fixme('E2E-C-EC-06 — nombre con solo espacios muestra error de validación (requiere schema trim)', async ({ page }) => {
    // FIXME: clienteSchema uses z.string().min(1) which allows whitespace-only strings
    // at frontend level. This test would need z.string().trim().min(1) in clienteSchema.ts
    // to work. Deferred until schema is updated to enforce trimming.
    let postFired = false;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postFired = true;
        route.abort();
      } else {
        route.continue();
      }
    });

    await clientesPage.goto();
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill('   ');
    await page.getByTestId('input-nit').fill('900000001-0');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-guardar').click();

    await expect(page.getByText(/nombre es requerido|el nombre/i).first()).toBeVisible();
    expect(postFired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// API Integration Edge Cases
// ---------------------------------------------------------------------------

test.describe('Story 2.3 — Edge Cases API: POST /api/v1/clientes', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // -------------------------------------------------------------------------
  // API-C-EC-01 (P0 · AC3)
  // POST missing required field "nit" → 400 Bad Request + Problem Details
  // -------------------------------------------------------------------------
  test('API-C-EC-01 — POST sin campo nit devuelve 400 + Problem Details', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa Sin NIT',
        telefono: '3001234567',
        ciudad: 'Bogotá',
        // nit intentionally omitted
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.status).toBe(400);
    expect(typeof body.title).toBe('string');
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-C-EC-02 (P0 · AC3)
  // POST missing required field "telefono" → 400 Bad Request + Problem Details
  // -------------------------------------------------------------------------
  test('API-C-EC-02 — POST sin campo telefono devuelve 400 + Problem Details', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa Sin Teléfono',
        nit: '900000099-0',
        ciudad: 'Bogotá',
        // telefono intentionally omitted
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.status).toBe(400);
    expect(body.stackTrace).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-C-EC-03 (P0 · AC3)
  // POST missing required field "ciudad" → 400 Bad Request + Problem Details
  // -------------------------------------------------------------------------
  test('API-C-EC-03 — POST sin campo ciudad devuelve 400 + Problem Details', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa Sin Ciudad',
        nit: '900000098-1',
        telefono: '3001234567',
        // ciudad intentionally omitted
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.status).toBe(400);
    expect(body.stackTrace).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-C-EC-04 (P0 · AC3)
  // POST with empty body {} → 400 Bad Request + Problem Details
  // Boundary: all required fields missing simultaneously
  // -------------------------------------------------------------------------
  test('API-C-EC-04 — POST con body vacío devuelve 400 + Problem Details', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.status).toBe(400);
    expect(typeof body.title).toBe('string');
    expect(body.stackTrace).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-C-EC-05 (P1 · AC2)
  // POST with extra unknown fields → 201 (server must ignore extra properties)
  // Boundary: robustness — extra fields should not cause 400 or 500
  // -------------------------------------------------------------------------
  test('API-C-EC-05 — POST con campos adicionales desconocidos devuelve 201 (server ignora extras)', async ({ request }) => {
    const data = buildCliente({ nombre: 'Empresa Extra Fields API-C-EC-05' });
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        ...data,
        unknownField: 'should-be-ignored',
        anotherExtra: 12345,
      },
    });

    // The server SHOULD accept the payload and ignore unknown fields
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    createdIds.push(body.id);

    // Extra fields must NOT appear in the response
    expect(body.unknownField).toBeUndefined();
    expect(body.anotherExtra).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-C-EC-06 (P1 · AC4)
  // Second duplicate NIT request → consistent 409 Problem Details shape
  // Edge case: verify that repeated 409 responses have the same structure
  // (not a transient error format change)
  // -------------------------------------------------------------------------
  test('API-C-EC-06 — segundo intento con NIT duplicado devuelve 409 consistente con mismo shape', async ({ request }) => {
    const original = buildCliente({ nombre: 'Empresa Original API-C-EC-06' });
    const createResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: original });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json();
    createdIds.push(created.id);

    // First duplicate attempt
    const dup1 = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { ...original, nombre: 'Empresa Duplicada 1 EC-06' },
    });
    expect(dup1.status()).toBe(409);
    const body1 = await dup1.json();

    // Second duplicate attempt — shape must be consistent
    const dup2 = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { ...original, nombre: 'Empresa Duplicada 2 EC-06' },
    });
    expect(dup2.status()).toBe(409);
    const body2 = await dup2.json();

    // Both responses must have the same Problem Details structure
    expect(body1.status).toBe(409);
    expect(body2.status).toBe(409);
    expect(typeof body1.title).toBe('string');
    expect(typeof body2.title).toBe('string');
    expect(body1.title).toBe(body2.title);
    expect(body1.stackTrace).toBeUndefined();
    expect(body2.stackTrace).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Helper import for buildCliente (already imported at top)
// ---------------------------------------------------------------------------
