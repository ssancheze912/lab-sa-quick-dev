/**
 * E2E Edge-Case Tests — Delete Client (Story 2.5)
 * Automation Expansion — BMad-Integrated mode
 *
 * Covers edge cases NOT in ATDD E2E:
 *   - [P1] DELETE 500 error: dialog stays open, error toast shown ("Error al eliminar el cliente")
 *   - [P1] Navigation rail remains visible during delete dialog flow
 *   - [P1] "Confirmar" button is disabled during in-flight DELETE (double-click guard)
 *   - [P2] Dialog has modal role (blocking) — user cannot bypass by clicking outside
 *
 * NOTE: These tests require both frontend (http://localhost:5173) and backend
 *       (or a running dev server) to be active. All API calls are intercepted via
 *       page.route (network-first pattern) — no live backend needed.
 *
 * Strategy:
 *   - Network-first: route.fulfill intercepts BEFORE page.goto
 *   - Uses data-testid selectors only
 *   - Given-When-Then format per test
 *   - Priority tags: [P0], [P1], [P2]
 */

import { test, expect } from '@playwright/test';

const KNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000097';

const KNOWN_CLIENT = {
  id: KNOWN_CLIENT_ID,
  nombre: 'Empresa Delete Edge E2E',
  nit: '900777777-7',
  telefono: '3007777777',
  ciudad: 'Cali',
  createdAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Helper: wire standard routes for a single known client
// ---------------------------------------------------------------------------

async function setupClientRoutes(page: import('@playwright/test').Page) {
  // Network-first: intercept ALL routes before navigation

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
      route.fulfill({ status: 204, body: '' });
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
// Edge: DELETE 500 — dialog stays open, error toast shown
// ---------------------------------------------------------------------------

test.describe('[Edge] DELETE 500 error — dialog stays open', () => {
  test.fixme('[P1] should keep dialog open and show error toast when DELETE returns 500', async ({ page }) => {
    // FIXME: Depends on implementation gap: useDeleteCliente onError toast not implemented.
    // See ClienteDetailView.delete.edge.test.tsx fixme for full context.
    // TODO: Remove test.fixme() once onError toast is implemented in ClienteDetailView.
    // GIVEN: Network-first — GET returns client, DELETE returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT]),
      })
    );

    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            status: 500,
            title: 'Internal Server Error',
            detail: 'An unexpected error occurred.',
          }),
        });
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

    // Open delete dialog
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-dialog')).toBeVisible();

    // WHEN: User clicks "Confirmar" and DELETE fails with 500
    await page.getByTestId('cliente-detail-delete-confirm').click();

    // THEN: Error toast is shown with Spanish message (never expose raw error)
    await expect(page.getByText('Error al eliminar el cliente')).toBeVisible();

    // AND: Dialog remains open (not cleared to empty state)
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
    await expect(page.getByTestId('cliente-detail-delete-dialog')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edge: Navigation rail visible during delete flow
// ---------------------------------------------------------------------------

test.describe('[Edge] Navigation shell visible during delete dialog flow', () => {
  test('[P1] should keep navigation rail visible when delete dialog is open', async ({ page }) => {
    // GIVEN: Client loaded, delete dialog opened
    await setupClientRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: Delete dialog is opened
    await page.getByTestId('cliente-detail-delete-button').click();
    await expect(page.getByTestId('cliente-detail-delete-dialog')).toBeVisible();

    // THEN: Navigation rail remains visible (app shell not broken)
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edge: "Confirmar" disabled during in-flight DELETE (double-click guard)
// ---------------------------------------------------------------------------

test.describe('[Edge] "Confirmar" disabled while DELETE is in-flight', () => {
  test('[P1] should disable "Confirmar" button while DELETE request is pending', async ({ page }) => {
    // GIVEN: DELETE hangs (delayed response) — client loaded, dialog open
    let resolveDelete: (() => void) | null = null;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT]),
      })
    );

    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        // Hold the DELETE response until we resolve it
        await new Promise<void>((resolve) => {
          resolveDelete = resolve;
        });
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

    // WHEN: User clicks "Confirmar" (DELETE starts and is pending)
    await page.getByTestId('cliente-detail-delete-confirm').click();

    // THEN: "Confirmar" button becomes disabled while in-flight
    await expect(page.getByTestId('cliente-detail-delete-confirm')).toBeDisabled();

    // Cleanup: resolve the pending DELETE so the page does not hang
    if (resolveDelete) resolveDelete();
  });
});

// ---------------------------------------------------------------------------
// Edge: Dialog has modal role (blocking semantics)
// ---------------------------------------------------------------------------

test.describe('[Edge] Delete dialog is modal (blocking semantics)', () => {
  test('[P2] delete confirmation dialog should have role="dialog" and aria-modal="true"', async ({ page }) => {
    // GIVEN: Client loaded in detail panel
    await setupClientRoutes(page);
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // WHEN: User opens the delete confirmation dialog
    await page.getByTestId('cliente-detail-delete-button').click();

    // THEN: The dialog element has role="dialog"
    const dialog = page.getByTestId('cliente-detail-delete-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('role', 'dialog');

    // AND: aria-modal is "true" (indicates blocking modal)
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
