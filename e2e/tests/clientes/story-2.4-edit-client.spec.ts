/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * These E2E tests intentionally FAIL until Story 2.4 is implemented.
 *
 * Acceptance Criteria covered here (see story 2.4):
 *   AC1 — Detail panel header shows a secondary Button "Editar"
 *         (data-testid="cliente-editar-button", aria-label="Editar cliente"),
 *         visible only when the cliente is loaded (not on loading / 404 /
 *         empty state). Clicking it opens `ClienteFormModal` in edit mode.
 *   AC2 — Modal title is "Editar cliente" (NOT "Nuevo cliente"). The 4 Inputs
 *         are pre-filled with the cliente's current values; auto-focus lands
 *         on Nombre; actions are Cancelar (outline) + Guardar (submit).
 *   AC3 — Empty/whitespace-only fields → inline errors with exact Spanish
 *         copy; aria-invalid="true"; **no** PUT reaches the backend.
 *   AC4 — Valid submit → PUT /api/v1/clientes/{id} with trimmed camelCase
 *         body → 200 → modal closes, toast success ("Cliente actualizado
 *         correctamente"), detail panel reflects the change immediately,
 *         list item is updated **in place** (order preserved — no reinsert
 *         at head as in Create).
 *   AC5 — Backend 409 duplicate NIT → modal STAYS open, inline error under
 *         NIT input with exact copy "El NIT/RUC ya está registrado".
 *         No toast. Neither `title` nor `detail` from Problem Details leak
 *         to the DOM (NFR6). Same NIT as the current cliente does NOT 409.
 *   AC6 — Backend 404 (cliente deleted by another session) → red toast
 *         "No se pudo guardar. Intenta de nuevo.", modal stays open, no
 *         stack traces leak (NFR6).
 *   AC7 — Backend 5xx / network error → red toast, modal stays open, values
 *         preserved.
 *   AC8 — Cancelar / Esc / ✕ → modal closes without submit; original values
 *         preserved; reopening restores the original values (no residue).
 *
 * Mapped test cases from _bmad-output/test-design-epic-2.md:
 *   P0#1  — Edit cliente reflects immediately on list (FR27)
 *   P0#7  — Mutation invalidates ['clientes'] and ['clientes', id] keys
 *   P0#9  — Required fields validation prevents submit on empty inputs
 *   P1#7  — Edit form pre-filled with current values (FR6, AC-E2.4)
 *   P1#10 — PUT /clientes/{id} updates only mutable fields; createdAt unchanged
 *   R-002 — Duplicate NIT mitigation (unique index + 409 + inline)
 *   R-004 — Cache invalidation after mutation
 *   R-008 — Server-first flow (no optimistic pre-PUT; modal closes only on 200)
 *   R-011 — Exact copy of toasts and inline messages
 *   R-012 — Trim + required validation server-side + frontend
 *
 * Network-first pattern: every `page.route()` intercept is registered BEFORE
 * `page.goto()` so the SPA's initial GET hits the mock. All selectors use
 * `data-testid`; all waits are explicit (`toBeVisible`, `toHaveText`, etc.).
 */

import { test, expect, type Route, type Page, type Request } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures / factories (local to Story 2.4 ATDD suite)
// ─────────────────────────────────────────────────────────────────────────────

type ClienteDto = {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
};

const originalCreatedAt = '2026-07-02T12:00:00Z';
const originalUpdatedAt = '2026-07-02T12:00:00Z';
const refreshedUpdatedAt = '2026-07-02T13:00:00Z';

const CLIENTE_A: ClienteDto = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Acme Corp',
  nit: '900123456-7',
  telefono: '+57 300 111 1111',
  ciudad: 'Cali',
  createdAt: originalCreatedAt,
  updatedAt: originalUpdatedAt,
};

const CLIENTE_B: ClienteDto = {
  id: '22222222-2222-2222-2222-222222222222',
  nombre: 'Beta Distribuciones',
  nit: '800987654-3',
  telefono: '+57 301 222 2222',
  ciudad: 'Bogotá',
  createdAt: originalCreatedAt,
  updatedAt: originalUpdatedAt,
};

const CLIENTE_C: ClienteDto = {
  id: '33333333-3333-3333-3333-333333333333',
  nombre: 'Gamma Suministros',
  nit: '700111222-1',
  telefono: '+57 302 333 3333',
  ciudad: 'Medellín',
  createdAt: originalCreatedAt,
  updatedAt: originalUpdatedAt,
};

const seedClientes: ClienteDto[] = [CLIENTE_A, CLIENTE_B, CLIENTE_C];

// ─────────────────────────────────────────────────────────────────────────────
// Route interceptors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mocks GET (list), GET (byId), and PUT (update) end-to-end. On successful PUT,
 * the returned cliente REPLACES the entry in the list at its current position
 * (order preserved — no reinsert at head). Records every PUT request into
 * `putLog` for assertions.
 */
async function mockClientesListAndUpdate(
  page: Page,
  putLog: { requests: Request[]; bodies: unknown[] },
) {
  let listBody: ClienteDto[] = [...seedClientes];

  // GET /api/v1/clientes (list)
  await page.route('**/api/v1/clientes', async (route: Route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(listBody),
      });
      return;
    }
    await route.continue();
  });

  // GET /api/v1/clientes/:id + PUT /api/v1/clientes/:id
  await page.route('**/api/v1/clientes/*', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    const id = url.substring(url.lastIndexOf('/') + 1);

    if (method === 'GET') {
      const found = listBody.find((c) => c.id === id);
      if (!found) {
        await route.fulfill({
          status: 404,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
            title: 'Cliente no encontrado',
            status: 404,
            detail: `No existe ningún cliente con id ${id}.`,
            instance: `/api/v1/clientes/${id}`,
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(found),
      });
      return;
    }

    if (method === 'PUT') {
      putLog.requests.push(request);
      const raw = request.postData() ?? '{}';
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        parsed = {};
      }
      putLog.bodies.push(parsed);

      const existing = listBody.find((c) => c.id === id);
      if (!existing) {
        await route.fulfill({
          status: 404,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
            title: 'Cliente no encontrado',
            status: 404,
            detail: `No existe ningún cliente con id ${id}.`,
            instance: `/api/v1/clientes/${id}`,
          }),
        });
        return;
      }

      const updated: ClienteDto = {
        ...existing,
        nombre: String(parsed.nombre ?? existing.nombre).trim(),
        nit: String(parsed.nit ?? existing.nit).trim(),
        telefono: String(parsed.telefono ?? existing.telefono).trim(),
        ciudad: String(parsed.ciudad ?? existing.ciudad).trim(),
        // createdAt is IMMUTABLE audit — backend never overwrites it.
        createdAt: existing.createdAt,
        updatedAt: refreshedUpdatedAt,
      };
      listBody = listBody.map((c) => (c.id === id ? updated : c));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
      return;
    }

    await route.continue();
  });
}

/** PUT /api/v1/clientes/:id → 409 Conflict Problem Details (duplicate NIT). */
async function mockClientesUpdate409(
  page: Page,
  putLog: { requests: Request[] },
) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedClientes),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/clientes/*', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    const id = url.substring(url.lastIndexOf('/') + 1);

    if (method === 'GET') {
      const found = seedClientes.find((c) => c.id === id);
      if (found) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(found),
        });
        return;
      }
    }

    if (method === 'PUT') {
      putLog.requests.push(request);
      await route.fulfill({
        status: 409,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
          title: 'NIT/RUC duplicado',
          status: 409,
          detail: 'Ya existe un cliente con el NIT/RUC indicado.',
          instance: `/api/v1/clientes/${id}`,
          field: 'nit',
          extensions: { field: 'nit' },
        }),
      });
      return;
    }
    await route.continue();
  });
}

/** PUT /api/v1/clientes/:id → 404 Not Found Problem Details. */
async function mockClientesUpdate404(
  page: Page,
  putLog: { requests: Request[] },
) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedClientes),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/clientes/*', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    const id = url.substring(url.lastIndexOf('/') + 1);

    // First GET returns 200 so the detail view mounts. Subsequent PUT returns 404.
    if (method === 'GET') {
      const found = seedClientes.find((c) => c.id === id);
      if (found) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(found),
        });
        return;
      }
    }

    if (method === 'PUT') {
      putLog.requests.push(request);
      await route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
          title: 'Cliente no encontrado',
          status: 404,
          detail: `No existe ningún cliente con id ${id}.`,
          instance: `/api/v1/clientes/${id}`,
        }),
      });
      return;
    }
    await route.continue();
  });
}

/** PUT /api/v1/clientes/:id → 500 Problem Details (server error). */
async function mockClientesUpdate500(
  page: Page,
  putLog: { requests: Request[] },
) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedClientes),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/clientes/*', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    const id = url.substring(url.lastIndexOf('/') + 1);

    if (method === 'GET') {
      const found = seedClientes.find((c) => c.id === id);
      if (found) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(found),
        });
        return;
      }
    }

    if (method === 'PUT') {
      putLog.requests.push(request);
      await route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Server error',
          status: 500,
        }),
      });
      return;
    }
    await route.continue();
  });
}

/** Delayed GET /api/v1/clientes/:id — used to assert loading branch hides Editar. */
async function mockDetailSlow(page: Page, delayMs: number) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedClientes),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/clientes/*', async (route: Route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      // Explicit wait via setTimeout in the route handler (NOT a page.waitForTimeout
      // — the delay lives in the mock, page-side waits stay assertion-based).
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const url = request.url();
      const id = url.substring(url.lastIndexOf('/') + 1);
      const found = seedClientes.find((c) => c.id === id);
      if (found) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(found),
        });
        return;
      }
    }
    await route.continue();
  });
}

/** Detail GET returns 404 — used to assert Editar is hidden on 404 branch. */
async function mockDetail404(page: Page) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedClientes),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/clientes/*', async (route: Route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      const url = request.url();
      const id = url.substring(url.lastIndexOf('/') + 1);
      await route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
          title: 'Cliente no encontrado',
          status: 404,
          detail: `No existe ningún cliente con id ${id}.`,
          instance: `/api/v1/clientes/${id}`,
        }),
      });
      return;
    }
    await route.continue();
  });
}

const CLIENTE_A_URL = `/clientes/${CLIENTE_A.id}`;

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — [TC-Story-2.4-Editar-Button] "Editar" button visible + opens modal
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — "Editar" button lives in the detail panel header', () => {
  test('[TC-Story-2.4-Editar-Button-Visible] button is visible with aria-label when cliente is loaded', async ({
    page,
  }) => {
    // GIVEN: The detail view is mounted with a loaded cliente
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: The user looks at the detail panel header
    const editarButton = page.getByTestId('cliente-editar-button');

    // THEN: The secondary "Editar" button is visible with the a11y label
    await expect(editarButton).toBeVisible();
    await expect(editarButton).toHaveAttribute('aria-label', 'Editar cliente');
    await expect(editarButton).toHaveText(/editar/i);
  });

  test('[TC-Story-2.4-Editar-Button-Hidden-While-Loading] button is NOT rendered while the detail is loading', async ({
    page,
  }) => {
    // GIVEN: GET /clientes/:id is intentionally slow so the loading branch renders
    await mockDetailSlow(page, 1500);
    await page.goto(CLIENTE_A_URL);

    // WHEN: The user inspects the detail panel while still loading
    const editarButton = page.getByTestId('cliente-editar-button');

    // THEN: The Editar button is not present in the DOM during isLoading
    await expect(editarButton).toHaveCount(0);
  });

  test('[TC-Story-2.4-Editar-Button-Hidden-On-404] button is NOT rendered when the cliente is not found', async ({
    page,
  }) => {
    // GIVEN: GET /clientes/:id returns 404 (NotFoundClientePanel branch)
    await mockDetail404(page);
    await page.goto(CLIENTE_A_URL);

    // WHEN: The 404 panel eventually renders
    const editarButton = page.getByTestId('cliente-editar-button');

    // THEN: The Editar button is not present in the 404 panel
    await expect(editarButton).toHaveCount(0);
  });

  test('[TC-Story-2.4-Editar-Opens-Modal] clicking the button opens the modal in edit mode', async ({
    page,
  }) => {
    // GIVEN: The detail is loaded for cliente A
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);

    // WHEN: The user clicks Editar
    await page.getByTestId('cliente-editar-button').click();

    // THEN: The modal is visible with the "Editar cliente" title
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();
    await expect(page.getByText('Editar cliente', { exact: true })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — [TC-Story-2.4-Prefill] Modal shows edit title and pre-filled fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Edit modal is pre-filled with the cliente values', () => {
  test('[TC-Story-2.4-Prefill-Fields] all 4 inputs are pre-filled from the cliente', async ({
    page,
  }) => {
    // GIVEN: The detail is loaded for cliente A
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // WHEN: The user inspects the four form inputs
    // THEN: Each input carries the current cliente value
    await expect(page.getByTestId('cliente-form-nombre')).toHaveValue(CLIENTE_A.nombre);
    await expect(page.getByTestId('cliente-form-nit')).toHaveValue(CLIENTE_A.nit);
    await expect(page.getByTestId('cliente-form-telefono')).toHaveValue(CLIENTE_A.telefono);
    await expect(page.getByTestId('cliente-form-ciudad')).toHaveValue(CLIENTE_A.ciudad);
  });

  test('[TC-Story-2.4-Prefill-Title] modal title reads "Editar cliente" (not "Nuevo cliente")', async ({
    page,
  }) => {
    // GIVEN: The detail is loaded for cliente A
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();
    const modal = page.getByTestId('cliente-form-modal');
    await expect(modal).toBeVisible();

    // WHEN: The user reads the modal header
    // THEN: The title is the edit copy
    await expect(modal).toContainText('Editar cliente');
    await expect(modal).not.toContainText('Nuevo cliente');
  });

  test('[TC-Story-2.4-Prefill-Focus] auto-focus lands on the Nombre input', async ({
    page,
  }) => {
    // GIVEN: The detail is loaded for cliente A
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);

    // WHEN: The user opens the edit modal
    await page.getByTestId('cliente-editar-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // THEN: The Nombre input has focus
    await expect(page.getByTestId('cliente-form-nombre')).toBeFocused();
  });

  test('[TC-Story-2.4-Prefill-Actions] Cancelar + Guardar buttons are rendered', async ({
    page,
  }) => {
    // GIVEN: The modal is open in edit mode
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    // WHEN: The user inspects the modal footer
    const cancelBtn = page.getByTestId('cliente-form-cancel');
    const submitBtn = page.getByTestId('cliente-form-submit');

    // THEN: Both action buttons are visible with the expected copy
    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toHaveText(/cancelar/i);
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText(/guardar/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — [TC-Story-2.4-Validation] Empty / whitespace-only submit → inline errors + no PUT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Client-side validation blocks PUT for empty/whitespace fields', () => {
  test('[TC-Story-2.4-Validation-EmptyNombre] emptying Nombre and submitting shows inline error and sends no PUT', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open with pre-filled values
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // WHEN: The user clears Nombre and clicks Guardar
    const nombre = page.getByTestId('cliente-form-nombre');
    await nombre.fill('');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The inline error for Nombre appears with the exact Spanish copy
    await expect(page.getByTestId('cliente-form-nombre-error')).toHaveText(
      'El nombre es requerido',
    );
    // AND: aria-invalid is set on the field
    await expect(nombre).toHaveAttribute('aria-invalid', 'true');
    // AND: No PUT request was ever issued to the backend
    expect(putLog.requests).toHaveLength(0);
  });

  test('[TC-Story-2.4-Validation-WhitespaceNit] whitespace-only NIT fails validation and sends no PUT', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    // WHEN: The user replaces NIT with only spaces and submits
    const nit = page.getByTestId('cliente-form-nit');
    await nit.fill('   ');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The inline NIT error is rendered with the exact Spanish copy
    await expect(page.getByTestId('cliente-form-nit-error')).toHaveText(
      'El NIT/RUC es requerido',
    );
    // AND: No PUT reached the backend
    expect(putLog.requests).toHaveLength(0);
  });

  test('[TC-Story-2.4-Validation-ARIA] Nombre input wires aria-describedby to its error element id', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open and Nombre was cleared
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    // WHEN: The user clears Nombre and submits
    await page.getByTestId('cliente-form-nombre').fill('');
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByTestId('cliente-form-nombre-error')).toBeVisible();

    // THEN: The input's aria-describedby points to the error element id
    await expect(page.getByTestId('cliente-form-nombre')).toHaveAttribute(
      'aria-describedby',
      'nombre-error',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — [TC-Story-2.4-Happy] Valid submit → 200 → modal closes, toast, list update
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Successful edit refreshes detail + list and shows a success toast', () => {
  test('[TC-Story-2.4-Happy-Put-Body] PUT body is trimmed camelCase JSON and modal closes on 200', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open with pre-filled values
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // WHEN: The user edits Nombre (with surrounding whitespace) and submits
    await page.getByTestId('cliente-form-nombre').fill('  Acme Updated  ');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The modal is hidden after the successful mutation
    await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);

    // AND: Exactly one PUT was issued, targeting the correct id, with trimmed body
    expect(putLog.requests).toHaveLength(1);
    expect(putLog.requests[0].url()).toContain(`/api/v1/clientes/${CLIENTE_A.id}`);
    expect(putLog.bodies[0]).toEqual({
      nombre: 'Acme Updated',
      nit: CLIENTE_A.nit,
      telefono: CLIENTE_A.telefono,
      ciudad: CLIENTE_A.ciudad,
    });
  });

  test('[TC-Story-2.4-Happy-Toast] success toast shows "Cliente actualizado correctamente"', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    // WHEN: The user edits and submits successfully
    await page.getByTestId('cliente-form-nombre').fill('Acme Updated');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The success toast copy appears in the DOM (NOT the create copy)
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();
    await expect(page.getByText('Cliente creado correctamente')).toHaveCount(0);
  });

  test('[TC-Story-2.4-Happy-Detail] detail panel reflects the new values without a page reload', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    // WHEN: The user edits Nombre and submits
    await page.getByTestId('cliente-form-nombre').fill('Acme Updated');
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);

    // THEN: The detail panel heading now shows the new nombre
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Acme Updated');
  });

  test('[TC-Story-2.4-Happy-List-Order-Preserved] list item is updated in the SAME position (no reinsert at head)', async ({
    page,
  }) => {
    // GIVEN: The list is loaded with A, B, C in that order and the modal is open for B
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(`/clientes/${CLIENTE_B.id}`);
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
    await page.getByTestId('cliente-editar-button').click();

    // WHEN: The user edits B's nombre and submits
    await page.getByTestId('cliente-form-nombre').fill('Beta Updated');
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);

    // THEN: The updated cliente is still at index 1 (NOT at the head — order is
    // preserved, unlike Create which prepends to the top)
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('Acme Corp');
    await expect(items.nth(1)).toContainText('Beta Updated');
    await expect(items.nth(2)).toContainText('Gamma Suministros');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — [TC-Story-2.4-409] Duplicate NIT → inline error, modal stays, no toast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — 409 Conflict on duplicate NIT keeps the modal open with an inline error', () => {
  test('[TC-Story-2.4-409-Inline] shows exact "El NIT/RUC ya está registrado" under NIT input', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open and PUT responds 409
    const putLog = { requests: [] as Request[] };
    await mockClientesUpdate409(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    // WHEN: The user changes the NIT to one that collides server-side and submits
    await page.getByTestId('cliente-form-nit').fill('800987654-3');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The inline error appears under NIT with the exact Spanish copy
    await expect(page.getByTestId('cliente-form-nit-error')).toHaveText(
      'El NIT/RUC ya está registrado',
    );
    // AND: NIT input carries aria-invalid="true"
    await expect(page.getByTestId('cliente-form-nit')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('[TC-Story-2.4-409-Modal-Stays] modal stays open and fields keep their values on 409', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open with edited values ready to submit
    const putLog = { requests: [] as Request[] };
    await mockClientesUpdate409(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Acme Corp Renamed');
    await page.getByTestId('cliente-form-nit').fill('800987654-3');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 999 0000');
    await page.getByTestId('cliente-form-ciudad').fill('Cartagena');

    // WHEN: The user submits and the server rejects with 409
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByTestId('cliente-form-nit-error')).toBeVisible();

    // THEN: The modal is still open with the edited values preserved
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();
    await expect(page.getByTestId('cliente-form-nombre')).toHaveValue('Acme Corp Renamed');
    await expect(page.getByTestId('cliente-form-nit')).toHaveValue('800987654-3');
    await expect(page.getByTestId('cliente-form-telefono')).toHaveValue('+57 300 999 0000');
    await expect(page.getByTestId('cliente-form-ciudad')).toHaveValue('Cartagena');
  });

  test('[TC-Story-2.4-409-No-Toast] 409 does NOT trigger the red error toast', async ({
    page,
  }) => {
    // GIVEN: PUT responds 409
    const putLog = { requests: [] as Request[] };
    await mockClientesUpdate409(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    await page.getByTestId('cliente-form-nit').fill('800987654-3');

    // WHEN: The user submits
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByTestId('cliente-form-nit-error')).toBeVisible();

    // THEN: No red-toast copy is present in the DOM
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toHaveCount(0);
  });

  test('[TC-Story-2.4-409-NoLeak] Problem Details detail/title never leak to the DOM (NFR6)', async ({
    page,
  }) => {
    // GIVEN: PUT responds 409 with a verbose detail string
    const putLog = { requests: [] as Request[] };
    await mockClientesUpdate409(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    await page.getByTestId('cliente-form-nit').fill('800987654-3');
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByTestId('cliente-form-nit-error')).toBeVisible();

    // WHEN: We snapshot the full DOM
    const html = await page.content();

    // THEN: Neither the Problem Details detail nor title appear verbatim
    expect(html).not.toContain('Ya existe un cliente con el NIT/RUC indicado.');
    expect(html).not.toContain('NIT/RUC duplicado');
    // AND: No C# / EF Core stack-trace signals leak either
    expect(html).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(html).not.toMatch(/Microsoft\.EntityFrameworkCore/);
    expect(html).not.toMatch(/\.cs:line \d+/);
    expect(html).not.toContain('uk_clientes_nit');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — [TC-Story-2.4-404] Backend 404 during PUT → red toast + modal stays
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — 404 Not Found during PUT surfaces a red toast without closing the modal', () => {
  test('[TC-Story-2.4-404-Toast] 404 shows red toast "No se pudo guardar. Intenta de nuevo."', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open and PUT responds 404
    const putLog = { requests: [] as Request[] };
    await mockClientesUpdate404(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Acme Updated');

    // WHEN: The user submits and the server responds 404
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The red toast copy appears in the DOM
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();
  });

  test('[TC-Story-2.4-404-Modal-Stays] modal stays open with edited values on 404', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open and PUT responds 404
    const putLog = { requests: [] as Request[] };
    await mockClientesUpdate404(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Acme Updated');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 555 5555');

    // WHEN: The user submits and the server responds 404
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();

    // THEN: The modal is still open with the edited values preserved
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();
    await expect(page.getByTestId('cliente-form-nombre')).toHaveValue('Acme Updated');
    await expect(page.getByTestId('cliente-form-telefono')).toHaveValue('+57 300 555 5555');
  });

  test('[TC-Story-2.4-404-NoLeak] 404 does NOT leak stack traces or detail into the DOM (NFR6)', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open and PUT responds 404 with a verbose detail
    const putLog = { requests: [] as Request[] };
    await mockClientesUpdate404(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();

    // WHEN: We snapshot the full DOM after the failure
    const html = await page.content();

    // THEN: Backend detail strings do not leak
    expect(html).not.toContain('No existe ningún cliente con id');
    expect(html).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(html).not.toMatch(/\.cs:line \d+/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — [TC-Story-2.4-5xx] 500 → red toast, modal stays, no leak
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — 5xx server error surfaces a red toast without closing the modal', () => {
  test('[TC-Story-2.4-5xx-Toast] 500 shows red toast "No se pudo guardar. Intenta de nuevo."', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open and PUT responds 500
    const putLog = { requests: [] as Request[] };
    await mockClientesUpdate500(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Acme Updated');

    // WHEN: The user submits and the server fails
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The red toast copy appears in the DOM
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();
  });

  test('[TC-Story-2.4-5xx-Modal-Stays] modal stays open with values intact on 500', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open and PUT responds 500
    const putLog = { requests: [] as Request[] };
    await mockClientesUpdate500(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Acme Updated');
    await page.getByTestId('cliente-form-ciudad').fill('Barranquilla');

    // WHEN: The submit fails
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();

    // THEN: The modal is still open and inputs keep their edited values
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();
    await expect(page.getByTestId('cliente-form-nombre')).toHaveValue('Acme Updated');
    await expect(page.getByTestId('cliente-form-ciudad')).toHaveValue('Barranquilla');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — [TC-Story-2.4-Cancel] Cancelar / Esc / ✕ → close, preserve original
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Cancelling the edit closes the modal and preserves the original values', () => {
  test('[TC-Story-2.4-Cancel-Closes] Cancelar closes the modal without submitting', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open with an in-progress edit
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();
    await page.getByTestId('cliente-form-nombre').fill('Modified But Not Saved');

    // WHEN: The user clicks Cancelar
    await page.getByTestId('cliente-form-cancel').click();

    // THEN: The modal is closed and no PUT was sent
    await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);
    expect(putLog.requests).toHaveLength(0);
    // AND: No toast (success or error) is shown
    await expect(page.getByText('Cliente actualizado correctamente')).toHaveCount(0);
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toHaveCount(0);
  });

  test('[TC-Story-2.4-Cancel-Esc] pressing Escape closes the modal without submitting', async ({
    page,
  }) => {
    // GIVEN: The edit modal is open
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // WHEN: The user presses Escape
    await page.keyboard.press('Escape');

    // THEN: The modal is closed and no PUT was sent
    await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);
    expect(putLog.requests).toHaveLength(0);
  });

  test('[TC-Story-2.4-Cancel-Detail-Unchanged] detail panel keeps the original nombre after cancel', async ({
    page,
  }) => {
    // GIVEN: The detail is showing "Acme Corp" and the modal is open
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();

    // WHEN: The user edits Nombre in-modal then cancels
    await page.getByTestId('cliente-form-nombre').fill('Modified But Not Saved');
    await page.getByTestId('cliente-form-cancel').click();
    await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);

    // THEN: The detail panel still shows the ORIGINAL nombre
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Acme Corp');
    await expect(page.getByTestId('cliente-detail-panel')).not.toContainText(
      'Modified But Not Saved',
    );
  });

  test('[TC-Story-2.4-Cancel-Reopen-Restores] reopening the modal shows the ORIGINAL cliente values (no residue)', async ({
    page,
  }) => {
    // GIVEN: The modal is open with edits in flight
    const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndUpdate(page, putLog);
    await page.goto(CLIENTE_A_URL);
    await page.getByTestId('cliente-editar-button').click();
    await page.getByTestId('cliente-form-nombre').fill('Modified But Not Saved');
    await page.getByTestId('cliente-form-cancel').click();
    await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);

    // WHEN: The user reopens the edit modal
    await page.getByTestId('cliente-editar-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // THEN: The Nombre input shows the ORIGINAL cliente value, not the last edit
    await expect(page.getByTestId('cliente-form-nombre')).toHaveValue(CLIENTE_A.nombre);
    await expect(page.getByTestId('cliente-form-nombre')).not.toHaveValue(
      'Modified But Not Saved',
    );
  });
});
