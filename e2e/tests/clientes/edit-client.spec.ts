/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * Tests define expected behavior and serve as the contract for the DEV team.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking "Editar" opens the form pre-filled with all current client values (FR6)
 *   AC2 — Valid modification saves changes, reflects in detail+list, shows success toast (FR27)
 *   AC3 — Clearing a required field shows inline error and blocks submit (FR8)
 *   AC4 — Clicking "Cancelar" closes form without persisting any changes
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Clicking "Editar" opens the form pre-filled with current client values
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Edit button opens pre-filled form', () => {
  const CLIENTE_ID = '00000000-0000-0000-0000-000000002401';

  const mockCliente = {
    id: CLIENTE_ID,
    nombre: 'Empresa Editada SA',
    nit: '900111222-1',
    telefono: '3001112222',
    ciudad: 'Medellín',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  test('should show "Editar" button when a client detail is displayed', async ({ page }) => {
    // GIVEN: User is viewing a client's detail
    // Network-first: intercept before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);

    // THEN: "Editar" button is visible in the detail panel
    await expect(page.getByTestId('edit-cliente-button')).toBeVisible();
  });

  test('should open a form dialog when "Editar" button is clicked', async ({ page }) => {
    // GIVEN: User is on the client detail view
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);

    // WHEN: User clicks "Editar"
    await page.getByTestId('edit-cliente-button').click();

    // THEN: A form dialog is visible
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should pre-fill Nombre field with current client value', async ({ page }) => {
    // GIVEN: User opens the edit form for an existing client
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Form opens
    // THEN: Nombre field is pre-filled with the client's current nombre
    const nombreInput = page.getByRole('dialog').getByLabel(/nombre/i);
    await expect(nombreInput).toHaveValue(mockCliente.nombre);
  });

  test('should pre-fill NIT/RUC field with current client value', async ({ page }) => {
    // GIVEN: User opens the edit form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // THEN: NIT/RUC field is pre-filled
    const nitInput = page.getByRole('dialog').getByLabel(/nit/i);
    await expect(nitInput).toHaveValue(mockCliente.nit);
  });

  test('should pre-fill Teléfono field with current client value', async ({ page }) => {
    // GIVEN: User opens the edit form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // THEN: Teléfono field is pre-filled
    const telefonoInput = page.getByRole('dialog').getByLabel(/teléfono/i);
    await expect(telefonoInput).toHaveValue(mockCliente.telefono);
  });

  test('should pre-fill Ciudad field with current client value', async ({ page }) => {
    // GIVEN: User opens the edit form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // THEN: Ciudad field is pre-filled
    const ciudadInput = page.getByRole('dialog').getByLabel(/ciudad/i);
    await expect(ciudadInput).toHaveValue(mockCliente.ciudad);
  });

  test('should render edit form overlay with correct data-testid', async ({ page }) => {
    // GIVEN: User opens the edit form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();

    // THEN: The overlay has the correct data-testid attribute
    await expect(page.getByTestId('edit-cliente-form-overlay')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Valid submission updates client and shows success toast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Valid modification saves changes and shows success toast', () => {
  const CLIENTE_ID = '00000000-0000-0000-0000-000000002402';

  const mockClienteOriginal = {
    id: CLIENTE_ID,
    nombre: 'Empresa Original SA',
    nit: '900333444-1',
    telefono: '3003334444',
    ciudad: 'Cali',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockClienteUpdated = {
    ...mockClienteOriginal,
    nombre: 'Empresa Modificada SAS',
    ciudad: 'Bogotá',
    updatedAt: '2026-06-30T00:00:00Z',
  };

  test('should close the edit form after successful save', async ({ page }) => {
    // GIVEN: User has the edit form open and modifies a field
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockClienteOriginal]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockClienteOriginal),
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockClienteUpdated),
        });
      }
    });

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User modifies nombre and submits
    const nombreInput = page.getByRole('dialog').getByLabel(/nombre/i);
    await nombreInput.fill('Empresa Modificada SAS');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Form dialog is closed
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('should show success toast "Cliente actualizado correctamente" after valid save', async ({ page }) => {
    // GIVEN: User opens the edit form and modifies data
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockClienteOriginal]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockClienteOriginal),
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockClienteUpdated),
        });
      }
    });

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User submits with a modified value
    const nombreInput = page.getByRole('dialog').getByLabel(/nombre/i);
    await nombreInput.fill('Empresa Modificada SAS');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Success toast with exact text is displayed (AC2)
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();
  });

  test('should reflect updated nombre in the detail panel immediately (FR27)', async ({ page }) => {
    // GIVEN: User edits the nombre of an existing client
    const createdIds: string[] = [];

    await page.goto('/clientes');

    // Create real client for this integration test
    const clientData = buildCliente();
    const apiHelper = new ApiHelper(page.request);
    const created = await apiHelper.createCliente(clientData);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);

    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const updatedNombre = `${clientData.nombre} UPDATED`;
    const nombreInput = page.getByRole('dialog').getByLabel(/nombre/i);
    await nombreInput.fill(updatedNombre);

    // WHEN: Form is saved
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // THEN: Updated nombre appears in the detail panel without page reload (FR27)
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(updatedNombre);

    // Cleanup
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
  });

  test('should reflect updated nombre in the list panel immediately (FR27)', async ({ page }) => {
    // GIVEN: User edits the nombre of an existing client
    const createdIds: string[] = [];
    const apiHelper = new ApiHelper(page.request);

    const clientData = buildCliente();
    const created = await apiHelper.createCliente(clientData);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);

    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const updatedNombre = `${clientData.nombre} LISTED`;
    const nombreInput = page.getByRole('dialog').getByLabel(/nombre/i);
    await nombreInput.fill(updatedNombre);

    // WHEN: Form is saved
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // THEN: Updated nombre appears in the left list panel without reload (FR27)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: updatedNombre })
    ).toBeVisible();

    // Cleanup
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
  });

  test('should keep submit button disabled while save is in flight', async ({ page }) => {
    // GIVEN: User opens the edit form
    let resolveput: ((value: unknown) => void) | null = null;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockClienteOriginal]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockClienteOriginal),
        });
      } else if (route.request().method() === 'PUT') {
        // Hold the PUT to verify pending state
        await new Promise((resolve) => { resolveput = resolve; });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockClienteUpdated),
        });
      }
    });

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User submits the edit form
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Submit button is disabled while PUT is in flight
    await expect(page.getByTestId('cliente-form-submit')).toBeDisabled();

    // Release the PUT
    if (resolveput) resolveput(undefined);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Required field validation prevents form submission
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Required field validation blocks submission', () => {
  const CLIENTE_ID = '00000000-0000-0000-0000-000000002403';

  const mockCliente = {
    id: CLIENTE_ID,
    nombre: 'Empresa Valida SA',
    nit: '900555666-1',
    telefono: '3005556666',
    ciudad: 'Barranquilla',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  async function openEditForm(page: import('@playwright/test').Page) {
    // Network-first: intercept before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );
    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }

  test('should show inline error when Nombre is cleared and form submitted', async ({ page }) => {
    // GIVEN: User opens the edit form (all fields pre-filled)
    await openEditForm(page);

    // WHEN: User clears Nombre field and submits
    await page.getByRole('dialog').getByLabel(/nombre/i).fill('');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Inline error for Nombre is shown
    await expect(page.getByText(/nombre requerido/i)).toBeVisible();
  });

  test('should show inline error when NIT is cleared and form submitted', async ({ page }) => {
    // GIVEN: User opens the edit form
    await openEditForm(page);

    // WHEN: User clears NIT field and submits
    await page.getByRole('dialog').getByLabel(/nit/i).fill('');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Inline error for NIT is shown
    await expect(page.getByText(/nit.*requerido/i)).toBeVisible();
  });

  test('should show inline error when Teléfono is cleared and form submitted', async ({ page }) => {
    // GIVEN: User opens the edit form
    await openEditForm(page);

    // WHEN: User clears Teléfono and submits
    await page.getByRole('dialog').getByLabel(/teléfono/i).fill('');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Inline error for Teléfono is shown
    await expect(page.getByText(/teléfono requerido/i)).toBeVisible();
  });

  test('should show inline error when Ciudad is cleared and form submitted', async ({ page }) => {
    // GIVEN: User opens the edit form
    await openEditForm(page);

    // WHEN: User clears Ciudad and submits
    await page.getByRole('dialog').getByLabel(/ciudad/i).fill('');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Inline error for Ciudad is shown
    await expect(page.getByText(/ciudad requerida/i)).toBeVisible();
  });

  test('should NOT call PUT when a required field is cleared and submitted', async ({ page }) => {
    // GIVEN: User opens the edit form
    let putCalled = false;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User clears Nombre and clicks Guardar
    await page.getByRole('dialog').getByLabel(/nombre/i).fill('');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: No PUT request was made (frontend validation prevents submission)
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Clicking "Cancelar" closes form without persisting changes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Cancelar closes form without saving changes', () => {
  const CLIENTE_ID = '00000000-0000-0000-0000-000000002404';

  const mockCliente = {
    id: CLIENTE_ID,
    nombre: 'Empresa Sin Cambios SA',
    nit: '900777888-1',
    telefono: '3007778888',
    ciudad: 'Cartagena',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  test('should close the edit form when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: User opens the edit form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByRole('button', { name: /cancelar/i }).click();

    // THEN: Form dialog is hidden
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('should NOT send PUT request when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: User opens the edit form and modifies a field
    let putCalled = false;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // User types in the nombre field but does NOT submit
    await page.getByRole('dialog').getByLabel(/nombre/i).fill('Nombre Modificado Sin Guardar');

    // WHEN: User clicks "Cancelar"
    await page.getByRole('button', { name: /cancelar/i }).click();

    // THEN: No PUT was made — original data is preserved
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(putCalled).toBe(false);
  });

  test('should preserve original client nombre in detail panel after Cancelar', async ({ page }) => {
    // GIVEN: User opens the edit form and types a new nombre but cancels
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('edit-cliente-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('dialog').getByLabel(/nombre/i).fill('Nombre Que No Se Guarda');

    // WHEN: User cancels
    await page.getByRole('button', { name: /cancelar/i }).click();

    // THEN: Original nombre is still shown in detail panel
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(mockCliente.nombre);
    await expect(page.getByTestId('cliente-detail-panel')).not.toContainText('Nombre Que No Se Guarda');
  });
});
