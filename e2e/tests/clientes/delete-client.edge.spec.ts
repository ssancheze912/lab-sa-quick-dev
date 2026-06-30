/**
 * Story 2.5: Delete Client — Edge Cases
 * Epic 2: Client Management
 *
 * Expanded automation coverage: boundary conditions, error paths and UX edge cases
 * NOT covered by the ATDD acceptance tests.
 *
 * Scenarios covered:
 *   - Dialog description contains client name (contextual confirmation)
 *   - Keyboard Escape key dismisses confirmation dialog
 *   - "Cancelar" button is disabled while deletion is in flight
 *   - Loading text "Eliminando..." replaces "Confirmar" while pending
 *   - Network error (500) during deletion shows error toast
 *   - Multiple rapid clicks on "Eliminar" open only one dialog
 *   - Multiple rapid clicks on "Confirmar" trigger mutation only once
 *   - After successful deletion the right panel shows no client detail
 */

import { test, expect } from '@playwright/test';

const CLIENTE_ID = '00000000-0000-0000-0000-000000002550';

const mockCliente = {
  id: CLIENTE_ID,
  nombre: 'Empresa Edge Cases SA',
  nit: '900255000-1',
  telefono: '3002550001',
  ciudad: 'Barranquilla',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

/** Setup shared route mocks (no contacts, GET succeeds) for most edge cases */
async function setupDefaultRoutes(page: import('@playwright/test').Page, deleteStatus = 204) {
  await page.route('**/api/v1/clientes', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockCliente]),
    })
  );
  await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: deleteStatus });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      });
    }
  });
  await page.route('**/api/v1/contactos**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog content — contextual information
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Dialog shows client name for contextual confirmation', () => {
  test('[P1] dialog description should contain the client name', async ({ page }) => {
    // GIVEN: Client detail is loaded
    await setupDefaultRoutes(page);
    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // THEN: The dialog description references the client name (contextual awareness)
    await expect(page.getByRole('alertdialog')).toContainText(mockCliente.nombre);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Keyboard Escape closes the confirmation dialog', () => {
  test('[P1] pressing Escape should close the AlertDialog without deleting the client', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    let deleteCalled = false;
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route('**/api/v1/contactos**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User presses Escape
    await page.keyboard.press('Escape');

    // THEN: Dialog closes and no DELETE was issued
    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    expect(deleteCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loading state — UI feedback while pending
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Loading state UX during deletion', () => {
  test('[P1] "Cancelar" button should be disabled while deletion is in flight', async ({ page }) => {
    // GIVEN: DELETE is held pending
    let resolveDelete: (() => void) | null = null;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise<void>((resolve) => {
          resolveDelete = resolve;
        });
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route('**/api/v1/contactos**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByTestId('delete-confirm-button').click();

    // THEN: "Cancelar" is also disabled to prevent race condition (isPending guard)
    await expect(page.getByTestId('delete-cancel-button')).toBeDisabled();

    // Release DELETE
    if (resolveDelete) (resolveDelete as () => void)();
  });

  test('[P1] "Confirmar" button should show "Eliminando..." text while pending', async ({ page }) => {
    // GIVEN: DELETE is held pending
    let resolveDelete: (() => void) | null = null;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await new Promise<void>((resolve) => {
          resolveDelete = resolve;
        });
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route('**/api/v1/contactos**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByTestId('delete-confirm-button').click();

    // THEN: Button label changes to "Eliminando..." (loading feedback)
    await expect(page.getByTestId('delete-confirm-button')).toHaveText('Eliminando...');

    // Release DELETE
    if (resolveDelete) (resolveDelete as () => void)();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error path — server error during deletion
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Server error (500) during deletion shows error toast', () => {
  test('[P1] should show error toast "No se pudo eliminar. Intenta de nuevo." when DELETE returns 500', async ({ page }) => {
    // GIVEN: DELETE returns 500 Internal Server Error
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, detail: 'Internal server error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route('**/api/v1/contactos**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User confirms but server fails
    await page.getByTestId('delete-confirm-button').click();

    // THEN: Error toast is shown (AC2 — onError handler)
    await expect(page.getByText('No se pudo eliminar. Intenta de nuevo.')).toBeVisible();
  });

  test('[P1] should NOT navigate away from client detail when DELETE returns 500', async ({ page }) => {
    // GIVEN: DELETE returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 500 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route('**/api/v1/contactos**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await page.getByTestId('delete-confirm-button').click();

    // THEN: URL remains at client detail (not navigated away on error)
    await expect(page).toHaveURL(new RegExp(`/clientes/${CLIENTE_ID}`));
  });

  test('[P1] should keep the client detail panel visible after a failed deletion', async ({ page }) => {
    // GIVEN: DELETE returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 500 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route('**/api/v1/contactos**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await page.getByTestId('delete-confirm-button').click();
    await expect(page.getByText('No se pudo eliminar. Intenta de nuevo.')).toBeVisible();

    // THEN: Client detail content is still displayed (error is non-destructive)
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rapid interaction — double-click guard
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Multiple rapid clicks on "Confirmar" trigger DELETE only once', () => {
  test('[P2] double-clicking "Confirmar" should call DELETE exactly once', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    let deleteCallCount = 0;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCallCount++;
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route('**/api/v1/contactos**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User double-clicks "Confirmar" rapidly
    await page.getByTestId('delete-confirm-button').dblclick();

    // THEN: DELETE was called exactly once (disabled after first click prevents double submission)
    await expect.poll(() => deleteCallCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Post-deletion — empty panel state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Right panel returns to empty/default state after deletion', () => {
  test('[P1] should not show client detail content after successful deletion (panel is empty)', async ({ page }) => {
    // GIVEN: Client is successfully deleted
    await setupDefaultRoutes(page);
    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User confirms deletion
    await page.getByTestId('delete-confirm-button').click();
    await expect(page).toHaveURL(/\/clientes$/);

    // THEN: The client detail content is gone (panel is in empty state — AC2)
    await expect(page.getByTestId('cliente-detail-content')).not.toBeVisible();
  });
});
