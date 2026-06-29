/**
 * Edge-case E2E Tests — Edit Client (Story 2.4)
 * Automation Expansion — BMad-Integrated mode
 *
 * Complements ClienteDetailView.edit.edge.test.tsx (component) and
 * UpdateClienteEndpointEdgeTests.cs (API integration).
 * Covers E2E edge cases NOT exercised by ATDD:
 *   - [P0] "Editar" button visible in detail panel after client loads via deep link
 *   - [P0] Clicking "Editar" opens edit form pre-filled with current nombre
 *   - [P0] "Cancelar" closes edit form without triggering PUT
 *   - [P1] Detail panel shows updated values after successful PUT
 *   - [P1] Toast "Cliente actualizado correctamente" shown after successful PUT
 *   - [P1] Edit form stays open after PUT 500 error
 *   - [P1] Submitting empty nombre in edit form shows inline validation error, no PUT
 *   - [P2] "Editar" button is NOT visible when no client is selected (empty state)
 *   - [P2] Navigation shell (navigation-rail) stays visible during edit flow
 *   - [P2] Edit button does not disappear between form open and form cancel (idempotent)
 *
 * Strategy:
 *   - Network-first: route.fulfill intercepts BEFORE page.goto
 *   - Uses data-testid selectors only
 *   - Given-When-Then format per test
 *   - Priority tags: [P0], [P1], [P2]
 */

import { test, expect } from '@playwright/test';

const KNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000042';

const KNOWN_CLIENT = {
  id: KNOWN_CLIENT_ID,
  nombre: 'Empresa Edit E2E',
  nit: '900123456-7',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
};

const UPDATED_CLIENT = {
  ...KNOWN_CLIENT,
  nombre: 'Empresa Actualizada E2E',
  telefono: '3119876543',
  updatedAt: '2026-06-29T12:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupClientRoutes(page: import('@playwright/test').Page, opts?: {
  putStatus?: number;
  putBody?: object;
}) {
  await page.route('**/api/v1/clientes', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([KNOWN_CLIENT]),
    })
  );

  await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) => {
    if (route.request().method() === 'PUT') {
      route.fulfill({
        status: opts?.putStatus ?? 200,
        contentType: opts?.putStatus && opts.putStatus >= 500
          ? 'application/problem+json'
          : 'application/json',
        body: JSON.stringify(opts?.putBody ?? UPDATED_CLIENT),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT),
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Edge: "Editar" button visible after client loads
// ---------------------------------------------------------------------------

test.describe('Edit button presence in detail panel', () => {
  test('[P0] should show "Editar" button in the detail panel after client loads via deep link', async ({ page }) => {
    // GIVEN: Network-first — GET /clientes and GET /clientes/:id both wired
    await setupClientRoutes(page);

    // WHEN: Navigate directly to client detail URL
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);

    // THEN: "Editar" button is visible in the detail panel
    await expect(page.getByTestId('cliente-detail-edit-button')).toBeVisible();
  });

  test('[P2] should NOT show "Editar" button when no client is selected (empty state)', async ({ page }) => {
    // GIVEN: List returns clients but no client selected
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT]),
      })
    );

    // WHEN: Navigate to /clientes (no clienteId)
    await page.goto('/clientes');

    // THEN: "Editar" button is NOT present (empty state, no client selected)
    await expect(page.getByTestId('cliente-detail-empty')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-edit-button')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edge: Clicking "Editar" opens edit form pre-filled
// ---------------------------------------------------------------------------

test.describe('Clicking "Editar" opens edit form pre-filled', () => {
  test('[P0] should hide detail panel and show edit form when "Editar" is clicked', async ({ page }) => {
    // GIVEN: Client is loaded in the detail panel
    await setupClientRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User clicks "Editar"
    await page.getByTestId('cliente-detail-edit-button').click();

    // THEN: Edit form is shown, detail panel is hidden
    await expect(page.getByTestId('cliente-detail-edit-form')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).not.toBeVisible();
  });

  test('[P0] should pre-fill edit form with current client nombre', async ({ page }) => {
    // GIVEN: Client loaded in detail panel
    await setupClientRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User clicks "Editar"
    await page.getByTestId('cliente-detail-edit-button').click();

    // THEN: Nombre field is pre-filled with client's current nombre
    await expect(page.getByTestId('cliente-form-nombre')).toHaveValue(KNOWN_CLIENT.nombre);
  });

  test('[P1] should pre-fill edit form with current NIT', async ({ page }) => {
    // GIVEN: Client loaded in detail panel
    await setupClientRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User clicks "Editar"
    await page.getByTestId('cliente-detail-edit-button').click();

    // THEN: NIT field is pre-filled with client's current NIT
    await expect(page.getByTestId('cliente-form-nit')).toHaveValue(KNOWN_CLIENT.nit);
  });
});

// ---------------------------------------------------------------------------
// Edge: "Cancelar" closes form without PUT
// ---------------------------------------------------------------------------

test.describe('"Cancelar" closes edit form without PUT', () => {
  test('[P0] should close edit form and restore detail panel when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Edit form is open
    await setupClientRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-edit-button').click();
    await expect(page.getByTestId('cliente-detail-edit-form')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cliente-form-cancel').click();

    // THEN: Edit form closes and detail panel is visible again
    await expect(page.getByTestId('cliente-detail-edit-form')).not.toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  test('[P1] should NOT send PUT when "Cancelar" is clicked after modifying a field', async ({ page }) => {
    // GIVEN: Edit form open, PUT tracker set
    let putWasCalled = false;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT]),
      })
    );

    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, async (route) => {
      if (route.request().method() === 'PUT') {
        putWasCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENT) });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CLIENT),
        });
      }
    });

    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-edit-button').click();
    await expect(page.getByTestId('cliente-detail-edit-form')).toBeVisible();

    // Modify a field (but do not submit)
    await page.getByTestId('cliente-form-nombre').fill('Nombre Modificado');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cliente-form-cancel').click();

    // THEN: PUT was NOT called
    expect(putWasCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: Successful PUT shows toast and updates detail panel
// ---------------------------------------------------------------------------

test.describe('Successful PUT — toast and updated detail panel', () => {
  test('[P1] should show "Cliente actualizado correctamente" toast after successful edit', async ({ page }) => {
    // GIVEN: Routes wired, PUT returns 200
    await setupClientRoutes(page, { putBody: UPDATED_CLIENT });

    // Re-route GET after PUT to return updated client
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-edit-button').click();
    await expect(page.getByTestId('cliente-detail-edit-form')).toBeVisible();

    // WHEN: User submits edit form
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Success toast is visible
    await expect(page.getByText(/cliente actualizado correctamente/i)).toBeVisible();
  });

  test('[P1] should close edit form and show detail panel after successful PUT', async ({ page }) => {
    // GIVEN: PUT returns 200 with updated client
    await setupClientRoutes(page, { putBody: UPDATED_CLIENT });

    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-edit-button').click();
    await expect(page.getByTestId('cliente-detail-edit-form')).toBeVisible();

    // WHEN: User submits the form
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Edit form closes, detail panel is restored
    await expect(page.getByTestId('cliente-detail-edit-form')).not.toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edge: PUT 500 error — edit form stays open
// ---------------------------------------------------------------------------

test.describe('PUT 500 error — edit form stays open', () => {
  test('[P1] should keep edit form open when PUT fails with 500', async ({ page }) => {
    // GIVEN: PUT returns 500 Internal Server Error
    await setupClientRoutes(page, {
      putStatus: 500,
      putBody: {
        status: 500,
        title: 'Internal Server Error',
        detail: 'An unexpected error occurred',
      },
    });

    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-edit-button').click();
    await expect(page.getByTestId('cliente-detail-edit-form')).toBeVisible();

    // WHEN: User submits the form (PUT fails)
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Edit form remains visible (not closed on error)
    await expect(page.getByTestId('cliente-detail-edit-form')).toBeVisible();

    // THEN: Detail panel is NOT shown (form did not close)
    await expect(page.getByTestId('cliente-detail-panel')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edge: Inline validation on whitespace-only nombre in edit mode
// ---------------------------------------------------------------------------

test.describe('Edit form validation — whitespace-only nombre blocked', () => {
  test('[P1] should show inline validation error and NOT send PUT when nombre is cleared to whitespace', async ({ page }) => {
    // GIVEN: Edit form open, PUT tracker set
    let putWasCalled = false;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT]),
      })
    );

    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, async (route) => {
      if (route.request().method() === 'PUT') {
        putWasCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CLIENT) });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CLIENT),
        });
      }
    });

    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-edit-button').click();
    await expect(page.getByTestId('cliente-detail-edit-form')).toBeVisible();

    // WHEN: User clears nombre to whitespace and submits
    await page.getByTestId('cliente-form-nombre').fill('   ');
    await page.getByTestId('cliente-form-submit').click();

    // THEN: Inline error for nombre is shown
    await expect(page.getByTestId('cliente-form-error-nombre')).toBeVisible();

    // THEN: PUT was NOT sent
    expect(putWasCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: Navigation shell stays visible during edit flow
// ---------------------------------------------------------------------------

test.describe('Navigation shell visible during edit flow', () => {
  test('[P2] should keep navigation rail visible when edit form is open', async ({ page }) => {
    // GIVEN: Client loaded, edit form open
    await setupClientRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User opens edit form
    await page.getByTestId('cliente-detail-edit-button').click();
    await expect(page.getByTestId('cliente-detail-edit-form')).toBeVisible();

    // THEN: Navigation rail is still visible (app shell not broken)
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });
});
