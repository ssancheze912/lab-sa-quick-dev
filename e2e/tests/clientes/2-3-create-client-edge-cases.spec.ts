/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * E2E Tests — Edge Cases & Boundary Conditions (BMad-Integrated Expansion)
 * Expands ATDD coverage with E2E-level edge cases not covered in
 * 2-3-create-client.spec.ts.
 *
 * New Test Cases:
 *   TC-2.3-E-04 — "Nuevo cliente" button is visible even when client list is empty
 *   TC-2.3-E-05 — Dialog stays open after a 409 duplicate NIT error (form not closed)
 *   TC-2.3-E-06 — Network error (5xx) shows generic toast and keeps dialog open
 *   TC-2.3-E-07 — Form resets after successful creation; reopening shows empty fields
 *   TC-2.3-E-08 — Cancelling form (Cancelar button) closes the dialog
 *   TC-2.3-E-09 — Dialog closes when user presses Escape key
 *   TC-2.3-E-10 — Each form field has an associated <label> element (WCAG 2.1 AA)
 *   TC-2.3-E-11 — Submit button shows "Guardando…" text while request is in-flight
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-04 — "Nuevo cliente" button visible with empty list
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — "Nuevo cliente" button visible even when the client list is empty', () => {
  test('[P1][TC-2.3-E-04] Given no clients exist in the system, When user navigates to /clientes, Then "Nuevo cliente" button is still visible', async ({
    page,
  }) => {
    // GIVEN: Network-first — mock an empty client list BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The list panel renders (even if empty)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: "Nuevo cliente" button is visible despite the empty list
    await expect(page.getByTestId('nuevo-cliente-button')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-05 — Dialog stays open after a 409 duplicate NIT error
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#4 — Dialog remains open after duplicate NIT error (no accidental close)', () => {
  test('[P1][TC-2.3-E-05] Given a 409 response for duplicate NIT, When the error is shown, Then the form dialog remains open and the user can correct the field', async ({
    page,
  }) => {
    // GIVEN: Network-first — mock list GET and POST 409 BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({ title: 'El NIT/RUC ya está registrado.', status: 409 }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    // WHEN: User navigates, opens form, submits with duplicate NIT
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    await page.getByTestId('cliente-form-nombre').fill('Empresa Duplicada SA');
    await page.getByTestId('cliente-form-nit').fill('800111222-3');
    await page.getByTestId('cliente-form-telefono').fill('3001234567');
    await page.getByTestId('cliente-form-ciudad').fill('Bogotá');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The inline NIT error appears
    await expect(
      page.getByTestId('cliente-form-nit-error')
    ).toContainText(/El NIT\/RUC ya está registrado/i, { timeout: 3000 });

    // AND: The dialog remains open so the user can correct the NIT field
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-06 — Network/server error (5xx) shows generic error toast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Error path — generic server error shows toast and keeps dialog open', () => {
  test('[P1][TC-2.3-E-06] Given a 500 server error on POST, When user submits valid form, Then generic error toast "No se pudo crear el cliente" is shown and form stays open', async ({
    page,
  }) => {
    // GIVEN: Network-first — mock list GET and POST 500 BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    // WHEN: User navigates, opens form, and submits valid data
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    await page.getByTestId('cliente-form-nombre').fill('Empresa Error SA');
    await page.getByTestId('cliente-form-nit').fill('700333444-5');
    await page.getByTestId('cliente-form-telefono').fill('3009998887');
    await page.getByTestId('cliente-form-ciudad').fill('Medellín');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Generic error toast appears (sonner toast.error)
    await expect(
      page.getByText(/No se pudo crear el cliente/i)
    ).toBeVisible({ timeout: 5000 });

    // AND: The dialog remains open (user can retry)
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // AND: No NIT field error is shown (this is NOT a duplicate NIT case)
    await expect(
      page.getByTestId('cliente-form-nit-error')
    ).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-07 — Form resets after successful creation; reopening shows empty fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#2 — Form resets after successful creation', () => {
  test('[P1][TC-2.3-E-07] Given a client was just created, When the user opens the form again, Then all fields are empty (form was reset)', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Reset After Create SA', nit: '900321321-7' });
    let createdId: string | null = null;

    try {
      // GIVEN: Network-first — intercept real list and POST BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());

      // WHEN: User navigates, creates a client successfully
      await page.goto('/clientes');
      await page.getByTestId('nuevo-cliente-button').click();
      await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

      await page.getByTestId('cliente-form-nombre').fill(data.nombre);
      await page.getByTestId('cliente-form-nit').fill(data.nit);
      await page.getByTestId('cliente-form-telefono').fill(data.telefono);
      await page.getByTestId('cliente-form-ciudad').fill(data.ciudad);
      await page.getByTestId('cliente-form-submit').click();

      // THEN: Dialog closes after success
      await expect(page.getByTestId('cliente-form-dialog')).not.toBeVisible({ timeout: 5000 });

      // WHEN: User opens the form again
      await page.getByTestId('nuevo-cliente-button').click();
      await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

      // THEN: All fields are empty (form was reset on success)
      await expect(page.getByTestId('cliente-form-nombre')).toHaveValue('');
      await expect(page.getByTestId('cliente-form-nit')).toHaveValue('');
      await expect(page.getByTestId('cliente-form-telefono')).toHaveValue('');
      await expect(page.getByTestId('cliente-form-ciudad')).toHaveValue('');

      // Cleanup
      const allClientes = await api.getClientes() as Array<{ id: string; nit: string }>;
      const match = allClientes.find((c) => c.nit === data.nit);
      if (match) createdId = match.id;
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-08 — Cancelling form closes the dialog
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — Clicking "Cancelar" closes the form dialog', () => {
  test('[P1][TC-2.3-E-08] Given the "Nuevo cliente" dialog is open, When user clicks "Cancelar", Then the dialog closes and no API call is made', async ({
    page,
  }) => {
    let apiCallMade = false;

    // GIVEN: Network-first — intercept BEFORE navigation; track POST calls
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        apiCallMade = true;
        await route.continue();
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    // WHEN: User opens the form
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // AND: Clicks "Cancelar" without filling any field
    await page.getByRole('button', { name: /cancelar/i }).click();

    // THEN: The dialog closes
    await expect(page.getByTestId('cliente-form-dialog')).not.toBeVisible();

    // AND: No POST request was made
    expect(apiCallMade).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-09 — Pressing Escape key closes the dialog
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — Pressing Escape closes the form dialog', () => {
  test('[P1][TC-2.3-E-09] Given the form dialog is open, When user presses Escape, Then the dialog closes (shadcn Dialog default behavior)', async ({
    page,
  }) => {
    // GIVEN: Network-first — mock empty list BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User opens the form dialog
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // AND: Presses Escape
    await page.keyboard.press('Escape');

    // THEN: The dialog closes (shadcn Dialog handles Escape natively)
    await expect(page.getByTestId('cliente-form-dialog')).not.toBeVisible({ timeout: 2000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-10 — Each field has an associated <label> (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('WCAG 2.1 AA — All form fields have associated labels', () => {
  test('[P1][TC-2.3-E-10] Given the form dialog is open, When inspecting form fields, Then Nombre, NIT/RUC, Teléfono and Ciudad each have a visible label', async ({
    page,
  }) => {
    // GIVEN: Network-first — mock empty list BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User opens the form dialog
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // THEN: All four field labels are visible in the dialog
    // Using getByLabel confirms the <label htmlFor="..."> / aria-label association
    await expect(page.getByLabel('Nombre')).toBeVisible();
    await expect(page.getByLabel('NIT/RUC')).toBeVisible();
    await expect(page.getByLabel('Teléfono')).toBeVisible();
    await expect(page.getByLabel('Ciudad')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-11 — Submit button shows "Guardando…" text while request is in-flight
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#2 — Submit button shows loading state while request is pending', () => {
  test('[P1][TC-2.3-E-11] Given user submits valid form, When POST request is in-flight, Then submit button is disabled and shows "Guardando…"', async ({
    page,
  }) => {
    // GIVEN: Network-first — mock a delayed POST BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        // Delay response by 2 seconds to capture loading state
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const uniqueId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: uniqueId,
            nombre: 'Loading State SA',
            nit: '700000001-1',
            telefono: '3001000001',
            ciudad: 'Cali',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    // WHEN: User fills the form and submits
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-button').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    await page.getByTestId('cliente-form-nombre').fill('Loading State SA');
    await page.getByTestId('cliente-form-nit').fill('700000001-1');
    await page.getByTestId('cliente-form-telefono').fill('3001000001');
    await page.getByTestId('cliente-form-ciudad').fill('Cali');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The submit button becomes disabled immediately with "Guardando…" text
    await expect(page.getByTestId('cliente-form-submit')).toBeDisabled({ timeout: 500 });
    await expect(page.getByTestId('cliente-form-submit')).toContainText('Guardando');
  });
});
