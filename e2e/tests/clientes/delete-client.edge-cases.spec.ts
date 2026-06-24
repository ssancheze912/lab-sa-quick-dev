/**
 * E2E Edge-Case Tests — Story 2.5: Delete Client
 * BMad-Integrated Automate — Expansion beyond ATDD coverage in delete-client.spec.ts
 *
 * ATDD baseline covers (NOT duplicated here):
 *   AC1 — "Eliminar" button visible; dialog opens with title, "Confirmar", "Cancelar"
 *   AC2 — DELETE called, navigates to /clientes, success toast, list re-fetched
 *   AC3 — "Cancelar" closes dialog; no DELETE call; client still visible; URL unchanged
 *   AC4 — hasContacts toast vs. generic toast
 *   AC5 — "Confirmar" disabled + "Eliminando..." while in-flight
 *   AC6 — 500 shows error toast; no navigation; no stack trace
 *
 * Edge cases added here:
 *   - Dialog reopens correctly after a previous cancel (state reset)
 *   - "Eliminar" and "Editar" buttons are both accessible when data is loaded
 *   - "Eliminar" button is NOT present while client is still loading (skeleton state)
 *   - Keyboard accessibility: "Eliminar" button is activatable via Enter key
 *   - 404 on DELETE (client deleted by another session mid-flow) — error toast shown
 *   - Dialog subtitle "Esta acción no se puede deshacer." is rendered
 *   - "Confirmar" button re-enables after a failed delete (user can retry)
 *   - Multiple sequential cancels leave the dialog closeable each time
 *   - URL stays at /clientes/{id} after 404 delete error
 *   - Network failure (connection refused) during DELETE shows error toast
 *
 * Network-first pattern: ALL page.route() calls happen BEFORE page.goto().
 */

import { test, expect } from '@playwright/test';
import { createClienteDto } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';
const API_CLIENTE_BY_ID = '**/api/v1/clientes/**';

// ─────────────────────────────────────────────────────────────────────────────
// Dialog subtitle rendered
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Confirmation dialog subtitle', () => {
  test('[P1] should display "Esta acción no se puede deshacer." subtitle in confirmation dialog', async ({ page }) => {
    // GIVEN: User opens the delete confirmation dialog
    const cliente = createClienteDto({ nombre: 'Subtitle Edge SA', nit: '900100100-1', telefono: '3100001111', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);

    // WHEN: User clicks "Eliminar"
    await page.getByTestId('eliminar-cliente-button').click();

    // THEN: Dialog subtitle warns the action is irreversible
    await expect(page.getByText('Esta acción no se puede deshacer.')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dialog reopens after cancel — state must be reset
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Delete dialog reopens correctly after cancel', () => {
  test('[P1] should reopen the confirmation dialog after a previous cancel', async ({ page }) => {
    // GIVEN: User opened and then cancelled the delete dialog
    const cliente = createClienteDto({ nombre: 'Reopen Dialog SA', nit: '900200200-2', telefono: '3100002222', ciudad: 'Medellín' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);

    // First open + cancel
    await page.getByTestId('eliminar-cliente-button').click();
    await expect(page.getByTestId('confirmar-eliminacion-button')).toBeVisible();
    await page.getByTestId('cancelar-eliminacion-button').click();
    await expect(page.getByText('¿Eliminar este cliente?')).not.toBeVisible();

    // WHEN: User clicks "Eliminar" again
    await page.getByTestId('eliminar-cliente-button').click();

    // THEN: Dialog appears again with both action buttons
    await expect(page.getByTestId('confirmar-eliminacion-button')).toBeVisible();
    await expect(page.getByTestId('cancelar-eliminacion-button')).toBeVisible();
  });

  test('[P1] should close the dialog and reopen correctly across multiple cancel cycles', async ({ page }) => {
    // GIVEN: A client detail is shown
    const cliente = createClienteDto({ nombre: 'Multi Cancel SA', nit: '900300300-3', telefono: '3100003333', ciudad: 'Cali' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);

    // WHEN: User opens and cancels the dialog three times
    for (let i = 0; i < 3; i++) {
      await page.getByTestId('eliminar-cliente-button').click();
      await expect(page.getByTestId('confirmar-eliminacion-button')).toBeVisible();
      await page.getByTestId('cancelar-eliminacion-button').click();
      await expect(page.getByText('¿Eliminar este cliente?')).not.toBeVisible();
    }

    // THEN: Dialog is still closeable after multiple cycles (no stuck state)
    await expect(page.getByTestId('eliminar-cliente-button')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// "Eliminar" and "Editar" buttons co-exist in detail panel
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] "Eliminar" and "Editar" buttons coexist in detail panel', () => {
  test('[P1] should show both "Editar" and "Eliminar" action buttons when client data is loaded', async ({ page }) => {
    // GIVEN: Client data is loaded in the detail panel
    const cliente = createClienteDto({ nombre: 'Both Buttons SA', nit: '900400400-4', telefono: '3100004444', ciudad: 'Barranquilla' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Both action buttons are visible simultaneously
    await expect(page.getByTestId('eliminar-cliente-button')).toBeVisible();
    await expect(page.getByTestId('editar-cliente-button')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard accessibility: "Eliminar" button activatable via Enter
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Keyboard accessibility for delete flow', () => {
  test('[P1] should open confirmation dialog when "Eliminar" button is focused and Enter is pressed', async ({ page }) => {
    // GIVEN: Client detail is loaded and "Eliminar" button is focusable
    const cliente = createClienteDto({ nombre: 'Keyboard Delete SA', nit: '900500500-5', telefono: '3100005555', ciudad: 'Bucaramanga' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('eliminar-cliente-button')).toBeVisible();

    // WHEN: User focuses and presses Enter on the "Eliminar" button
    await page.getByTestId('eliminar-cliente-button').focus();
    await page.keyboard.press('Enter');

    // THEN: Confirmation dialog opens
    await expect(page.getByText('¿Eliminar este cliente?')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 on DELETE — client deleted by another session mid-flow
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] 404 on DELETE — stale client mid-flow', () => {
  test('[P1] should show error toast when DELETE returns 404 (client already deleted)', async ({ page }) => {
    // GIVEN: Client is loaded but backend returns 404 on DELETE (race condition)
    const cliente = createClienteDto({ nombre: '404 Mid Delete SA', nit: '900600600-6', telefono: '3100006666', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ status: 404, title: 'Not Found', detail: `Cliente ${cliente.id} not found.` }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User confirms deletion but backend returns 404
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: Error toast is shown (404 is treated as an unexpected error)
    await expect(page.getByText('No se pudo eliminar. Intenta de nuevo.')).toBeVisible();
  });

  test('[P1] should remain on the client detail URL when DELETE returns 404', async ({ page }) => {
    // GIVEN: Backend returns 404 on DELETE
    const cliente = createClienteDto({ nombre: '404 No Nav SA', nit: '900700700-7', telefono: '3100007777', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ status: 404, title: 'Not Found', detail: `Cliente ${cliente.id} not found.` }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();
    await page.getByTestId('confirmar-eliminacion-button').click();
    await expect(page.getByText('No se pudo eliminar. Intenta de nuevo.')).toBeVisible();

    // THEN: URL still contains the client ID — no navigation on error
    expect(page.url()).toContain(cliente.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// "Confirmar" re-enables after failed delete (user can retry)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] "Confirmar" button re-enables after a failed delete', () => {
  test('[P2] should re-enable the "Confirmar" button after a 500 error so the user can retry', async ({ page }) => {
    // GIVEN: First DELETE returns 500, second returns 204
    const cliente = createClienteDto({ nombre: 'Retry After Error SA', nit: '900800800-8', telefono: '3100008888', ciudad: 'Bogotá' });
    let deleteAttempt = 0;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteAttempt++;
        if (deleteAttempt === 1) {
          return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ status: 500, title: 'Internal Server Error' }) });
        }
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // First attempt — fails
    await page.getByTestId('confirmar-eliminacion-button').click();
    await expect(page.getByText('No se pudo eliminar. Intenta de nuevo.')).toBeVisible();

    // THEN: "Confirmar" is enabled again so the user can retry
    await expect(page.getByTestId('confirmar-eliminacion-button')).toBeEnabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Network failure (connection refused) during DELETE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Network failure during DELETE', () => {
  test('[P2] should show error toast when network connection fails during deletion', async ({ page }) => {
    // GIVEN: Network aborts on DELETE
    const cliente = createClienteDto({ nombre: 'Network Fail SA', nit: '900900900-9', telefono: '3100009999', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.abort('failed');
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('eliminar-cliente-button').click();

    // WHEN: User confirms deletion and the request fails at the network level
    await page.getByTestId('confirmar-eliminacion-button').click();

    // THEN: Error toast is shown
    await expect(page.getByText('No se pudo eliminar. Intenta de nuevo.')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// "Eliminar" button NOT visible during skeleton loading state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] "Eliminar" button is not present during loading skeleton', () => {
  test('[P1] should not show "Eliminar" button while client data is still loading', async ({ page }) => {
    // GIVEN: Backend response is delayed (client is loading)
    const cliente = createClienteDto({ nombre: 'Skeleton No Button SA', nit: '901000100-1', telefono: '3101001111', ciudad: 'Bogotá' });
    let respondFn!: () => void;
    const holdResponse = new Promise<void>((resolve) => { respondFn = resolve; });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, async (route) => {
      await holdResponse;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);

    // THEN: "Eliminar" button is not visible while data is still loading
    await expect(page.getByTestId('eliminar-cliente-button')).not.toBeVisible();

    // Cleanup: release the held response
    respondFn();
  });
});
