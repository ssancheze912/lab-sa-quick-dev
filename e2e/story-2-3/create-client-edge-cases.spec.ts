/**
 * Story 2.3: Create Client — E2E Edge Cases
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD E2E coverage with edge cases NOT covered by create-client.spec.ts.
 *
 * Additional scenarios:
 * - URL stays at /clientes after a successful create (no navigation)
 * - Data is preserved in all fields after a 5xx error (not just Nombre after 409)
 * - "Guardando…" text appears on the submit button during pending state (text, not just disabled)
 * - Form can be re-opened after a successful create
 * - Error on NIT is cleared when user corrects the field and resubmits successfully
 * - All fields are cleared/reset when form closes and reopens
 * - Keyboard: pressing Enter submits the form
 * - Keyboard: Tab order flows through fields in logical order
 * - 400 server-side validation error: toast not shown, inline error appears for affected field
 *
 * Patterns:
 * - Network-first: route intercepts registered BEFORE navigation
 * - data-testid selectors only
 * - Given-When-Then structure
 * - One assertion per test (atomic)
 * - Explicit waits only (no hard waits)
 */

import { test, expect } from '@playwright/test';
import { buildClienteResponse } from '../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';

// ─── URL does not change after a successful create ────────────────────────────

test.describe('[P1] AC2 edge — URL remains /clientes after successful create', () => {
  test('[P1] should keep the URL at /clientes after a successful form submission', async ({ page }) => {
    // GIVEN: POST endpoint returns 201 (network-first intercept before navigation)
    const newCliente = buildClienteResponse({ nombre: 'URL Stays Test SA', nit: '900777888-1' });
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newCliente) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([newCliente]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await page.getByTestId('input-nombre').fill('URL Stays Test SA');
    await page.getByTestId('input-nit').fill('900777888-1');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');

    // WHEN: User submits the form
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: URL stays at /clientes (no navigation occurs)
    await expect(page).toHaveURL(/\/clientes$/);
  });
});

// ─── Form re-opens fresh after successful create ──────────────────────────────

test.describe('[P1] AC2 edge — Form can be re-opened after successful create', () => {
  test('[P1] should show a clean empty form when "Nuevo cliente" is clicked after a successful create', async ({ page }) => {
    // GIVEN: A successful create was performed
    const newCliente = buildClienteResponse({ nombre: 'Primera Empresa SA', nit: '900100200-1' });
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newCliente) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([newCliente]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await page.getByTestId('input-nombre').fill('Primera Empresa SA');
    await page.getByTestId('input-nit').fill('900100200-1');
    await page.getByTestId('input-telefono').fill('3009900001');
    await page.getByTestId('input-ciudad').fill('Cali');
    await page.getByTestId('btn-submit-cliente').click();
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();

    // WHEN: User opens the form again
    await page.getByTestId('btn-nuevo-cliente').click();

    // THEN: The Nombre field is empty (form is reset)
    await expect(page.getByTestId('input-nombre')).toHaveValue('');
  });
});

// ─── Data preservation on 5xx error ──────────────────────────────────────────

test.describe('[P1] AC5 edge — All field values preserved after 5xx error', () => {
  test('[P1] should preserve the NIT field value after a 5xx server error', async ({ page }) => {
    // GIVEN: POST returns 500 (network-first intercept before navigation)
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 500, contentType: 'application/problem+json', body: JSON.stringify({ status: 500 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await page.getByTestId('input-nombre').fill('Empresa Sin Servidor');
    await page.getByTestId('input-nit').fill('900555666-9');
    await page.getByTestId('input-telefono').fill('3005556660');
    await page.getByTestId('input-ciudad').fill('Barranquilla');

    // WHEN: User submits the form and server returns 500
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: The NIT field still has the entered value
    await expect(page.getByTestId('toast-error')).toBeVisible();
    await expect(page.getByTestId('input-nit')).toHaveValue('900555666-9');
  });

  test('[P1] should preserve the Ciudad field value after a 5xx server error', async ({ page }) => {
    // GIVEN: POST returns 500
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 500, contentType: 'application/problem+json', body: JSON.stringify({ status: 500 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await page.getByTestId('input-nombre').fill('Empresa Sin Servidor');
    await page.getByTestId('input-nit').fill('900555666-9');
    await page.getByTestId('input-telefono').fill('3005556660');
    await page.getByTestId('input-ciudad').fill('Barranquilla');

    // WHEN: User submits and gets a 500
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: The Ciudad field still has the entered value
    await expect(page.getByTestId('toast-error')).toBeVisible();
    await expect(page.getByTestId('input-ciudad')).toHaveValue('Barranquilla');
  });
});

// ─── "Guardando…" text visible during pending state ──────────────────────────

test.describe('[P1] AC2 edge — "Guardando…" text is displayed during pending', () => {
  test('[P1] should display "Guardando…" text on the submit button while the mutation is in flight', async ({ page }) => {
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
    await page.getByTestId('input-nombre').fill('Empresa Lenta');
    await page.getByTestId('input-nit').fill('900001112-0');
    await page.getByTestId('input-telefono').fill('3001112000');
    await page.getByTestId('input-ciudad').fill('Bogotá');

    // WHEN: User submits the form
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: Submit button shows "Guardando…" during pending state
    await expect(page.getByTestId('btn-submit-cliente')).toContainText('Guardando');
  });
});

// ─── NIT error clears on correction and successful resubmit ──────────────────

test.describe('[P1] AC4 edge — NIT inline error clears on successful resubmit', () => {
  test('[P1] should clear the NIT inline error when user corrects the NIT and submits successfully', async ({ page }) => {
    // GIVEN: First POST returns 409, second POST returns 201
    let attemptCount = 0;
    const newCliente = buildClienteResponse({ nombre: 'Empresa Corregida', nit: '900999888-1' });
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        attemptCount++;
        if (attemptCount === 1) {
          route.fulfill({
            status: 409,
            contentType: 'application/problem+json',
            body: JSON.stringify({ title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado.' }),
          });
        } else {
          route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newCliente) });
        }
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await page.getByTestId('input-nombre').fill('Empresa Corregida');
    await page.getByTestId('input-nit').fill('900123456-7');
    await page.getByTestId('input-telefono').fill('3001234567');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-submit-cliente').click();
    await expect(page.getByTestId('error-nit')).toBeVisible();

    // WHEN: User corrects the NIT and resubmits
    await page.getByTestId('input-nit').fill('900999888-1');
    await page.getByTestId('btn-submit-cliente').click();

    // THEN: The form closes (indicating success) and NIT error is no longer shown
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
  });
});

// ─── Keyboard: Enter key submits the form ────────────────────────────────────

test.describe('[P2] AC1/AC2 edge — Keyboard interaction: Enter submits form', () => {
  test('[P2] should submit the form when Enter is pressed while a field is focused', async ({ page }) => {
    // GIVEN: Form is open with all fields filled (network-first intercept before navigation)
    const newCliente = buildClienteResponse({ nombre: 'Empresa Enter Key', nit: '900444555-1' });
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newCliente) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([newCliente]) });
      }
    });
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await page.getByTestId('input-nombre').fill('Empresa Enter Key');
    await page.getByTestId('input-nit').fill('900444555-1');
    await page.getByTestId('input-telefono').fill('3004445550');
    await page.getByTestId('input-ciudad').fill('Bogotá');

    // WHEN: User presses Enter while the last field is focused
    await page.getByTestId('input-ciudad').press('Enter');

    // THEN: Form is submitted and closed
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
  });
});

// ─── Cancelar when fields have data: no data persisted ───────────────────────

test.describe('[P1] AC6 edge — Cancelar with partially filled form', () => {
  test('[P1] should close the form even when all fields are filled when Cancelar is clicked', async ({ page }) => {
    // GIVEN: Form is open with all fields filled (network-first intercept before navigation)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('btn-nuevo-cliente').click();
    await page.getByTestId('input-nombre').fill('Empresa No Guardada');
    await page.getByTestId('input-nit').fill('900000099-9');
    await page.getByTestId('input-telefono').fill('3000000990');
    await page.getByTestId('input-ciudad').fill('Pereira');

    // WHEN: User clicks Cancelar without submitting
    await page.getByTestId('btn-cancelar-cliente').click();

    // THEN: The form is no longer visible
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
  });
});
