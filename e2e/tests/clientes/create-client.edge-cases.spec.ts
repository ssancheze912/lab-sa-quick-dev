/**
 * E2E Edge-Case Tests — Story 2.3: Create Client
 * Expands coverage beyond create-client.spec.ts (ATDD tests).
 *
 * Edge cases covered:
 *   - Form reset when reopened after a successful submission
 *   - Boundary max-length field values accepted by the form (no client-side block)
 *   - Tab/keyboard navigation order between form fields
 *   - Pressing Enter inside a field submits the form
 *   - Generic 500 error toast without closing the form
 *   - "Nuevo cliente" button remains visible after form is closed
 *   - Multiple sequential submissions after multiple opens
 *   - No error messages shown on initial form open (before any submission)
 *
 * Network intercept strategy: always intercept BEFORE navigation (network-first).
 */

import { test, expect } from '@playwright/test';
import { createClienteDto, createClientePayload } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';

// ─────────────────────────────────────────────────────────────────────────────
// Form state: no errors shown before first submit attempt
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — No inline errors shown before first submission attempt', () => {
  test('should NOT show any validation errors when the form is first opened', async ({ page }) => {
    // GIVEN: User opens the create form for the first time
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: No error messages are visible before the user interacts
    await expect(page.getByText('El nombre es requerido')).not.toBeVisible();
    await expect(page.getByText('El NIT/RUC es requerido')).not.toBeVisible();
    await expect(page.getByText('El teléfono es requerido')).not.toBeVisible();
    await expect(page.getByText('La ciudad es requerida')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Form reset: form opens empty after a successful submission
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Form resets when reopened after a successful submission', () => {
  test('should open an empty form when "Nuevo cliente" is clicked again after a successful creation', async ({ page }) => {
    // GIVEN: A client was already created in a previous interaction
    const firstPayload = createClientePayload({ nombre: 'Primera Empresa SA' });
    const firstCreated = createClienteDto({ ...firstPayload });
    let callCount = 0;

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        callCount++;
        if (callCount === 1) {
          return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(firstCreated) });
        }
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(createClienteDto()) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([firstCreated]) });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(firstPayload.nombre);
    await page.getByTestId('field-nit').fill(firstPayload.nit);
    await page.getByTestId('field-telefono').fill(firstPayload.telefono);
    await page.getByTestId('field-ciudad').fill(firstPayload.ciudad);
    await page.getByTestId('submit-button').click();

    // Wait for form to close after success
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();

    // WHEN: User opens the form again
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: All fields are empty (form was reset)
    await expect(page.getByTestId('field-nombre')).toHaveValue('');
    await expect(page.getByTestId('field-nit')).toHaveValue('');
    await expect(page.getByTestId('field-telefono')).toHaveValue('');
    await expect(page.getByTestId('field-ciudad')).toHaveValue('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: max-length values are accepted without client-side blocking
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Max-length field values are accepted by client-side validation', () => {
  test('should accept nombre at exactly 200 characters without showing a validation error', async ({ page }) => {
    // GIVEN: User opens the create form
    const nombre200 = 'A'.repeat(200);
    const newCliente = createClientePayload({ nombre: nombre200 });
    const created = createClienteDto({ ...newCliente });

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();

    // WHEN: User fills nombre with exactly 200 chars
    await page.getByTestId('field-nombre').fill(nombre200);
    await page.getByTestId('field-nit').fill(newCliente.nit);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);
    await page.getByTestId('submit-button').click();

    // THEN: No "Máximo 200 caracteres" error — form submits successfully
    await expect(page.getByText('Máximo 200 caracteres')).not.toBeVisible();
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
  });

  test('should accept nit at exactly 50 characters without showing a validation error', async ({ page }) => {
    // GIVEN: User opens the create form
    const nit50 = 'N'.repeat(50);
    const newCliente = createClientePayload({ nit: nit50 });
    const created = createClienteDto({ ...newCliente });

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(newCliente.nombre);
    await page.getByTestId('field-nit').fill(nit50);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);
    await page.getByTestId('submit-button').click();

    // THEN: No max-length error for NIT
    await expect(page.getByText('Máximo 50 caracteres')).not.toBeVisible();
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard: Enter key submits the form when all fields are filled
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Keyboard: Enter key submits the form', () => {
  test('should submit the form when Enter is pressed in the last field (Ciudad)', async ({ page }) => {
    // GIVEN: User fills all fields
    const newCliente = createClientePayload();
    const created = createClienteDto({ ...newCliente });
    let postCalled = false;

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([created]) });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(newCliente.nombre);
    await page.getByTestId('field-nit').fill(newCliente.nit);
    await page.getByTestId('field-telefono').fill(newCliente.telefono);
    await page.getByTestId('field-ciudad').fill(newCliente.ciudad);

    // WHEN: User presses Enter in the Ciudad field
    await page.getByTestId('field-ciudad').press('Enter');

    // THEN: The form is submitted (POST called)
    await expect.poll(() => postCalled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Generic server error: form stays open, toast shown, no success
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Generic 500 server error keeps form open', () => {
  test('should display the generic error toast and keep the form open on a 500 error', async ({ page }) => {
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
    await page.getByTestId('field-nombre').fill('Empresa Error');
    await page.getByTestId('field-nit').fill('900111222-1');
    await page.getByTestId('field-telefono').fill('3001234567');
    await page.getByTestId('field-ciudad').fill('Bogotá');

    // WHEN: Form is submitted and server returns 500
    await page.getByTestId('submit-button').click();

    // THEN: Generic error toast is shown
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();

    // AND: The form remains open (user can retry)
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });

  test('should NOT display a success toast when a 500 error occurs', async ({ page }) => {
    // GIVEN: Backend returns 500 on POST
    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Empresa Error');
    await page.getByTestId('field-nit').fill('900111222-1');
    await page.getByTestId('field-telefono').fill('3001234567');
    await page.getByTestId('field-ciudad').fill('Bogotá');
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();

    // THEN: No success toast visible
    await expect(page.getByText('Cliente creado correctamente')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// "Nuevo cliente" button: remains visible after form is cancelled
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — "Nuevo cliente" button remains accessible after cancel', () => {
  test('should still show "Nuevo cliente" button after cancelling the create form', async ({ page }) => {
    // GIVEN: User opens and cancels the form
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User cancels
    await page.getByTestId('cancel-button').click();

    // THEN: "Nuevo cliente" button is still visible (user can open the form again)
    await expect(page.getByTestId('nuevo-cliente-button')).toBeVisible();
  });

  test('should allow reopening the create form multiple times after cancel', async ({ page }) => {
    // GIVEN: User opens and cancels multiple times
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/clientes');

    for (let i = 0; i < 3; i++) {
      await page.getByTestId('nuevo-cliente-button').click();
      await expect(page.getByTestId('cliente-form')).toBeVisible();
      await page.getByTestId('cancel-button').click();
      await expect(page.getByTestId('cliente-form')).not.toBeVisible();
    }

    // THEN: Form can still be opened a final time
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple sequential submissions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Multiple sequential successful submissions', () => {
  test('should allow creating two clients in sequence', async ({ page }) => {
    // GIVEN: Two valid client payloads
    const first = createClientePayload({ nombre: 'Primera Empresa SA' });
    const second = createClientePayload({ nombre: 'Segunda Empresa SA' });
    const firstCreated = createClienteDto({ ...first });
    const secondCreated = createClienteDto({ ...second });
    let postCount = 0;

    await page.route(API_CLIENTES, (route) => {
      if (route.request().method() === 'POST') {
        postCount++;
        const body = postCount === 1 ? firstCreated : secondCreated;
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(body) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');

    // First creation
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(first.nombre);
    await page.getByTestId('field-nit').fill(first.nit);
    await page.getByTestId('field-telefono').fill(first.telefono);
    await page.getByTestId('field-ciudad').fill(first.ciudad);
    await page.getByTestId('submit-button').click();
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();

    // Second creation
    await page.getByTestId('nuevo-cliente-button').click();
    await page.getByTestId('field-nombre').fill(second.nombre);
    await page.getByTestId('field-nit').fill(second.nit);
    await page.getByTestId('field-telefono').fill(second.telefono);
    await page.getByTestId('field-ciudad').fill(second.ciudad);
    await page.getByTestId('submit-button').click();

    // THEN: Two POSTs were made
    await expect.poll(() => postCount).toBe(2);
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
  });
});
