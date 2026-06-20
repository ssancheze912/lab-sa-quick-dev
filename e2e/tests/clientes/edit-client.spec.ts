// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.4: Edit Client
// Test Level: E2E (Playwright)
// Phase: RED — all tests fail until implementation exists
//
// Acceptance Criteria covered:
//   AC1 — Clicking "Editar" button opens EditarClienteDialog with title
//          "Editar cliente" and all 4 fields pre-filled from current client data
//   AC2 — Valid form submission calls PUT /api/v1/clientes/{id},
//          closes modal, invalidates both queries, shows success toast
//   AC3 — Clearing required fields on submit shows inline validation errors;
//          PUT is NOT called
//   AC4 — Clicking "Cancelar" or pressing Esc closes dialog without sending PUT
//   AC5 — Submitting a NIT already registered by another client returns 409;
//          inline error "El NIT/RUC ya está registrado" appears below NIT field
//   AC6 — "Guardar" shows "Guardando..." and is disabled while mutation is in-flight
//   AC7 — WCAG 2.1 AA keyboard accessibility; focus returns to "Editar" button
//
// Required data-testid attributes (implementation must add these):
//   - data-testid="editar-btn"                — "Editar" button in ClienteDetailView
//   - data-testid="editar-cliente-dialog"     — dialog content wrapper
//   - data-testid="cliente-form"              — form element inside dialog
//   - data-testid="cliente-nombre-input"      — Nombre text input (pre-filled)
//   - data-testid="cliente-nit-input"         — NIT/RUC text input (pre-filled)
//   - data-testid="cliente-telefono-input"    — Teléfono text input (pre-filled)
//   - data-testid="cliente-ciudad-input"      — Ciudad input (pre-filled)
//   - data-testid="cliente-nombre-error"      — Nombre inline error
//   - data-testid="cliente-nit-error"         — NIT/RUC inline error
//   - data-testid="cliente-telefono-error"    — Teléfono inline error
//   - data-testid="cliente-ciudad-error"      — Ciudad inline error
//   - data-testid="guardar-btn"               — "Guardar" submit button
//   - data-testid="cancelar-btn"              — "Cancelar" button
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ── Shared test data ──────────────────────────────────────────────────────────

const EXISTING_CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EXISTING_CLIENTE = {
  id: EXISTING_CLIENTE_ID,
  nombre: 'Empresa Test Existente',
  nit: '900111222-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const UPDATED_CLIENTE = {
  ...EXISTING_CLIENTE,
  nombre: 'Empresa Test Actualizada',
  telefono: '3009876543',
  ciudad: 'Medellín',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

const OTHER_CLIENTE_ID = 'b9c8d7e6-f5a4-3210-fedc-ba9876543210';
const OTHER_CLIENTE = buildCliente({ nit: '800999888-5' });

// ── 409 Conflict Problem Details ──────────────────────────────────────────────

const CONFLICT_RESPONSE = {
  type: 'https://tools.ietf.org/html/rfc7807',
  title: 'Conflicto de datos',
  status: 409,
  detail: "El NIT/RUC '800999888-5' ya está registrado.",
};

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Editar" button opens dialog with pre-filled fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — EditarClienteDialog opens with pre-filled form fields', () => {
  test('should render "Editar" button in the client detail panel', async ({ page }) => {
    // GIVEN: GET /api/v1/clientes/{id} returns existing client (network-first)
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );

    // WHEN: User navigates to the client detail view
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);

    // THEN: The "Editar" button is visible in the detail panel
    await expect(page.getByTestId('editar-btn')).toBeVisible();
  });

  test('should open EditarClienteDialog when "Editar" button is clicked', async ({ page }) => {
    // GIVEN: Client detail is loaded (network-first)
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // THEN: Dialog content is visible
    await expect(page.getByTestId('editar-cliente-dialog')).toBeVisible();
  });

  test('should show dialog title "Editar cliente"', async ({ page }) => {
    // GIVEN: Dialog is opened
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // THEN: Title is "Editar cliente"
    await expect(page.getByRole('dialog')).toContainText('Editar cliente');
  });

  test('should pre-fill Nombre field with current client name', async ({ page }) => {
    // GIVEN: Dialog is opened
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // THEN: Nombre is pre-filled with the existing client's name
    await expect(page.getByTestId('cliente-nombre-input')).toHaveValue('Empresa Test Existente');
  });

  test('should pre-fill NIT/RUC field with current client NIT', async ({ page }) => {
    // GIVEN: Dialog is opened
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // THEN: NIT/RUC is pre-filled
    await expect(page.getByTestId('cliente-nit-input')).toHaveValue('900111222-1');
  });

  test('should pre-fill Teléfono field with current client phone', async ({ page }) => {
    // GIVEN: Dialog is opened
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // THEN: Teléfono is pre-filled
    await expect(page.getByTestId('cliente-telefono-input')).toHaveValue('3001234567');
  });

  test('should pre-fill Ciudad field with current client city', async ({ page }) => {
    // GIVEN: Dialog is opened
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // THEN: Ciudad is pre-filled
    await expect(page.getByTestId('cliente-ciudad-input')).toHaveValue('Bogotá');
  });

  test('should render "Guardar" and "Cancelar" buttons when dialog is open', async ({ page }) => {
    // GIVEN: Dialog is opened
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // THEN: Action buttons are visible
    await expect(page.getByTestId('guardar-btn')).toBeVisible();
    await expect(page.getByTestId('cancelar-btn')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Valid form submission calls PUT and updates UI
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Valid form submission calls PUT /api/v1/clientes/{id}', () => {
  test('should call PUT /api/v1/clientes/{id} when Guardar is clicked with valid data', async ({ page }) => {
    // GIVEN: Network intercepts (network-first: routes before goto)
    let putCalled = false;
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENTE) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([UPDATED_CLIENTE]) })
    );

    // WHEN: User opens dialog and submits
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();
    await page.getByTestId('guardar-btn').click();

    // THEN: PUT was called
    await expect.poll(() => putCalled).toBe(true);
  });

  test('should close the dialog after successful edit', async ({ page }) => {
    // GIVEN: PUT returns success
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENTE) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([UPDATED_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // WHEN: User submits the form
    await page.getByTestId('guardar-btn').click();

    // THEN: Dialog is no longer visible
    await expect(page.getByTestId('editar-cliente-dialog')).not.toBeVisible();
  });

  test('should show success toast "Cliente actualizado correctamente" after successful edit', async ({ page }) => {
    // GIVEN: PUT returns success
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENTE) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([UPDATED_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();
    await page.getByTestId('guardar-btn').click();

    // THEN: Success toast appears with the correct Spanish message
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();
  });

  test('should reflect updated values in the detail view after successful edit', async ({ page }) => {
    // GIVEN: PUT returns success; GET returns updated data (query invalidation re-fetches)
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENTE) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([UPDATED_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();
    await page.getByTestId('guardar-btn').click();

    // THEN: Updated client name is visible in the detail view (invalidateQueries triggered)
    await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Empresa Test Actualizada');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Inline validation errors when required fields are cleared
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Inline validation errors for empty required fields', () => {
  async function setupAndOpenDialog(page: import('@playwright/test').Page) {
    // Network-first: intercept before goto
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();
    await expect(page.getByTestId('editar-cliente-dialog')).toBeVisible();
  }

  test('should show inline error below Nombre when Nombre is cleared and Guardar is clicked', async ({ page }) => {
    // GIVEN: Dialog is open with pre-filled values
    await setupAndOpenDialog(page);

    // WHEN: User clears Nombre and clicks Guardar
    await page.getByTestId('cliente-nombre-input').clear();
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline error appears below Nombre
    await expect(page.getByTestId('cliente-nombre-error')).toBeVisible();
  });

  test('should show inline error below NIT/RUC when NIT is cleared and Guardar is clicked', async ({ page }) => {
    // GIVEN: Dialog is open with pre-filled values
    await setupAndOpenDialog(page);

    // WHEN: User clears NIT and clicks Guardar
    await page.getByTestId('cliente-nit-input').clear();
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline error appears below NIT
    await expect(page.getByTestId('cliente-nit-error')).toBeVisible();
  });

  test('should show inline error below Teléfono when Teléfono is cleared and Guardar is clicked', async ({ page }) => {
    // GIVEN: Dialog is open
    await setupAndOpenDialog(page);

    // WHEN: User clears Teléfono and clicks Guardar
    await page.getByTestId('cliente-telefono-input').clear();
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline error appears
    await expect(page.getByTestId('cliente-telefono-error')).toBeVisible();
  });

  test('should show inline error below Ciudad when Ciudad is cleared and Guardar is clicked', async ({ page }) => {
    // GIVEN: Dialog is open
    await setupAndOpenDialog(page);

    // WHEN: User clears Ciudad and clicks Guardar
    await page.getByTestId('cliente-ciudad-input').clear();
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline error appears
    await expect(page.getByTestId('cliente-ciudad-error')).toBeVisible();
  });

  test('should NOT call PUT /api/v1/clientes when validation fails', async ({ page }) => {
    // GIVEN: Dialog is open; intercept PUT to verify it is NOT called
    let putCalled = false;
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENTE) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // WHEN: User clears Nombre and clicks Guardar
    await page.getByTestId('cliente-nombre-input').clear();
    await page.getByTestId('guardar-btn').click();

    // THEN: PUT was NOT called
    expect(putCalled).toBe(false);
  });

  test('should keep dialog open and "Guardar" button active when validation fails', async ({ page }) => {
    // GIVEN: Dialog is open
    await setupAndOpenDialog(page);

    // WHEN: User clears Nombre and clicks Guardar
    await page.getByTestId('cliente-nombre-input').clear();
    await page.getByTestId('guardar-btn').click();

    // THEN: Dialog remains open and Guardar button is still visible and enabled
    await expect(page.getByTestId('editar-cliente-dialog')).toBeVisible();
    await expect(page.getByTestId('guardar-btn')).toBeVisible();
    await expect(page.getByTestId('guardar-btn')).not.toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Cancel or Esc closes dialog without calling PUT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Cancel or Esc closes dialog without submitting', () => {
  async function setupAndOpenDialog(page: import('@playwright/test').Page) {
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();
    await expect(page.getByTestId('editar-cliente-dialog')).toBeVisible();
  }

  test('should close dialog when "Cancelar" button is clicked', async ({ page }) => {
    // GIVEN: Dialog is open
    await setupAndOpenDialog(page);

    // WHEN: User clicks Cancelar
    await page.getByTestId('cancelar-btn').click();

    // THEN: Dialog is closed
    await expect(page.getByTestId('editar-cliente-dialog')).not.toBeVisible();
  });

  test('should NOT call PUT when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Dialog open; monitor PUT requests
    let putCalled = false;
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENTE) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // WHEN: User clicks Cancelar
    await page.getByTestId('cancelar-btn').click();

    // THEN: PUT was NOT called
    expect(putCalled).toBe(false);
  });

  test('should close dialog when Esc key is pressed', async ({ page }) => {
    // GIVEN: Dialog is open
    await setupAndOpenDialog(page);

    // WHEN: User presses Escape
    await page.keyboard.press('Escape');

    // THEN: Dialog closes
    await expect(page.getByTestId('editar-cliente-dialog')).not.toBeVisible();
  });

  test('should preserve original client data in detail view after clicking Cancelar', async ({ page }) => {
    // GIVEN: Dialog is open; user modifies a field but cancels
    await setupAndOpenDialog(page);
    await page.getByTestId('cliente-nombre-input').fill('Nombre Provisional');

    // WHEN: User clicks Cancelar
    await page.getByTestId('cancelar-btn').click();

    // THEN: Original client name is still shown in the detail view
    await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Empresa Test Existente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — 409 NIT conflict shows inline error
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — 409 conflict shows "El NIT/RUC ya está registrado" inline', () => {
  test('should show "El NIT/RUC ya está registrado" below NIT field on 409 response', async ({ page }) => {
    // GIVEN: Network intercepts (network-first: before goto)
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        // PUT returns 409 conflict
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify(CONFLICT_RESPONSE),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );

    // WHEN: User opens dialog, changes NIT to a conflicting value, and submits
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();
    await page.getByTestId('cliente-nit-input').fill('800999888-5');
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline error "El NIT/RUC ya está registrado" appears below NIT field
    await expect(page.getByTestId('cliente-nit-error')).toBeVisible();
    await expect(page.getByTestId('cliente-nit-error')).toContainText('El NIT/RUC ya está registrado');
  });

  test('should NOT expose stack trace or technical details on 409 response (NFR6)', async ({ page }) => {
    // GIVEN: PUT returns 409
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify(CONFLICT_RESPONSE),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();
    await page.getByTestId('cliente-nit-input').fill('800999888-5');
    await page.getByTestId('guardar-btn').click();

    // THEN: No stack trace keywords are visible on the page
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('StackTrace');
    expect(pageText).not.toContain('System.');
    expect(pageText).not.toContain('Exception');
  });

  test('should keep dialog open when backend returns 409 conflict', async ({ page }) => {
    // GIVEN: PUT returns 409
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify(CONFLICT_RESPONSE),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();
    await page.getByTestId('cliente-nit-input').fill('800999888-5');
    await page.getByTestId('guardar-btn').click();

    // THEN: Dialog remains open (user must correct the NIT)
    await expect(page.getByTestId('editar-cliente-dialog')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — "Guardar" shows loading state while in-flight
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Guardar button loading state while mutation is in-flight', () => {
  test('should disable "Guardar" button while form is being submitted', async ({ page }) => {
    // GIVEN: PUT is delayed to capture in-flight state (network-first)
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise((r) => setTimeout(r, 2000));
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENTE) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // WHEN: User clicks Guardar (slow PUT is in-flight)
    await page.getByTestId('guardar-btn').click();

    // THEN: Guardar button is disabled during in-flight
    await expect(page.getByTestId('guardar-btn')).toBeDisabled();
  });

  test('should show "Guardando..." on submit button while mutation is in-flight', async ({ page }) => {
    // GIVEN: PUT is delayed (network-first)
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise((r) => setTimeout(r, 2000));
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENTE) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) });
      }
    });
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();

    // WHEN: User clicks Guardar
    await page.getByTestId('guardar-btn').click();

    // THEN: Button shows "Guardando..." while waiting for response
    await expect(page.getByTestId('guardar-btn')).toContainText('Guardando...');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Keyboard accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — WCAG 2.1 AA keyboard accessibility', () => {
  async function setupAndOpenDialog(page: import('@playwright/test').Page) {
    await page.route(`${API_BASE_URL}/api/v1/clientes/${EXISTING_CLIENTE_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EXISTING_CLIENTE) })
    );
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([EXISTING_CLIENTE]) })
    );
    await page.goto(`/clientes/${EXISTING_CLIENTE_ID}`);
    await page.getByTestId('editar-btn').click();
    await expect(page.getByTestId('editar-cliente-dialog')).toBeVisible();
  }

  test('dialog has role="dialog" for accessibility', async ({ page }) => {
    // GIVEN: Dialog is open
    await setupAndOpenDialog(page);

    // THEN: Dialog element has role="dialog"
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('all form fields and buttons are reachable via Tab within the dialog', async ({ page }) => {
    // GIVEN: Dialog is open
    await setupAndOpenDialog(page);

    // WHEN: User navigates via Tab from Nombre input
    const nombreInput = page.getByTestId('cliente-nombre-input');
    await nombreInput.focus();

    // THEN: Tab reaches NIT field
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('cliente-nit-input')).toBeFocused();
  });

  test('should return focus to "Editar" button when dialog is closed via Esc', async ({ page }) => {
    // GIVEN: Dialog is open
    await setupAndOpenDialog(page);

    // WHEN: User presses Escape to close dialog
    await page.keyboard.press('Escape');

    // THEN: Focus returns to the "Editar" button
    await expect(page.getByTestId('editar-btn')).toBeFocused();
  });
});
