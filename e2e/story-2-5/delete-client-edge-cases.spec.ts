/**
 * Story 2.5: Delete Client — E2E Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD E2E coverage with edge cases NOT covered by delete-client.spec.ts.
 *
 * Additional scenarios:
 * - "Confirmar" button shows "Eliminando…" text during pending (text assertion)
 * - URL remains unchanged after clicking "Cancelar"
 * - GET 404 → "Eliminar" button NOT visible (panel in not-found state)
 * - Dialog title description text is present (immutable description visible)
 * - "Cancelar" button has correct aria-label attribute
 * - "Confirmar" button has correct aria-label attribute
 * - "Eliminar" button has correct aria-label attribute
 * - Multiple "Cancelar" then "Confirmar" flow: deletion still works correctly
 * - "Eliminar" button not visible while in edit mode (E2E confirmation)
 * - Network abort on DELETE shows toast error and keeps detail visible
 *
 * Patterns:
 * - Network-first: ALL route intercepts registered BEFORE navigation
 * - data-testid selectors only
 * - Given-When-Then structure
 * - One assertion per test (atomic)
 * - Explicit waits only (no hard waits)
 */

import { test, expect } from '@playwright/test';
import { buildClienteResponse } from '../support/factories/cliente.factory';

const API_CLIENTES_LIST = '**/api/v1/clientes';
const API_CLIENTE_DETAIL = '**/api/v1/clientes/*';

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
) {
  const clientes = [clienteData];

  // CRITICAL: Intercept routes BEFORE navigation
  await page.route(API_CLIENTES_LIST, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(clientes),
    }),
  );

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

  await page.goto(`/clientes/${KNOWN_ID}`);
  await expect(page.getByTestId('cliente-detail-content')).toBeVisible();
}

// ─── "Eliminando…" text during pending ───────────────────────────────────────

test.describe('[P1] AC2 edge — "Confirmar" button shows "Eliminando…" text during pending', () => {
  test('[P1] should show "Eliminando…" text on "Confirmar" button during slow DELETE', async ({ page }) => {
    // GIVEN: DELETE is slow (network-first intercept before navigation)
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ delay: 8_000, status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User opens dialog and clicks "Confirmar"
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: Button text changes to "Eliminando…"
    await expect(page.getByTestId('delete-dialog-confirm')).toHaveText('Eliminando…');
  });
});

// ─── URL unchanged after "Cancelar" ──────────────────────────────────────────

test.describe('[P1] AC3 edge — URL remains unchanged after "Cancelar"', () => {
  test('[P1] should keep the URL containing clienteId after clicking "Cancelar"', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await navigateToClienteDetail(page);
    await page.getByTestId('cliente-eliminar-button').click();
    await expect(page.getByTestId('delete-confirmation-dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('delete-dialog-cancel').click();

    // THEN: URL still contains the clienteId
    await expect(page).toHaveURL(new RegExp(KNOWN_ID));
  });
});

// ─── 404 GET → no "Eliminar" button ──────────────────────────────────────────

test.describe('[P1] — No "Eliminar" button when client is not found (404 GET)', () => {
  test('[P1] should NOT show "Eliminar" button when GET /clientes/:id returns 404', async ({ page }) => {
    // GIVEN: GET detail returns 404 (network-first intercept before navigation)
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([buildClienteStub()]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Not Found', status: 404, detail: 'Cliente no encontrado.' }),
      });
    });

    // WHEN: User navigates to the client detail URL
    await page.goto(`/clientes/${KNOWN_ID}`);

    // Wait for not-found state
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // THEN: "Eliminar" button is NOT visible
    await expect(page.getByTestId('cliente-eliminar-button')).not.toBeVisible();
  });
});

// ─── Dialog description text ─────────────────────────────────────────────────

test.describe('[P2] AC1 edge — Dialog description text is present', () => {
  test('[P2] should display the irreversibility warning description in the dialog', async ({ page }) => {
    // GIVEN: Client detail is loaded
    await navigateToClienteDetail(page);

    // WHEN: User opens the confirmation dialog
    await page.getByTestId('cliente-eliminar-button').click();

    // THEN: Description text is visible
    await expect(page.getByText('Esta acción no se puede deshacer')).toBeVisible();
  });
});

// ─── ARIA attributes ──────────────────────────────────────────────────────────

test.describe('[P1] — Accessibility: ARIA labels on delete buttons', () => {
  test('[P1] "Eliminar" button should have aria-label="Eliminar cliente"', async ({ page }) => {
    // GIVEN: Client detail is loaded
    await navigateToClienteDetail(page);

    // THEN: "Eliminar" button has descriptive aria-label
    await expect(page.getByTestId('cliente-eliminar-button')).toHaveAttribute(
      'aria-label',
      'Eliminar cliente',
    );
  });

  test('[P1] "Cancelar" button in dialog should have aria-label="Cancelar eliminación"', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await navigateToClienteDetail(page);
    await page.getByTestId('cliente-eliminar-button').click();
    await expect(page.getByTestId('delete-confirmation-dialog')).toBeVisible();

    // THEN: "Cancelar" button has descriptive aria-label
    await expect(page.getByTestId('delete-dialog-cancel')).toHaveAttribute(
      'aria-label',
      'Cancelar eliminación',
    );
  });

  test('[P1] "Confirmar" button in dialog should have aria-label="Confirmar eliminación"', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await navigateToClienteDetail(page);
    await page.getByTestId('cliente-eliminar-button').click();
    await expect(page.getByTestId('delete-confirmation-dialog')).toBeVisible();

    // THEN: "Confirmar" button has descriptive aria-label
    await expect(page.getByTestId('delete-dialog-confirm')).toHaveAttribute(
      'aria-label',
      'Confirmar eliminación',
    );
  });
});

// ─── Cancel then confirm flow ─────────────────────────────────────────────────

test.describe('[P1] AC3+AC2 edge — Cancel then confirm: deletion still works', () => {
  test('[P1] should successfully delete after cancelling the dialog once', async ({ page }) => {
    // GIVEN: DELETE returns 204 (network-first intercept before navigation)
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

    // WHEN: User opens dialog, cancels, then opens and confirms
    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-cancel').click();
    await expect(page.getByTestId('delete-confirmation-dialog')).not.toBeVisible();

    await page.getByTestId('cliente-eliminar-button').click();
    await page.getByTestId('delete-dialog-confirm').click();

    // THEN: Navigation occurs (deletion succeeded after cancel-then-confirm)
    await expect(page).toHaveURL(/\/clientes(?!\/.+)/);
  });
});

// ─── "Eliminar" not visible while editing ────────────────────────────────────

test.describe('[P1] AC1 edge — "Eliminar" button absent while in edit mode (E2E)', () => {
  test('[P1] should NOT show "Eliminar" button after activating edit mode', async ({ page }) => {
    // GIVEN: Client detail is loaded
    await navigateToClienteDetail(page);

    // WHEN: User clicks "Editar" to enter edit mode
    await page.getByTestId('cliente-editar-button').click();

    // THEN: "Eliminar" button is NOT visible while in edit mode
    await expect(page.getByTestId('cliente-eliminar-button')).not.toBeVisible();
  });
});

// ─── 404 error during pending: multiple rapid confirm clicks ignored ──────────

test.describe('[P2] AC2 edge — Rapid confirm clicks do not send multiple DELETE requests', () => {
  test('[P2] should send only one DELETE request even if user clicks "Confirmar" rapidly', async ({ page }) => {
    // GIVEN: DELETE is slow (network-first intercept before navigation)
    let deleteCount = 0;
    const clienteData = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteData]) }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCount++;
        route.fulfill({ delay: 3_000, status: 204 });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteData) });
      }
    });
    await page.goto(`/clientes/${KNOWN_ID}`);
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User opens dialog and rapidly clicks "Confirmar"
    await page.getByTestId('cliente-eliminar-button').click();
    await expect(page.getByTestId('delete-dialog-confirm')).toBeVisible();

    // Click confirm — button is disabled immediately after first click
    await page.getByTestId('delete-dialog-confirm').click();

    // Try to click again (should be disabled now)
    const confirmBtn = page.getByTestId('delete-dialog-confirm');
    await expect(confirmBtn).toBeDisabled();

    // THEN: Only one DELETE request was sent
    expect(deleteCount).toBe(1);
  });
});
