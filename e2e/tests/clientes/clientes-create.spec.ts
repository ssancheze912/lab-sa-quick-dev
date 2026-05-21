import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD — Story 2.3: Create Client
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing ClienteFormDialog, useCreateCliente,
 * clienteSchema, and wiring the "Nuevo cliente" button in ClienteListPanel
 * as specified in Story 2.3.
 *
 * Coverage:
 *   E2E-C-11  P0  AC1     — "Nuevo cliente" opens dialog with 4 required fields
 *   E2E-C-12  P0  AC2     — Successful create: client appears in list immediately (no reload)
 *   E2E-C-13  P0  AC3     — Empty form submit: inline errors shown, no POST fired
 *   E2E-C-14  P0  AC3     — Partial empty form: error only on empty required fields
 *   E2E-C-15  P0  AC4     — Backend 409 duplicate NIT: "El NIT/RUC ya está registrado" shown in form
 *   E2E-C-16  P1  AC2     — Success toast "Cliente creado correctamente" appears
 *   E2E-C-17  P1  AC2     — Dialog closes automatically after successful create
 *
 * API Integration Tests:
 *   API-C-01  P0  AC2     — POST valid payload → 201 + UUID + ISO 8601 createdAt
 *   API-C-02  P0  AC4     — POST duplicate NIT → 409 + Problem Details, no stackTrace
 *   API-C-03  P0  AC3     — POST missing nombre → 400 + Problem Details
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// E2E Tests
// ---------------------------------------------------------------------------

test.describe('Story 2.3 — Crear cliente (E2E)', () => {
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
  // E2E-C-11 (P0 · AC1)
  // Given the user is on the /clientes view
  // When the user clicks "Nuevo cliente"
  // Then a dialog form opens with four fields: Nombre, NIT/RUC, Teléfono, Ciudad
  //   AND all four fields are marked as required
  // -------------------------------------------------------------------------
  test('E2E-C-11 — "Nuevo cliente" abre el formulario con los 4 campos requeridos', async ({ page }) => {
    // GIVEN — user is on the /clientes view (intercept network BEFORE navigation)
    await page.route('**/api/v1/clientes', (route) => route.continue());

    await clientesPage.goto();

    // THEN — "Nuevo cliente" button is visible in the list panel
    await expect(clientesPage.btnNuevoCliente).toBeVisible();

    // WHEN — user clicks "Nuevo cliente"
    await clientesPage.btnNuevoCliente.click();

    // THEN — dialog opens
    await expect(clientesPage.form).toBeVisible();

    // AND — all four fields are visible
    await expect(page.getByTestId('input-nombre')).toBeVisible();
    await expect(page.getByTestId('input-nit')).toBeVisible();
    await expect(page.getByTestId('input-telefono')).toBeVisible();
    await expect(page.getByTestId('input-ciudad')).toBeVisible();

    // AND — "Guardar" and "Cancelar" buttons are visible
    await expect(page.getByTestId('btn-guardar')).toBeVisible();
    await expect(page.getByTestId('btn-cancelar')).toBeVisible();

    // AND — the dialog has the expected test ID
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-C-12 (P0 · AC2)
  // Given the user fills all required fields and clicks "Guardar"
  // When the form is submitted
  // Then the client is created via POST /api/v1/clientes,
  //   the dialog closes,
  //   the new client appears in the left panel list immediately (no page reload — FR27),
  //   and a toast displays "Cliente creado correctamente"
  // -------------------------------------------------------------------------
  test('E2E-C-12 — enviar formulario completo crea el cliente y lo muestra en la lista sin recargar', async ({ page }) => {
    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    let postCallCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postCallCount++;
      }
      route.continue();
    });

    await clientesPage.goto();

    const data = buildCliente({ nombre: 'Empresa Create E2E-C-12' });

    // WHEN — user opens the form and fills all required fields
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-nit').fill(data.nit);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-ciudad').fill(data.ciudad);

    // AND — user clicks "Guardar"
    await page.getByTestId('btn-guardar').click();

    // THEN — dialog closes automatically (form hidden)
    await expect(clientesPage.form).toBeHidden();

    // AND — exactly one POST call was made to the backend
    expect(postCallCount).toBe(1);

    // AND — new client appears in the list WITHOUT a page reload
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();

    // Track created id for cleanup
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-C-13 (P0 · AC3 — Risk R8)
  // Given the user clicks "Guardar" with all required fields empty
  // When the Zod schema validation runs on submit (frontend-only)
  // Then inline error messages appear under each empty field (FR8),
  //   the form does NOT send any request to the backend,
  //   and the dialog remains open
  // -------------------------------------------------------------------------
  test('E2E-C-13 — enviar formulario vacío muestra errores inline y no lanza petición POST', async ({ page }) => {
    // GIVEN — network intercept BEFORE navigation; fail if POST fires
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

    // WHEN — user opens the form without filling any field
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    // AND — user clicks "Guardar" immediately (all fields empty)
    await page.getByTestId('btn-guardar').click();

    // THEN — form remains open (dialog did not close)
    await expect(clientesPage.form).toBeVisible();

    // AND — inline validation errors are visible for required fields
    await expect(
      page.getByText(/nombre es requerido|el nombre/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/nit.*requerido|el nit/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/teléfono.*requerido|el teléfono/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/ciudad.*requerida|la ciudad/i).first()
    ).toBeVisible();

    // AND — no POST request was fired
    expect(postFired).toBe(false);
  });

  // -------------------------------------------------------------------------
  // E2E-C-14 (P0 · AC3)
  // Given the user fills some required fields but leaves others empty
  // When the form is submitted
  // Then inline error messages appear ONLY on the empty required fields
  //   AND no POST request is fired
  // -------------------------------------------------------------------------
  test('E2E-C-14 — formulario parcialmente vacío muestra errores solo en campos vacíos', async ({ page }) => {
    // GIVEN — network intercept BEFORE navigation; fail if POST fires
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

    // WHEN — user opens form, fills only Nombre and NIT, leaves Teléfono and Ciudad empty
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill('Empresa Parcial SA');
    await page.getByTestId('input-nit').fill('900111222-3');
    // Teléfono and Ciudad intentionally left empty

    await page.getByTestId('btn-guardar').click();

    // THEN — form remains open
    await expect(clientesPage.form).toBeVisible();

    // AND — error appears for Teléfono (empty)
    await expect(
      page.getByText(/teléfono.*requerido|el teléfono/i).first()
    ).toBeVisible();

    // AND — error appears for Ciudad (empty)
    await expect(
      page.getByText(/ciudad.*requerida|la ciudad/i).first()
    ).toBeVisible();

    // AND — NO error appears for Nombre (filled)
    await expect(
      page.getByText(/nombre es requerido|el nombre/i)
    ).not.toBeVisible();

    // AND — NO error appears for NIT (filled)
    await expect(page.getByTestId('error-nit')).not.toBeVisible();

    // AND — no POST request was fired
    expect(postFired).toBe(false);
  });

  // -------------------------------------------------------------------------
  // E2E-C-15 (P0 · AC4 — Risk R2)
  // Given the user submits a NIT/RUC that already exists
  // When the backend returns HTTP 409
  // Then an inline error message "El NIT/RUC ya está registrado" appears
  //   in the form without exposing technical details (NFR6),
  //   and the dialog remains open
  // -------------------------------------------------------------------------
  test('E2E-C-15 — NIT duplicado devuelve 409 y muestra "El NIT/RUC ya está registrado" en el formulario', async ({ page }) => {
    // GIVEN — a client with a known NIT already exists in the system
    const existing = buildCliente({ nombre: 'Empresa Existente E2E-C-15' });
    const created = await apiHelper.createCliente(existing);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation (network-first)
    await page.route('**/api/v1/clientes', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user opens the form and submits with the SAME NIT but different Nombre
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill('Empresa Duplicada');
    await page.getByTestId('input-nit').fill(existing.nit);   // duplicate NIT
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Medellín');

    await page.getByTestId('btn-guardar').click();

    // THEN — dialog remains open (form not closed)
    await expect(clientesPage.form).toBeVisible();

    // AND — inline error "El NIT/RUC ya está registrado" is visible
    await expect(page.getByTestId('error-nit')).toBeVisible();
    await expect(page.getByTestId('error-nit')).toContainText('El NIT/RUC ya está registrado');

    // AND — no stack trace, class names, or internal details are shown to the user (NFR6)
    const pageContent = await page.content();
    expect(pageContent).not.toMatch(/at SiesaAgents/i);
    expect(pageContent).not.toMatch(/StackTrace|stackTrace/);
    expect(pageContent).not.toMatch(/DbUpdateException/i);
  });

  // -------------------------------------------------------------------------
  // E2E-C-16 (P1 · AC2)
  // Given all required fields are filled and the backend returns 201
  // When the form is successfully submitted
  // Then a toast notification "Cliente creado correctamente" appears
  // -------------------------------------------------------------------------
  test('E2E-C-16 — toast "Cliente creado correctamente" aparece tras creación exitosa', async ({ page }) => {
    // GIVEN — intercept network BEFORE navigation
    await page.route('**/api/v1/clientes', (route) => route.continue());

    await clientesPage.goto();

    const data = buildCliente({ nombre: 'Empresa Toast E2E-C-16' });

    // WHEN — user fills the form and saves
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-nit').fill(data.nit);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-ciudad').fill(data.ciudad);

    await page.getByTestId('btn-guardar').click();

    // THEN — success toast with Spanish message is visible
    await expect(
      page.getByText(/cliente creado correctamente/i)
    ).toBeVisible();

    // Cleanup
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-C-17 (P1 · AC2)
  // Given all required fields are filled and the backend returns 201
  // When the form is successfully submitted
  // Then the dialog closes automatically WITHOUT the user clicking "Cancelar"
  // -------------------------------------------------------------------------
  test('E2E-C-17 — el formulario se cierra automáticamente tras una creación exitosa', async ({ page }) => {
    // GIVEN — intercept network BEFORE navigation
    await page.route('**/api/v1/clientes', (route) => route.continue());

    await clientesPage.goto();

    const data = buildCliente({ nombre: 'Empresa Autoclose E2E-C-17' });

    // WHEN — user opens form, fills all fields, and clicks "Guardar"
    await clientesPage.btnNuevoCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-nit').fill(data.nit);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-ciudad').fill(data.ciudad);

    await page.getByTestId('btn-guardar').click();

    // THEN — dialog closes automatically (without pressing Cancelar)
    await expect(clientesPage.form).toBeHidden();

    // AND — the list panel is still visible (no full-page navigation occurred)
    await expect(clientesPage.listPanel).toBeVisible();

    // Cleanup
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });
});

// ---------------------------------------------------------------------------
// API Integration Tests
// ---------------------------------------------------------------------------

test.describe('Story 2.3 — API: POST /api/v1/clientes', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // -------------------------------------------------------------------------
  // API-C-01 (P0 · AC2)
  // Given a valid payload with Nombre, Nit, Telefono, Ciudad
  // When POST /api/v1/clientes is called
  // Then the response is 201 Created with a body containing:
  //   id (UUID v4), nombre, nit, telefono, ciudad, createdAt (ISO 8601 with timezone)
  // -------------------------------------------------------------------------
  test('API-C-01 — POST /api/v1/clientes con payload válido devuelve 201 + cuerpo completo con UUID y createdAt ISO 8601', async ({ request }) => {
    // GIVEN — a valid client payload
    const data = buildCliente({ nombre: 'Empresa API-C-01 Test' });

    // WHEN — POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN — response is 201 Created
    expect(response.status()).toBe(201);

    // AND — body contains all required fields
    const body = await response.json();

    // id must be UUID v4
    expect(typeof body.id).toBe('string');
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    createdIds.push(body.id);

    // data fields must match submitted payload
    expect(body.nombre).toBe(data.nombre);
    expect(body.nit).toBe(data.nit);
    expect(body.telefono).toBe(data.telefono);
    expect(body.ciudad).toBe(data.ciudad);

    // createdAt must be ISO 8601 with timezone offset (DateTimeOffset — not plain DateTime)
    expect(typeof body.createdAt).toBe('string');
    expect(body.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );

    // Response must NOT be a wrapper object { data: {...} }
    expect(body.data).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-C-02 (P0 · AC4 — Risk R2)
  // Given a NIT that already exists in the system
  // When POST /api/v1/clientes is called with the same NIT
  // Then the response is 409 Conflict with a Problem Details body
  //   AND the body does NOT contain a stackTrace key (NFR6)
  // -------------------------------------------------------------------------
  test('API-C-02 — POST /api/v1/clientes con NIT duplicado devuelve 409 + Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — a client is created first
    const original = buildCliente({ nombre: 'Empresa Original API-C-02' });
    const createResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: original });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json();
    createdIds.push(created.id);

    // WHEN — POST again with the same NIT but different Nombre
    const duplicate = { ...original, nombre: 'Empresa Duplicada API-C-02' };
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: duplicate });

    // THEN — response is 409 Conflict
    expect(response.status()).toBe(409);

    // AND — body is Problem Details (RFC 7807)
    const body = await response.json();
    expect(body.status).toBe(409);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // AND — detail contains the Spanish user-facing message
    expect(body.detail).toMatch(/NIT|RUC|registrado/i);

    // AND — no stack trace or internal error information exposed (NFR6)
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
    const bodyText = JSON.stringify(body);
    expect(bodyText).not.toMatch(/at SiesaAgents/i);
    expect(bodyText).not.toMatch(/DbUpdateException/i);
  });

  // -------------------------------------------------------------------------
  // API-C-03 (P0 · AC3)
  // Given a payload with the required field Nombre missing
  // When POST /api/v1/clientes is called
  // Then the response is 400 Bad Request with a Problem Details body
  // -------------------------------------------------------------------------
  test('API-C-03 — POST /api/v1/clientes sin campo nombre devuelve 400 + Problem Details', async ({ request }) => {
    // GIVEN — payload missing the required Nombre field
    const invalidPayload = {
      nit: '900000001-0',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      // nombre intentionally omitted
    };

    // WHEN — POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: invalidPayload });

    // THEN — response is 400 Bad Request
    expect(response.status()).toBe(400);

    // AND — body is Problem Details (RFC 7807)
    const body = await response.json();
    expect(body.status).toBe(400);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // AND — no stack trace exposed (NFR6)
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
  });
});
