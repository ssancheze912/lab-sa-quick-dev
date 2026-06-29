/**
 * E2E Tests — Delete Client (Story 2.5)
 * ATDD RED phase — tests fail until implementation is complete.
 *
 * Covers Story 2.5 acceptance criteria via browser automation:
 *   AC #1 — [P0] "Eliminar" button visible; confirmation dialog appears with
 *            "¿Eliminar este cliente?", "Confirmar", "Cancelar"
 *   AC #2 — [P0] Confirming deletion removes client from list, right panel resets,
 *            toast "Cliente eliminado correctamente" shown
 *   AC #3 — [P1] "Cancelar" closes dialog, no DELETE triggered, client still visible
 *   AC #4 — [P1] Orphan-contact toast shown when client had associated contacts
 *
 * Strategy:
 *   - Network-first: route.fulfill intercepts BEFORE page.goto (prevents race conditions)
 *   - Uses data-testid selectors only
 *   - Given-When-Then format per test
 *   - Priority tags: [P0], [P1], [P2]
 *
 * Expected RED failures:
 *   - data-testid="cliente-detail-delete-button" does not exist yet
 *   - data-testid="cliente-detail-delete-dialog" does not exist yet
 *   - data-testid="cliente-detail-delete-confirm" does not exist yet
 *   - data-testid="cliente-detail-delete-cancel" does not exist yet
 *   - Toast text "Cliente eliminado correctamente" not emitted yet
 */

import { test, expect } from '@playwright/test';

const KNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000099';

const KNOWN_CLIENT = {
  id: KNOWN_CLIENT_ID,
  nombre: 'Empresa Delete E2E',
  nit: '900999999-9',
  telefono: '3009999999',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
};

const KNOWN_CLIENT_WITH_CONTACTS = {
  id: '00000000-0000-0000-0000-000000000098',
  nombre: 'Empresa Con Contactos E2E',
  nit: '900888888-8',
  telefono: '3008888888',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
  contactCount: 2,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupDeleteRoutes(
  page: import('@playwright/test').Page,
  opts?: {
    clienteId?: string;
    deleteStatus?: number;
    deleteBody?: object | null;
    clientData?: typeof KNOWN_CLIENT;
  }
) {
  const clienteId = opts?.clienteId ?? KNOWN_CLIENT_ID;
  const clientData = opts?.clientData ?? KNOWN_CLIENT;
  const deleteStatus = opts?.deleteStatus ?? 204;

  // CRITICAL: Register all route intercepts BEFORE navigation (network-first)

  // GET /api/v1/clientes — list
  await page.route('**/api/v1/clientes', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clientData]),
      });
    } else {
      route.continue();
    }
  });

  // GET /api/v1/clientes/:id and DELETE /api/v1/clientes/:id
  await page.route(`**/api/v1/clientes/${clienteId}`, (route) => {
    if (route.request().method() === 'DELETE') {
      if (deleteStatus === 204) {
        route.fulfill({
          status: 204,
          body: '',
        });
      } else {
        route.fulfill({
          status: deleteStatus,
          contentType: 'application/problem+json',
          body: JSON.stringify(opts?.deleteBody ?? {
            status: deleteStatus,
            title: 'Not Found',
            detail: 'Cliente no encontrado',
          }),
        });
      }
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientData),
      });
    }
  });
}

// ---------------------------------------------------------------------------
// AC #1 — "Eliminar" button and confirmation dialog
// ---------------------------------------------------------------------------

test.describe('[AC#1] "Eliminar" button and confirmation dialog', () => {
  test('[P0] should show "Eliminar" button in the detail panel when a client is loaded', async ({ page }) => {
    // GIVEN: Network routes wired before navigation
    await setupDeleteRoutes(page);

    // WHEN: Navigate to client detail
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);

    // THEN: "Eliminar" button is visible in the detail panel
    await expect(page.getByTestId('cliente-detail-delete-button')).toBeVisible();
  });

  test('[P0] should open confirmation dialog with correct title when "Eliminar" is clicked', async ({ page }) => {
    // GIVEN: Client loaded in detail panel
    await setupDeleteRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User clicks "Eliminar"
    await page.getByTestId('cliente-detail-delete-button').click();

    // THEN: Confirmation dialog appears with "¿Eliminar este cliente?"
    await expect(page.getByTestId('cliente-detail-delete-dialog')).toBeVisible();
    await expect(page.getByText('¿Eliminar este cliente?')).toBeVisible();
  });

  test('[P0] should show "Confirmar" and "Cancelar" buttons inside the confirmation dialog', async ({ page }) => {
    // GIVEN: Client loaded, "Eliminar" clicked
    await setupDeleteRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-delete-button').click();

    // THEN: Both action buttons are visible in the dialog
    await expect(page.getByTestId('cliente-detail-delete-confirm')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-delete-cancel')).toBeVisible();
  });

  test('[P2] should NOT show "Eliminar" button when no client is selected (empty state)', async ({ page }) => {
    // GIVEN: List returns empty, no client selected
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: Navigate to /clientes (no clienteId selected)
    await page.goto('/clientes');

    // THEN: "Eliminar" button is NOT present
    await expect(page.getByTestId('cliente-detail-delete-button')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC #2 — Confirming deletion: removes from list, resets panel, shows toast
// ---------------------------------------------------------------------------

test.describe('[AC#2] Confirming deletion completes the delete flow', () => {
  test('[P0] should call DELETE API with correct client ID when "Confirmar" is clicked', async ({ page }) => {
    // GIVEN: Network-first intercepts, track if DELETE was called
    let deletedId: string | null = null;

    await page.route('**/api/v1/clientes', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([KNOWN_CLIENT]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) => {
      if (route.request().method() === 'DELETE') {
        deletedId = KNOWN_CLIENT_ID;
        route.fulfill({ status: 204, body: '' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CLIENT),
        });
      }
    });

    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-confirm')).toBeVisible();

    // WHEN: User clicks "Confirmar"
    await page.getByTestId('cliente-detail-delete-confirm').click();

    // THEN: DELETE was called with the correct client ID
    await expect(async () => {
      expect(deletedId).toBe(KNOWN_CLIENT_ID);
    }).toPass({ timeout: 3000 });
  });

  test('[P0] should show toast "Cliente eliminado correctamente" after successful deletion', async ({ page }) => {
    // GIVEN: Network-first routes wired
    await setupDeleteRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-confirm')).toBeVisible();

    // WHEN: User clicks "Confirmar"
    await page.getByTestId('cliente-detail-delete-confirm').click();

    // THEN: Success toast is shown
    await expect(page.getByText('Cliente eliminado correctamente')).toBeVisible();
  });

  test('[P0] should return right panel to empty/default state after successful deletion', async ({ page }) => {
    // GIVEN: Network routes wired — after delete, list returns empty
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204, body: '' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CLIENT),
        });
      }
    });

    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-confirm')).toBeVisible();

    // WHEN: User clicks "Confirmar"
    await page.getByTestId('cliente-detail-delete-confirm').click();

    // THEN: Right panel returns to empty/default state
    await expect(page.getByTestId('cliente-detail-panel')).not.toBeVisible();
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC #3 — "Cancelar" preserves client, no DELETE triggered
// ---------------------------------------------------------------------------

test.describe('[AC#3] "Cancelar" closes dialog without deleting', () => {
  test('[P1] should close the confirmation dialog when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Client loaded, dialog open
    await setupDeleteRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cliente-detail-delete-cancel').click();

    // THEN: Dialog is closed
    await expect(page.getByTestId('cliente-detail-delete-dialog')).not.toBeVisible();
  });

  test('[P1] should NOT trigger DELETE when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Network-first — track DELETE calls, add a DELETE handler that would fail
    let deleteWasCalled = false;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT]),
      })
    );

    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteWasCalled = true;
        route.fulfill({ status: 204, body: '' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CLIENT),
        });
      }
    });

    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-cancel')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cliente-detail-delete-cancel').click();

    // THEN: DELETE was NOT called
    expect(deleteWasCalled).toBe(false);
  });

  test('[P1] should keep the client in the detail panel after "Cancelar"', async ({ page }) => {
    // GIVEN: Client loaded, "Cancelar" clicked in dialog
    await setupDeleteRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-cancel')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cliente-detail-delete-cancel').click();

    // THEN: Client detail panel is still visible (record unchanged)
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC #4 — Orphan-contact toast when client had contacts
// ---------------------------------------------------------------------------

test.describe('[AC#4] Orphan-contact toast for client with associated contacts', () => {
  test('[P1] should show orphan-contact toast when client with contacts is deleted', async ({ page }) => {
    // GIVEN: Client with contactCount > 0, DELETE returns 204
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT_WITH_CONTACTS]),
      })
    );

    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_WITH_CONTACTS.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204, body: '' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CLIENT_WITH_CONTACTS),
        });
      }
    });

    await page.goto(`/clientes/${KNOWN_CLIENT_WITH_CONTACTS.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-confirm')).toBeVisible();

    // WHEN: User confirms deletion of a client with contacts
    await page.getByTestId('cliente-detail-delete-confirm').click();

    // THEN: Orphan-contact toast is shown
    await expect(
      page.getByText('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
    ).toBeVisible();
  });

  test('[P1] should NOT show orphan-contact toast for client without contacts', async ({ page }) => {
    // GIVEN: Client without contacts, DELETE returns 204
    await setupDeleteRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-confirm')).toBeVisible();

    // WHEN: User confirms deletion
    await page.getByTestId('cliente-detail-delete-confirm').click();

    // THEN: Generic success toast shown, NOT the orphan-contact message
    await expect(page.getByText('Cliente eliminado correctamente')).toBeVisible();
    await expect(
      page.getByText('Sus contactos asociados quedaron sin cliente asignado.')
    ).not.toBeVisible();
  });
});
