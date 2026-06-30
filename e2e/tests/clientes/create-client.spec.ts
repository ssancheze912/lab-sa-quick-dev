/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * Tests define expected behavior and serve as the contract for the DEV team.
 *
 * Acceptance Criteria covered:
 *   AC1 — "Nuevo cliente" button opens form with 4 required fields
 *   AC2 — Valid submission creates client and shows success toast
 *   AC3 — Empty required fields show inline validation errors, form NOT submitted
 *   AC4 — Duplicate NIT returns 409, shows specific error message
 */

import { test, expect } from '@playwright/test';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Nuevo cliente" button opens form with all required fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Nuevo cliente form opens with required fields', () => {
  test('should show "Nuevo cliente" button on /clientes view', async ({ page }) => {
    // GIVEN: User is on the /clientes view
    // Network-first: intercept before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: "Nuevo cliente" button is visible
    await expect(page.getByRole('button', { name: /nuevo cliente/i })).toBeVisible();
  });

  test('should open form dialog when "Nuevo cliente" is clicked', async ({ page }) => {
    // GIVEN: User is on the /clientes view
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');

    // WHEN: User clicks "Nuevo cliente"
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // THEN: A form dialog/panel is visible
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should render Nombre field in the form', async ({ page }) => {
    // GIVEN: User is on the /clientes view with form open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Form is displayed
    // THEN: Nombre field is present with label
    await expect(page.getByLabel(/nombre/i)).toBeVisible();
  });

  test('should render NIT/RUC field in the form', async ({ page }) => {
    // GIVEN: User is on the /clientes view with form open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Form is displayed
    // THEN: NIT/RUC field is present with label
    await expect(page.getByLabel(/nit/i)).toBeVisible();
  });

  test('should render Teléfono field in the form', async ({ page }) => {
    // GIVEN: User is on the /clientes view with form open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Form is displayed
    // THEN: Teléfono field is present with label
    await expect(page.getByLabel(/teléfono/i)).toBeVisible();
  });

  test('should render Ciudad field in the form', async ({ page }) => {
    // GIVEN: User is on the /clientes view with form open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Form is displayed
    // THEN: Ciudad field is present with label
    await expect(page.getByLabel(/ciudad/i)).toBeVisible();
  });

  test('should render form with data-testid="cliente-form"', async ({ page }) => {
    // GIVEN: User is on the /clientes view with form open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // THEN: Form element has required data-testid
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Valid submission creates client and shows success toast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Valid submission creates client and shows success toast', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should close the form after successful creation', async ({ page }) => {
    // GIVEN: User has the form open with all fields filled
    const data = buildCliente();

    // Network-first: intercept GET list to return empty then intercept POST
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '00000000-0000-0000-0000-000000000099',
            nombre: data.nombre,
            nit: data.nit,
            telefono: data.telefono,
            ciudad: data.ciudad,
            createdAt: '2026-06-30T00:00:00Z',
            updatedAt: '2026-06-30T00:00:00Z',
          }),
        });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User fills all fields and submits
    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Form dialog is closed
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('should show success toast "Cliente creado correctamente" after valid submission', async ({ page }) => {
    // GIVEN: User has the form open with all fields filled
    const data = buildCliente();

    // Network-first: intercept before navigation
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '00000000-0000-0000-0000-000000000098',
            nombre: data.nombre,
            nit: data.nit,
            telefono: data.telefono,
            ciudad: data.ciudad,
            createdAt: '2026-06-30T00:00:00Z',
            updatedAt: '2026-06-30T00:00:00Z',
          }),
        });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User fills all fields and submits
    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Success toast with correct message is displayed
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
  });

  test('should appear in client list immediately after creation', async ({ page, request }) => {
    // GIVEN: User creates a new client via the form with real API
    const clientesPage = new ClientesPage(page);
    apiHelper = new ApiHelper(request);

    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();

    const data = buildCliente();

    // WHEN: User fills all fields and submits
    await clientesPage.llenarFormulario(data);
    await clientesPage.guardar();

    // Find and track for cleanup
    const all = await apiHelper.getClientes();
    const created = all.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);

    // THEN: New client is visible in the list immediately (FR27)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  test('should keep submit button disabled and show loading state while pending', async ({ page }) => {
    // GIVEN: User fills form and is about to submit
    let resolvePost: ((value: unknown) => void) | null = null;

    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (route.request().method() === 'POST') {
        // Hold the POST response to verify pending state
        await new Promise((resolve) => { resolvePost = resolve; });
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '00000000-0000-0000-0000-000000000097',
            nombre: 'Test',
            nit: '123',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-06-30T00:00:00Z',
            updatedAt: '2026-06-30T00:00:00Z',
          }),
        });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await page.getByLabel(/nombre/i).fill('Test');
    await page.getByLabel(/nit/i).fill('123');
    await page.getByLabel(/teléfono/i).fill('3001234567');
    await page.getByLabel(/ciudad/i).fill('Bogotá');

    // WHEN: User clicks submit
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Submit button is disabled while pending
    await expect(page.getByTestId('cliente-form-submit')).toBeDisabled();

    // Release the pending POST
    if (resolvePost) resolvePost(undefined);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Empty required fields show inline errors, form NOT submitted
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Required field validation prevents submission', () => {
  test('should show inline error on Nombre field when empty and submitted', async ({ page }) => {
    // GIVEN: User opens the "Nuevo cliente" form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User submits without filling Nombre
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Inline error for Nombre is shown
    await expect(page.getByText(/nombre requerido/i)).toBeVisible();
  });

  test('should show inline error on NIT/RUC field when empty and submitted', async ({ page }) => {
    // GIVEN: User opens the form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User submits without filling NIT
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Inline error for NIT is shown
    await expect(page.getByText(/nit.*requerido/i)).toBeVisible();
  });

  test('should show inline error on Teléfono field when empty and submitted', async ({ page }) => {
    // GIVEN: User opens the form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User submits without filling Teléfono
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Inline error for Teléfono is shown
    await expect(page.getByText(/teléfono requerido/i)).toBeVisible();
  });

  test('should show inline error on Ciudad field when empty and submitted', async ({ page }) => {
    // GIVEN: User opens the form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User submits without filling Ciudad
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Inline error for Ciudad is shown
    await expect(page.getByText(/ciudad requerida/i)).toBeVisible();
  });

  test('should NOT submit form to backend when required fields are empty', async ({ page }) => {
    // GIVEN: User opens the form
    let postCalled = false;

    // Network-first: intercept before navigation
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User clicks Guardar with all fields empty
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Form remains visible and no POST was made
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(postCalled).toBe(false);
  });

  test('should close form when "Cancelar" is clicked without submitting', async ({ page }) => {
    // GIVEN: User opens the form
    let postCalled = false;

    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByRole('button', { name: /cancelar/i }).click();

    // THEN: Form closes without any POST
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(postCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Duplicate NIT shows specific error without technical details (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Duplicate NIT shows business-friendly error message', () => {
  test('should display "El NIT/RUC ya está registrado" on 409 conflict', async ({ page }) => {
    // GIVEN: User opens the form and fills in a NIT that already exists
    const data = buildCliente();

    // Network-first: intercept before navigation
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (route.request().method() === 'POST') {
        // Simulate 409 Conflict from backend
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          }),
        });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User submits form with duplicate NIT
    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Error message shows exactly the business-friendly text
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();
  });

  test('should NOT expose technical error details on 409 conflict (NFR6)', async ({ page }) => {
    // GIVEN: Backend returns 409 with Problem Details
    const data = buildCliente();

    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
            traceId: 'internal-trace-abc123',
          }),
        });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByTestId('cliente-form-submit').click();

    // THEN: No technical details are shown to the user (NFR6)
    await expect(page.getByText(/traceId|stackTrace|internal-trace|application\/problem/i)).toHaveCount(0);
  });

  test('should keep the form open after 409 conflict so user can correct NIT', async ({ page }) => {
    // GIVEN: User submits form with duplicate NIT
    const data = buildCliente();

    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({ status: 409, detail: 'El NIT/RUC ya está registrado' }),
        });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByTestId('cliente-form-submit').click();

    // WHEN: Backend responds with 409
    // THEN: Form remains open (user can correct the NIT)
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });
});
