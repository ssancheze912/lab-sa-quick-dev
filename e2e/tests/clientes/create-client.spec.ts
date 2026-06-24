/**
 * E2E Tests — Story 2.3: Create Client
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — "Nuevo cliente" button opens form with Nombre, NIT/RUC, Teléfono, Ciudad fields (all required)
 *   AC2 — Successful submit calls POST /api/v1/clientes, updates list, shows success toast
 *   AC3 — Submitting with empty fields shows inline validation errors; no backend call
 *   AC4 — Duplicate NIT (409 Conflict) shows "El NIT/RUC ya está registrado" without stack trace
 *   AC5 — In-flight submission disables submit button and shows loading indicator
 *   AC6 — Clicking "Cancelar" closes form without creating a client
 *
 * Required data-testid attributes (must be added during implementation):
 *   - nuevo-cliente-button    → "Nuevo cliente" trigger button in list panel header
 *   - cliente-form            → <form> root of the create client form
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
import { createClienteDto, createClienteDtos, createClientePayload } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Nuevo cliente" button opens form with all required fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — "Nuevo cliente" button opens the create client form', () => {
  test('should display a "Nuevo cliente" button in the client list panel', async ({ page }) => {
    // GIVEN: User is on /clientes with an empty client list
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: "Nuevo cliente" button is visible
    await expect(page.getByTestId('nuevo-cliente-button')).toBeVisible();
  });

  test('should open a form dialog when "Nuevo cliente" is clicked', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');

    // WHEN: User clicks "Nuevo cliente"
    await page.getByTestId('nuevo-cliente-button').click();

    // THEN: The create client form is visible
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });

  test('should display the Nombre input field in the create form', async ({ page }) => {
    // GIVEN: User has opened the create client form
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: Nombre input field is present
    await expect(page.getByTestId('field-nombre')).toBeVisible();
  });

  test('should display the NIT/RUC input field in the create form', async ({ page }) => {
    // GIVEN: User has opened the create client form
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: NIT/RUC input field is present
    await expect(page.getByTestId('field-nit')).toBeVisible();
  });

  test('should display the Teléfono input field in the create form', async ({ page }) => {
    // GIVEN: User has opened the create client form
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: Teléfono input field is present
    await expect(page.getByTestId('field-telefono')).toBeVisible();
  });

  test('should display the Ciudad input field in the create form', async ({ page }) => {
    // GIVEN: User has opened the create client form
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: Ciudad input field is present
    await expect(page.getByTestId('field-ciudad')).toBeVisible();
  });

  test('should display a submit button in the create form', async ({ page }) => {
    // GIVEN: User has opened the create client form
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();

    // THEN: A submit button is present and enabled
    await expect(page.getByTestId('submit-button')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toBeEnabled();
  });

  test('should display a cancel button in the create form', async ({ page }) => {
    // GIVEN: User has opened the create client form
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();

    // THEN: A cancel button is present
    await expect(page.getByTestId('cancel-button')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Successful submit creates client via POST and updates the list
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Successful form submission creates client and refreshes list', () => {
  test('should call POST /api/v1/clientes when the form is submitted with valid data', async ({ page }) => {
    // GIVEN: User has opened the create client form
    const newCliente = createClientePayload({ nombre: 'Empresa Nueva SAS', nit: '900111222-1', ciudad: 'Bogotá' });
    const createdCliente = createClienteDto({ ...newCliente });
    let postCalled = false;

    // Network-first: intercept BEFORE navigation
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createdCliente) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();

    // WHEN: User fills and submits the form
    await page.getByTestId('field-nombre').fill(newCliente.nombre);
    await page.getByTestId('field-nit').fill(newCliente.nit);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);
    await page.getByTestId('submit-button').click();

    // THEN: POST was called to the backend
    await expect.poll(() => postCalled).toBe(true);
  });

  test('should close the create form after a successful submission', async ({ page }) => {
    // GIVEN: User has filled the form
    const newCliente = createClientePayload();
    const createdCliente = createClienteDto({ ...newCliente });

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createdCliente) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([createdCliente]) });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(newCliente.nombre);
    await page.getByTestId('field-nit').fill(newCliente.nit);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);

    // WHEN: Form is submitted
    await page.getByTestId('submit-button').click();

    // THEN: The form dialog closes
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
  });

  test('should display a success toast "Cliente creado correctamente" after successful submission', async ({ page }) => {
    // GIVEN: User fills and submits the form
    const newCliente = createClientePayload();
    const createdCliente = createClienteDto({ ...newCliente });

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createdCliente) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([createdCliente]) });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(newCliente.nombre);
    await page.getByTestId('field-nit').fill(newCliente.nit);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);

    // WHEN: Form is submitted
    await page.getByTestId('submit-button').click();

    // THEN: A success toast with the expected Spanish message is shown
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
  });

  test('should refresh the client list (re-fetch GET /api/v1/clientes) after successful creation', async ({ page }) => {
    // GIVEN: A client is created via the form
    const existingCliente = createClienteDto({ nombre: 'Empresa Existente' });
    const newCliente = createClientePayload({ nombre: 'Empresa Recién Creada' });
    const createdCliente = createClienteDto({ ...newCliente });
    let getCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createdCliente) });
      }
      // GET: first call returns initial list; second call (after invalidation) returns updated list
      getCallCount++;
      const body = getCallCount === 1
        ? JSON.stringify([existingCliente])
        : JSON.stringify([existingCliente, createdCliente]);
      return route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(newCliente.nombre);
    await page.getByTestId('field-nit').fill(newCliente.nit);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);

    // WHEN: Form is submitted successfully
    await page.getByTestId('submit-button').click();

    // THEN: A second GET is triggered (TanStack Query invalidateQueries)
    await expect.poll(() => getCallCount).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Empty required fields show inline validation errors; no backend call
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Client-side validation: empty fields show inline errors without backend call', () => {
  test('should show inline error for Nombre when the form is submitted with Nombre empty', async ({ page }) => {
    // GIVEN: User opens the form but leaves Nombre empty
    let postCalled = false;
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    // Fill all fields EXCEPT Nombre
    await page.getByTestId('field-nit').fill('900111222-1');
    await page.getByTestId('field-telefono').fill('3001234567');
    await page.getByTestId('field-ciudad').fill('Bogotá');

    // WHEN: User submits the form
    await page.getByTestId('submit-button').click();

    // THEN: An inline error for Nombre is displayed
    await expect(page.getByText('El nombre es requerido')).toBeVisible();
    // AND: No POST request was made
    expect(postCalled).toBe(false);
  });

  test('should show inline error for NIT when the form is submitted with NIT empty', async ({ page }) => {
    // GIVEN: User opens form with NIT empty
    let postCalled = false;
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa Test');
    // NIT left empty
    await page.getByTestId('field-telefono').fill('3001234567');
    await page.getByTestId('field-ciudad').fill('Bogotá');

    // WHEN: Form is submitted
    await page.getByTestId('submit-button').click();

    // THEN: Inline error for NIT is visible
    await expect(page.getByText('El NIT/RUC es requerido')).toBeVisible();
    expect(postCalled).toBe(false);
  });

  test('should show inline error for Teléfono when the form is submitted with Teléfono empty', async ({ page }) => {
    // GIVEN: User opens form with Teléfono empty
    let postCalled = false;
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa Test');
    await page.getByTestId('field-nit').fill('900111222-1');
    // Teléfono left empty
    await page.getByTestId('field-ciudad').fill('Bogotá');

    // WHEN: Form is submitted
    await page.getByTestId('submit-button').click();

    // THEN: Inline error for Teléfono is visible
    await expect(page.getByText('El teléfono es requerido')).toBeVisible();
    expect(postCalled).toBe(false);
  });

  test('should show inline error for Ciudad when the form is submitted with Ciudad empty', async ({ page }) => {
    // GIVEN: User opens form with Ciudad empty
    let postCalled = false;
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa Test');
    await page.getByTestId('field-nit').fill('900111222-1');
    await page.getByTestId('field-telefono').fill('3001234567');
    // Ciudad left empty

    // WHEN: Form is submitted
    await page.getByTestId('submit-button').click();

    // THEN: Inline error for Ciudad is visible
    await expect(page.getByText('La ciudad es requerida')).toBeVisible();
    expect(postCalled).toBe(false);
  });

  test('should NOT submit the form to the backend when all fields are empty', async ({ page }) => {
    // GIVEN: User opens the form and immediately submits without filling any field
    let postCalled = false;
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();

    // WHEN: Submit button is clicked with all fields empty
    await page.getByTestId('submit-button').click();

    // THEN: No POST call was made to the backend
    // Validate no POST occurred by checking form still shows validation errors (Zod prevents submission)
    await expect(page.getByText('El nombre es requerido')).toBeVisible();
    expect(postCalled).toBe(false);
  });

  test('should keep the form open when validation fails (not close on error)', async ({ page }) => {
    // GIVEN: User submits with empty fields
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();

    // WHEN: User submits with empty fields
    await page.getByTestId('submit-button').click();

    // THEN: The form remains open (not closed on validation error)
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 409 Conflict: "El NIT/RUC ya está registrado" shown, no stack trace
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Duplicate NIT/RUC (409) shows user-friendly error without technical details', () => {
  test('should display "El NIT/RUC ya está registrado" when backend returns 409 Conflict', async ({ page }) => {
    // GIVEN: A NIT that already exists in the system
    const duplicateNit = '900111222-1';

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa Duplicada SA');
    await page.getByTestId('field-nit').fill(duplicateNit);
    await page.getByTestId('field-telefono').fill('3001234567');
    await page.getByTestId('field-ciudad').fill('Bogotá');

    // WHEN: User submits the form with a duplicate NIT
    await page.getByTestId('submit-button').click();

    // THEN: The error message is displayed to the user
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();
  });

  test('should NOT display a stack trace or technical error details when 409 Conflict occurs', async ({ page }) => {
    // GIVEN: A NIT that already exists (409)
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // Track uncaught JS errors (stack traces shown in browser)
    const uncaughtErrors: string[] = [];
    page.on('pageerror', (err) => uncaughtErrors.push(err.message));

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa Test');
    await page.getByTestId('field-nit').fill('900111222-1');
    await page.getByTestId('field-telefono').fill('3001234567');
    await page.getByTestId('field-ciudad').fill('Bogotá');

    // WHEN: User submits with duplicate NIT
    await page.getByTestId('submit-button').click();
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // THEN: No uncaught JS errors (no stack trace exposed to user)
    expect(uncaughtErrors).toHaveLength(0);
  });

  test('should keep the create form open when a 409 error occurs', async ({ page }) => {
    // GIVEN: Backend returns 409 on POST
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa Test');
    await page.getByTestId('field-nit').fill('900111222-1');
    await page.getByTestId('field-telefono').fill('3001234567');
    await page.getByTestId('field-ciudad').fill('Bogotá');

    // WHEN: Conflict error occurs
    await page.getByTestId('submit-button').click();

    // THEN: The form stays open (user can correct the NIT and retry)
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });

  test('should display a generic error toast for non-409 server errors', async ({ page }) => {
    // GIVEN: Backend returns 500 on POST
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa Test');
    await page.getByTestId('field-nit').fill('900111222-1');
    await page.getByTestId('field-telefono').fill('3001234567');
    await page.getByTestId('field-ciudad').fill('Bogotá');

    // WHEN: A generic server error occurs
    await page.getByTestId('submit-button').click();

    // THEN: A generic error message is shown (not the NIT conflict message)
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — In-flight submission: submit button is disabled with loading indicator
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Submit button is disabled and shows loading state while mutation is pending', () => {
  test('should disable the submit button while the POST request is in-flight', async ({ page }) => {
    // GIVEN: User has filled the form; POST will be held pending
    let releaseMutation!: () => void;
    const mutationHeld = new Promise<void>((resolve) => { releaseMutation = resolve; });
    const newCliente = createClientePayload();
    const createdCliente = createClienteDto({ ...newCliente });

    await page.route(API_CLIENTES, async (route) => {
      if (route.request().method() === 'POST') {
        await mutationHeld;
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createdCliente) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(newCliente.nombre);
    await page.getByTestId('field-nit').fill(newCliente.nit);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);

    // WHEN: User submits (mutation is in-flight)
    await page.getByTestId('submit-button').click();

    // THEN: Submit button is disabled during in-flight request
    await expect(page.getByTestId('submit-button')).toBeDisabled();

    // Cleanup
    releaseMutation();
  });

  test('should show a loading indicator ("Guardando...") on the submit button while mutation is pending', async ({ page }) => {
    // GIVEN: POST is held pending while mutation is in-flight
    let releaseMutation!: () => void;
    const mutationHeld = new Promise<void>((resolve) => { releaseMutation = resolve; });
    const newCliente = createClientePayload();
    const createdCliente = createClienteDto({ ...newCliente });

    await page.route(API_CLIENTES, async (route) => {
      if (route.request().method() === 'POST') {
        await mutationHeld;
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createdCliente) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(newCliente.nombre);
    await page.getByTestId('field-nit').fill(newCliente.nit);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);

    // WHEN: Mutation is in-flight
    await page.getByTestId('submit-button').click();

    // THEN: Submit button shows loading text "Guardando..."
    await expect(page.getByTestId('submit-button')).toContainText('Guardando...');

    // Cleanup
    releaseMutation();
  });

  test('should re-enable the submit button after the POST request completes', async ({ page }) => {
    // GIVEN: A successful POST is performed
    const newCliente = createClientePayload();
    const createdCliente = createClienteDto({ ...newCliente });

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createdCliente) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([createdCliente]) });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(newCliente.nombre);
    await page.getByTestId('field-nit').fill(newCliente.nit);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);
    await page.getByTestId('submit-button').click();

    // Form closes on success; open form again to check button state
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
    await page.getByTestId('nuevo-cliente-button').click();

    // THEN: Submit button is enabled again on a fresh form
    await expect(page.getByTestId('submit-button')).toBeEnabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Cancel button closes form without creating a client
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — "Cancelar" closes form without creating a client', () => {
  test('should close the create form when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: User has opened the create client form
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cancel-button').click();

    // THEN: The form is no longer visible
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
  });

  test('should NOT call POST /api/v1/clientes when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: User partially fills the form
    let postCalled = false;
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    // User partially fills the form
    await page.getByTestId('field-nombre').fill('Empresa Cancelada SA');
    await page.getByTestId('field-nit').fill('900000001-1');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cancel-button').click();

    // THEN: No POST was sent to the backend
    expect(postCalled).toBe(false);
  });

  test('should keep the existing client list unchanged after cancelling the form', async ({ page }) => {
    // GIVEN: Clients already exist and the user opens the create form
    const existingClientes = createClienteDtos(3);
    let getCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'GET') {
        getCallCount++;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(existingClientes) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa No Creada');

    // WHEN: User cancels
    await page.getByTestId('cancel-button').click();

    // THEN: No additional GET request was triggered (list not refreshed — no mutation occurred)
    // Only the initial GET should have been called
    expect(getCallCount).toBe(1);
  });
});
