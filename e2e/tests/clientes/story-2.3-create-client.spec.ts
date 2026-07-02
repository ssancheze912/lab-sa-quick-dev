/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * These E2E tests intentionally FAIL until Story 2.3 is implemented.
 *
 * Acceptance Criteria covered here (see story 2.3):
 *   AC1 — Header of `ClienteListView` shows a primary Button "Nuevo cliente"
 *         (data-testid="cliente-nuevo-button", aria-label="Nuevo cliente"),
 *         visible even when the list is empty. Clicking any "Nuevo cliente"
 *         trigger opens the ClienteFormModal in create mode with 4 empty
 *         fields and auto-focus on Nombre.
 *   AC2 — Modal contains a form with exactly 4 required Input fields
 *         (Nombre, NIT/RUC, Teléfono, Ciudad) with stable data-testid,
 *         aria-required, and a "* Campos obligatorios" legend. Actions:
 *         Cancelar (outline) + Guardar (default, disabled when invalid).
 *   AC3 — Empty/whitespace-only field submit → inline error messages
 *         appear (exact Spanish strings), aria-invalid="true",
 *         aria-describedby="{field}-error", and NO POST request is sent.
 *   AC4 — Happy path: fill 4 fields + submit → POST /api/v1/clientes with
 *         trimmed camelCase body → 201 → modal closes, toast success
 *         ("Cliente creado correctamente"), new cliente appears at top
 *         of the list; queryKey ['clientes'] is invalidated (list refresh).
 *   AC5 — Backend 409 duplicate NIT → modal STAYS open, inline error under
 *         NIT input with exact text "El NIT/RUC ya está registrado".
 *         No toast (business validation is inline per UX spec). Neither
 *         the Problem Details `detail` nor `title` leaks into the DOM.
 *   AC6 — Backend 5xx / network error → modal stays open, fields keep
 *         their values, red toast "No se pudo guardar. Intenta de nuevo."
 *         is shown, and no stack traces leak (NFR6).
 *
 * Mapped test cases from _bmad-output/test-design-epic-2.md:
 *   P0#1  — Create cliente reflects immediately on list (FR27)
 *   P0#3  — POST /clientes with duplicate NIT returns 409 (uk_clientes_nit)
 *   P0#4  — Frontend maps 409 to "El NIT/RUC ya está registrado" (NFR6)
 *   P0#7  — Mutation invalidates ['clientes'] query key
 *   P0#9  — Required fields validation prevents submit on empty inputs
 *   R-002 — Duplicate NIT mitigation (unique index + 409 + inline)
 *   R-004 — Cache invalidation after mutation
 *   R-011 — Exact copy of toasts and inline messages
 *   R-012 — Trim + required validation server-side + frontend
 *
 * Network-first pattern: all `page.route()` intercepts are registered BEFORE
 * the navigation call so the SPA's initial GETs hit the mocks.
 * Selectors use `data-testid` (never CSS classes) — resilient to markup churn.
 * All waits are explicit (`toBeVisible`, `toHaveText`, `toHaveCount`, etc.) —
 * no `page.waitForTimeout`.
 */

import { test, expect, type Route, type Page, type Request } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures / factories (local to Story 2.3 ATDD suite)
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

const now = '2026-07-02T12:00:00Z';

const seedClientes: ClienteDto[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Acme Corp',
    nit: '900123456-7',
    telefono: '+57 300 111 1111',
    ciudad: 'Cali',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Beta Distribuciones',
    nit: '800987654-3',
    telefono: '+57 301 222 2222',
    ciudad: 'Bogotá',
    createdAt: now,
    updatedAt: now,
  },
];

const NEW_CLIENTE: Omit<ClienteDto, 'createdAt' | 'updatedAt'> = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  nombre: 'Nuevo Cliente SA',
  nit: '999888777-1',
  telefono: '+57 300 555 0000',
  ciudad: 'Medellín',
};

// ─────────────────────────────────────────────────────────────────────────────
// Route interceptors
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/clientes → JSON array (list). POST is delegated to caller. */
async function mockClientesList(page: Page, body: ClienteDto[]) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
      return;
    }
    await route.continue();
  });
}

/**
 * Mocks GET (list) + POST (create) end-to-end. On successful POST, the
 * returned cliente is prepended to the list so subsequent GETs reflect it.
 * Records every POST request into `postLog` for assertions.
 */
async function mockClientesListAndCreate(
  page: Page,
  postLog: { requests: Request[]; bodies: unknown[] },
) {
  let listBody: ClienteDto[] = [...seedClientes];

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
    if (method === 'POST') {
      postLog.requests.push(route.request());
      const raw = route.request().postData() ?? '{}';
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      postLog.bodies.push(parsed);

      const body = (parsed ?? {}) as Partial<ClienteDto>;
      const created: ClienteDto = {
        id: NEW_CLIENTE.id,
        nombre: (body.nombre ?? NEW_CLIENTE.nombre).trim(),
        nit: (body.nit ?? NEW_CLIENTE.nit).trim(),
        telefono: (body.telefono ?? NEW_CLIENTE.telefono).trim(),
        ciudad: (body.ciudad ?? NEW_CLIENTE.ciudad).trim(),
        createdAt: now,
        updatedAt: now,
      };
      listBody = [created, ...listBody];
      await route.fulfill({
        status: 201,
        headers: { Location: `/api/v1/clientes/${created.id}` },
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
      return;
    }
    await route.continue();
  });
}

/** POST /api/v1/clientes → 409 Conflict Problem Details (duplicate NIT). */
async function mockClientesCreate409(
  page: Page,
  postLog: { requests: Request[] },
) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedClientes),
      });
      return;
    }
    if (method === 'POST') {
      postLog.requests.push(route.request());
      await route.fulfill({
        status: 409,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
          title: 'NIT/RUC duplicado',
          status: 409,
          detail: 'Ya existe un cliente con el NIT/RUC indicado.',
          instance: '/api/v1/clientes',
          field: 'nit',
          extensions: { field: 'nit' },
        }),
      });
      return;
    }
    await route.continue();
  });
}

/** POST /api/v1/clientes → 500 Problem Details (server error). */
async function mockClientesCreate500(
  page: Page,
  postLog: { requests: Request[] },
) {
  await page.route('**/api/v1/clientes', async (route: Route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedClientes),
      });
      return;
    }
    if (method === 'POST') {
      postLog.requests.push(route.request());
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

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — [TC-Story-2.3-Header-Button] "Nuevo cliente" button visible + opens modal
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — "Nuevo cliente" button opens the modal', () => {
  test('[TC-Story-2.3-Header-Button] header shows the primary "Nuevo cliente" button', async ({
    page,
  }) => {
    // GIVEN: The clientes list is loaded with at least one cliente
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);

    // WHEN: The user looks at the header of the left panel
    const nuevoButton = page.getByTestId('cliente-nuevo-button');

    // THEN: The button is visible with the expected accessible name
    await expect(nuevoButton).toBeVisible();
    await expect(nuevoButton).toHaveAttribute('aria-label', 'Nuevo cliente');
    await expect(nuevoButton).toHaveText(/nuevo cliente/i);
  });

  test('[TC-Story-2.3-Header-Button-Empty-List] button remains visible when the list is empty', async ({
    page,
  }) => {
    // GIVEN: The clientes list returns zero clientes
    await mockClientesList(page, []);
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);

    // WHEN: The user looks at the header of the left panel
    const nuevoButton = page.getByTestId('cliente-nuevo-button');

    // THEN: The header button is still rendered (even alongside the EmptyState)
    await expect(nuevoButton).toBeVisible();
  });

  test('[TC-Story-2.3-Header-Opens-Modal] clicking the header button opens the modal in create mode', async ({
    page,
  }) => {
    // GIVEN: The list is loaded with clientes
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');

    // WHEN: The user clicks the header "Nuevo cliente" button
    await page.getByTestId('cliente-nuevo-button').click();

    // THEN: The modal is visible with empty fields and Nombre auto-focused
    const modal = page.getByTestId('cliente-form-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('cliente-form-nombre')).toHaveValue('');
    await expect(page.getByTestId('cliente-form-nit')).toHaveValue('');
    await expect(page.getByTestId('cliente-form-telefono')).toHaveValue('');
    await expect(page.getByTestId('cliente-form-ciudad')).toHaveValue('');
    await expect(page.getByTestId('cliente-form-nombre')).toBeFocused();
  });

  test('[TC-Story-2.3-Empty-CTA-Opens-Modal] EmptyState CTA opens the same modal', async ({
    page,
  }) => {
    // GIVEN: The list returns zero clientes so the EmptyState is rendered
    await mockClientesList(page, []);
    await page.goto('/clientes');
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();

    // WHEN: The user clicks the CTA "Nuevo cliente" inside the EmptyState
    await emptyState.getByRole('button', { name: /nuevo cliente/i }).click();

    // THEN: The same ClienteFormModal opens
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — [TC-Story-2.3-Modal-Fields] Modal has exactly the 4 required Inputs + actions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Modal renders the 4 required Inputs and the two action buttons', () => {
  test('[TC-Story-2.3-Modal-Fields] modal contains Nombre, NIT/RUC, Teléfono, Ciudad — all required', async ({
    page,
  }) => {
    // GIVEN: The modal is open in create mode
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // WHEN: The user inspects the form fields
    const nombre = page.getByTestId('cliente-form-nombre');
    const nit = page.getByTestId('cliente-form-nit');
    const telefono = page.getByTestId('cliente-form-telefono');
    const ciudad = page.getByTestId('cliente-form-ciudad');

    // THEN: All four Inputs are present with aria-required="true"
    await expect(nombre).toBeVisible();
    await expect(nombre).toHaveAttribute('aria-required', 'true');
    await expect(nit).toBeVisible();
    await expect(nit).toHaveAttribute('aria-required', 'true');
    await expect(telefono).toBeVisible();
    await expect(telefono).toHaveAttribute('aria-required', 'true');
    await expect(ciudad).toBeVisible();
    await expect(ciudad).toHaveAttribute('aria-required', 'true');
  });

  test('[TC-Story-2.3-Modal-Actions] modal shows Cancelar (outline) + Guardar (submit) buttons', async ({
    page,
  }) => {
    // GIVEN: The modal is open
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    // WHEN: The user looks at the modal footer actions
    const cancelBtn = page.getByTestId('cliente-form-cancel');
    const submitBtn = page.getByTestId('cliente-form-submit');

    // THEN: Both action buttons are visible with the expected copy
    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toHaveText(/cancelar/i);
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText(/guardar/i);
  });

  test('[TC-Story-2.3-Modal-Legend] "* Campos obligatorios" legend is rendered', async ({
    page,
  }) => {
    // GIVEN: The modal is open
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    // WHEN: The user reads the footer of the form
    const modal = page.getByTestId('cliente-form-modal');

    // THEN: The Spanish legend is displayed
    await expect(modal).toContainText('* Campos obligatorios');
  });

  test('[TC-Story-2.3-Modal-Cancel-Closes] clicking Cancelar closes the modal without submitting', async ({
    page,
  }) => {
    // GIVEN: The modal is open and no POST intercept has been triggered
    const postLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndCreate(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // WHEN: The user clicks the Cancelar button
    await page.getByTestId('cliente-form-cancel').click();

    // THEN: The modal is hidden and no POST was sent
    await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);
    expect(postLog.requests).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — [TC-Story-2.3-Validation] Empty / whitespace-only submit → inline errors + no POST
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Client-side validation blocks POST for empty/whitespace fields', () => {
  test('[TC-Story-2.3-Validation-Empty] submitting an empty form shows the four inline errors and sends no POST', async ({
    page,
  }) => {
    // GIVEN: The modal is open with empty inputs and no POST has been sent
    const postLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndCreate(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // WHEN: The user attempts to submit without filling any field
    // (form.requestSubmit forces the submit event bypassing the disabled button
    //  so we assert the validator, not the disabled-attr behaviour)
    await page.evaluate(() => {
      const form = document.getElementById('cliente-form') as HTMLFormElement | null;
      form?.requestSubmit();
    });

    // THEN: An inline error message is rendered for each required field
    await expect(page.getByTestId('cliente-form-nombre-error')).toHaveText(
      'El nombre es requerido',
    );
    await expect(page.getByTestId('cliente-form-nit-error')).toHaveText(
      'El NIT/RUC es requerido',
    );
    await expect(page.getByTestId('cliente-form-telefono-error')).toHaveText(
      'El teléfono es requerido',
    );
    await expect(page.getByTestId('cliente-form-ciudad-error')).toHaveText(
      'La ciudad es requerida',
    );

    // AND: No POST request was ever issued to the backend
    expect(postLog.requests).toHaveLength(0);
  });

  test('[TC-Story-2.3-Validation-Whitespace] whitespace-only Nombre fails validation on blur', async ({
    page,
  }) => {
    // GIVEN: The modal is open
    const postLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndCreate(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    // WHEN: The user types only spaces in Nombre and blurs the field
    const nombre = page.getByTestId('cliente-form-nombre');
    await nombre.fill('   ');
    await nombre.blur();

    // THEN: The inline error appears with the exact Spanish copy
    await expect(page.getByTestId('cliente-form-nombre-error')).toHaveText(
      'El nombre es requerido',
    );
    // AND: aria-invalid is set on the field so screen readers announce it
    await expect(nombre).toHaveAttribute('aria-invalid', 'true');
  });

  test('[TC-Story-2.3-Validation-ARIA] each error links to its input via aria-describedby', async ({
    page,
  }) => {
    // GIVEN: The modal is open with empty fields
    await mockClientesList(page, seedClientes);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    // WHEN: The user submits the empty form
    await page.evaluate(() => {
      const form = document.getElementById('cliente-form') as HTMLFormElement | null;
      form?.requestSubmit();
    });
    await expect(page.getByTestId('cliente-form-nit-error')).toBeVisible();

    // THEN: The NIT input's aria-describedby points to the error element id
    await expect(page.getByTestId('cliente-form-nit')).toHaveAttribute(
      'aria-describedby',
      'nit-error',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — [TC-Story-2.3-Happy] Valid submit → 201 → modal closes, toast, list update
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Successful creation refreshes the list and shows a success toast', () => {
  test('[TC-Story-2.3-Happy] POST body is trimmed camelCase JSON and modal closes on 201', async ({
    page,
  }) => {
    // GIVEN: The modal is open and the POST endpoint returns 201 with the new dto
    const postLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndCreate(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();

    // WHEN: The user fills the 4 fields (with surrounding spaces to prove trim)
    await page.getByTestId('cliente-form-nombre').fill('  Nuevo Cliente SA  ');
    await page.getByTestId('cliente-form-nit').fill('  999888777-1  ');
    await page.getByTestId('cliente-form-telefono').fill('  +57 300 555 0000  ');
    await page.getByTestId('cliente-form-ciudad').fill('  Medellín  ');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The modal is hidden after the successful mutation
    await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);

    // AND: Exactly one POST was issued with trimmed camelCase body
    expect(postLog.requests).toHaveLength(1);
    expect(postLog.bodies[0]).toEqual({
      nombre: 'Nuevo Cliente SA',
      nit: '999888777-1',
      telefono: '+57 300 555 0000',
      ciudad: 'Medellín',
    });
  });

  test('[TC-Story-2.3-Happy-Toast] success toast shows "Cliente creado correctamente"', async ({
    page,
  }) => {
    // GIVEN: The modal is open and the POST returns 201
    const postLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndCreate(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    // WHEN: The user fills the fields and submits
    await page.getByTestId('cliente-form-nombre').fill('Nuevo Cliente SA');
    await page.getByTestId('cliente-form-nit').fill('999888777-1');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 555 0000');
    await page.getByTestId('cliente-form-ciudad').fill('Medellín');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The success toast copy appears in the DOM
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
  });

  test('[TC-Story-2.3-Happy-List] new cliente appears at the top of the list (FR27)', async ({
    page,
  }) => {
    // GIVEN: The modal is open and the POST returns 201 (list mock will refetch)
    const postLog = { requests: [] as Request[], bodies: [] as unknown[] };
    await mockClientesListAndCreate(page, postLog);
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
    await page.getByTestId('cliente-nuevo-button').click();

    // WHEN: The user submits a valid form
    await page.getByTestId('cliente-form-nombre').fill('Nuevo Cliente SA');
    await page.getByTestId('cliente-form-nit').fill('999888777-1');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 555 0000');
    await page.getByTestId('cliente-form-ciudad').fill('Medellín');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The list count increased by one and the new cliente is first
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
    await expect(page.getByTestId('cliente-list-item').first()).toContainText(
      'Nuevo Cliente SA',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — [TC-Story-2.3-409] Duplicate NIT → inline error, modal stays open, no toast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — 409 Conflict on duplicate NIT shows an inline error and keeps the modal open', () => {
  test('[TC-Story-2.3-409-Inline] shows exact "El NIT/RUC ya está registrado" under NIT input', async ({
    page,
  }) => {
    // GIVEN: The modal is open; the POST always responds 409 duplicate NIT
    const postLog = { requests: [] as Request[] };
    await mockClientesCreate409(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    // WHEN: The user fills the fields and submits (NIT collides server-side)
    await page.getByTestId('cliente-form-nombre').fill('Acme Corp');
    await page.getByTestId('cliente-form-nit').fill('900123456-7');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 111 1111');
    await page.getByTestId('cliente-form-ciudad').fill('Cali');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The inline error appears under the NIT field with the exact Spanish copy
    await expect(page.getByTestId('cliente-form-nit-error')).toHaveText(
      'El NIT/RUC ya está registrado',
    );
    // AND: NIT input carries aria-invalid="true"
    await expect(page.getByTestId('cliente-form-nit')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('[TC-Story-2.3-409-Modal-Stays] modal stays open and fields keep their values on 409', async ({
    page,
  }) => {
    // GIVEN: The modal is open; POST responds 409
    const postLog = { requests: [] as Request[] };
    await mockClientesCreate409(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Acme Corp');
    await page.getByTestId('cliente-form-nit').fill('900123456-7');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 111 1111');
    await page.getByTestId('cliente-form-ciudad').fill('Cali');

    // WHEN: The user submits and the server rejects with 409
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByTestId('cliente-form-nit-error')).toBeVisible();

    // THEN: The modal is still open, values are preserved, so user can correct
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();
    await expect(page.getByTestId('cliente-form-nombre')).toHaveValue('Acme Corp');
    await expect(page.getByTestId('cliente-form-nit')).toHaveValue('900123456-7');
    await expect(page.getByTestId('cliente-form-telefono')).toHaveValue(
      '+57 300 111 1111',
    );
    await expect(page.getByTestId('cliente-form-ciudad')).toHaveValue('Cali');
  });

  test('[TC-Story-2.3-409-No-Toast] 409 does NOT trigger the red error toast', async ({
    page,
  }) => {
    // GIVEN: The modal is open and POST responds 409
    const postLog = { requests: [] as Request[] };
    await mockClientesCreate409(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Acme Corp');
    await page.getByTestId('cliente-form-nit').fill('900123456-7');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 111 1111');
    await page.getByTestId('cliente-form-ciudad').fill('Cali');

    // WHEN: The user submits
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByTestId('cliente-form-nit-error')).toBeVisible();

    // THEN: No red-toast copy is present in the DOM
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toHaveCount(
      0,
    );
  });

  test('[TC-Story-2.3-409-NoLeak] Problem Details detail/title never leak to the DOM (NFR6)', async ({
    page,
  }) => {
    // GIVEN: The modal is open and POST responds 409 with a verbose detail string
    const postLog = { requests: [] as Request[] };
    await mockClientesCreate409(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Acme Corp');
    await page.getByTestId('cliente-form-nit').fill('900123456-7');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 111 1111');
    await page.getByTestId('cliente-form-ciudad').fill('Cali');
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByTestId('cliente-form-nit-error')).toBeVisible();

    // WHEN: We snapshot the full DOM
    const html = await page.content();

    // THEN: Neither the Problem Details `detail` nor `title` appear verbatim
    expect(html).not.toContain('Ya existe un cliente con el NIT/RUC indicado.');
    expect(html).not.toContain('NIT/RUC duplicado');
    // AND: No C# / EF Core stack-trace signals leak either
    expect(html).not.toMatch(/System\.[A-Za-z]+Exception/);
    expect(html).not.toMatch(/Microsoft\.EntityFrameworkCore/);
    expect(html).not.toMatch(/\.cs:line \d+/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — [TC-Story-2.3-5xx] 500 / network error → red toast, modal stays, no leak
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Server error surfaces a red toast without closing the modal', () => {
  test('[TC-Story-2.3-5xx-Toast] 500 shows red toast "No se pudo guardar. Intenta de nuevo."', async ({
    page,
  }) => {
    // GIVEN: The modal is open and POST responds 500
    const postLog = { requests: [] as Request[] };
    await mockClientesCreate500(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Nuevo Cliente SA');
    await page.getByTestId('cliente-form-nit').fill('999888777-1');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 555 0000');
    await page.getByTestId('cliente-form-ciudad').fill('Medellín');

    // WHEN: The user submits and the server fails
    await page.getByTestId('cliente-form-submit').click();

    // THEN: The red toast copy appears in the DOM
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();
  });

  test('[TC-Story-2.3-5xx-Modal-Stays] modal stays open with fields intact on 500', async ({
    page,
  }) => {
    // GIVEN: The modal is open and POST responds 500
    const postLog = { requests: [] as Request[] };
    await mockClientesCreate500(page, postLog);
    await page.goto('/clientes');
    await page.getByTestId('cliente-nuevo-button').click();

    await page.getByTestId('cliente-form-nombre').fill('Nuevo Cliente SA');
    await page.getByTestId('cliente-form-nit').fill('999888777-1');
    await page.getByTestId('cliente-form-telefono').fill('+57 300 555 0000');
    await page.getByTestId('cliente-form-ciudad').fill('Medellín');

    // WHEN: The submit fails
    await page.getByTestId('cliente-form-submit').click();
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();

    // THEN: The modal is still open and inputs keep their values
    await expect(page.getByTestId('cliente-form-modal')).toBeVisible();
    await expect(page.getByTestId('cliente-form-nombre')).toHaveValue('Nuevo Cliente SA');
    await expect(page.getByTestId('cliente-form-nit')).toHaveValue('999888777-1');
    await expect(page.getByTestId('cliente-form-telefono')).toHaveValue(
      '+57 300 555 0000',
    );
    await expect(page.getByTestId('cliente-form-ciudad')).toHaveValue('Medellín');
  });
});
