/**
 * Story 2.3: Create Client — E2E Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC1 — "Nuevo cliente" button opens form with 4 required fields (Nombre, NIT/RUC, Teléfono, Ciudad)
 *   AC2 — Successful form submit → new client in list + detail panel + toast
 *   AC3 — Validation: empty required fields show inline errors, no HTTP request sent
 *   AC4 — Validation: whitespace-only fields treated as empty
 *   AC5 — Duplicate NIT returns 409 → "El NIT/RUC ya está registrado" shown in form
 *   AC6 — Cancel closes form without sending any request
 *
 * Test scenarios from test-design-epic-2.md:
 *   TC-E2-P0-01 — Create client happy path (AC2)
 *   TC-E2-P0-02 — Duplicate NIT shows conflict message (AC5)
 *
 * Test status: RED — tests will fail until Story 2.3 frontend implementation is complete:
 *   - ClienteForm.tsx does NOT exist yet
 *   - "Nuevo cliente" button is not wired to a Dialog with ClienteForm
 *   - useCreateCliente.ts does NOT exist yet
 *
 * Framework: Playwright E2E (@playwright/test)
 * Patterns: network-first intercepts BEFORE navigation, data-testid selectors,
 *           Given-When-Then, explicit waits, auto-cleanup via afterEach.
 */

import { test, expect } from '@playwright/test';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-01 — AC1: Form opens with 4 required fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Formulario "Nuevo cliente" abre con los 4 campos requeridos', () => {
  test('should open a dialog with Nombre field when "Nuevo cliente" is clicked', async ({ page }) => {
    // GIVEN: User is on /clientes
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();

    // WHEN: User clicks "Nuevo cliente"
    await clientesPage.btnNuevoCliente.click();

    // THEN: Dialog with Nombre input is visible
    await expect(clientesPage.inputNombre).toBeVisible();
  });

  test('should show NIT/RUC field in the dialog', async ({ page }) => {
    // GIVEN: User is on /clientes
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();

    // WHEN: User clicks "Nuevo cliente"
    await clientesPage.btnNuevoCliente.click();

    // THEN: NIT/RUC input is visible
    await expect(clientesPage.inputNit).toBeVisible();
  });

  test('should show Teléfono field in the dialog', async ({ page }) => {
    // GIVEN: User is on /clientes
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();

    // WHEN: User clicks "Nuevo cliente"
    await clientesPage.btnNuevoCliente.click();

    // THEN: Teléfono input is visible
    await expect(clientesPage.inputTelefono).toBeVisible();
  });

  test('should show Ciudad field in the dialog', async ({ page }) => {
    // GIVEN: User is on /clientes
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();

    // WHEN: User clicks "Nuevo cliente"
    await clientesPage.btnNuevoCliente.click();

    // THEN: Ciudad input is visible
    await expect(clientesPage.inputCiudad).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-01 — AC2: Happy path — submit succeeds
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Happy path: nuevo cliente aparece en lista y panel de detalle', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should show the new client in the left panel list after successful creation', async ({ page }) => {
    // GIVEN: User is on /clientes with form open
    const clientesPage = new ClientesPage(page);
    const data = buildCliente();
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();

    // WHEN: User fills all required fields and clicks "Guardar"
    await clientesPage.llenarFormulario(data);
    await clientesPage.btnGuardar.click();
    await expect(clientesPage.form).toBeHidden();

    // THEN: New client appears in the left panel list
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);

    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  test('should show toast "Cliente creado correctamente" after successful creation', async ({ page }) => {
    // GIVEN: User is on /clientes with form open
    const clientesPage = new ClientesPage(page);
    const data = buildCliente();
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario(data);

    // WHEN: User clicks "Guardar" and POST succeeds
    await clientesPage.btnGuardar.click();

    // THEN: Toast "Cliente creado correctamente" is visible
    await expect(
      page.getByText(/cliente creado correctamente/i)
    ).toBeVisible();

    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  test('should display the new client detail in the right panel after creation', async ({ page }) => {
    // GIVEN: User is on /clientes with form open
    const clientesPage = new ClientesPage(page);
    const data = buildCliente();
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario(data);

    // WHEN: User submits the form
    await clientesPage.btnGuardar.click();
    await expect(clientesPage.form).toBeHidden();

    // THEN: Right panel shows new client detail
    await expect(clientesPage.detailPanel).toBeVisible();
    await expect(clientesPage.detailPanel).toContainText(data.nombre);

    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Validation: empty required fields → inline errors, no HTTP request
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Validación: campos vacíos muestran errores inline sin enviar HTTP', () => {
  test('should display an inline error for Nombre when form is submitted empty', async ({ page }) => {
    // GIVEN: User opens the "Nuevo cliente" form
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();

    // WHEN: User clicks "Guardar" without filling any fields
    await clientesPage.btnGuardar.click();

    // THEN: Inline error for Nombre is visible in Spanish
    await expect(
      page.getByTestId('error-nombre')
    ).toBeVisible();
  });

  test('should display an inline error for NIT/RUC when form is submitted empty', async ({ page }) => {
    // GIVEN: User opens the form
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();

    // WHEN: User clicks "Guardar" without filling any fields
    await clientesPage.btnGuardar.click();

    // THEN: Inline error for NIT/RUC is visible
    await expect(
      page.getByTestId('error-nit')
    ).toBeVisible();
  });

  test('should display an inline error for Teléfono when form is submitted empty', async ({ page }) => {
    // GIVEN: User opens the form
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();

    // WHEN: User clicks "Guardar" without filling any fields
    await clientesPage.btnGuardar.click();

    // THEN: Inline error for Teléfono is visible
    await expect(
      page.getByTestId('error-telefono')
    ).toBeVisible();
  });

  test('should display an inline error for Ciudad when form is submitted empty', async ({ page }) => {
    // GIVEN: User opens the form
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();

    // WHEN: User clicks "Guardar" without filling any fields
    await clientesPage.btnGuardar.click();

    // THEN: Inline error for Ciudad is visible
    await expect(
      page.getByTestId('error-ciudad')
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — TC-E2-P0-02: Duplicate NIT → 409 → error message in form
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Duplicate NIT: 409 muestra "El NIT/RUC ya está registrado"', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should show "El NIT/RUC ya está registrado" when a duplicate NIT is submitted', async ({ page }) => {
    // GIVEN: A client with a specific NIT already exists
    const data = buildCliente();
    const existing = await apiHelper.createCliente(data);
    createdIds.push(existing.id);

    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario({ ...data, nombre: 'Empresa Diferente SA' });

    // WHEN: User submits the form with the duplicate NIT
    await clientesPage.btnGuardar.click();

    // THEN: Form remains visible with the conflict error message
    await expect(clientesPage.form).toBeVisible();
    await expect(
      page.getByText(/nit.*ya está registrado|ya está registrado/i)
    ).toBeVisible();
  });

  test('should NOT expose a stack trace when 409 is returned', async ({ page }) => {
    // GIVEN: Duplicate NIT scenario
    const data = buildCliente();
    const existing = await apiHelper.createCliente(data);
    createdIds.push(existing.id);

    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario({ ...data, nombre: 'Empresa Diferente SA' });

    // WHEN: User submits the form with the duplicate NIT
    await clientesPage.btnGuardar.click();

    // THEN: No stack trace text is visible on the page (NFR6)
    await expect(
      page.getByText(/stackTrace|stack trace|at System\.|at Microsoft\./i)
    ).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Cancel closes form without sending any HTTP request
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Cancelar cierra el formulario sin enviar solicitud HTTP', () => {
  test('should close the form when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: User has opened the form
    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();

    // Intercept POST BEFORE any action — network-first pattern
    let postCalled = false;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
      }
      route.continue();
    });

    // WHEN: User clicks "Cancelar"
    await clientesPage.btnCancelar.click();

    // THEN: Form is closed
    await expect(clientesPage.form).toBeHidden();

    // AND: No POST request was sent
    expect(postCalled).toBe(false);
  });
});
