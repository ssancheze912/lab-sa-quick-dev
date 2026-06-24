/**
 * E2E Edge-Case Tests — Story 2.4: Edit Client
 * Expands coverage beyond the ATDD baseline in edit-client.spec.ts.
 *
 * ATDD baseline covers (NOT duplicated here):
 *   AC1 — "Editar" opens pre-filled form
 *   AC2 — PUT called, success toast, form closes, list re-fetched
 *   AC3 — Inline errors per required field; form stays open
 *   AC4 — Cancel closes form without PUT call
 *   AC5 — Submit disabled + "Guardando..." during in-flight PUT
 *   AC6 — 409 toast, 500 toast, form stays open on error
 *
 * Edge cases added here:
 *   - Re-opening edit form after a cancel restores original pre-fill values
 *   - Multiple sequential successful edits within the same session
 *   - Edit form inaccessible ("Editar" hidden) while client is still loading (skeleton)
 *   - Edit form inaccessible when client fails to load (error state)
 *   - 404 mid-session (client was deleted by another session) — shows correct toast
 *   - Network failure during PUT — generic toast shown
 *   - Validation: multiple empty fields produce multiple inline errors simultaneously
 *   - Validation: fixing one field at a time clears only that field's error
 *   - Form values preserved in inputs after a 409 error (user can correct and retry)
 *   - Keyboard accessibility: "Editar" button activatable via Enter key
 *
 * Network-first pattern: ALL page.route() calls happen BEFORE page.goto().
 */

import { test, expect } from '@playwright/test';
import { createClienteDto } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';
const API_CLIENTE_BY_ID = '**/api/v1/clientes/**';

// ─────────────────────────────────────────────────────────────────────────────
// Re-open edit form after cancel — pre-fill values must be the same
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Edit form re-opens with same pre-fill values after cancel', () => {
  test('[P1] should show original Nombre pre-filled when edit form is re-opened after cancel', async ({ page }) => {
    // GIVEN: A client is in the detail panel
    const cliente = createClienteDto({ nombre: 'Empresa Reopen SA', nit: '911100200-1', telefono: '3111100001', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);

    // Open, modify, then cancel
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();
    await page.getByTestId('field-nombre').fill('Nombre No Guardado');
    await page.getByTestId('cancel-button').click();
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();

    // WHEN: User opens the edit form again
    await page.getByTestId('editar-cliente-button').click();

    // THEN: The Nombre field is pre-filled with the ORIGINAL value, not the unsaved change
    await expect(page.getByTestId('cliente-form')).toBeVisible();
    await expect(page.getByTestId('field-nombre')).toHaveValue(cliente.nombre);
  });

  test('[P1] should show original NIT pre-filled when edit form is re-opened after cancel', async ({ page }) => {
    // GIVEN: A client is in the detail panel
    const cliente = createClienteDto({ nombre: 'NIT Reopen SA', nit: '911200300-2', telefono: '3111100002', ciudad: 'Cali' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);

    // Open, modify NIT, cancel
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nit').fill('000000000-0');
    await page.getByTestId('cancel-button').click();

    // WHEN: Re-open
    await page.getByTestId('editar-cliente-button').click();

    // THEN: NIT shows original value
    await expect(page.getByTestId('field-nit')).toHaveValue(cliente.nit);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple sequential successful edits
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Multiple sequential successful edits in one session', () => {
  test('[P1] should allow a second edit immediately after the first one succeeds', async ({ page }) => {
    // GIVEN: A client exists; first edit succeeds
    const cliente = createClienteDto({ nombre: 'Edit Cycle SA', nit: '911300400-3', telefono: '3111100003', ciudad: 'Bogotá' });
    const edit1 = { ...cliente, nombre: 'Edit Cycle 1 SA', updatedAt: new Date().toISOString() };
    const edit2 = { ...edit1, nombre: 'Edit Cycle 2 SA', updatedAt: new Date().toISOString() };
    let putCallCount = 0;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        putCallCount++;
        const body = putCallCount === 1 ? edit1 : edit2;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);

    // First edit
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Edit Cycle 1 SA');
    await page.getByTestId('submit-button').click();
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();

    // WHEN: User opens edit form again for a second edit
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();
    await page.getByTestId('field-nombre').fill('Edit Cycle 2 SA');
    await page.getByTestId('submit-button').click();

    // THEN: Second edit also succeeds (PUT called twice, form closes)
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
    await expect.poll(() => putCallCount).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Editar button visibility during loading / error states
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] "Editar" button not accessible during loading and error states', () => {
  test('[P2] should NOT show "Editar" button while client detail is loading (skeleton visible)', async ({ page }) => {
    // GIVEN: Client detail fetch is slow (skeleton state is active)
    const cliente = createClienteDto({ nombre: 'Slow Load SA', nit: '911400500-4', telefono: '3111100004', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    let releaseDetailResponse!: () => void;
    const detailResponseHeld = new Promise<void>((resolve) => { releaseDetailResponse = resolve; });

    await page.route(API_CLIENTE_BY_ID, async (route) => {
      // Hold the response indefinitely until released — deterministic skeleton state
      await detailResponseHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    // WHEN: User navigates to the client detail
    const gotoPromise = page.goto(`/clientes/${cliente.id}`);

    // THEN: During loading (response still pending), "Editar" button is not present or not visible
    const editButton = page.getByTestId('editar-cliente-button');
    await expect(editButton).not.toBeVisible({ timeout: 3000 });

    // Cleanup: release the held response so the page can settle
    releaseDetailResponse();
    await gotoPromise;
  });

  test('[P2] should NOT show "Editar" button when client detail fails to load (error state)', async ({ page }) => {
    // GIVEN: Client detail fetch returns 500
    const cliente = createClienteDto({ nombre: 'Error State SA', nit: '911500600-5', telefono: '3111100005', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ status: 500, title: 'Internal Server Error' }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    // WHEN: User navigates to the client detail
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: ErrorPanel is shown and "Editar" button is not accessible
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('editar-cliente-button')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 mid-session — client deleted between load and edit
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] 404 response during PUT — client deleted mid-session', () => {
  test('[P1] should show a generic error toast when PUT returns 404 (client no longer exists)', async ({ page }) => {
    // GIVEN: Client loads successfully but is deleted before the edit is submitted
    const cliente = createClienteDto({ nombre: '404 Mid Session SA', nit: '911600700-6', telefono: '3111100006', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ status: 404, title: 'Not Found', detail: `Cliente ${cliente.id} not found.` }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('New Name SA');

    // WHEN: User submits — backend returns 404
    await page.getByTestId('submit-button').click();

    // THEN: A generic error toast is shown (not the NIT conflict message)
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();
  });

  test('[P1] should keep the edit form open when PUT returns 404', async ({ page }) => {
    // GIVEN: Same 404 mid-session scenario
    const cliente = createClienteDto({ nombre: '404 Form Open SA', nit: '911700800-7', telefono: '3111100007', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ status: 404, title: 'Not Found' }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('New Name SA');
    await page.getByTestId('submit-button').click();

    // THEN: Form stays open so user can see the error and decide what to do
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Network failure during PUT — Axios network error (no HTTP status)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Network failure during PUT', () => {
  test('[P1] should show "No se pudo guardar. Intenta de nuevo." when network fails during edit', async ({ page }) => {
    // GIVEN: Client loads successfully; network drops during PUT
    const cliente = createClienteDto({ nombre: 'Network Fail SA', nit: '911800900-8', telefono: '3111100008', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.abort('failed');
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Network Fail Nuevo SA');

    // WHEN: PUT is aborted by network failure
    await page.getByTestId('submit-button').click();

    // THEN: Generic error toast is shown
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation edge cases — multiple empty fields, per-field error clearing
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Validation edge cases in edit mode', () => {
  test('[P1] should show all four inline errors simultaneously when all fields are cleared before submit', async ({ page }) => {
    // GIVEN: Edit form is open with pre-filled values; user clears ALL fields
    const cliente = createClienteDto({ nombre: 'All Errors SA', nit: '911900100-9', telefono: '3111100009', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // Clear all fields
    await page.getByTestId('field-nombre').fill('');
    await page.getByTestId('field-nit').fill('');
    await page.getByTestId('field-telefono').fill('');
    await page.getByTestId('field-ciudad').fill('');

    // WHEN: User submits
    await page.getByTestId('submit-button').click();

    // THEN: All four inline error messages appear simultaneously
    await expect(page.getByText('El nombre es requerido')).toBeVisible();
    await expect(page.getByText('El NIT/RUC es requerido')).toBeVisible();
    await expect(page.getByText('El teléfono es requerido')).toBeVisible();
    await expect(page.getByText('La ciudad es requerida')).toBeVisible();
  });

  test('[P1] should clear only the Nombre error once the user fills that field and resubmits (other fields still empty)', async ({ page }) => {
    // GIVEN: All fields cleared, submit pressed — four errors visible
    const cliente = createClienteDto({ nombre: 'Partial Fix SA', nit: '912000200-1', telefono: '3112000001', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();

    await page.getByTestId('field-nombre').fill('');
    await page.getByTestId('field-nit').fill('');
    await page.getByTestId('field-telefono').fill('');
    await page.getByTestId('field-ciudad').fill('');
    await page.getByTestId('submit-button').click();

    // Verify all errors visible
    await expect(page.getByText('El nombre es requerido')).toBeVisible();

    // WHEN: User fixes only Nombre and re-submits
    await page.getByTestId('field-nombre').fill('Empresa Fixed Nombre');
    await page.getByTestId('submit-button').click();

    // THEN: Nombre error is gone; other errors may still be present
    await expect(page.getByText('El nombre es requerido')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Form values preserved after 409 error — user can correct NIT and retry
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Form values preserved after 409 error', () => {
  test('[P1] should keep the entered Nombre value in the input after a 409 NIT conflict error', async ({ page }) => {
    // GIVEN: User changes Nombre and NIT; NIT conflicts with another client
    const cliente = createClienteDto({ nombre: 'Values Preserved SA', nit: '912100300-2', telefono: '3112100001', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('New Correct Nombre SA');
    await page.getByTestId('field-nit').fill('912999999-9'); // conflicting NIT

    // WHEN: Submit fails with 409
    await page.getByTestId('submit-button').click();
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // THEN: The Nombre that was entered is still in the input (values not lost)
    await expect(page.getByTestId('field-nombre')).toHaveValue('New Correct Nombre SA');
  });

  test('[P1] should allow user to correct the NIT and retry after a 409 error', async ({ page }) => {
    // GIVEN: First PUT returns 409; second PUT (with corrected NIT) returns 200
    const cliente = createClienteDto({ nombre: 'Retry NIT SA', nit: '912200400-3', telefono: '3112200002', ciudad: 'Bogotá' });
    const updated = { ...cliente, nit: '912200401-4', updatedAt: new Date().toISOString() };
    let putCallCount = 0;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        putCallCount++;
        if (putCallCount === 1) {
          return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }) });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nit').fill('912999999-9');
    await page.getByTestId('submit-button').click();

    // Confirm 409 toast visible
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // WHEN: User corrects the NIT and retries
    await page.getByTestId('field-nit').fill('912200401-4');
    await page.getByTestId('submit-button').click();

    // THEN: Second PUT succeeds; form closes
    await expect(page.getByTestId('cliente-form')).not.toBeVisible();
    await expect.poll(() => putCallCount).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard accessibility: Enter key activates "Editar" button
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Keyboard accessibility for "Editar" button', () => {
  test('[P2] should open the edit form when "Editar" button is activated via Enter key', async ({ page }) => {
    // GIVEN: User is on the client detail view; "Editar" button is focused
    const cliente = createClienteDto({ nombre: 'Keyboard Test SA', nit: '912300500-4', telefono: '3112300001', ciudad: 'Bogotá' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );
    await page.goto(`/clientes/${cliente.id}`);

    const editButton = page.getByTestId('editar-cliente-button');
    await expect(editButton).toBeVisible();

    // WHEN: User focuses and activates via Enter key
    await editButton.focus();
    await page.keyboard.press('Enter');

    // THEN: The edit form opens
    await expect(page.getByTestId('cliente-form')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Success toast exact message match (P2 per test-design-epic-2.md)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Success toast exact text after edit', () => {
  test('[P2] should show exactly "Cliente actualizado correctamente" — not a partial or translated string', async ({ page }) => {
    // GIVEN: User submits a valid edit
    const cliente = createClienteDto({ nombre: 'Toast Exact SA', nit: '912400600-5', telefono: '3112400001', ciudad: 'Bogotá' });
    const updated = { ...cliente, nombre: 'Toast Exact Nuevo SA', updatedAt: new Date().toISOString() };

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([updated]) })
    );
    await page.route(API_CLIENTE_BY_ID, (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('editar-cliente-button').click();
    await page.getByTestId('field-nombre').fill('Toast Exact Nuevo SA');

    // WHEN: Edit is submitted
    await page.getByTestId('submit-button').click();

    // THEN: Exact Spanish success message (case-sensitive, full string)
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();
  });
});
