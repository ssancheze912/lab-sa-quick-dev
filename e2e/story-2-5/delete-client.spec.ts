/**
 * Story 2.5: Delete Client — E2E Acceptance Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: "Eliminar" button opens confirmation dialog with "¿Eliminar este cliente?",
 *        "Confirmar" and "Cancelar" options
 * - AC2: Confirming deletion (204) → client removed from list + right panel back to empty
 *        + success toast "Cliente eliminado correctamente"
 * - AC3: Clicking "Cancelar" in dialog → dialog closes, client unchanged, no request sent
 * - AC4: Client with associated contacts → deletion succeeds + toast shows
 *        "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
 * - AC5: Backend unavailable (5xx/network) → toast error
 *        "No se pudo eliminar el cliente. Intenta de nuevo." + dialog closes + detail remains
 *
 * Patterns:
 * - Network-first: route intercepts are registered BEFORE navigation
 * - data-testid selectors only (no CSS class selectors)
 * - Given-When-Then structure
 * - One assertion per test (atomic)
 * - Explicit waits only (no hard waits)
 */

import { test, expect } from '@playwright/test';
import { buildClienteResponse } from '../support/factories/cliente.factory';

const API_CLIENTES_LIST = '**/api/v1/clientes';
const API_CLIENTE_DETAIL = '**/api/v1/clientes/*';
const API_CONTACTOS = '**/api/v1/contactos*';

const KNOWN_ID = '550e8400-e29b-41d4-a716-446655440005';

function buildClienteStub(overrides: Record<string, unknown> = {}) {
  return buildClienteResponse({
    id: KNOWN_ID,
    nombre: 'Empresa Ejemplo S.A.',
    nit: '900123456-7',
    telefono: '6011234567',
    ciudad: 'Bogotá',
    ...overrides,
  });
}

// ─── Shared navigation helper ─────────────────────────────────────────────────

async function navigateToClienteDetail(
  page: import('@playwright/test').Page,
  deleteStatus: number = 204,
  clienteData = buildClienteStub(),
  withContactos = false,
) {
  const clientes = [clienteData];

  // CRITICAL: Intercept routes BEFORE navigation
  await page.route(API_CLIENTES_LIST, (route) => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({ status: deleteStatus });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    }
  });

  await page.route(API_CLIENTE_DETAIL, (route) => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({ status: deleteStatus });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clienteData),
      });
    }
  });

  if (withContactos) {
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'contact-1', nombre: 'Juan García', clienteId: KNOWN_ID },
        ]),
      }),
    );
  }

  await page.goto(`/clientes/${KNOWN_ID}`);

  // Wait for detail panel to load
  await expect(page.getByTestId('cliente-detail-content')).toBeVisible();
}

// ─── AC1: "Eliminar" button opens confirmation dialog ────────────────────────

test.describe('AC1 — Botón "Eliminar" abre diálogo de confirmación', () => {
  test('should render "Eliminar" button when client data is loaded', async ({ page }) => {
    // GIVEN: API returns client data and detail panel is loaded
    await navigateToClienteDetail(page);

    // WHEN: Client detail is displayed
    // THEN: "Eliminar" button is visible
    await expect(page.getByTestId('cliente-eliminar-button')).toBeVisible();
  });

  test('should open confirmation dialog when "Eliminar" button is clicked', async ({ page }) => {
    // GIVEN: Client detail panel is loaded
    await navigateToClienteDetail(page);

    // WHEN: User clicks "Eliminar"
    await page.getByTestId('cliente-eliminar-button').click();

    // THEN: Confirmation dialog appears
    await expect(page.getByTestId('delete-confirmation-dialog')).toBeVisible();
  });

  test('should display the dialog title "¿Eliminar este cliente?" in the confirmation dialog', async ({ page }) => {
    // GIVEN: Client detail panel is loaded
    await navigateToClienteDetail(page);

    // WHEN: User clicks "Eliminar" to open dialog
    await page.getByTestId('cliente-eliminar-button').click();

    // THEN: Dialog title is "¿Eliminar este cliente?"
    await expect(page.getByTestId('delete-dialog-title')).toHaveText('¿Eliminar este cliente?');
  });

  test('should display "Confirmar" button inside the confirmation dialog', async ({ page }) => {
    // GIVEN: Client detail panel is loaded
    await navigateToClienteDetail(page);

    // WHEN: User opens the confirmation dialog
    await page.getByTestId('cliente-eliminar-button').click();

    // THEN: "Confirmar" button is visible in the dialog
    await expect(page.getByTestId('delete-dialog-confirm')).toBeVisible();
  });

  test('should display "Cancelar" button inside the confirmation dialog', async ({ page }) => {
    // GIVEN: Client detail panel is loaded
    await navigateToClienteDetail(page);

    // WHEN: User opens the confirmation dialog
    await page.getByTestId('cliente-eliminar-button').click();

    // THEN: "Cancelar" button is visible in the dialog
    await expect(page.getByTestId('delete-dialog-cancel')).toBeVisible();
  });

  test('should NOT render "Eliminar" button during skeleton loading state', async ({ page }) => {
    // GIVEN: API is slow (network-first intercept before navigation)
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({ delay: 10_000, status: 200, contentType: 'application/json', body: JSON.stringify(buildClienteStub()) }),
    );

    // WHEN: User navigates and detail is still loading
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-skeleton')).toBeVisible();

    // THEN: "Eliminar" button is NOT present during loading
    await expect(page.getByTestId('cliente-eliminar-button')).not.toBeVisible();
  });

  test('should NOT render "Eliminar" button while in edit mode', async ({ page }) => {
    // GIVEN: Client detail panel is loaded
    await navigateToClienteDetail(page);

    // WHEN: User activates edit mode
    await page.getByTestId('cliente-editar-button').click();

    // THEN: "Eliminar" button is not visible while editing
    await expect(page.getByTestId('cliente-eliminar-button')).not.toBeVisible();
  });
});

// ─── AC2: Confirming deletion → client removed from list + default state + toast ──

test.describe('AC2 — Confirmación de eliminación exitosa (sin contactos)', () => {
  test('should display success toast "Cliente eliminado correctamente" after confirmed deletion', async ({ page }) => {
    // GIVEN: Network intercepts set up before navigation, DELETE returns 204
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User clicks "Eliminar" and confirms
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: Success toast is shown with the correct message
    await expect(page.getByTestId('toast-success')).toContainText('Cliente eliminado correctamente');
  });

  test('should navigate to /clientes (right panel empty/default) after confirmed deletion', async ({ page }) => {
    // GIVEN: Network intercepts set up before navigation
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User confirms deletion
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: URL no longer contains clienteId (right panel returns to default state)
    await expect(page).toHaveURL(/\/clientes(?!\/.+)/);
  });

  test('should show placeholder in right panel after confirmed deletion', async ({ page }) => {
    // GIVEN: Network intercepts set up before navigation
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User confirms deletion
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: The empty/default placeholder is shown in the right panel
    await expect(page.getByTestId('cliente-detail-placeholder')).toBeVisible();
  });

  test('should remove deleted client from the left panel list', async ({ page }) => {
    // GIVEN: Client is in the list; after DELETE, list is re-fetched empty
    const clienteData = buildClienteStub({ nombre: 'Empresa A Eliminar' });
    let deleted = false;

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(deleted ? [] : [clienteData]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        deleted = true;
        route.fulfill({ status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User confirms deletion
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: The deleted client is no longer in the list
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa A Eliminar' })).not.toBeVisible();
  });

  test('should disable "Confirmar" button and show "Eliminando…" while mutation is pending', async ({ page }) => {
    // GIVEN: DELETE is slow (network-first intercept before navigation)
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ delay: 5_000, status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User clicks "Eliminar" and opens dialog
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: "Confirmar" button is disabled during pending state
    await expect(page.getByTestId('delete-dialog-confirm')).toBeDisabled();
  });
});

// ─── AC3: "Cancelar" closes dialog without sending request ───────────────────

test.describe('AC3 — "Cancelar" cierra diálogo sin enviar petición', () => {
  test('should close the confirmation dialog when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await navigateToClienteDetail(page);
    await page.getByTestId('cliente-eliminar-button').click();
    await expect(page.getByTestId('delete-confirmation-dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('delete-dialog-cancel').click();

    // THEN: The dialog is closed
    await expect(page.getByTestId('delete-confirmation-dialog')).not.toBeVisible();
  });

  test('should NOT send any DELETE request when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: DELETE route is intercepted to detect unwanted calls
    let deleteCallCount = 0;
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([buildClienteStub()]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCallCount++;
        route.fulfill({ status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildClienteStub()) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User opens dialog and clicks "Cancelar"
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-cancel').click();

    // THEN: No DELETE request was sent
    expect(deleteCallCount).toBe(0);
  });

  test('should keep the client detail visible after clicking "Cancelar"', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await navigateToClienteDetail(page);
    await page.getByTestId('cliente-eliminar-button').click();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('delete-dialog-cancel').click();

    // THEN: Client detail content is still displayed
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();
  });

  test('should keep the URL unchanged after clicking "Cancelar"', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await navigateToClienteDetail(page);
    await page.getByTestId('cliente-eliminar-button').click();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('delete-dialog-cancel').click();

    // THEN: URL still contains the clienteId
    await expect(page).toHaveURL(new RegExp(KNOWN_ID));
  });
});

// ─── AC4: Client with contacts → special toast message ───────────────────────

test.describe('AC4 — Eliminación de cliente con contactos asociados', () => {
  test('should display the contacts toast message when deleted client had associated contacts', async ({ page }) => {
    // GIVEN: Client has associated contacts in cache; DELETE returns 204
    const clienteData = buildClienteStub();

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'c1', nombre: 'Juan García', clienteId: KNOWN_ID }]),
      }),
    );

    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User confirms deletion of client that has contacts
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: Special contacts toast is shown
    await expect(page.getByTestId('toast-success')).toContainText(
      'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.',
    );
  });

  test('should navigate to /clientes (empty state) after deleting a client with contacts', async ({ page }) => {
    // GIVEN: Client with contacts; DELETE returns 204
    const clienteData = buildClienteStub();

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'c1', nombre: 'Juan García', clienteId: KNOWN_ID }]),
      }),
    );

    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User confirms deletion
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: URL returns to /clientes (no clienteId)
    await expect(page).toHaveURL(/\/clientes(?!\/.+)/);
  });
});

// ─── AC5: Backend unavailable → toast error + dialog closes + detail remains ─

test.describe('AC5 — Error de backend: toast de error, dialog cierra, detalle visible', () => {
  test('should display toast error "No se pudo eliminar el cliente. Intenta de nuevo." on 500', async ({ page }) => {
    // GIVEN: DELETE returns 500 (network-first intercept before navigation)
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User confirms deletion and backend returns 500
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: Toast error is shown with the correct message
    await expect(page.getByTestId('toast-error')).toContainText(
      'No se pudo eliminar el cliente. Intenta de nuevo.',
    );
  });

  test('should close the confirmation dialog after a 500 error', async ({ page }) => {
    // GIVEN: DELETE returns 500
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 500, contentType: 'application/problem+json', body: JSON.stringify({ status: 500 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User confirms deletion and backend returns 500
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: Dialog is closed after error
    await expect(page.getByTestId('delete-confirmation-dialog')).not.toBeVisible();
  });

  test('should keep client detail visible after a 500 error', async ({ page }) => {
    // GIVEN: DELETE returns 500
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 500, contentType: 'application/problem+json', body: JSON.stringify({ status: 500 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User confirms deletion and backend returns 500
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: Client detail content is still visible
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();
  });

  test('should display toast error when DELETE network call is aborted', async ({ page }) => {
    // GIVEN: DELETE is aborted (simulates network error)
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.abort('connectionrefused');
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User confirms deletion and network is unavailable
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: Toast error is displayed
    await expect(page.getByTestId('toast-error')).toBeVisible();
  });
});
