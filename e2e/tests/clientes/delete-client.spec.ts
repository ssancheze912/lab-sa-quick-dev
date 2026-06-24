/**
 * E2E Tests — Story 2.5: Delete Client
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking "Eliminar" in client detail shows confirmation dialog with "Confirmar" and "Cancelar"
 *   AC2 — Confirming deletion calls DELETE /api/v1/clientes/{id}, removes client from list,
 *          navigates to /clientes, shows success toast "Cliente eliminado correctamente"
 *   AC3 — Clicking "Cancelar" in dialog closes it without any API call; client data unchanged
 *   AC4 — Deleting a client with contacts shows toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
 *   AC5 — While delete is in-flight, "Confirmar" button is disabled and shows "Eliminando..."
 *   AC6 — Backend error (non-404) shows toast "No se pudo eliminar. Intenta de nuevo." without technical details
 *
 * Required data-testid attributes (must be added during implementation):
 *   - eliminar-cliente-button       → "Eliminar" trigger button inside ClienteDetailView header
 *   - confirmar-eliminacion-button  → "Confirmar" button inside the AlertDialog
 *   - cancelar-eliminacion-button   → "Cancelar" button inside the AlertDialog
 *
 * Network intercept strategy: ALWAYS intercept routes BEFORE navigation (network-first).
 */

import { test, expect } from '@playwright/test';
import { createClienteDto, createClienteDtos } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';
const API_CLIENTE_BY_ID = '**/api/v1/clientes/**';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Clicking "Eliminar" shows confirmation dialog with correct options
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — "Eliminar" button opens confirmation dialog', () => {
  test('should display an "Eliminar" button in the client detail panel', async ({ page }) => {
    // GIVEN: A client is loaded in the detail panel
    const cliente = createClienteDto({ nombre: 'Empresa Eliminar SA', nit: '800100200-1', telefono: '3011112222', ciudad: 'Bogotá' });

    // Network-first: intercept BEFORE navigation
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User navigates to the client detail
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The "Eliminar" button is visible in the detail panel
    await expect(page.getByTestId('eliminar-cliente-button')).toBeVisible();
  });

  test('should open a confirmation dialog when "Eliminar" is clicked', async ({ page }) => {
    // GIVEN: User is on a client detail view
    const cliente = createClienteDto({ nombre: 'Dialog Test SA', nit: '800200300-2', telefono: '3021112222', ciudad: 'Medellín' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);

    // WHEN: User clicks "Eliminar"
    await page.getByTestId('eliminar-cliente-button').click();

    // THEN: A confirmation dialog appears
    await expect(page.getByText('¿Eliminar este cliente?')).toBeVisible();
  });

  test('should show "Confirmar" option in the confirmation dialog', async ({ page }) => {
    // GIVEN: User has clicked "Eliminar" and dialog is open
    const cliente = createClienteDto({ nombre: 'Confirmar Option SA', nit: '800300400-3', telefono: '3031112222', ciudad: 'Cali' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // THEN: The "Confirmar" button is visible in the dialog
    await expect(page.getByTestId('confirmar-eliminacion-button')).toBeVisible();
  });

  test('should show "Cancelar" option in the confirmation dialog', async ({ page }) => {
    // GIVEN: User has clicked "Eliminar" and dialog is open
    const cliente = createClienteDto({ nombre: 'Cancelar Option SA', nit: '800400500-4', telefono: '3041112222', ciudad: 'Barranquilla' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // THEN: The "Cancelar" button is visible in the dialog
    await expect(page.getByTestId('cancelar-eliminacion-button')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Confirming deletion calls DELETE, removes client from list, navigates to /clientes, shows toast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Confirming deletion removes client and shows success toast', () => {
  test('should call DELETE /api/v1/clientes/{id} when "Confirmar" is clicked', async ({ page }) => {
    // GIVEN: User has opened the confirmation dialog for a client
    const cliente = createClienteDto({ nombre: 'Delete Call SA', nit: '800500600-5', telefono: '3051112222', ciudad: 'Bogotá' });
    let deleteCalled = false;

    // Network-first: intercept BEFORE navigation
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User clicks "Confirmar" in the dialog
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: DELETE was called to the backend
    await expect.poll(() => deleteCalled).toBe(true);
  });

  test('should navigate to /clientes after successful deletion', async ({ page }) => {
    // GIVEN: User confirms deletion successfully
    const cliente = createClienteDto({ nombre: 'Navigate After Delete SA', nit: '800600700-6', telefono: '3061112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User confirms deletion
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: URL navigates back to /clientes
    await page.waitForURL('**/clientes', { timeout: 5000 });
    expect(page.url()).toContain('/clientes');
    expect(page.url()).not.toContain(cliente.id);
  });

  test('should display success toast "Cliente eliminado correctamente" after deletion', async ({ page }) => {
    // GIVEN: User confirms deletion of a client without contacts
    const cliente = createClienteDto({ nombre: 'Toast Delete SA', nit: '800700800-7', telefono: '3071112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User confirms deletion
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: A success toast with the Spanish message is shown
    await expect(page.getByText('Cliente eliminado correctamente')).toBeVisible();
  });

  test('should re-fetch the client list (invalidateQueries "clientes") after successful deletion', async ({ page }) => {
    // GIVEN: User confirms deletion
    const cliente = createClienteDto({ nombre: 'Invalidate After Delete SA', nit: '800800900-8', telefono: '3081112222', ciudad: 'Bogotá' });
    let getListCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      getListCallCount++;
      // Second call returns empty list (client was deleted)
      const body = getListCallCount === 1 ? JSON.stringify([cliente]) : JSON.stringify([]);
      return route.fulfill({ status: 200, contentType: 'application/json', body });
    });
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User confirms deletion
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: A second GET /api/v1/clientes is triggered (TanStack Query invalidateQueries)
    await expect.poll(() => getListCallCount).toBeGreaterThanOrEqual(2);
  });

  test('should show the right panel in empty/default state after deletion', async ({ page }) => {
    // GIVEN: User confirms deletion
    const cliente = createClienteDto({ nombre: 'Right Panel Empty SA', nit: '800900100-9', telefono: '3091112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User confirms deletion
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: The detail panel no longer shows the deleted client's data
    await page.waitForURL('**/clientes', { timeout: 5000 });
    await expect(page.getByText(cliente.nombre)).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Clicking "Cancelar" closes dialog; no API call; client data unchanged
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — "Cancelar" closes dialog without deleting client', () => {
  test('should close the confirmation dialog when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: User has opened the confirmation dialog
    const cliente = createClienteDto({ nombre: 'Cancel Dialog SA', nit: '801000200-1', telefono: '3101112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();
    await expect(page.getByText('¿Eliminar este cliente?')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cancelar-eliminacion-button').click();

    // THEN: The confirmation dialog is closed
    await expect(page.getByText('¿Eliminar este cliente?')).not.toBeVisible();
  });

  test('should NOT call DELETE /api/v1/clientes/{id} when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: User has opened the confirmation dialog
    const cliente = createClienteDto({ nombre: 'No Delete Cancel SA', nit: '801100300-2', telefono: '3111112222', ciudad: 'Bogotá' });
    let deleteCalled = false;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('cancelar-eliminacion-button').click();

    // THEN: No DELETE request was made
    await expect.poll(() => deleteCalled).toBe(false);
  });

  test('should keep the client record visible in detail after clicking "Cancelar"', async ({ page }) => {
    // GIVEN: User opens dialog and then cancels
    const cliente = createClienteDto({ nombre: 'Still Visible SA', nit: '801200400-3', telefono: '3121112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User cancels the dialog
    await page.getByTestId('cancelar-eliminacion-button').click();

    // THEN: The client name is still displayed in the detail panel
    await expect(page.getByText(cliente.nombre)).toBeVisible();
  });

  test('should remain on the same URL after clicking "Cancelar"', async ({ page }) => {
    // GIVEN: User opens dialog and then cancels
    const cliente = createClienteDto({ nombre: 'URL Unchanged SA', nit: '801300500-4', telefono: '3131112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User cancels the dialog
    await page.getByTestId('cancelar-eliminacion-button').click();

    // THEN: The URL still contains the client ID
    expect(page.url()).toContain(cliente.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Deleting client with contacts shows specialized toast message
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Deleting a client with contacts shows contacts-aware toast', () => {
  test('should show "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." when client has contacts', async ({ page }) => {
    // GIVEN: A client with associated contacts is loaded in the detail panel
    const cliente = createClienteDto({ nombre: 'Cliente Con Contactos SA', nit: '801400600-5', telefono: '3141112222', ciudad: 'Bogotá' });
    const mockContacts = [
      { id: 'contact-uuid-1', nombre: 'Contacto Uno', clienteId: cliente.id },
      { id: 'contact-uuid-2', nombre: 'Contacto Dos', clienteId: cliente.id },
    ];

    // Network-first: intercept BEFORE navigation
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });
    // Mock contacts endpoint so TanStack Query cache knows this client has contacts
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockContacts) })
    );

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User confirms deletion of a client that has contacts
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: The contacts-aware toast message is shown
    await expect(page.getByText('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')).toBeVisible();
  });

  test('should NOT show the contacts-aware toast when client has no contacts', async ({ page }) => {
    // GIVEN: A client WITHOUT contacts is loaded in the detail panel
    const cliente = createClienteDto({ nombre: 'Cliente Sin Contactos SA', nit: '801500700-6', telefono: '3151112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });
    // Empty contacts list
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User confirms deletion
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: The generic success toast is shown (not the contacts-aware one)
    await expect(page.getByText('Cliente eliminado correctamente')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — In-flight DELETE: "Confirmar" disabled and shows "Eliminando..."
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — "Confirmar" button is disabled and shows "Eliminando..." while DELETE is in-flight', () => {
  test('should disable the "Confirmar" button while the DELETE request is in-flight', async ({ page }) => {
    // GIVEN: The DELETE request is held pending
    const cliente = createClienteDto({ nombre: 'Loading Delete SA', nit: '801600800-7', telefono: '3161112222', ciudad: 'Bogotá' });
    let releaseMutation!: () => void;
    const mutationHeld = new Promise<void>((resolve) => { releaseMutation = resolve; });

    // Network-first: intercept BEFORE navigation
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, async (route) => {
      if (route.request().method() === 'DELETE') {
        await mutationHeld;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User clicks "Confirmar" (mutation is in-flight)
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: "Confirmar" button is disabled during in-flight request
    await expect(page.getByTestId('confirmar-eliminacion-button')).toBeDisabled();

    // Cleanup
    releaseMutation();
  });

  test('should show "Eliminando..." on the "Confirmar" button while DELETE is in-flight', async ({ page }) => {
    // GIVEN: DELETE request is held pending
    const cliente = createClienteDto({ nombre: 'Eliminando Test SA', nit: '801700900-8', telefono: '3171112222', ciudad: 'Bogotá' });
    let releaseMutation!: () => void;
    const mutationHeld = new Promise<void>((resolve) => { releaseMutation = resolve; });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, async (route) => {
      if (route.request().method() === 'DELETE') {
        await mutationHeld;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: Mutation is in-flight
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: "Confirmar" button shows "Eliminando..." text
    await expect(page.getByTestId('confirmar-eliminacion-button')).toContainText('Eliminando...');

    // Cleanup
    releaseMutation();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Backend error shows error toast without technical details (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Backend error shows user-friendly error toast without technical details', () => {
  test('should display error toast "No se pudo eliminar. Intenta de nuevo." when backend returns 500', async ({ page }) => {
    // GIVEN: Backend returns 500 on DELETE
    const cliente = createClienteDto({ nombre: '500 Delete SA', nit: '801800100-9', telefono: '3181112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error', detail: 'Database error.' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User confirms deletion and backend errors
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: Error toast with Spanish message is shown
    await expect(page.getByText('No se pudo eliminar. Intenta de nuevo.')).toBeVisible();
  });

  test('should NOT display a stack trace or technical error message when deletion fails', async ({ page }) => {
    // GIVEN: Backend returns 500 on DELETE
    const cliente = createClienteDto({ nombre: 'Stack Trace Delete SA', nit: '801900200-1', telefono: '3191112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error', detail: 'Exception at SiesaAgents.API' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    // Track uncaught JS errors (stack traces exposed to the browser)
    const uncaughtErrors: string[] = [];
    page.on('pageerror', (err) => uncaughtErrors.push(err.message));

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();
    await page.getByTestId('confirmar-eliminacion-button').click();
    await expect(page.getByText('No se pudo eliminar. Intenta de nuevo.')).toBeVisible();

    // THEN: No uncaught JS errors were thrown
    expect(uncaughtErrors).toHaveLength(0);
  });

  test('should NOT navigate away from the client detail when deletion fails', async ({ page }) => {
    // GIVEN: Backend returns 500 on DELETE
    const cliente = createClienteDto({ nombre: 'No Nav On Error SA', nit: '802000300-2', telefono: '3201112222', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ status: 500, title: 'Internal Server Error' }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: Deletion fails
    await page.getByTestId('confirmar-eliminacion-button').click();
    await expect(page.getByText('No se pudo eliminar. Intenta de nuevo.')).toBeVisible();

    // THEN: The URL still contains the client ID (no navigation)
    expect(page.url()).toContain(cliente.id);
  });
});
