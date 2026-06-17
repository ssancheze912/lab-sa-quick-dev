/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level — Playwright)
 * These tests FAIL until the implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking "Nuevo cliente" opens a form with 4 required fields (Nombre, NIT/RUC, Teléfono, Ciudad)
 *   AC2 — Submitting valid data creates the client via POST /api/v1/clientes, shows it in the list
 *          immediately (FR27, NFR2), and displays toast "Cliente creado correctamente"
 *   AC3 — Submitting empty fields shows inline errors per field and fires no API call (Zod, FR8)
 *   AC4 — NIT/RUC that already exists returns 409 and shows "El NIT/RUC ya está registrado" inline
 *   AC5 — Clicking "Cancelar" closes the form without creating any record
 *
 * Test IDs (from test-design-epic-2.md):
 *   TC-E2-P0-07 — Create client → appears in list immediately, toast visible, < 2s
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';
import { ClientesPage } from '../../pages/clientes.page';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Nuevo cliente" button opens a form with all 4 required fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — "Nuevo cliente" button opens form with 4 required fields', () => {
  test('should show "Nuevo cliente" button on the /clientes view', async ({ page }) => {
    // GIVEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The view renders
    // THEN: "Nuevo cliente" button is visible in the list panel
    await expect(page.getByRole('button', { name: /nuevo cliente/i })).toBeVisible();
  });

  test('should open a form dialog when "Nuevo cliente" is clicked', async ({ page }) => {
    // GIVEN: The user is on the /clientes view
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The user clicks "Nuevo cliente"
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // THEN: A dialog/modal opens (role="dialog")
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should display Nombre field in the create form', async ({ page }) => {
    // GIVEN: The user is on /clientes and clicks "Nuevo cliente"
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: The form is open
    // THEN: The Nombre input field is present
    await expect(page.getByLabel(/nombre/i)).toBeVisible();
  });

  test('should display NIT/RUC field in the create form', async ({ page }) => {
    // GIVEN: The user is on /clientes and opens the form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: The form is open
    // THEN: The NIT/RUC input field is present
    await expect(page.getByLabel(/nit/i)).toBeVisible();
  });

  test('should display Teléfono field in the create form', async ({ page }) => {
    // GIVEN: The user is on /clientes and opens the form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: The form is open
    // THEN: The Teléfono input field is present
    await expect(page.getByLabel(/teléfono/i)).toBeVisible();
  });

  test('should display Ciudad field in the create form', async ({ page }) => {
    // GIVEN: The user is on /clientes and opens the form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: The form is open
    // THEN: The Ciudad input field is present
    await expect(page.getByLabel(/ciudad/i)).toBeVisible();
  });

  test('should display "Guardar" submit button in the create form', async ({ page }) => {
    // GIVEN: The user opens the create client form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: The form is open
    // THEN: A "Guardar" submit button is present
    await expect(page.getByRole('button', { name: /guardar/i })).toBeVisible();
  });

  test('should display "Cancelar" button in the create form', async ({ page }) => {
    // GIVEN: The user opens the create client form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: The form is open
    // THEN: A "Cancelar" button is present
    await expect(page.getByRole('button', { name: /cancelar/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Successful create: client appears in list + toast "Cliente creado correctamente"
// TC-E2-P0-07 — Create client → appears in list immediately, toast visible, < 2s (FR27, NFR2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P0-07 — AC2 — Successful create: client in list immediately + toast', () => {
  let apiHelper: ApiHelper;
  const createdNits: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    // Best-effort cleanup: delete any clients created during the test by name pattern
    // The E2E test creates via the UI, so we query the list and delete matching entries
    const clients = await apiHelper.getClientes().catch(() => ({ items: [], data: [] }));
    const list = Array.isArray(clients) ? clients : (clients.items ?? clients.data ?? []);
    for (const c of list) {
      if (createdNits.includes(c.nitRuc ?? c.nit)) {
        await apiHelper.deleteCliente(c.id).catch(() => null);
      }
    }
    createdNits.length = 0;
  });

  test('should show success toast "Cliente creado correctamente" after form submission', async ({ page }) => {
    // GIVEN: The user navigates to /clientes and opens the create form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const nit = `800${Date.now().toString().slice(-7)}`;
    createdNits.push(nit);

    // WHEN: The user fills all required fields and submits
    await page.getByLabel(/nombre/i).fill('Empresa Toast Test S.A.S.');
    await page.getByLabel(/nit/i).fill(nit);
    await page.getByLabel(/teléfono/i).fill('3009990001');
    await page.getByLabel(/ciudad/i).fill('Bogotá');
    await page.getByRole('button', { name: /guardar/i }).click();

    // THEN: A success toast with the exact text "Cliente creado correctamente" appears
    await expect(
      page.getByText('Cliente creado correctamente')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should close the form dialog after successful submission', async ({ page }) => {
    // GIVEN: The create client form is open with all required fields filled
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const nit = `800${Date.now().toString().slice(-7)}1`;
    createdNits.push(nit);

    // WHEN: The user submits valid data
    await page.getByLabel(/nombre/i).fill('Empresa Close Dialog S.A.');
    await page.getByLabel(/nit/i).fill(nit);
    await page.getByLabel(/teléfono/i).fill('3009990002');
    await page.getByLabel(/ciudad/i).fill('Medellín');
    await page.getByRole('button', { name: /guardar/i }).click();

    // THEN: The dialog closes (form is no longer visible)
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
  });

  test('should display the newly created client in the list immediately without manual refresh', async ({ page }) => {
    // GIVEN: The /clientes view is loaded and the user opens the create form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const clientName = `Empresa Immediata ${Date.now()}`;
    const nit = `800${Date.now().toString().slice(-7)}2`;
    createdNits.push(nit);

    const startTime = Date.now();

    // WHEN: The user fills all required fields and submits
    await page.getByLabel(/nombre/i).fill(clientName);
    await page.getByLabel(/nit/i).fill(nit);
    await page.getByLabel(/teléfono/i).fill('3009990003');
    await page.getByLabel(/ciudad/i).fill('Cali');
    await page.getByRole('button', { name: /guardar/i }).click();

    // THEN: The new client appears in the list immediately (< 2s from submission, FR27, NFR2)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: clientName })
    ).toBeVisible({ timeout: 2000 });

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(2000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Clicking "Cancelar" closes the form without creating a record
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — "Cancelar" closes the form without creating any record', () => {
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test('should close the form dialog when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: The user opens the create client form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: The user clicks "Cancelar"
    await page.getByRole('button', { name: /cancelar/i }).click();

    // THEN: The dialog closes
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3000 });
  });

  test('should not create a client when "Cancelar" is clicked after partially filling the form', async ({ page }) => {
    // GIVEN: The user opens the form and partially fills it
    const clientesBefore = await apiHelper.getClientes();
    const countBefore = Array.isArray(clientesBefore)
      ? clientesBefore.length
      : (clientesBefore.items ?? clientesBefore.data ?? []).length;

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill('Empresa Cancelada S.A.S.');

    // WHEN: The user clicks "Cancelar" without submitting
    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3000 });

    // THEN: The total client count remains unchanged (no record was created)
    const clientesAfter = await apiHelper.getClientes();
    const countAfter = Array.isArray(clientesAfter)
      ? clientesAfter.length
      : (clientesAfter.items ?? clientesAfter.data ?? []).length;

    expect(countAfter).toBe(countBefore);
  });

  test('should keep the client list unchanged after "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: The user is on /clientes and opens the form with a partially filled Nombre
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill('Empresa No Guardada Corp.');

    // WHEN: The user cancels
    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3000 });

    // THEN: "Empresa No Guardada Corp." is NOT in the client list
    const items = page.getByTestId('cliente-list-item');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).not.toContainText('Empresa No Guardada Corp.');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 409 NIT/RUC conflict shows inline error (network-first intercept)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Duplicate NIT/RUC shows inline error "El NIT/RUC ya está registrado"', () => {
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

  test('should show "El NIT/RUC ya está registrado" inline when backend returns 409', async ({ page }) => {
    // GIVEN: A client with NIT/RUC "900999001-1" already exists
    const existing = buildCliente({ nombre: 'Empresa Existente S.A.', nit: '900999001-1' });
    const created = await apiHelper.createCliente(existing);
    createdIds.push(created.id);

    // Network-first: intercept POST /api/v1/clientes BEFORE navigating to avoid race conditions
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON?.();
        // Only intercept if the submitted NIT/RUC is the duplicate
        if (body?.nitRuc === '900999001-1') {
          await route.fulfill({
            status: 409,
            contentType: 'application/problem+json',
            body: JSON.stringify({
              status: 409,
              title: 'Conflicto de datos',
              detail: 'El NIT/RUC ya está registrado',
            }),
          });
          return;
        }
      }
      await route.continue();
    });

    // WHEN: The user navigates to /clientes, opens the form, and submits the duplicate NIT/RUC
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill('Empresa Duplicada S.A.S.');
    await page.getByLabel(/nit/i).fill('900999001-1');
    await page.getByLabel(/teléfono/i).fill('3001234567');
    await page.getByLabel(/ciudad/i).fill('Bogotá');
    await page.getByRole('button', { name: /guardar/i }).click();

    // THEN: The inline error message "El NIT/RUC ya está registrado" appears (not a toast, inline)
    await expect(
      page.getByText('El NIT/RUC ya está registrado')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should NOT expose stack traces or technical details in the 409 error message', async ({ page }) => {
    // GIVEN: The form is open and the API is set to return 409 (network-first intercept)
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            status: 409,
            title: 'Conflicto de datos',
            detail: 'El NIT/RUC ya está registrado',
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill('Empresa Stack Trace Test');
    await page.getByLabel(/nit/i).fill('999000111-9');
    await page.getByLabel(/teléfono/i).fill('3001111111');
    await page.getByLabel(/ciudad/i).fill('Cali');
    await page.getByRole('button', { name: /guardar/i }).click();

    // THEN: No technical content (stack trace, exception class, URL) is visible in the DOM
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('stackTrace');
    expect(bodyText).not.toContain('Exception');
    expect(bodyText).not.toContain('InnerException');
    expect(bodyText).not.toContain('at System.');
  });

  test('should keep the dialog open after 409 error so user can correct the NIT/RUC', async ({ page }) => {
    // GIVEN: Network-first intercept returning 409
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            status: 409,
            title: 'Conflicto de datos',
            detail: 'El NIT/RUC ya está registrado',
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill('Empresa Dialogo Abierto S.A.');
    await page.getByLabel(/nit/i).fill('999000222-9');
    await page.getByLabel(/teléfono/i).fill('3002222222');
    await page.getByLabel(/ciudad/i).fill('Barranquilla');
    await page.getByRole('button', { name: /guardar/i }).click();

    // THEN: The dialog remains open (user can correct the duplicate NIT/RUC)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });
});
