import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E Acceptance Tests — Story 2.3: Create Client
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P0-07 — Create client E2E: toast "Cliente creado correctamente" + client appears in list immediately (FR27)
 *
 * AC coverage:
 *   AC1 — "Nuevo cliente" button opens form dialog over the split-panel layout (no navigation away)
 *   AC2 — Form submission → POST /api/v1/clientes → 201 → list refreshed via invalidateQueries → toast
 *
 * These tests are in RED phase — they will fail until implementation is complete.
 * Network-first intercepts are set BEFORE navigation per ATDD patterns (for mocked variants).
 * Full-stack E2E variants use live backend via ApiHelper.
 */

test.describe('Story 2.3 — TC-E2-P0-07: Create client E2E (full-stack)', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-P0-07: Create client E2E — toast + list update without page reload
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-P0-07 — creating a client shows toast "Cliente creado correctamente"', async ({ page }) => {
    // GIVEN: User is on the /clientes page
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    const data = buildCliente();

    // WHEN: User clicks "Nuevo cliente", fills the form, and submits
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Toast "Cliente creado correctamente" appears
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible({ timeout: 5000 });

    // Cleanup: find the created client and queue for deletion
    const clientes = await apiHelper.getClientes();
    const found = clientes.find((c: { nit: string }) => c.nit === data.nit);
    if (found?.id) createdIds.push(found.id);
  });

  test('TC-E2-P0-07 — new client appears in the left panel list immediately (FR27)', async ({ page }) => {
    // GIVEN: User is on the /clientes page
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    const data = buildCliente();

    // WHEN: User creates a new client via the form
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // Wait for success feedback
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible({ timeout: 5000 });

    // THEN: The new client appears in the left panel list without page reload
    const clienteItem = page.getByTestId('cliente-list-item').filter({ hasText: data.nombre });
    await expect(clienteItem).toBeVisible({ timeout: 3000 });

    // Cleanup
    const clientes = await apiHelper.getClientes();
    const found = clientes.find((c: { nit: string }) => c.nit === data.nit);
    if (found?.id) createdIds.push(found.id);
  });

  test('TC-E2-P0-07 — form dialog closes automatically after successful creation', async ({ page }) => {
    // GIVEN: User is on the /clientes page with the form open
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    const data = buildCliente();

    // WHEN: User creates a new client
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Dialog closes automatically after creation
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });

    // Cleanup
    const clientes = await apiHelper.getClientes();
    const found = clientes.find((c: { nit: string }) => c.nit === data.nit);
    if (found?.id) createdIds.push(found.id);
  });

  test('TC-E2-P0-07 — URL remains /clientes after creation (no navigation away from split-panel)', async ({ page }) => {
    // GIVEN: User is on the /clientes page
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    const data = buildCliente();

    // WHEN: User creates a new client
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill(data.nombre);
    await page.getByLabel(/nit/i).fill(data.nit);
    await page.getByLabel(/teléfono/i).fill(data.telefono);
    await page.getByLabel(/ciudad/i).fill(data.ciudad);
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: URL stays on /clientes (not navigated away) — AC1 requirement
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/clientes');

    // Cleanup
    const clientes = await apiHelper.getClientes();
    const found = clientes.find((c: { nit: string }) => c.nit === data.nit);
    if (found?.id) createdIds.push(found.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Submit button loading state — AC2 (shows "Guardando..." while pending)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.3 — Submit button loading state while isPending', () => {

  test('submit button is disabled and shows "Guardando..." while request is in flight', async ({ page }) => {
    // GIVEN: The form is open and POST has a delayed response (simulated via route)
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        // Delay the response to capture the pending state
        await new Promise((resolve) => setTimeout(resolve, 800));
        const body = {
          id: 'uuid-pending-test',
          nombre: 'Empresa Pending',
          nit: '900-PEND-001',
          telefono: '3001234567',
          ciudad: 'Bogotá',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(body) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/nombre/i).fill('Empresa Pending');
    await page.getByLabel(/nit/i).fill('900-PEND-001');
    await page.getByLabel(/teléfono/i).fill('3001234567');
    await page.getByLabel(/ciudad/i).fill('Bogotá');

    // WHEN: Clicking submit (before response arrives)
    await page.getByRole('button', { name: /crear cliente/i }).click();

    // THEN: Submit button shows "Guardando..." and is disabled while pending
    const submitBtn = page.getByRole('button', { name: /guardando/i });
    await expect(submitBtn).toBeVisible({ timeout: 500 });
    await expect(submitBtn).toBeDisabled();
  });
});
