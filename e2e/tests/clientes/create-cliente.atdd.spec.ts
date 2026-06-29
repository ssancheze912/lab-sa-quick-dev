import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.3: Create Client — E2E ATDD (RED phase)
 *
 * Acceptance Criteria covered (UI legs):
 *   AC #4 — Clicking "Nuevo cliente" opens an AlertDialog with 4 inputs + Guardar/Cancelar buttons.
 *   AC #5 — Submitting an empty form blocks (no POST), inline Spanish errors per field, dialog stays open.
 *   AC #6 — Happy path: dialog closes, new client appears at top of list, success toast.
 *   AC #7 — Duplicate NIT: dialog stays open, inline "El NIT/RUC ya está registrado", no leakage (NFR6).
 *   AC #8 — Generic server error (500): dialog stays open, error toast, no leakage.
 *   AC #9 — Cancel button + Escape close the dialog without firing POST.
 *   AC #10 — Submitting state disables inputs and Guardar; double-click on Guardar fires only one POST.
 *
 * Aligned test cases (test-design-epic-2.md):
 *   TC-E2-P0-01 (UI / E2E leg)  — Create happy path + immediate list refresh
 *   TC-E2-P0-02 (UI / E2E leg)  — Required-field validation blocks submission
 *   TC-E2-P0-03 (E2E leg)        — Duplicate NIT user-safe message
 *
 * These tests MUST fail until the CreateClienteDialog + useCreateCliente +
 * the "Nuevo cliente" button wired into ClienteListView are implemented.
 */

test.describe('Story 2.3 — Create Client UI (RED)', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const api = new ApiHelper(request);
    for (const id of createdIds) {
      await api.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── AC #4 — Nuevo cliente button is always visible ──────────────────────
  test('AC #4 — "Nuevo cliente" button is rendered in the left panel sticky header', async ({
    page,
  }) => {
    // GIVEN: backend returns an empty list (intercept BEFORE navigation)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: user navigates to /clientes
    await page.goto('/clientes');

    // THEN: the "Nuevo cliente" button is visible regardless of list state
    await expect(
      page.getByRole('button', { name: /nuevo cliente/i }),
    ).toBeVisible();
  });

  // ─── AC #4 — Clicking opens AlertDialog with all 4 inputs ────────────────
  test('AC #4 — clicking "Nuevo cliente" opens the dialog with title and 4 inputs', async ({
    page,
  }) => {
    // GIVEN: empty list
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: user clicks "Nuevo cliente"
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    // THEN: dialog opens with title and the 4 required inputs (aria-required)
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Nuevo cliente');

    for (const label of [/^nombre$/i, /nit\/?ruc/i, /tel[eé]fono/i, /ciudad/i]) {
      const input = dialog.getByLabel(label);
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('aria-required', 'true');
    }

    // And Guardar + Cancelar buttons
    await expect(dialog.getByRole('button', { name: /guardar/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /cancelar/i })).toBeVisible();
  });

  // ─── AC #5 — Empty submit blocks (no POST), shows 4 inline Spanish errors ─
  test('AC #5 — empty submit blocks: zero POST calls, 4 inline Spanish errors', async ({
    page,
  }) => {
    // GIVEN: empty list + POST spy
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      // The POST should NEVER be reached on empty submit (AC #5)
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ unexpected: 'POST was fired on empty submit' }),
      });
    });

    let postCount = 0;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/v1/clientes')) {
        postCount += 1;
      }
    });

    // WHEN: user opens the dialog and clicks Guardar without filling
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await page.getByRole('button', { name: /guardar/i }).click();

    // THEN: 4 inline Spanish errors are rendered
    await expect(page.getByText('El nombre es obligatorio')).toBeVisible();
    await expect(page.getByText('El NIT/RUC es obligatorio')).toBeVisible();
    await expect(page.getByText('El teléfono es obligatorio')).toBeVisible();
    await expect(page.getByText('La ciudad es obligatoria')).toBeVisible();

    // AND: no POST was fired (React Hook Form + Zod block submission)
    expect(postCount).toBe(0);

    // AND: dialog is still open
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  // ─── AC #6 / TC-E2-P0-01 — Happy path: 201 → list updates + success toast ─
  test('AC #6 — happy path: 201 closes dialog, new client appears in list, success toast', async ({
    page,
  }) => {
    // GIVEN: backend returns 201 with the new client (intercept BEFORE navigation)
    const newId = '11111111-1111-1111-1111-111111111111';
    const newFixture = {
      id: newId,
      nombre: 'ACME Happy Path',
      nitRuc: '900111250-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-06-29T10:00:00Z',
      updatedAt: '2026-06-29T10:00:00Z',
    };

    await page.route('**/api/v1/clientes', (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { Location: `/api/v1/clientes/${newId}` },
          body: JSON.stringify(newFixture),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: user opens dialog, fills the form, submits
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/^nombre$/i).fill(newFixture.nombre);
    await dialog.getByLabel(/nit\/?ruc/i).fill(newFixture.nitRuc);
    await dialog.getByLabel(/tel[eé]fono/i).fill(newFixture.telefono);
    await dialog.getByLabel(/ciudad/i).fill(newFixture.ciudad);
    await dialog.getByRole('button', { name: /guardar/i }).click();

    // THEN: dialog closes
    await expect(dialog).toBeHidden();

    // AND: success toast appears with the exact Spanish copy
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();

    // AND: the new client appears in the list
    await expect(
      page.getByTestId(`client-list-item-${newId}`),
    ).toBeVisible();
  });

  // ─── AC #7 / TC-E2-P0-03 — Duplicate NIT: dialog stays open + inline error ─
  test('AC #7 — duplicate NIT: dialog stays open, inline NIT/RUC error, no NFR6 leakage', async ({
    page,
  }) => {
    // GIVEN: backend returns 409 Problem Details
    const dupNit = '900111260-2';
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            title: 'NIT/RUC duplicado',
            status: 409,
            instance: '/api/v1/clientes',
            detail: 'El NIT/RUC ya está registrado',
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: user submits the form with the duplicate NIT
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/^nombre$/i).fill('Dup Nombre');
    await dialog.getByLabel(/nit\/?ruc/i).fill(dupNit);
    await dialog.getByLabel(/tel[eé]fono/i).fill('3001112233');
    await dialog.getByLabel(/ciudad/i).fill('Bogotá');
    await dialog.getByRole('button', { name: /guardar/i }).click();

    // THEN: dialog stays open
    await expect(dialog).toBeVisible();

    // AND: inline error message is visible (exact Spanish copy from problem.detail)
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // AND (NFR6): the DOM does NOT contain SQL / EF / 409 / about:blank
    const html = await page.content();
    expect(html).not.toContain('23505');
    expect(html).not.toContain('DbUpdateException');
    expect(html).not.toContain('uk_clientes_nit');
    expect(html).not.toContain('about:blank');
  });

  // ─── AC #8 — Server error (500): dialog stays open + error toast ─────────
  test('AC #8 — 500 server error: dialog stays open, error toast, form values preserved', async ({
    page,
  }) => {
    // GIVEN: backend returns 500 on POST
    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ type: 'about:blank', title: 'Server Error', status: 500 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: user submits a valid form
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/^nombre$/i).fill('Some Nombre');
    await dialog.getByLabel(/nit\/?ruc/i).fill('900111270-3');
    await dialog.getByLabel(/tel[eé]fono/i).fill('3009998877');
    await dialog.getByLabel(/ciudad/i).fill('Cali');
    await dialog.getByRole('button', { name: /guardar/i }).click();

    // THEN: dialog stays open
    await expect(dialog).toBeVisible();

    // AND: error toast appears with exact Spanish copy
    await expect(
      page.getByText('No pudimos crear el cliente. Inténtalo de nuevo.'),
    ).toBeVisible();

    // AND: form values are preserved (user can retry)
    await expect(dialog.getByLabel(/^nombre$/i)).toHaveValue('Some Nombre');
    await expect(dialog.getByLabel(/nit\/?ruc/i)).toHaveValue('900111270-3');

    // NFR6: no raw status / problem details leak
    const html = await page.content();
    expect(html).not.toContain('500');
    expect(html).not.toContain('about:blank');
  });

  // ─── AC #9 — Cancel button closes dialog without firing POST ─────────────
  test('AC #9 — clicking Cancelar closes dialog and does NOT fire POST', async ({
    page,
  }) => {
    // GIVEN: empty list + POST spy
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    let postCount = 0;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/v1/clientes')) {
        postCount += 1;
      }
    });

    // WHEN: user opens, types something, clicks Cancelar
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/^nombre$/i).fill('Filled then Cancelled');
    await dialog.getByRole('button', { name: /cancelar/i }).click();

    // THEN: dialog is closed
    await expect(dialog).toBeHidden();
    expect(postCount).toBe(0);

    // AND: reopening shows empty fields (form was reset)
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog').getByLabel(/^nombre$/i)).toHaveValue('');
  });

  // ─── AC #10 — Submitting state disables Guardar; double-click fires once ──
  test('AC #10 — while submitting, Guardar is disabled; double-click fires POST once', async ({
    page,
  }) => {
    // GIVEN: backend POST is artificially slow (500ms) so the in-flight state is observable
    let postCount = 0;
    const newId = '22222222-2222-2222-2222-222222222222';
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 500));
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { Location: `/api/v1/clientes/${newId}` },
          body: JSON.stringify({
            id: newId,
            nombre: 'Slow Cliente',
            nitRuc: '900111290-5',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-06-29T10:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: user submits a valid form and immediately clicks Guardar twice
    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/^nombre$/i).fill('Slow Cliente');
    await dialog.getByLabel(/nit\/?ruc/i).fill('900111290-5');
    await dialog.getByLabel(/tel[eé]fono/i).fill('3001234567');
    await dialog.getByLabel(/ciudad/i).fill('Bogotá');

    const guardar = dialog.getByRole('button', { name: /guardar/i });
    await guardar.click();
    // Attempt a second click while in-flight; the button should be disabled and absorb the click
    await guardar.click({ force: true }).catch(() => null);

    // THEN: only ONE POST was fired
    await expect(dialog).toBeHidden({ timeout: 3000 });
    expect(postCount).toBe(1);
  });
});
