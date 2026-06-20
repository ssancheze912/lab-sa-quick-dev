// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.3: Create Client
// Test Level: E2E (Playwright)
// Phase: RED — all tests fail until implementation exists
//
// Acceptance Criteria covered:
//   AC1 — "Nuevo cliente" button opens shadcn Dialog with 4 required fields,
//          autoFocus on Nombre, and "* Campos obligatorios" legend
//   AC2 — Valid form submission calls POST /api/v1/clientes, closes modal,
//          invalidates query (list updates), shows success toast
//   AC3 — Empty required fields show inline validation errors; form not submitted
//   AC4 — NIT conflict (409) shows "El NIT/RUC ya está registrado" inline
//   AC5 — Dialog closes and form resets on ✕, Esc, or outside click
//   AC6 — WCAG 2.1 AA keyboard navigation; focus trap in dialog; focus returns to trigger
//   AC7 — "Guardar" button disabled and shows "Guardando..." while in-flight
//
// Required data-testid attributes (implementation must add these):
//   - data-testid="nuevo-cliente-btn"          — "Nuevo cliente" trigger button
//   - data-testid="nuevo-cliente-dialog"       — shadcn Dialog content
//   - data-testid="cliente-form"               — form element
//   - data-testid="cliente-nombre-input"       — Nombre text input
//   - data-testid="cliente-nit-input"          — NIT/RUC text input
//   - data-testid="cliente-telefono-input"     — Teléfono text input
//   - data-testid="cliente-ciudad-input"       — Ciudad select/input
//   - data-testid="cliente-nombre-error"       — Nombre inline error
//   - data-testid="cliente-nit-error"          — NIT/RUC inline error
//   - data-testid="cliente-telefono-error"     — Teléfono inline error
//   - data-testid="cliente-ciudad-error"       — Ciudad inline error
//   - data-testid="guardar-btn"                — "Guardar" submit button
//   - data-testid="cancelar-btn"               — "Cancelar" button
//   - data-testid="campos-obligatorios-legend" — "* Campos obligatorios" legend
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Nuevo cliente" button opens Dialog with 4 required fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — NuevoClienteDialog opens with form fields', () => {
  test('should render "Nuevo cliente" button in the list panel header', async ({ page }) => {
    // GIVEN: User navigates to /clientes
    await page.goto('/clientes');

    // WHEN: The page is loaded
    // THEN: The "Nuevo cliente" button is visible
    await expect(page.getByTestId('nuevo-cliente-btn')).toBeVisible();
  });

  test('should open a dialog when "Nuevo cliente" button is clicked', async ({ page }) => {
    // GIVEN: User is on the /clientes view
    await page.goto('/clientes');

    // WHEN: User clicks "Nuevo cliente"
    await page.getByTestId('nuevo-cliente-btn').click();

    // THEN: A Dialog with role="dialog" is visible
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();
  });

  test('should show dialog title "Nuevo cliente"', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');

    // WHEN: User opens the dialog
    await page.getByTestId('nuevo-cliente-btn').click();

    // THEN: Dialog title reads "Nuevo cliente"
    await expect(page.getByRole('dialog')).toContainText('Nuevo cliente');
  });

  test('should render Nombre field marked as required (*)', async ({ page }) => {
    // GIVEN: Dialog is open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();

    // WHEN: Dialog is visible
    // THEN: Nombre field exists with * marker
    const nombreInput = page.getByTestId('cliente-nombre-input');
    await expect(nombreInput).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Nombre *');
  });

  test('should render NIT/RUC field marked as required (*)', async ({ page }) => {
    // GIVEN: Dialog is open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();

    // WHEN: Dialog is visible
    // THEN: NIT/RUC field exists with * marker
    const nitInput = page.getByTestId('cliente-nit-input');
    await expect(nitInput).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('NIT/RUC *');
  });

  test('should render Teléfono field marked as required (*)', async ({ page }) => {
    // GIVEN: Dialog is open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();

    // WHEN: Dialog is visible
    // THEN: Teléfono field exists with * marker
    const telefonoInput = page.getByTestId('cliente-telefono-input');
    await expect(telefonoInput).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Teléfono *');
  });

  test('should render Ciudad field marked as required (*)', async ({ page }) => {
    // GIVEN: Dialog is open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();

    // WHEN: Dialog is visible
    // THEN: Ciudad field exists with * marker
    const ciudadInput = page.getByTestId('cliente-ciudad-input');
    await expect(ciudadInput).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Ciudad *');
  });

  test('should show "* Campos obligatorios" legend at the bottom of the form', async ({ page }) => {
    // GIVEN: Dialog is open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();

    // WHEN: Form is visible
    // THEN: The legend "* Campos obligatorios" appears at the form footer
    await expect(page.getByTestId('campos-obligatorios-legend')).toBeVisible();
    await expect(page.getByTestId('campos-obligatorios-legend')).toContainText('* Campos obligatorios');
  });

  test('should auto-focus the Nombre field when dialog opens', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');

    // WHEN: User clicks "Nuevo cliente"
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // THEN: Nombre input has focus
    const nombreInput = page.getByTestId('cliente-nombre-input');
    await expect(nombreInput).toBeFocused();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Successful form submission creates client and updates list
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Successful client creation', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should call POST /api/v1/clientes when valid form is submitted', async ({ page, request }) => {
    // GIVEN: User is on /clientes and opens the new client dialog
    const data = buildCliente();

    // Intercept network BEFORE navigation
    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/api/v1/clientes') && req.method() === 'POST',
    );

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User fills all required fields and clicks "Guardar"
    await page.getByTestId('cliente-nombre-input').fill(data.nombre);
    await page.getByTestId('cliente-nit-input').fill(data.nit);
    await page.getByTestId('cliente-telefono-input').fill(data.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(data.ciudad);
    await page.getByTestId('guardar-btn').click();

    // THEN: A POST request is made to /api/v1/clientes
    const postRequest = await requestPromise;
    expect(postRequest).toBeTruthy();

    // Cleanup
    const apiHelper = new ApiHelper(request);
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  test('should close the dialog after successful client creation', async ({ page, request }) => {
    // GIVEN: User is on /clientes with dialog open and form filled
    const data = buildCliente();

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User submits valid form
    await page.getByTestId('cliente-nombre-input').fill(data.nombre);
    await page.getByTestId('cliente-nit-input').fill(data.nit);
    await page.getByTestId('cliente-telefono-input').fill(data.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(data.ciudad);
    await page.getByTestId('guardar-btn').click();

    // THEN: Dialog closes
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden();

    // Cleanup
    const apiHelper = new ApiHelper(request);
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  test('should show new client in the list immediately after creation (invalidateQueries)', async ({ page, request }) => {
    // GIVEN: User is on /clientes with dialog open
    const data = buildCliente();

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User submits valid form and dialog closes
    await page.getByTestId('cliente-nombre-input').fill(data.nombre);
    await page.getByTestId('cliente-nit-input').fill(data.nit);
    await page.getByTestId('cliente-telefono-input').fill(data.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(data.ciudad);
    await page.getByTestId('guardar-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden();

    // THEN: The new client appears in the list without page reload
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }),
    ).toBeVisible();

    // Cleanup
    const apiHelper = new ApiHelper(request);
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  test('should show success toast "Cliente creado correctamente" after creation', async ({ page, request }) => {
    // GIVEN: User is on /clientes with dialog open
    const data = buildCliente();

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User submits valid form
    await page.getByTestId('cliente-nombre-input').fill(data.nombre);
    await page.getByTestId('cliente-nit-input').fill(data.nit);
    await page.getByTestId('cliente-telefono-input').fill(data.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(data.ciudad);
    await page.getByTestId('guardar-btn').click();

    // THEN: Success toast appears
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();

    // Cleanup
    const apiHelper = new ApiHelper(request);
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Zod inline validation errors for empty required fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Inline validation errors for empty fields', () => {
  test('should show inline error below Nombre when it is empty on submit', async ({ page }) => {
    // GIVEN: Dialog is open with all fields empty
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User clicks "Guardar" without filling any field
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline error appears below Nombre field
    await expect(page.getByTestId('cliente-nombre-error')).toBeVisible();
  });

  test('should show inline error below NIT/RUC when it is empty on submit', async ({ page }) => {
    // GIVEN: Dialog is open with all fields empty
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User clicks "Guardar" without filling any field
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline error appears below NIT/RUC field
    await expect(page.getByTestId('cliente-nit-error')).toBeVisible();
  });

  test('should show inline error below Teléfono when it is empty on submit', async ({ page }) => {
    // GIVEN: Dialog is open with all fields empty
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User clicks "Guardar" without filling any field
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline error appears below Teléfono field
    await expect(page.getByTestId('cliente-telefono-error')).toBeVisible();
  });

  test('should show inline error below Ciudad when it is empty on submit', async ({ page }) => {
    // GIVEN: Dialog is open with all fields empty
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User clicks "Guardar" without filling any field
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline error appears below Ciudad field
    await expect(page.getByTestId('cliente-ciudad-error')).toBeVisible();
  });

  test('should NOT call POST /api/v1/clientes when validation fails', async ({ page }) => {
    // GIVEN: Dialog is open with all fields empty
    let postCalled = false;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User clicks "Guardar" without filling any field
    await page.getByTestId('guardar-btn').click();

    // THEN: POST was not called
    expect(postCalled).toBe(false);
  });

  test('should keep dialog open and "Guardar" active when validation fails', async ({ page }) => {
    // GIVEN: Dialog is open with all fields empty
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();

    // WHEN: User clicks "Guardar" without filling any field
    await page.getByTestId('guardar-btn').click();

    // THEN: Dialog remains open (validation errors shown, form not submitted)
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();
    // And "Guardar" button is still enabled (not disabled — only disabled when isPending)
    await expect(page.getByTestId('guardar-btn')).toBeEnabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — NIT conflict (409 backend error) shows inline error on NIT field
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — NIT/RUC conflict error (409 response)', () => {
  test('should show "El NIT/RUC ya está registrado" below NIT field on 409 response', async ({
    page,
    request,
  }) => {
    // GIVEN: A client already exists with a known NIT
    const apiHelper = new ApiHelper(request);
    const existingData = buildCliente();
    const existing = await apiHelper.createCliente(existingData);

    // GIVEN: Intercept POST before navigation to return 409
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: `El NIT/RUC '${existingData.nit}' ya está registrado.`,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User submits form with duplicate NIT
    await page.getByTestId('cliente-nombre-input').fill('Empresa Diferente');
    await page.getByTestId('cliente-nit-input').fill(existingData.nit);
    await page.getByTestId('cliente-telefono-input').fill('3001234567');
    await page.getByTestId('cliente-ciudad-input').fill('Bogotá');
    await page.getByTestId('guardar-btn').click();

    // THEN: Inline NIT error is shown
    await expect(page.getByTestId('cliente-nit-error')).toBeVisible();
    await expect(page.getByTestId('cliente-nit-error')).toContainText('El NIT/RUC ya está registrado');

    // Cleanup
    await apiHelper.deleteCliente(existing.id).catch(() => null);
  });

  test('should NOT expose stack trace or technical details on 409 response', async ({ page }) => {
    // GIVEN: Intercept POST to return 409 before navigation
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: 'El NIT/RUC ya está registrado.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await page.getByTestId('cliente-nombre-input').fill('Test Co');
    await page.getByTestId('cliente-nit-input').fill('900000001');
    await page.getByTestId('cliente-telefono-input').fill('3001234567');
    await page.getByTestId('cliente-ciudad-input').fill('Bogotá');
    await page.getByTestId('guardar-btn').click();

    // THEN: No raw technical details are shown
    await expect(page.getByText(/stack|trace|exception|System\./i)).not.toBeVisible();
    await expect(page.getByText(/ConflictException/i)).not.toBeVisible();
  });

  test('should keep dialog open when backend returns 409 conflict', async ({ page }) => {
    // GIVEN: Intercept POST to return 409 before navigation
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            status: 409,
            title: 'Conflicto de datos',
            detail: 'Duplicate NIT.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await page.getByTestId('cliente-nombre-input').fill('Test Co');
    await page.getByTestId('cliente-nit-input').fill('900000001');
    await page.getByTestId('cliente-telefono-input').fill('3001234567');
    await page.getByTestId('cliente-ciudad-input').fill('Bogotá');
    await page.getByTestId('guardar-btn').click();

    // THEN: Dialog stays open (user can correct the NIT)
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Dialog closes and form resets on ✕ button, Esc key, or outside click
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Dialog close and form reset', () => {
  test('should close dialog when ✕ (close) button is clicked', async ({ page }) => {
    // GIVEN: Dialog is open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User clicks the ✕ close button
    await page.getByRole('button', { name: /close|cerrar|✕/i }).click();

    // THEN: Dialog is closed
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden();
  });

  test('should close dialog when Esc key is pressed', async ({ page }) => {
    // GIVEN: Dialog is open with some data typed
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();
    await page.getByTestId('cliente-nombre-input').fill('Empresa Temporal');

    // WHEN: User presses Escape
    await page.keyboard.press('Escape');

    // THEN: Dialog closes
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden();
  });

  test('should reset form values when dialog is closed via Cancelar button', async ({ page }) => {
    // GIVEN: Dialog is open and user has typed data
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await page.getByTestId('cliente-nombre-input').fill('Empresa Temporal');
    await page.getByTestId('cliente-nit-input').fill('123456789');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cancelar-btn').click();

    // THEN: Dialog closes
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden();

    // WHEN: User reopens the dialog
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // THEN: Form fields are empty (reset)
    await expect(page.getByTestId('cliente-nombre-input')).toHaveValue('');
    await expect(page.getByTestId('cliente-nit-input')).toHaveValue('');
  });

  test('should NOT submit any data when dialog is closed via Cancelar', async ({ page }) => {
    // GIVEN: Dialog is open with all fields filled
    let postCalled = false;
    // Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await page.getByTestId('cliente-nombre-input').fill('Empresa Temporal');
    await page.getByTestId('cliente-nit-input').fill('123456789');
    await page.getByTestId('cliente-telefono-input').fill('3001234567');
    await page.getByTestId('cliente-ciudad-input').fill('Bogotá');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cancelar-btn').click();

    // THEN: POST was never called
    expect(postCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — WCAG 2.1 AA keyboard accessibility and focus management
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Keyboard accessibility and focus management', () => {
  test('should return focus to "Nuevo cliente" button when dialog is closed via Esc', async ({
    page,
  }) => {
    // GIVEN: Dialog is open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User presses Escape to close dialog
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden();

    // THEN: Focus returns to the "Nuevo cliente" trigger button
    await expect(page.getByTestId('nuevo-cliente-btn')).toBeFocused();
  });

  test('should allow Tab navigation through all form fields inside dialog', async ({ page }) => {
    // GIVEN: Dialog is open with focus on Nombre (autoFocus)
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();
    await expect(page.getByTestId('cliente-nombre-input')).toBeFocused();

    // WHEN: User presses Tab
    await page.keyboard.press('Tab');

    // THEN: Focus moves to NIT field (next field in tab order)
    await expect(page.getByTestId('cliente-nit-input')).toBeFocused();
  });

  test('should have all form fields reachable via Tab within the dialog', async ({ page }) => {
    // GIVEN: Dialog is open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User tabs through the form
    // Tab sequence: Nombre → NIT → Teléfono → Ciudad → Guardar → Cancelar → (close btn)
    const tabTargets = [
      page.getByTestId('cliente-nit-input'),
      page.getByTestId('cliente-telefono-input'),
      page.getByTestId('cliente-ciudad-input'),
    ];

    for (const target of tabTargets) {
      await page.keyboard.press('Tab');
      await expect(target).toBeFocused();
    }
  });

  test('dialog has role="dialog" for accessibility', async ({ page }) => {
    // GIVEN: User opens the dialog
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();

    // WHEN: Dialog is visible
    // THEN: The element has role="dialog"
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — "Guardar" shows loading state and is disabled while mutation is in-flight
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Loading state on Guardar button during submission', () => {
  test('should disable "Guardar" button while form is being submitted', async ({ page }) => {
    // GIVEN: Intercept POST BEFORE navigation to add artificial delay
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        // Simulate slow backend
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-id',
            nombre: 'Test',
            nit: '900000001',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User fills form and clicks "Guardar" (submission starts)
    await page.getByTestId('cliente-nombre-input').fill('Test Company');
    await page.getByTestId('cliente-nit-input').fill('900000001');
    await page.getByTestId('cliente-telefono-input').fill('3001234567');
    await page.getByTestId('cliente-ciudad-input').fill('Bogotá');
    await page.getByTestId('guardar-btn').click();

    // THEN: "Guardar" button is disabled during in-flight mutation
    await expect(page.getByTestId('guardar-btn')).toBeDisabled();
  });

  test('should show "Guardando..." text on submit button while mutation is in-flight', async ({
    page,
  }) => {
    // GIVEN: Intercept POST BEFORE navigation to add delay
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-id-2',
            nombre: 'Test 2',
            nit: '900000002',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User submits form
    await page.getByTestId('cliente-nombre-input').fill('Test Company 2');
    await page.getByTestId('cliente-nit-input').fill('900000002');
    await page.getByTestId('cliente-telefono-input').fill('3001234567');
    await page.getByTestId('cliente-ciudad-input').fill('Bogotá');
    await page.getByTestId('guardar-btn').click();

    // THEN: "Guardar" shows loading text "Guardando..."
    await expect(page.getByTestId('guardar-btn')).toContainText('Guardando...');
  });
});
