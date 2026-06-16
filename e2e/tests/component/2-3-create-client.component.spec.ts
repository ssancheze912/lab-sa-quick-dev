import { test, expect } from '@playwright/test';

/**
 * Component-level Acceptance Tests — Story 2.3: Create Client
 *
 * NOTE: These Playwright tests are integration/E2E-style component tests using
 * mocked API routes (network-first intercepts). The unit-level component tests
 * (Vitest + RTL) are defined separately in:
 *   frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx
 *   frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts
 *   frontend/src/modules/crm/clientes/application/clienteSchema.test.ts
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P0-08 — Required field validation prevents form submission (no POST made)
 *   TC-E2-P2-06 — 409 duplicate NIT surfaces "El NIT/RUC ya está registrado" in UI (NFR6)
 *   TC-E2-P2-01 — Successful mutation shows toast "Cliente creado correctamente"
 *
 * AC coverage:
 *   AC1 — Clicking "Nuevo cliente" opens a dialog/modal form with 4 required fields
 *   AC2 — Submit success: client created, list refreshed, toast shown
 *   AC3 — Empty required fields: inline errors shown, no POST made
 *   AC4 — Duplicate NIT: "El NIT/RUC ya está registrado" inline error, no raw error shown
 *   AC5 — Cancel/dismiss: no API call, list unchanged
 *   AC6 — Non-409 backend error: toast "No se pudo crear el cliente. Intenta de nuevo."
 *
 * These tests are in RED phase — they will fail until implementation is complete.
 * Network-first intercepts are set BEFORE navigation per ATDD patterns.
 */

const BASE_URL = 'http://localhost:5173';
const API_LIST_PATTERN = '**/api/v1/clientes';

/**
 * Build a minimal mock ClienteDto matching the backend contract.
 */
function mockClienteDto(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const ts = new Date().toISOString();
  return {
    id: `uuid-create-${Math.random().toString(36).slice(2, 10)}`,
    nombre: 'Empresa Creada S.A.',
    nit: '900555001',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1: "Nuevo cliente" button opens dialog with required fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — AC1: "Nuevo cliente" button opens form dialog', () => {

  test('AC1 — "Nuevo cliente" button is visible on /clientes', async ({ page }) => {
    // GIVEN: The clientes page is loaded with a mocked empty list
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: Navigating to /clientes
    await page.goto(`${BASE_URL}/clientes`);

    // THEN: The "Nuevo cliente" button is visible
    await expect(page.getByRole('button', { name: /nuevo cliente/i })).toBeVisible();
  });

  test('AC1 — clicking "Nuevo cliente" opens a dialog/modal', async ({ page }) => {
    // GIVEN: The clientes page is loaded
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
    await page.goto(`${BASE_URL}/clientes`);

    // WHEN: User clicks "Nuevo cliente"
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // THEN: A dialog/modal is open
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('AC1 — form dialog contains Nombre input field', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Inspecting the form
    // THEN: Nombre input is present (label + input pair via htmlFor/id)
    await expect(page.getByLabel(/nombre/i)).toBeVisible();
  });

  test('AC1 — form dialog contains NIT/RUC input field', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Inspecting the form
    // THEN: NIT/RUC input is present
    await expect(page.getByLabel(/nit/i)).toBeVisible();
  });

  test('AC1 — form dialog contains Teléfono input field', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Inspecting the form
    // THEN: Teléfono input is present
    await expect(page.getByLabel(/teléfono/i)).toBeVisible();
  });

  test('AC1 — form dialog contains Ciudad input field', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Inspecting the form
    // THEN: Ciudad input is present
    await expect(page.getByLabel(/ciudad/i)).toBeVisible();
  });

  test('AC1 — form dialog contains "Crear cliente" submit button', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Inspecting the dialog
    // THEN: Submit button is labeled "Crear cliente"
    await expect(page.getByRole('button', { name: /crear cliente/i })).toBeVisible();
  });

  test('AC1 — form dialog contains "Cancelar" button', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Inspecting the dialog
    // THEN: Cancel button is labeled "Cancelar"
    await expect(page.getByRole('button', { name: /cancelar/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-08 / AC3: Empty required fields → inline errors, no POST made
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — TC-E2-P0-08 / AC3: Required field validation prevents submission', () => {

  test('TC-E2-P0-08 — submitting empty form shows inline error on Nombre field', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open with all fields empty
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Track POST requests — none should be made
    let postMade = false;
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        postMade = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // WHEN: Submitting the form without filling any fields
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Inline error for Nombre field appears
    await expect(page.getByTestId('error-nombre')).toBeVisible();
  });

  test('TC-E2-P0-08 — submitting empty form shows inline error on NIT/RUC field', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open with all fields empty
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Submitting the form without filling any fields
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Inline error for NIT/RUC field appears
    await expect(page.getByTestId('error-nit')).toBeVisible();
  });

  test('TC-E2-P0-08 — submitting empty form shows inline error on Teléfono field', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open with all fields empty
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Submitting the form without filling any fields
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Inline error for Teléfono field appears
    await expect(page.getByTestId('error-telefono')).toBeVisible();
  });

  test('TC-E2-P0-08 — submitting empty form shows inline error on Ciudad field', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open with all fields empty
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Submitting the form without filling any fields
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Inline error for Ciudad field appears
    await expect(page.getByTestId('error-ciudad')).toBeVisible();
  });

  test('TC-E2-P0-08 — submitting empty form does NOT make a POST request', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open
    const postRequests: string[] = [];

    // Network-first: intercept list GET and track POST
    await page.route(API_LIST_PATTERN, (route) => {
      if (route.request().method() === 'POST') {
        postRequests.push(route.request().url());
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({}) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Submitting the form without filling any fields
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // Wait briefly for any async effects
    await page.waitForTimeout(300);

    // THEN: No POST request was made to the backend
    expect(postRequests).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-06 / AC4: 409 Duplicate NIT → inline error in form (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — TC-E2-P2-06 / AC4: Duplicate NIT shows inline error', () => {

  test('TC-E2-P2-06 — submitting duplicate NIT shows "El NIT/RUC ya está registrado" inline', async ({ page }) => {
    // GIVEN: The clientes page with the dialog open
    // AND: the POST endpoint returns a 409 Problem Details response
    const problem409 = {
      status: 409,
      title: 'Conflicto de datos',
      detail: 'El NIT/RUC ya está registrado',
    };

    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify(problem409),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Filling the form with a NIT that triggers 409 and submitting
    await page.getByLabel(/nombre/i).fill('Empresa Duplicada S.A.');
    await page.getByLabel(/nit/i).fill('900-EXISTING-NIT');
    await page.getByLabel(/teléfono/i).fill('3001234567');
    await page.getByLabel(/ciudad/i).fill('Medellín');
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: The inline error message "El NIT/RUC ya está registrado" appears
    await expect(page.getByTestId('error-nit')).toContainText('El NIT/RUC ya está registrado');
  });

  test('TC-E2-P2-06 / NFR6 — 409 response does NOT show raw error or status code to user', async ({ page }) => {
    // GIVEN: POST endpoint returns 409
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({ status: 409, title: 'Conflicto', detail: 'El NIT/RUC ya está registrado' }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill and submit
    await page.getByLabel(/nombre/i).fill('Empresa NFR6 Test');
    await page.getByLabel(/nit/i).fill('900-DUP-NFR6');
    await page.getByLabel(/teléfono/i).fill('3101234567');
    await page.getByLabel(/ciudad/i).fill('Cali');
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // Wait for error to appear
    await page.waitForSelector('[data-testid="error-nit"]');

    // THEN: The page body text does not contain raw technical error information
    const pageText = await page.innerText('body');
    expect(pageText).not.toContain('DbUpdateException');
    expect(pageText).not.toContain('stackTrace');
    expect(pageText).not.toContain('409 Conflict');
    expect(pageText).not.toContain('application/problem+json');
  });

  test('TC-E2-P2-06 — after 409, dialog stays open so user can correct the NIT value', async ({ page }) => {
    // GIVEN: POST endpoint returns 409
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({ status: 409, detail: 'El NIT/RUC ya está registrado' }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill and submit
    await page.getByLabel(/nombre/i).fill('Empresa 409 Stay Open');
    await page.getByLabel(/nit/i).fill('900-DUP-STAY');
    await page.getByLabel(/teléfono/i).fill('3001234567');
    await page.getByLabel(/ciudad/i).fill('Bogotá');
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // Wait for error to appear
    await page.waitForSelector('[data-testid="error-nit"]');

    // THEN: Dialog is still visible (form does not close on 409)
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Success path — toast shown, dialog closes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — AC2: Successful form submission shows toast and closes dialog', () => {

  test('AC2 — successful submission shows toast "Cliente creado correctamente"', async ({ page }) => {
    // GIVEN: POST endpoint returns 201 with a new client
    const newCliente = mockClienteDto({ nombre: 'Empresa Nueva S.A.', nit: '900-SUCCESS-001' });

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

    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Filling and submitting the form
    await page.getByLabel(/nombre/i).fill(newCliente.nombre);
    await page.getByLabel(/nit/i).fill(newCliente.nit);
    await page.getByLabel(/teléfono/i).fill(newCliente.telefono);
    await page.getByLabel(/ciudad/i).fill(newCliente.ciudad);
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Toast message "Cliente creado correctamente" appears
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible({ timeout: 5000 });
  });

  test('AC2 — dialog closes automatically after successful submission', async ({ page }) => {
    // GIVEN: POST endpoint returns 201
    const newCliente = mockClienteDto({ nombre: 'Empresa Auto Close', nit: '900-CLOSE-001' });

    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newCliente) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Filling and submitting the form
    await page.getByLabel(/nombre/i).fill(newCliente.nombre);
    await page.getByLabel(/nit/i).fill(newCliente.nit);
    await page.getByLabel(/teléfono/i).fill(newCliente.telefono);
    await page.getByLabel(/ciudad/i).fill(newCliente.ciudad);
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Dialog closes after success
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Cancel/dismiss dialog — no API call made
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — AC5: Cancel dialog makes no API call', () => {

  test('AC5 — clicking "Cancelar" closes the dialog', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open
    await page.route(API_LIST_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByRole('button', { name: /cancelar/i }).click();

    // THEN: Dialog is closed
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('AC5 — clicking "Cancelar" does NOT make a POST request', async ({ page }) => {
    // GIVEN: The "Nuevo cliente" dialog is open
    const postRequests: string[] = [];

    await page.route(API_LIST_PATTERN, (route) => {
      if (route.request().method() === 'POST') {
        postRequests.push(route.request().url());
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({}) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill some fields but then cancel
    await page.getByLabel(/nombre/i).fill('Empresa No Creada');

    // WHEN: User clicks "Cancelar"
    await page.getByRole('button', { name: /cancelar/i }).click();
    await page.waitForTimeout(300);

    // THEN: No POST request was made
    expect(postRequests).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Non-409 backend error → toast "No se pudo crear el cliente. Intenta de nuevo."
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — AC6: Non-409 backend error shows error toast', () => {

  test('AC6 — 500 backend error shows toast "No se pudo crear el cliente. Intenta de nuevo."', async ({ page }) => {
    // GIVEN: POST endpoint returns 500
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Filling and submitting the form
    await page.getByLabel(/nombre/i).fill('Empresa Error 500');
    await page.getByLabel(/nit/i).fill('900-ERROR-500');
    await page.getByLabel(/teléfono/i).fill('3001234567');
    await page.getByLabel(/ciudad/i).fill('Bogotá');
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Error toast appears with the user-friendly message
    await expect(page.getByText('No se pudo crear el cliente. Intenta de nuevo.')).toBeVisible({ timeout: 5000 });
  });

  test('AC6 / NFR6 — 500 backend error does NOT show raw error details to user', async ({ page }) => {
    // GIVEN: POST endpoint returns 500 with internal details
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            status: 500,
            title: 'Internal Server Error',
            detail: 'Object reference not set to an instance of an object',
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto(`${BASE_URL}/clientes`);
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: Submitting
    await page.getByLabel(/nombre/i).fill('Empresa NFR6 Error');
    await page.getByLabel(/nit/i).fill('900-NFR6-500');
    await page.getByLabel(/teléfono/i).fill('3001234567');
    await page.getByLabel(/ciudad/i).fill('Bogotá');
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // Wait for error toast
    await page.waitForSelector('[role="status"]', { timeout: 5000 }).catch(() => null);

    // THEN: Raw error text is not visible to the user
    const pageText = await page.innerText('body');
    expect(pageText).not.toContain('Object reference not set');
    expect(pageText).not.toContain('Internal Server Error');
    expect(pageText).not.toContain('stackTrace');
  });
});
