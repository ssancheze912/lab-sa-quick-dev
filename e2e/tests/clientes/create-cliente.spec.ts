/**
 * E2E Acceptance Tests — Create Client (Story 2.3)
 * RED phase — ClienteForm.tsx and POST /api/v1/clientes endpoint do not exist yet.
 *
 * Acceptance Criteria covered:
 *   AC-1  Clicking "Nuevo cliente" opens form with 4 required fields
 *   AC-2  Submitting valid form → POST /api/v1/clientes → new client in list + success toast
 *   AC-3  Submitting empty fields → inline validation errors, form NOT submitted
 *   AC-4  POST returns 409 → "El NIT/RUC ya está registrado" shown, no stack trace
 *   AC-5  Clicking "Cancelar" closes form without mutation
 *   AC-6  onSuccess fires → queryClient.invalidateQueries(['clientes']) → list re-fetches
 *
 * Network-first: all page.route() intercepts MUST be set before page.goto() / navigation.
 *
 * Given-When-Then format per test.
 */

import { test, expect } from '@playwright/test';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE = 'http://localhost:5000';
const CLIENTES_API = `${API_BASE}/api/v1/clientes`;

test.describe('Story 2.3 — Create Client', () => {
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
  // AC-1: Clicking "Nuevo cliente" opens form with all 4 required fields
  // ---------------------------------------------------------------------------

  test('AC-1: should open form with Nombre, NIT/RUC, Teléfono, Ciudad fields when "Nuevo cliente" is clicked', async ({ page }) => {
    // GIVEN: User is on /clientes view (network-first: intercept before navigate)
    await page.route(`${CLIENTES_API}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await clientesPage.goto();

    // WHEN: User clicks "Nuevo cliente"
    await clientesPage.btnNuevoCliente.click();

    // THEN: Form opens with all 4 input fields visible
    await expect(clientesPage.form).toBeVisible();
    await expect(clientesPage.inputNombre).toBeVisible();
    await expect(clientesPage.inputNit).toBeVisible();
    await expect(clientesPage.inputTelefono).toBeVisible();
    await expect(clientesPage.inputCiudad).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC-2: Fill all fields, submit → POST, list updated, toast shown
  // ---------------------------------------------------------------------------

  test('AC-2: should create client via POST, show toast, and display new client in list', async ({ page }) => {
    // GIVEN: Prepare test data
    const newCliente = buildCliente();
    const createdDto = {
      id: '00000000-0000-0000-0000-000000000099',
      ...newCliente,
      createdAt: '2026-06-29T10:00:00Z',
    };

    // GIVEN: Network-first — intercept before navigation
    // Initial GET returns empty list
    await page.route(`${CLIENTES_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdDto),
        });
      } else {
        await route.continue();
      }
    });

    await clientesPage.goto();

    // WHEN: User opens form, fills all 4 fields, and clicks "Guardar"
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario(newCliente);

    // Re-route GET to return the new client (simulates cache invalidation + re-fetch)
    await page.route(`${CLIENTES_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([createdDto]),
        });
      } else {
        await route.continue();
      }
    });

    await clientesPage.btnGuardar.click();

    // THEN: Success toast is shown
    await expect(
      page.getByText(/cliente creado correctamente/i)
    ).toBeVisible();

    // THEN: Form closes after successful submit
    await expect(clientesPage.form).toBeHidden();

    // THEN: New client appears in the list
    await expect(
      clientesPage.clienteItems.filter({ hasText: newCliente.nombre })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC-3: Empty fields → inline errors, form NOT submitted to backend
  // ---------------------------------------------------------------------------

  test('AC-3: should show inline validation errors when submitting empty form and NOT call POST', async ({ page }) => {
    // GIVEN: Network-first intercept — POST would fail the test if called
    let postWasCalled = false;

    await page.route(`${CLIENTES_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'POST') {
        postWasCalled = true;
        await route.fulfill({ status: 201, body: '{}' });
      } else {
        await route.continue();
      }
    });

    await clientesPage.goto();

    // WHEN: User opens form and clicks "Guardar" without filling any field
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.btnGuardar.click();

    // THEN: Form remains open (not submitted)
    await expect(clientesPage.form).toBeVisible();

    // THEN: At least one inline validation error is visible
    await expect(
      page.getByText(/requerido|obligatorio|campo requerido/i).first()
    ).toBeVisible();

    // THEN: POST was NOT called (Zod blocked submission)
    expect(postWasCalled).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // AC-4: POST returns 409 → "El NIT/RUC ya está registrado", no stack trace
  // ---------------------------------------------------------------------------

  test('AC-4: should show "El NIT/RUC ya está registrado" when backend returns 409', async ({ page }) => {
    // GIVEN: Network-first — intercept POST to return 409 Conflict
    const existingCliente = buildCliente();

    await page.route(`${CLIENTES_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            status: 409,
            title: 'Conflict',
            detail: 'El NIT/RUC ya está registrado',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await clientesPage.goto();

    // WHEN: User fills form with a NIT that already exists and submits
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario({
      ...existingCliente,
      nombre: 'Empresa Diferente',
    });
    await clientesPage.btnGuardar.click();

    // THEN: The form remains open
    await expect(clientesPage.form).toBeVisible();

    // THEN: Error message "El NIT/RUC ya está registrado" is displayed
    await expect(
      page.getByText(/el nit\/ruc ya está registrado/i)
    ).toBeVisible();

    // THEN: No stack trace or technical details shown in UI
    await expect(page.getByText(/stackTrace/i)).not.toBeVisible();
    await expect(page.getByText(/innerException/i)).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC-5: Clicking "Cancelar" closes form without any mutation
  // ---------------------------------------------------------------------------

  test('AC-5: should close form without POST when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Network-first — POST would fail the test if called
    let postWasCalled = false;

    await page.route(`${CLIENTES_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'POST') {
        postWasCalled = true;
        await route.fulfill({ status: 201, body: '{}' });
      } else {
        await route.continue();
      }
    });

    await clientesPage.goto();

    // WHEN: User opens form, partially fills it, then clicks "Cancelar"
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.inputNombre.fill('Empresa Parcial');

    await clientesPage.btnCancelar.click();

    // THEN: Form closes
    await expect(clientesPage.form).toBeHidden();

    // THEN: POST was NOT called
    expect(postWasCalled).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // AC-6: After successful create, list re-fetches (cache invalidation via GET)
  // ---------------------------------------------------------------------------

  test('AC-6: should re-fetch client list after successful creation (cache invalidation)', async ({ page }) => {
    // GIVEN: Network-first — track number of GET calls to verify re-fetch
    const newCliente = buildCliente();
    const createdDto = {
      id: '00000000-0000-0000-0000-000000000099',
      ...newCliente,
      createdAt: '2026-06-29T10:00:00Z',
    };

    let getCallCount = 0;

    await page.route(`${CLIENTES_API}`, async (route) => {
      if (route.request().method() === 'GET') {
        getCallCount++;
        if (getCallCount === 1) {
          // First GET: empty list on initial load
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else {
          // Subsequent GETs (after invalidation): return the new client
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([createdDto]),
          });
        }
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdDto),
        });
      } else {
        await route.continue();
      }
    });

    await clientesPage.goto();

    // WHEN: User creates a new client
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario(newCliente);
    await clientesPage.btnGuardar.click();

    // THEN: GET is called at least twice (initial + re-fetch after invalidation)
    await expect(
      clientesPage.clienteItems.filter({ hasText: newCliente.nombre })
    ).toBeVisible();

    expect(getCallCount).toBeGreaterThanOrEqual(2);
  });
});
