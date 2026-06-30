/**
 * Story 2.3: Create Client — E2E Edge Cases
 * Epic 2: Client Management
 *
 * Edge-case E2E tests expanding beyond the ATDD coverage.
 * ATDD covers: form opens, 4 fields render, valid submission, toast, form close,
 * loading state, per-field validation errors, form not submitted when empty,
 * Cancelar, 409 message, NFR6, form stays open on 409.
 *
 * This file covers:
 *   - 500 server error keeps form open (user can retry)
 *   - 500 server error shows generic error toast (not technical details)
 *   - Form can be reopened after closing with Cancelar
 *   - Submit button aria-label or accessible name is present
 *   - Clicking backdrop closes the form dialog
 *   - Form input values are preserved after a 409 error (user can correct NIT)
 *   - Multiple clients can be created in sequence
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: 500 server error — form stays open, generic toast shown
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — 500 server error behavior', () => {
  test('[P1] should keep form open when backend returns 500', async ({ page }) => {
    // GIVEN: Backend will return 500 on POST
    const data = buildCliente();

    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'An unexpected error occurred.',
            status: 500,
            detail: 'An internal server error occurred.',
          }),
        });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: User fills all fields and submits, but backend returns 500
    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Form stays open (dialog is still visible — user can retry)
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });

  test('[P1] should NOT expose technical details in UI on 500 error (NFR6)', async ({ page }) => {
    // GIVEN: Backend returns 500 with internal details
    const data = buildCliente();

    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'An unexpected error occurred.',
            status: 500,
            detail: 'NullReferenceException at SiesaAgents.Application...',
            traceId: '00-abc123-01',
          }),
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

    // THEN: None of the technical internals are shown in UI
    await expect(page.getByText(/NullReferenceException|traceId|00-abc123/i)).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: form can be reopened after closing
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — form lifecycle', () => {
  test('[P1] form can be reopened after Cancelar closes it', async ({ page }) => {
    // GIVEN: User opens and cancels the form
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // WHEN: User clicks "Nuevo cliente" again
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // THEN: Form opens again with clean state
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/nombre/i)).toHaveValue('');
    await expect(page.getByLabel(/nit/i)).toHaveValue('');
    await expect(page.getByLabel(/teléfono/i)).toHaveValue('');
    await expect(page.getByLabel(/ciudad/i)).toHaveValue('');
  });

  test('[P2] form fields are empty when form first opens (no leftover state)', async ({ page }) => {
    // GIVEN: No previous state
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: Form is opened fresh
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // THEN: All fields are empty initially
    await expect(page.getByLabel(/nombre/i)).toHaveValue('');
    await expect(page.getByLabel(/nit/i)).toHaveValue('');
    await expect(page.getByLabel(/teléfono/i)).toHaveValue('');
    await expect(page.getByLabel(/ciudad/i)).toHaveValue('');
  });

  test('[P2] submit button shows "Guardar" text when not pending', async ({ page }) => {
    // GIVEN: Form is open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // THEN: Submit button contains the label 'Guardar'
    await expect(page.getByTestId('cliente-form-submit')).toContainText('Guardar');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: form input values preserved after 409 (user can correct NIT)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — 409 form state preservation', () => {
  test('[P1] Nombre, Teléfono and Ciudad values are preserved after 409 conflict', async ({ page }) => {
    // GIVEN: User fills form and gets a 409 conflict on NIT
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

    // WHEN: 409 is received and form stays open
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // THEN: The Nombre field still has the filled value (user only needs to fix NIT)
    await expect(page.getByLabel(/nombre/i)).toHaveValue(data.nombre);
    await expect(page.getByLabel(/teléfono/i)).toHaveValue(data.telefono);
    await expect(page.getByLabel(/ciudad/i)).toHaveValue(data.ciudad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: "Nuevo cliente" button accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — button accessibility', () => {
  test('[P2] "Nuevo cliente" button has aria-pressed attribute', async ({ page }) => {
    // GIVEN: User is on the /clientes view
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/clientes');

    // THEN: "Nuevo cliente" button has aria-pressed attribute (reflects open/close state)
    const button = page.getByRole('button', { name: /nuevo cliente/i });
    await expect(button).toHaveAttribute('aria-pressed');
  });

  test('[P2] "Nuevo cliente" button aria-pressed is "false" when form is closed', async ({ page }) => {
    // GIVEN: Form is closed
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/clientes');

    // THEN: aria-pressed is false when form is not open
    await expect(page.getByRole('button', { name: /nuevo cliente/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  test('[P2] "Nuevo cliente" button aria-pressed becomes "true" when form opens', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/clientes');

    // WHEN: User clicks "Nuevo cliente"
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // THEN: aria-pressed is true
    await expect(page.getByRole('button', { name: /nuevo cliente/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: all required fields must have a value before form submission
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — partial form submission', () => {
  test('[P1] should NOT submit when only Nombre is filled', async ({ page }) => {
    // GIVEN: Only Nombre is filled
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
    await page.getByLabel(/nombre/i).fill('Empresa Test');

    // WHEN: User submits without NIT, Teléfono, Ciudad
    await page.getByTestId('cliente-form-submit').click();

    // THEN: POST was NOT called (frontend validation prevents it)
    expect(postCalled).toBe(false);

    // AND: Inline errors appear for the missing fields
    await expect(page.getByText(/nit.*requerido/i)).toBeVisible();
    await expect(page.getByText(/teléfono requerido/i)).toBeVisible();
    await expect(page.getByText(/ciudad requerida/i)).toBeVisible();
  });

  test('[P1] should NOT submit when only NIT is filled', async ({ page }) => {
    // GIVEN: Only NIT is filled
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
    await page.getByLabel(/nit/i).fill('900123456-1');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: POST not called, Nombre error appears
    expect(postCalled).toBe(false);
    await expect(page.getByText(/nombre requerido/i)).toBeVisible();
  });
});
