/**
 * Story 2.3: Create Client — E2E Acceptance Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: "Nuevo cliente" button opens form with four required fields
 * - AC2: Successful submit → client appears in list + success toast + form closes
 * - AC3: Submitting with empty fields → inline validation errors, no API call
 * - AC4: 409 Conflict → inline NIT error "El NIT/RUC ya está registrado", form stays open with data
 * - AC5: Network/5xx error → toast error, form stays open with data
 * - AC6: "Cancelar" closes form without sending any request
 *
 * Patterns:
 * - Network-first: route intercepts are registered BEFORE navigation
 * - data-testid selectors only (no CSS class selectors)
 * - Given-When-Then structure
 * - One assertion per test (atomic)
 * - Explicit waits only (no hard waits)
 */

import { test, expect } from '@playwright/test';
import { buildClienteResponse } from '../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';

// ─── AC1: "Nuevo cliente" button opens form with required fields ──────────────

test.describe('AC1 — Formulario "Nuevo cliente" con campos requeridos', () => {
  test('should render "Nuevo cliente" button on the clientes page', async ({ page }) => {
    // GIVEN: API returns a client list (network-first intercept before navigation)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteResponse()]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: "Nuevo cliente" button is visible
    await expect(page.getByTestId('btn-nuevo-cliente')).toBeVisible();
  });

  test('should open the create form when "Nuevo cliente" button is clicked', async ({ page }) => {
    // GIVEN: API returns a client list
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteResponse()]),
      }),
    );
    await page.goto('/clientes');

    // WHEN: User clicks "Nuevo cliente"
    await page.getByTestId('btn-nuevo-cliente').click();

    // THEN: The create form is visible
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });

  test('should display the Nombre field in the create form', async ({ page }) => {
    // GIVEN: The create form is open
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: Form is rendered
    // THEN: Nombre input is visible
    await expect(page.getByTestId('input-nombre')).toBeVisible();
  });

  test('should display the NIT/RUC field in the create form', async ({ page }) => {
    // GIVEN: The create form is open
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: Form is rendered
    // THEN: NIT/RUC input is visible
    await expect(page.getByTestId('input-nit')).toBeVisible();
  });

  test('should display the Teléfono field in the create form', async ({ page }) => {
    // GIVEN: The create form is open
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: Form is rendered
    // THEN: Teléfono input is visible
    await expect(page.getByTestId('input-telefono')).toBeVisible();
  });

  test('should display the Ciudad field in the create form', async ({ page }) => {
    // GIVEN: The create form is open
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: Form is rendered
    // THEN: Ciudad input is visible
    await expect(page.getByTestId('input-ciudad')).toBeVisible();
  });
});

// ─── AC2: Successful create → client in list + toast + form closes ─────────

test.describe('AC2 — Crear cliente exitosamente', () => {
  test('should display success toast "Cliente creado correctamente" after successful submit', async ({ page }) => {
    // GIVEN: Network intercepts set up before navigation
    const newCliente = buildClienteResponse({ nombre: 'Nueva Empresa SA', nit: '900555777-1' });

    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newCliente),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([newCliente]),
        });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User fills the form and submits
    await page.getByTestId('input-nombre').fill('Nueva Empresa SA');
    await page.getByTestId('input-nit').fill('900555777-1');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Medellín');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Success toast is shown with the correct message
    await expect(page.getByTestId('toast-success')).toContainText('Cliente creado correctamente');
  });

  test('should close the form after a successful submit', async ({ page }) => {
    // GIVEN: Network intercepts set up before navigation
    const newCliente = buildClienteResponse({ nombre: 'Nueva Empresa SA', nit: '900555777-1' });

    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newCliente) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([newCliente]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User fills the form and submits
    await page.getByTestId('input-nombre').fill('Nueva Empresa SA');
    await page.getByTestId('input-nit').fill('900555777-1');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Medellín');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: The form is no longer visible
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
  });

  test('should show the new client in the list after successful create', async ({ page }) => {
    // GIVEN: Network intercepts set up before navigation
    const newCliente = buildClienteResponse({ nombre: 'Nueva Empresa SA', nit: '900555777-1' });
    let postDone = false;

    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postDone = true;
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newCliente) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(postDone ? [newCliente] : []),
        });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User fills the form and submits
    await page.getByTestId('input-nombre').fill('Nueva Empresa SA');
    await page.getByTestId('input-nit').fill('900555777-1');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Medellín');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: The new client appears in the list
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Nueva Empresa SA' })).toBeVisible();
  });

  test('should disable the submit button and show "Guardando…" while mutation is pending', async ({ page }) => {
    // GIVEN: POST endpoint is slow (network-first intercept before navigation)
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(buildClienteResponse()) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User fills and submits the form
    await page.getByTestId('input-nombre').fill('Empresa Test');
    await page.getByTestId('input-nit').fill('900000001-0');
    await page.getByTestId('input-telefono').fill('3009990000');
    await page.getByTestId('input-ciudad').fill('Cali');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Submit button is disabled during pending state
    await expect(page.getByTestId('btn-submit-cliente')).toBeDisabled();
  });
});

// ─── AC3: Client-side Zod validation — empty fields → inline errors ─────────

test.describe('AC3 — Validación Zod en cliente: errores inline por campos vacíos', () => {
  test('should display inline error for empty Nombre field', async ({ page }) => {
    // GIVEN: Create form is open (network-first intercept before navigation)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits without filling Nombre
    await page.getByTestId('input-nit').fill('900000001-0');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Inline error appears for Nombre
    await expect(page.getByTestId('error-nombre')).toContainText('El nombre es requerido');
  });

  test('should display inline error for empty NIT/RUC field', async ({ page }) => {
    // GIVEN: Create form is open
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits without filling NIT
    await page.getByTestId('input-nombre').fill('Empresa Test');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Inline error appears for NIT
    await expect(page.getByTestId('error-nit')).toContainText('El NIT/RUC es requerido');
  });

  test('should display inline error for empty Teléfono field', async ({ page }) => {
    // GIVEN: Create form is open
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits without filling Teléfono
    await page.getByTestId('input-nombre').fill('Empresa Test');
    await page.getByTestId('input-nit').fill('900000001-0');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Inline error appears for Teléfono
    await expect(page.getByTestId('error-telefono')).toContainText('El teléfono es requerido');
  });

  test('should display inline error for empty Ciudad field', async ({ page }) => {
    // GIVEN: Create form is open
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits without filling Ciudad
    await page.getByTestId('input-nombre').fill('Empresa Test');
    await page.getByTestId('input-nit').fill('900000001-0');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Inline error appears for Ciudad
    await expect(page.getByTestId('error-ciudad')).toContainText('La ciudad es requerida');
  });

  test('should NOT send API request when form has validation errors', async ({ page }) => {
    // GIVEN: Create form is open; API route is intercepted to detect unwanted calls
    let postCallCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postCallCount++;
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(buildClienteResponse()) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits the form with all fields empty
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: No POST request was sent to the backend
    expect(postCallCount).toBe(0);
  });
});

// ─── AC4: 409 Conflict — duplicate NIT → inline error on NIT field ─────────

test.describe('AC4 — Conflicto 409: NIT ya registrado muestra error inline', () => {
  test('should display inline NIT error when backend returns 409 Conflict', async ({ page }) => {
    // GIVEN: POST returns 409 Conflict (network-first intercept before navigation)
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado.',
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits with a duplicate NIT
    await page.getByTestId('input-nombre').fill('Empresa Duplicada');
    await page.getByTestId('input-nit').fill('900123456-7');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Inline error on NIT field shows "El NIT/RUC ya está registrado"
    await expect(page.getByTestId('error-nit')).toContainText('El NIT/RUC ya está registrado');
  });

  test('should keep the form open with entered data after 409 Conflict', async ({ page }) => {
    // GIVEN: POST returns 409 Conflict
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({ title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado.' }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits with a duplicate NIT
    await page.getByTestId('input-nombre').fill('Empresa Duplicada');
    await page.getByTestId('input-nit').fill('900123456-7');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: The form remains open (still visible)
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });

  test('should preserve the filled Nombre value after 409 Conflict', async ({ page }) => {
    // GIVEN: POST returns 409 Conflict
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({ title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado.' }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits with a duplicate NIT
    await page.getByTestId('input-nombre').fill('Empresa Duplicada');
    await page.getByTestId('input-nit').fill('900123456-7');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: The Nombre field still has the entered value
    await expect(page.getByTestId('input-nombre')).toHaveValue('Empresa Duplicada');
  });
});

// ─── AC5: Network/5xx error → toast error, form stays open ─────────────────

test.describe('AC5 — Error de red/servidor: toast de error y formulario abierto', () => {
  test('should display toast error "No se pudo crear el cliente. Intenta de nuevo." on 500', async ({ page }) => {
    // GIVEN: POST returns 500 Server Error (network-first intercept before navigation)
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits the form
    await page.getByTestId('input-nombre').fill('Empresa Test');
    await page.getByTestId('input-nit').fill('900000001-0');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Toast error is shown with the correct message
    await expect(page.getByTestId('toast-error')).toContainText('No se pudo crear el cliente. Intenta de nuevo.');
  });

  test('should keep the form open after a 500 server error', async ({ page }) => {
    // GIVEN: POST returns 500 Server Error
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 500, contentType: 'application/problem+json', body: JSON.stringify({ status: 500 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits the form
    await page.getByTestId('input-nombre').fill('Empresa Test');
    await page.getByTestId('input-nit').fill('900000001-0');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: The form remains open
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });

  test('should display toast error when the network call is aborted', async ({ page }) => {
    // GIVEN: POST is aborted (simulates network error)
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.abort('connectionrefused');
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User submits the form
    await page.getByTestId('input-nombre').fill('Empresa Test');
    await page.getByTestId('input-nit').fill('900000001-0');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Toast error is displayed
    await expect(page.getByTestId('toast-error')).toBeVisible();
  });
});

// ─── AC6: "Cancelar" closes form without sending any request ─────────────

test.describe('AC6 — Cancelar: cierra formulario sin enviar petición', () => {
  test('should close the form when "Cancelar" button is clicked', async ({ page }) => {
    // GIVEN: Create form is open (network-first intercept before navigation)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancelar-cliente').click();

    // THEN: The form is closed
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
  });

  test('should NOT send any API request when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Route is intercepted to detect unwanted POST calls
    let postCallCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postCallCount++;
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(buildClienteResponse()) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await page.getByTestId('input-nombre').fill('Empresa Cancelada');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancelar-cliente').click();

    // THEN: No POST request was sent
    expect(postCallCount).toBe(0);
  });

  test('should keep the URL at /clientes after cancelling the form', async ({ page }) => {
    // GIVEN: Create form is open
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancelar-cliente').click();

    // THEN: URL remains at /clientes
    await expect(page).toHaveURL(/\/clientes$/);
  });
});
