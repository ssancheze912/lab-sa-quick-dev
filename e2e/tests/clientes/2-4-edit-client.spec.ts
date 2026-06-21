/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD E2E Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Requires: frontend dev server on http://localhost:5173
 *           backend API on http://localhost:5000
 *
 * Acceptance Criteria covered:
 *   AC#1 — Clicking "Editar" opens client form pre-filled with current values (Nombre, NIT/RUC, Teléfono, Ciudad)
 *   AC#2 — Submitting modified fields saves changes, reflects them immediately in detail+list, shows toast "Cliente actualizado correctamente"
 *   AC#3 — Clearing a required field and submitting shows inline error and does NOT call the backend
 *   AC#4 — Clicking "Cancelar" without saving keeps original data and fires no API call (R-008)
 *
 * Test Cases:
 *   TC-2.4-P0-01 (P0, AC#1+AC#2) — Happy path: open edit dialog, modify fields, save, assert updated values in detail + toast
 *   TC-2.4-E-01  (P1, AC#1)      — "Editar" button opens dialog with all 4 fields pre-filled with current values
 *   TC-2.4-E-02  (P1, AC#2)      — After successful edit, updated client appears in list immediately (FR27)
 *   TC-2.4-E-03  (P1, AC#3)      — Clearing Nombre and submitting shows inline error, dialog stays open, no PUT fired
 *   TC-2.4-E-04  (P1, AC#4)      — Clicking "Cancelar" keeps original data unchanged (R-008)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-P0-01 — Happy path: open edit dialog, modify all fields, save, assert update (AC#1, AC#2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 + AC#2 — Happy path: edit client and confirm immediate reflection (FR27)', () => {
  test('[P0][TC-2.4-P0-01] Given user views a client detail, When user clicks "Editar", fills updated fields and submits, Then detail shows updated values and toast "Cliente actualizado correctamente" is shown', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const original = buildCliente({ nombre: 'Empresa Original Edit SA', nit: '800300400-1' });
    const created = await api.createCliente(original) as Record<string, string>;

    try {
      // GIVEN: Network-first — intercept GET list and GET by id BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());
      await page.route(`**/api/v1/clientes/${created.id}`, (route) => route.continue());

      // GIVEN: User is on the client detail page
      await page.goto(`/clientes/${created.id}`);
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

      // WHEN: User clicks "Editar" button
      await page.getByTestId('cliente-edit-button').click();

      // THEN: Edit dialog opens
      await expect(page.getByTestId('cliente-edit-dialog')).toBeVisible();

      // WHEN: User modifies fields
      const nombreInput = page.getByTestId('cliente-form-nombre');
      await nombreInput.clear();
      await nombreInput.fill('Empresa Modificada SA');

      const telefonoInput = page.getByTestId('cliente-form-telefono');
      await telefonoInput.clear();
      await telefonoInput.fill('3219876543');

      const ciudadInput = page.getByTestId('cliente-form-ciudad');
      await ciudadInput.clear();
      await ciudadInput.fill('Medellín');

      // WHEN: User submits the form
      await page.getByTestId('cliente-form-submit').click();

      // THEN: Dialog closes
      await expect(page.getByTestId('cliente-edit-dialog')).not.toBeVisible();

      // THEN: Updated name appears in detail panel immediately (FR27)
      await expect(
        page.getByTestId('cliente-detail-nombre')
      ).toContainText('Empresa Modificada SA', { timeout: 5000 });

      // THEN: Success toast is shown with exact Spanish text
      await expect(
        page.getByText('Cliente actualizado correctamente')
      ).toBeVisible({ timeout: 3000 });
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-E-01 — "Editar" button opens dialog with all 4 fields pre-filled (AC#1)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#1 — "Editar" button opens form with current values pre-filled', () => {
  test('[P1][TC-2.4-E-01] Given user views a client detail, When user clicks "Editar", Then edit dialog opens with Nombre, NIT/RUC, Teléfono, Ciudad pre-filled with current values', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const data = buildCliente({
      nombre: 'Empresa Prefilled SA',
      nit: '800400500-2',
      telefono: '3001112222',
      ciudad: 'Cali',
    });
    const created = await api.createCliente(data) as Record<string, string>;

    try {
      // GIVEN: Network-first — intercept BEFORE navigation
      await page.route(`**/api/v1/clientes/${created.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: created.id,
            nombre: data.nombre,
            nit: data.nit,
            telefono: data.telefono,
            ciudad: data.ciudad,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        })
      );

      // GIVEN: User is on the client detail page
      await page.goto(`/clientes/${created.id}`);
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

      // WHEN: User clicks "Editar"
      await page.getByTestId('cliente-edit-button').click();

      // THEN: Edit dialog is open
      await expect(page.getByTestId('cliente-edit-dialog')).toBeVisible();

      // AND: Each field is pre-filled with current client values
      await expect(page.getByTestId('cliente-form-nombre')).toHaveValue(data.nombre);
      await expect(page.getByTestId('cliente-form-nit')).toHaveValue(data.nit);
      await expect(page.getByTestId('cliente-form-telefono')).toHaveValue(data.telefono);
      await expect(page.getByTestId('cliente-form-ciudad')).toHaveValue(data.ciudad);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-E-02 — After successful edit, updated client appears in list immediately (AC#2, FR27)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#2 — Successful edit triggers immediate list and detail refresh (FR27)', () => {
  test('[P1][TC-2.4-E-02] Given user submits a valid edit, When PUT 200 is received, Then updated client name appears in the left list panel without page reload', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const original = buildCliente({ nombre: 'Lista Inmediata Corp SA', nit: '800500600-3' });
    const created = await api.createCliente(original) as Record<string, string>;

    try {
      // GIVEN: Network-first — intercept list and detail APIs BEFORE navigation
      await page.route('**/api/v1/clientes', (route) => route.continue());
      await page.route(`**/api/v1/clientes/${created.id}`, (route) => route.continue());

      // GIVEN: User is on the client detail page
      await page.goto(`/clientes/${created.id}`);
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

      // WHEN: User opens edit dialog, changes Nombre, and submits
      await page.getByTestId('cliente-edit-button').click();
      await expect(page.getByTestId('cliente-edit-dialog')).toBeVisible();

      const nombreInput = page.getByTestId('cliente-form-nombre');
      await nombreInput.clear();
      await nombreInput.fill('Lista Inmediata Actualizada SA');
      await page.getByTestId('cliente-form-submit').click();

      // THEN: Updated name appears in the left list panel immediately (invalidateQueries — FR27)
      await expect(
        page.getByTestId('clientes-list-panel').getByText('Lista Inmediata Actualizada SA')
      ).toBeVisible({ timeout: 5000 });

      // AND: URL stays at /clientes/:id (no navigation)
      await expect(page).toHaveURL(new RegExp(`/clientes/${created.id}`));
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-E-03 — Clearing required field shows inline error, no PUT fired (AC#3, FR8)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#3 — Clearing required field shows inline error and blocks submission (FR8)', () => {
  test('[P1][TC-2.4-E-03] Given edit dialog is open, When user clears Nombre and submits, Then inline error "El nombre es requerido" is shown and no PUT request is fired', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const original = buildCliente({ nombre: 'Empresa Para Validar SA', nit: '800600700-4' });
    const created = await api.createCliente(original) as Record<string, string>;

    let putCallMade = false;

    try {
      // GIVEN: Network-first — intercept BEFORE navigation; track PUT calls
      await page.route(`**/api/v1/clientes/${created.id}`, async (route) => {
        if (route.request().method() === 'PUT') {
          putCallMade = true;
          await route.continue();
        } else {
          await route.continue();
        }
      });

      // GIVEN: User is on the client detail page with edit dialog open
      await page.goto(`/clientes/${created.id}`);
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
      await page.getByTestId('cliente-edit-button').click();
      await expect(page.getByTestId('cliente-edit-dialog')).toBeVisible();

      // WHEN: User clears the Nombre field
      const nombreInput = page.getByTestId('cliente-form-nombre');
      await nombreInput.clear();

      // WHEN: User submits the form
      await page.getByTestId('cliente-form-submit').click();

      // THEN: Inline error appears on Nombre field
      await expect(
        page.getByTestId('cliente-form-nombre-error')
      ).toContainText(/El nombre es requerido/i, { timeout: 3000 });

      // AND: Dialog remains open
      await expect(page.getByTestId('cliente-edit-dialog')).toBeVisible();

      // AND: No PUT request was fired
      expect(putCallMade).toBe(false);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-E-04 — Clicking "Cancelar" keeps original data, no PUT fired (AC#4, R-008)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC#4 — "Cancelar" closes dialog without saving, original data unchanged (R-008)', () => {
  test('[P1][TC-2.4-E-04] Given edit dialog is open with modified data, When user clicks "Cancelar", Then dialog closes, original name is still shown in detail, and no PUT request is fired', async ({
    page,
    request,
  }) => {
    const api = new ApiHelper(request);
    const original = buildCliente({ nombre: 'Empresa Sin Cambios SA', nit: '800700800-5' });
    const created = await api.createCliente(original) as Record<string, string>;

    let putCallMade = false;

    try {
      // GIVEN: Network-first — intercept BEFORE navigation; track PUT calls
      await page.route(`**/api/v1/clientes/${created.id}`, async (route) => {
        if (route.request().method() === 'PUT') {
          putCallMade = true;
          await route.continue();
        } else {
          await route.continue();
        }
      });

      // GIVEN: User is on the client detail page with edit dialog open
      await page.goto(`/clientes/${created.id}`);
      await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
      await page.getByTestId('cliente-edit-button').click();
      await expect(page.getByTestId('cliente-edit-dialog')).toBeVisible();

      // WHEN: User modifies Nombre (but does NOT submit)
      const nombreInput = page.getByTestId('cliente-form-nombre');
      await nombreInput.clear();
      await nombreInput.fill('Nombre Que No Deberia Guardarse');

      // WHEN: User clicks "Cancelar"
      await page.getByTestId('cliente-form-cancel').click();

      // THEN: Dialog closes
      await expect(page.getByTestId('cliente-edit-dialog')).not.toBeVisible();

      // THEN: Original client name is still shown in the detail panel (R-008)
      await expect(
        page.getByTestId('cliente-detail-nombre')
      ).toContainText(original.nombre);

      // AND: No PUT request was fired
      expect(putCallMade).toBe(false);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });
});
