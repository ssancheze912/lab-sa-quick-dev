/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level — Playwright)
 * These tests FAIL until the implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking "Editar" opens the form pre-filled with current values (Nombre, NIT/RUC, Teléfono, Ciudad)
 *   AC2 — Saving changes reflects in the detail panel and list immediately; success toast shown
 *   AC3 — Clearing a required field and clicking save shows inline error; no API call fired
 *   AC4 — Clicking "Cancelar" closes the form; original data unchanged; no PUT fired
 *
 * Test IDs:
 *   TC-E2-P1-11 — Saving changes reflects in list and detail panel; toast shown (E2E level, P1)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Clicking "Editar" opens the edit form pre-filled with current values
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Clicking "Editar" opens the pre-filled edit form', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('AC1 — should open the edit form when user clicks "Editar" button', async ({ page }) => {
    // GIVEN: A client exists and the user is viewing its detail panel
    const cliente = buildCliente({
      nombre: 'Empresa Editar Form S.A.S.',
      nit: '900110001-1',
      telefono: '3001100001',
      ciudad: 'Bogotá',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User clicks the "Editar" button
    await page.getByTestId('btn-editar-cliente').click();

    // THEN: The edit form is visible
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();
  });

  test('AC1 — should pre-fill Nombre field with the current value when edit form opens', async ({ page }) => {
    // GIVEN: A client with known Nombre exists and its detail panel is shown
    const cliente = buildCliente({
      nombre: 'Empresa Pre-fill Nombre S.A.',
      nit: '900110002-2',
      telefono: '3001100002',
      ciudad: 'Medellín',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User clicks "Editar"
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    // THEN: Nombre input is pre-filled with the current value
    await expect(page.getByTestId('input-nombre')).toHaveValue('Empresa Pre-fill Nombre S.A.');
  });

  test('AC1 — should pre-fill NIT/RUC field with the current value when edit form opens', async ({ page }) => {
    // GIVEN: A client with a known NIT/RUC exists and the detail panel is shown
    const cliente = buildCliente({
      nombre: 'Empresa Pre-fill NIT S.A.',
      nit: '900110003-3',
      telefono: '3001100003',
      ciudad: 'Cali',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User clicks "Editar"
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    // THEN: NIT/RUC input is pre-filled with the current value
    await expect(page.getByTestId('input-nitruc')).toHaveValue('900110003-3');
  });

  test('AC1 — should pre-fill Teléfono field with the current value when edit form opens', async ({ page }) => {
    // GIVEN: A client with a known Teléfono exists and the detail panel is shown
    const cliente = buildCliente({
      nombre: 'Empresa Pre-fill Tel Ltda.',
      nit: '900110004-4',
      telefono: '3001100004',
      ciudad: 'Barranquilla',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User clicks "Editar"
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    // THEN: Teléfono input is pre-filled with the current value
    await expect(page.getByTestId('input-telefono')).toHaveValue('3001100004');
  });

  test('AC1 — should pre-fill Ciudad field with the current value when edit form opens', async ({ page }) => {
    // GIVEN: A client with a known Ciudad exists and the detail panel is shown
    const cliente = buildCliente({
      nombre: 'Empresa Pre-fill Ciudad Corp.',
      nit: '900110005-5',
      telefono: '3001100005',
      ciudad: 'Cartagena',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User clicks "Editar"
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    // THEN: Ciudad input is pre-filled with the current value
    await expect(page.getByTestId('input-ciudad')).toHaveValue('Cartagena');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-11 — AC2: Saving changes reflects in list and detail panel; toast shown
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P1-11 — AC2: Saving changes reflects in detail panel, list, and shows success toast', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('TC-E2-P1-11 — should show success toast "Cliente actualizado correctamente" after saving changes', async ({ page }) => {
    // GIVEN: A client exists and the user is on the edit form with modified data
    const cliente = buildCliente({
      nombre: 'Empresa Pre Actualizar S.A.',
      nit: '900220001-1',
      telefono: '3002200001',
      ciudad: 'Bogotá',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    await page.getByTestId('input-nombre').fill('Empresa Actualizada S.A.');

    // WHEN: User clicks "Guardar cambios"
    await page.getByTestId('btn-guardar-cambios').click();

    // THEN: Success toast "Cliente actualizado correctamente" is visible
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();
  });

  test('TC-E2-P1-11 — should reflect the updated Nombre in the detail panel immediately after save', async ({ page }) => {
    // GIVEN: A client exists and the user has modified the Nombre in the edit form
    const cliente = buildCliente({
      nombre: 'Empresa Antes Nombre S.A.',
      nit: '900220002-2',
      telefono: '3002200002',
      ciudad: 'Medellín',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    await page.getByTestId('input-nombre').fill('Empresa Después Nombre S.A.');

    // WHEN: User saves
    await page.getByTestId('btn-guardar-cambios').click();
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();

    // THEN: Updated Nombre appears in the detail panel without page refresh
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Después Nombre S.A.');
  });

  test('TC-E2-P1-11 — should reflect the updated Nombre in the client list panel immediately after save', async ({ page }) => {
    // GIVEN: A client exists and the user is on the edit form
    const cliente = buildCliente({
      nombre: 'Empresa Lista Antes S.A.',
      nit: '900220003-3',
      telefono: '3002200003',
      ciudad: 'Cali',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    await page.getByTestId('input-nombre').fill('Empresa Lista Después S.A.');

    // WHEN: User saves
    await page.getByTestId('btn-guardar-cambios').click();
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();

    // THEN: Updated Nombre appears in the left panel client list (FR27 — immediate visibility)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Lista Después S.A.' })
    ).toBeVisible();
  });

  test('TC-E2-P1-11 — should close the edit form and return to the detail view after saving', async ({ page }) => {
    // GIVEN: A client exists and the user is on the edit form
    const cliente = buildCliente({
      nombre: 'Empresa Form Close S.A.',
      nit: '900220004-4',
      telefono: '3002200004',
      ciudad: 'Barranquilla',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    await page.getByTestId('input-nombre').fill('Empresa Form Closed S.A.');

    // WHEN: User clicks "Guardar cambios"
    await page.getByTestId('btn-guardar-cambios').click();
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();

    // THEN: The edit form is no longer visible (returned to detail view)
    await expect(page.getByTestId('cliente-edit-form')).not.toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Clearing a required field shows inline error; form NOT submitted; no PUT fired
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Clearing a required field shows inline error and blocks submission', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('AC3 — should show an inline error for Nombre when the field is cleared and save is clicked', async ({ page }) => {
    // GIVEN: A client exists, the user opened the edit form and cleared Nombre
    const cliente = buildCliente({ nombre: 'Empresa Validar Nombre S.A.', nit: '900330001-1' });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    await page.getByTestId('input-nombre').clear();

    // WHEN: User clicks "Guardar cambios"
    await page.getByTestId('btn-guardar-cambios').click();

    // THEN: An inline error message appears under the Nombre field
    await expect(page.getByTestId('error-nombre')).toBeVisible();
  });

  test('AC3 — should NOT fire a PUT request when a required field is cleared and save is clicked', async ({ page }) => {
    // GIVEN: A client exists, the user opened the edit form and cleared NIT/RUC
    const cliente = buildCliente({ nombre: 'Empresa No PUT S.A.', nit: '900330002-2' });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // Network-first: set up a spy on the PUT endpoint BEFORE navigating
    const putRequests: string[] = [];
    await page.route(`**/api/v1/clientes/${created.id}`, (route) => {
      if (route.request().method() === 'PUT') {
        putRequests.push(route.request().url());
      }
      route.continue();
    });

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    await page.getByTestId('input-nitruc').clear();

    // WHEN: User clicks "Guardar cambios"
    await page.getByTestId('btn-guardar-cambios').click();

    // THEN: Inline error appears and no PUT request was fired
    await expect(page.getByTestId('error-nitruc')).toBeVisible();
    expect(putRequests).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Clicking "Cancelar" keeps original data unchanged; no PUT fired
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Clicking "Cancelar" preserves original data and fires no PUT request', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('AC4 — should show original Nombre in detail panel after "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: A client exists, the user opened the edit form and modified Nombre
    const cliente = buildCliente({
      nombre: 'Empresa Original Nombre S.A.',
      nit: '900440001-1',
      telefono: '3004400001',
      ciudad: 'Bogotá',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    await page.getByTestId('input-nombre').fill('Nombre Modificado Sin Guardar');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancelar').click();

    // THEN: The detail panel shows the ORIGINAL Nombre (unchanged)
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Original Nombre S.A.');
  });

  test('AC4 — should NOT fire a PUT request when user clicks "Cancelar"', async ({ page }) => {
    // GIVEN: A client exists, the user opened the edit form and modified fields
    const cliente = buildCliente({
      nombre: 'Empresa No PUT Cancelar S.A.',
      nit: '900440002-2',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // Network-first: intercept PUT BEFORE navigating to detect if any fires
    const putRequests: string[] = [];
    await page.route(`**/api/v1/clientes/${created.id}`, (route) => {
      if (route.request().method() === 'PUT') {
        putRequests.push(route.request().url());
      }
      route.continue();
    });

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    await page.getByTestId('input-nombre').fill('Nombre Que No Debería Guardarse');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancelar').click();

    // THEN: No PUT request was fired
    expect(putRequests).toHaveLength(0);
  });

  test('AC4 — should close the edit form when user clicks "Cancelar"', async ({ page }) => {
    // GIVEN: A client exists and the edit form is open
    const cliente = buildCliente({ nombre: 'Empresa Cancelar Close S.A.', nit: '900440003-3' });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('btn-editar-cliente').click();
    await expect(page.getByTestId('cliente-edit-form')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancelar').click();

    // THEN: The edit form is no longer visible
    await expect(page.getByTestId('cliente-edit-form')).not.toBeVisible();
  });
});
