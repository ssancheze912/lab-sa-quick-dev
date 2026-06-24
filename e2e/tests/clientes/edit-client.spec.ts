/**
 * E2E Tests — Story 2.4: Edit Client
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — "Editar" button opens client form pre-filled with all current field values
 *   AC2 — Successful save calls PUT /api/v1/clientes/{id}, refreshes list and detail, shows success toast
 *   AC3 — Clearing a required field and submitting shows inline validation error; no backend call
 *   AC4 — Clicking "Cancelar" closes form without saving; original data unchanged; no API call
 *   AC5 — In-flight submission disables submit button and shows "Guardando..."
 *   AC6 — Backend 409 Conflict shows "El NIT/RUC ya está registrado" without technical details
 *
 * Required data-testid attributes (must be added during implementation):
 *   - editar-cliente-button   → "Editar" trigger button inside ClienteDetailView
 *   - cliente-form            → <form> root (already used in Story 2.3; reused here in edit mode)
 *   - field-nombre            → <input> for Nombre
 *   - field-nit               → <input> for NIT/RUC
 *   - field-telefono          → <input> for Teléfono
 *   - field-ciudad            → <input> for Ciudad
 *   - submit-button           → submit button inside the form
 *   - cancel-button           → cancel button inside the form
 *
 * Network intercept strategy: ALWAYS intercept routes BEFORE navigation (network-first).
 */

import { test, expect } from '@playwright/test';
import { createClienteDto, createClienteDtos } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';
const API_CLIENTE_BY_ID = '**/api/v1/clientes/**';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Editar" button opens form pre-filled with current client values
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — "Editar" button opens form pre-filled with client data', () => {
  test('should display an "Editar" button in the client detail panel', async ({ page }) => {
    // GIVEN: A client is loaded in the detail panel
    const cliente = createClienteDto({ nombre: 'Empresa Editada SA', nit: '900100200-1', telefono: '3011112222', ciudad: 'Medellín' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User navigates to the client detail
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The "Editar" button is visible in the detail panel
    await expect(page.getByTestId('editar-cliente-button')).toBeVisible();
  });

  test('should open the edit form when "Editar" is clicked', async ({ page }) => {
    // GIVEN: User is on a client detail view
    const cliente = createClienteDto({ nombre: 'Empresa A SAS', nit: '900200300-2', telefono: '3021112222', ciudad: 'Cali' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);

    // WHEN: User clicks "Editar"
    await page.getByTestId('editar-cliente-button').click();

    // THEN: The client form is visible
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });

  test('should pre-fill the Nombre field with the current client value', async ({ page }) => {
    // GIVEN: A client with known Nombre exists in the detail panel
    const cliente = createClienteDto({ nombre: 'Pre-Fill Corp', nit: '900300400-3', telefono: '3031112222', ciudad: 'Barranquilla' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: The Nombre field is pre-filled with the current value
    await expect(page.getByTestId('field-nombre')).toHaveValue(cliente.nombre);
  });

  test('should pre-fill the NIT/RUC field with the current client value', async ({ page }) => {
    // GIVEN: A client with known NIT exists
    const cliente = createClienteDto({ nombre: 'NIT Corp', nit: '900400500-4', telefono: '3041112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: The NIT/RUC field is pre-filled with the current value
    await expect(page.getByTestId('field-nit')).toHaveValue(cliente.nit);
  });

  test('should pre-fill the Teléfono field with the current client value', async ({ page }) => {
    // GIVEN: A client with known Teléfono exists
    const cliente = createClienteDto({ nombre: 'Tel Corp', nit: '900500600-5', telefono: '3051112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: The Teléfono field is pre-filled with the current value
    await expect(page.getByTestId('field-telefono')).toHaveValue(cliente.telefono);
  });

  test('should pre-fill the Ciudad field with the current client value', async ({ page }) => {
    // GIVEN: A client with known Ciudad exists
    const cliente = createClienteDto({ nombre: 'Ciudad Corp', nit: '900600700-6', telefono: '3061112222', ciudad: 'Cartagena' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: The Ciudad field is pre-filled with the current value
    await expect(page.getByTestId('field-ciudad')).toHaveValue(cliente.ciudad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Successful save calls PUT, refreshes list + detail, shows success toast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Successful edit saves via PUT and refreshes data immediately', () => {
  test('should call PUT /api/v1/clientes/{id} when the edit form is submitted with valid data', async ({ page }) => {
    // GIVEN: User has opened the edit form for a client
    const cliente = createClienteDto({ nombre: 'Empresa Original SA', nit: '900700800-7', telefono: '3071112222', ciudad: 'Bogotá' });
    let putCalled = false;

    // Network-first: intercept BEFORE navigation
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        const updated = { ...cliente, nombre: 'Empresa Modificada SA', updatedAt: new Date().toISOString() };
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();

    // WHEN: User modifies Nombre and submits
    await page.getByTestId('field-nombre').fill('Empresa Modificada SA');
    await page.getByTestId('submit-button').click();

    // THEN: PUT was called to the backend
    await expect.poll(() => putCalled).toBe(true);
  });

  test('should close the edit form after a successful save', async ({ page }) => {
    // GIVEN: User has filled and submitted the edit form
    const cliente = createClienteDto({ nombre: 'Empresa Antes SA', nit: '900800900-8', telefono: '3081112222', ciudad: 'Bogotá' });
    const updated = { ...cliente, nombre: 'Empresa Después SA', updatedAt: new Date().toISOString() };

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([updated]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa Después SA');

    // WHEN: Form is submitted
    await page.getByTestId('submit-button').click();

    // THEN: The edit form closes
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
  });

  test('should display a success toast "Cliente actualizado correctamente" after a successful save', async ({ page }) => {
    // GIVEN: User submits the edit form successfully
    const cliente = createClienteDto({ nombre: 'Toast Test SA', nit: '900900100-9', telefono: '3091112222', ciudad: 'Bogotá' });
    const updated = { ...cliente, nombre: 'Toast Test Modificado SA', updatedAt: new Date().toISOString() };

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([updated]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Toast Test Modificado SA');

    // WHEN: Form is submitted
    await page.getByTestId('submit-button').click();

    // THEN: A success toast with the Spanish message is shown
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();
  });

  test('should re-fetch the client list (invalidateQueries "clientes") after a successful save', async ({ page }) => {
    // GIVEN: The edit is submitted successfully
    const cliente = createClienteDto({ nombre: 'Invalidate List SA', nit: '901000200-1', telefono: '3101112222', ciudad: 'Bogotá' });
    const updated = { ...cliente, nombre: 'Invalidate List Nuevo SA', updatedAt: new Date().toISOString() };
    let getListCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      getListCallCount++;
      const body = getListCallCount === 1 ? JSON.stringify([cliente]) : JSON.stringify([updated]);
      return route.fulfill({ status: 200, contentType: 'application/json', body });
    });
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Invalidate List Nuevo SA');

    // WHEN: Form is saved successfully
    await page.getByTestId('submit-button').click();

    // THEN: A second GET /api/v1/clientes is triggered (TanStack Query invalidateQueries)
    await expect.poll(() => getListCallCount).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Clearing required field shows inline error; form NOT submitted
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Client-side validation: cleared required field shows inline error without backend call', () => {
  test('should show inline error for Nombre when it is cleared and form is submitted', async ({ page }) => {
    // GIVEN: User opens the edit form (Nombre pre-filled) and clears it
    const cliente = createClienteDto({ nombre: 'Val Test Corp', nit: '901100300-1', telefono: '3111112222', ciudad: 'Bogotá' });
    let putCalled = false;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clears the Nombre field and submits
    await page.getByTestId('field-nombre').fill('');
    await page.getByTestId('submit-button').click();

    // THEN: Inline error for Nombre is visible
    await expect(page.getByText('El nombre es requerido')).toBeVisible();
    // AND: No PUT request was made
    expect(putCalled).toBe(false);
  });

  test('should show inline error for NIT when it is cleared and form is submitted', async ({ page }) => {
    // GIVEN: User opens the edit form and clears the NIT field
    const cliente = createClienteDto({ nombre: 'NIT Clear Corp', nit: '901200400-1', telefono: '3121112222', ciudad: 'Bogotá' });
    let putCalled = false;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clears NIT and submits
    await page.getByTestId('field-nit').fill('');
    await page.getByTestId('submit-button').click();

    // THEN: Inline error for NIT is visible
    await expect(page.getByText('El NIT/RUC es requerido')).toBeVisible();
    expect(putCalled).toBe(false);
  });

  test('should show inline error for Teléfono when it is cleared and form is submitted', async ({ page }) => {
    // GIVEN: User opens the edit form and clears Teléfono
    const cliente = createClienteDto({ nombre: 'Tel Clear Corp', nit: '901300500-1', telefono: '3131112222', ciudad: 'Bogotá' });
    let putCalled = false;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clears Teléfono and submits
    await page.getByTestId('field-telefono').fill('');
    await page.getByTestId('submit-button').click();

    // THEN: Inline error for Teléfono is visible
    await expect(page.getByText('El teléfono es requerido')).toBeVisible();
    expect(putCalled).toBe(false);
  });

  test('should show inline error for Ciudad when it is cleared and form is submitted', async ({ page }) => {
    // GIVEN: User opens the edit form and clears Ciudad
    const cliente = createClienteDto({ nombre: 'Ciudad Clear Corp', nit: '901400600-1', telefono: '3141112222', ciudad: 'Bogotá' });
    let putCalled = false;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clears Ciudad and submits
    await page.getByTestId('field-ciudad').fill('');
    await page.getByTestId('submit-button').click();

    // THEN: Inline error for Ciudad is visible
    await expect(page.getByText('La ciudad es requerida')).toBeVisible();
    expect(putCalled).toBe(false);
  });

  test('should keep the edit form open when client-side validation fails', async ({ page }) => {
    // GIVEN: User has cleared a required field in the edit form
    const cliente = createClienteDto({ nombre: 'Form Open Corp', nit: '901500700-1', telefono: '3151112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('');

    // WHEN: User submits with cleared Nombre
    await page.getByTestId('submit-button').click();

    // THEN: The form remains open
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Cancel closes form without saving; original data unchanged; no PUT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — "Cancelar" closes edit form without saving; original data unchanged', () => {
  test('should close the edit form when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: User has opened the edit form
    const cliente = createClienteDto({ nombre: 'Cancel Test SA', nit: '901600800-1', telefono: '3161112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cancel-button').click();

    // THEN: The edit form is no longer visible
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
  });

  test('should NOT call PUT /api/v1/clientes/{id} when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: User has partially modified the edit form
    const cliente = createClienteDto({ nombre: 'No PUT Cancel SA', nit: '901700900-1', telefono: '3171112222', ciudad: 'Bogotá' });
    let putCalled = false;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    // User modifies a field without submitting
    await page.getByTestId('field-nombre').fill('Nombre Cambiado Sin Guardar');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cancel-button').click();

    // THEN: No PUT was sent to the backend
    expect(putCalled).toBe(false);
  });

  test('should keep the original client name visible in detail after cancelling', async ({ page }) => {
    // GIVEN: User modifies the form then cancels
    const cliente = createClienteDto({ nombre: 'Original Name SA', nit: '901800100-1', telefono: '3181112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Changed But Not Saved SA');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cancel-button').click();

    // THEN: The original client name is still displayed in the detail view
    await expect(page.getByText('Original Name SA')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — In-flight submission: submit button disabled + "Guardando..."
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Submit button is disabled and shows "Guardando..." while PUT is in-flight', () => {
  test('should disable the submit button while the PUT request is in-flight', async ({ page }) => {
    // GIVEN: The PUT request is held pending
    const cliente = createClienteDto({ nombre: 'Loading State SA', nit: '901900200-1', telefono: '3191112222', ciudad: 'Bogotá' });
    let releaseMutation!: () => void;
    const mutationHeld = new Promise<void>((resolve) => { releaseMutation = resolve; });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, async (route) => {
      if (route.request().method() === 'PUT') {
        await mutationHeld;
        const updated = { ...cliente, nombre: 'Loading State Nuevo SA', updatedAt: new Date().toISOString() };
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Loading State Nuevo SA');

    // WHEN: User submits (mutation is in-flight)
    await page.getByTestId('submit-button').click();

    // THEN: Submit button is disabled during in-flight request
    await expect(page.getByTestId('submit-button')).toBeDisabled();

    // Cleanup
    releaseMutation();
  });

  test('should show "Guardando..." on the submit button while PUT is in-flight', async ({ page }) => {
    // GIVEN: PUT request is held pending
    const cliente = createClienteDto({ nombre: 'Guardando Test SA', nit: '902000300-1', telefono: '3201112222', ciudad: 'Bogotá' });
    let releaseMutation!: () => void;
    const mutationHeld = new Promise<void>((resolve) => { releaseMutation = resolve; });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, async (route) => {
      if (route.request().method() === 'PUT') {
        await mutationHeld;
        const updated = { ...cliente, nombre: 'Guardando Test Nuevo SA', updatedAt: new Date().toISOString() };
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Guardando Test Nuevo SA');

    // WHEN: Mutation is in-flight
    await page.getByTestId('submit-button').click();

    // THEN: Submit button shows "Guardando..." text
    await expect(page.getByTestId('submit-button')).toContainText('Guardando...');

    // Cleanup
    releaseMutation();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — 409 Conflict: "El NIT/RUC ya está registrado" without technical details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — 409 Conflict shows user-friendly error message without technical details', () => {
  test('should display "El NIT/RUC ya está registrado" when backend returns 409', async ({ page }) => {
    // GIVEN: User edits the NIT to a value that belongs to another client
    const cliente = createClienteDto({ nombre: '409 Test SA', nit: '902100400-1', telefono: '3211112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nit').fill('902999999-9');

    // WHEN: User submits with a conflicting NIT
    await page.getByTestId('submit-button').click();

    // THEN: The conflict error message is shown
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();
  });

  test('should NOT display a stack trace or technical error when 409 occurs', async ({ page }) => {
    // GIVEN: Backend returns 409 on PUT
    const cliente = createClienteDto({ nombre: 'Stack Trace Test SA', nit: '902200500-1', telefono: '3221112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    // Track uncaught JS errors (stack traces exposed to the browser)
    const uncaughtErrors: string[] = [];
    page.on('pageerror', (err) => uncaughtErrors.push(err.message));

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nit').fill('902999888-8');
    await page.getByTestId('submit-button').click();
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // THEN: No uncaught JS errors
    expect(uncaughtErrors).toHaveLength(0);
  });

  test('should keep the edit form open when a 409 error occurs', async ({ page }) => {
    // GIVEN: Backend returns 409 on PUT
    const cliente = createClienteDto({ nombre: 'Form Open 409 SA', nit: '902300600-1', telefono: '3231112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nit').fill('902999777-7');

    // WHEN: Conflict error occurs
    await page.getByTestId('submit-button').click();

    // THEN: The form stays open (user can correct the NIT and retry)
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });

  test('should display a generic error toast for non-409 server errors during edit', async ({ page }) => {
    // GIVEN: Backend returns 500 on PUT
    const cliente = createClienteDto({ nombre: '500 Error SA', nit: '902400700-1', telefono: '3241112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('500 Error Nuevo SA');

    // WHEN: A generic server error occurs
    await page.getByTestId('submit-button').click();

    // THEN: A generic error message is shown (not the NIT conflict message)
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();
  });
});
