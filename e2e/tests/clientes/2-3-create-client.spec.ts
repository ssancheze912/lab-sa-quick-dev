/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * ATDD E2E Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Requires: frontend dev server on http://localhost:5173
 *           backend API on http://localhost:5000
 *
 * Acceptance Criteria covered:
 *   AC#1 — Clicking "Nuevo cliente" opens a form with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required)
 *   AC#2 — Submitting valid form creates the client, it appears in list immediately, and a success toast shows
 *   AC#3 — Submitting with empty required fields shows inline errors and does NOT submit to backend
 *   AC#4 — Backend returns 409 for duplicate NIT/RUC → inline error "El NIT/RUC ya está registrado" with no stack trace
 *
 * Test Cases:
 *   TC-2.3-P0-01 (P0, AC#1+AC#2) — Happy path: fill all required fields, submit, assert client in list + toast (R-009)
 *   TC-2.3-E-01  (P1, AC#1)      — "Nuevo cliente" button opens form dialog with all 4 required fields
 *   TC-2.3-E-02  (P1, AC#2)      — After successful create, new client appears in list immediately (FR27, R-009)
 *   TC-2.3-E-03  (P1, AC#4)      — Duplicate NIT/RUC shows inline error, no stack trace, no toast (R-002, NFR6)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-P0-01 — Happy path: create client + appears in list + success toast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 + AC#2 — Happy path: create client and confirm immediate list update (R-009)', () => {
  test('[P0][TC-2.3-P0-01] Given user is on /clientes, When user fills all required fields and submits, Then client appears in list and toast "Cliente creado correctamente" is shown', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa Creada SA', nit: '800111222-3' });
    let createdId: string | null = null;

    try {
      // GIVEN: Network-first — intercept list API and POST BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());

      // GIVEN: User is on /clientes
      await page.goto('/clientes');
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

      // WHEN: User clicks "Nuevo cliente" button
      await page.getByTestId('nuevo-cliente-button').click();

      // THEN: Form dialog opens
      await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

      // WHEN: User fills all required fields
      await page.getByTestId('cliente-form-nombre').fill(data.nombre);
      await page.getByTestId('cliente-form-nit').fill(data.nit);
      await page.getByTestId('cliente-form-telefono').fill(data.telefono);
      await page.getByTestId('cliente-form-ciudad').fill(data.ciudad);

      // WHEN: User submits the form
      await page.getByTestId('cliente-form-submit').click();

      // THEN: Form closes (dialog not visible)
      await expect(page.getByTestId('cliente-form-dialog')).not.toBeVisible();

      // THEN: New client appears in the list immediately (FR27 — invalidateQueries)
      await expect(
        page.getByTestId('clientes-list-panel').getByText(data.nombre)
      ).toBeVisible({ timeout: 5000 });

      // THEN: Success toast is shown with exact Spanish text
      await expect(
        page.getByText('Cliente creado correctamente')
      ).toBeVisible({ timeout: 3000 });

      // Capture created ID for cleanup
      const items = await page.getByTestId('cliente-list-item').all();
      const allClientes = await api.getClientes() as Array<{ id: string; nit: string }>;
      const match = allClientes.find((c) => c.nit === data.nit);
      if (match) createdId = match.id;
    } finally {
      if (createdId) await api.deleteCliente(createdId).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-01 — "Nuevo cliente" button opens form dialog with 4 required fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — "Nuevo cliente" button opens form with all required fields', () => {
  test('[P1][TC-2.3-E-01] Given user is on /clientes, When user clicks "Nuevo cliente", Then form opens with Nombre, NIT/RUC, Teléfono, Ciudad fields visible', async ({
    page,
  }) => {
    // GIVEN: Network-first — intercept list API BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // GIVEN: User is on /clientes
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // WHEN: User clicks "Nuevo cliente"
    await page.getByTestId('nuevo-cliente-button').click();

    // THEN: Form dialog is open
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // AND: Nombre field is visible
    await expect(page.getByTestId('cliente-form-nombre')).toBeVisible();

    // AND: NIT/RUC field is visible
    await expect(page.getByTestId('cliente-form-nit')).toBeVisible();

    // AND: Teléfono field is visible
    await expect(page.getByTestId('cliente-form-telefono')).toBeVisible();

    // AND: Ciudad field is visible
    await expect(page.getByTestId('cliente-form-ciudad')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-E-02 — Successful create triggers list refresh immediately (FR27, R-009)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#2 — Successful create: client appears in list immediately without manual refresh (FR27, R-009)', () => {
  test('[P1][TC-2.3-E-02] Given a valid form is submitted, When POST 201 is received, Then the new client is visible in the list without page reload', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Visibilidad Inmediata Corp', nit: '700444555-6' });
    let createdId: string | null = null;

    try {
      // GIVEN: Network-first — intercept list API BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());

      // GIVEN: User is on /clientes
      await page.goto('/clientes');
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

      // WHEN: User opens form, fills data, and submits
      await page.getByTestId('nuevo-cliente-button').click();
      await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

      await page.getByTestId('cliente-form-nombre').fill(data.nombre);
      await page.getByTestId('cliente-form-nit').fill(data.nit);
      await page.getByTestId('cliente-form-telefono').fill(data.telefono);
      await page.getByTestId('cliente-form-ciudad').fill(data.ciudad);
      await page.getByTestId('cliente-form-submit').click();

      // THEN: The new client appears in the left panel list immediately (no manual refresh)
      await expect(
        page.getByTestId('clientes-list-panel').getByText(data.nombre)
      ).toBeVisible({ timeout: 5000 });

      // AND: URL stays at /clientes (no navigation change per architecture decision)
      await expect(page).toHaveURL('/clientes');

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
// TC-2.3-E-03 — Duplicate NIT/RUC shows inline error without stack trace (R-002, NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#4 — Duplicate NIT/RUC shows inline error without stack trace (R-002, NFR6)', () => {
  test('[P1][TC-2.3-E-03] Given a NIT/RUC that already exists, When user submits the form, Then "El NIT/RUC ya está registrado" appears on NIT field and no stack trace is visible (NFR6)', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const existing = buildCliente({ nombre: 'Empresa Original SA', nit: '600777888-9' });
    const created = await api.createCliente(existing);

    try {
      // GIVEN: Network-first — intercept list API BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());

      // GIVEN: Network-first — intercept POST for duplicate NIT to return 409 BEFORE navigation
      await page.route('**/api/v1/clientes', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 409,
            contentType: 'application/problem+json',
            body: JSON.stringify({ title: 'El NIT/RUC ya está registrado.', status: 409 }),
          });
        } else {
          await route.continue();
        }
      });

      // GIVEN: User is on /clientes
      await page.goto('/clientes');

      // WHEN: User opens form and fills with duplicate NIT
      await page.getByTestId('nuevo-cliente-button').click();
      await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

      await page.getByTestId('cliente-form-nombre').fill('Empresa Duplicada SA');
      await page.getByTestId('cliente-form-nit').fill(existing.nit);
      await page.getByTestId('cliente-form-telefono').fill('3201234567');
      await page.getByTestId('cliente-form-ciudad').fill('Medellín');
      await page.getByTestId('cliente-form-submit').click();

      // THEN: Inline error "El NIT/RUC ya está registrado" is visible on the NIT field
      await expect(
        page.getByTestId('cliente-form-nit-error')
      ).toContainText(/El NIT\/RUC ya está registrado/i, { timeout: 3000 });

      // AND: Form stays open (NOT closed)
      await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

      // AND: No stack trace or technical error details are shown (NFR6)
      await expect(
        page.getByText(/stackTrace|stack_trace|at line|Exception|InnerException/i)
      ).not.toBeVisible();

      // AND: No generic error toast (only inline error for 409)
      await expect(
        page.getByText(/No se pudo crear el cliente/i)
      ).not.toBeVisible();
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});
