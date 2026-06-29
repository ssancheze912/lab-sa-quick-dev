/**
 * E2E Tests — Delete Contact (Story 3.5)
 * ATDD RED phase — tests fail until implementation is complete.
 *
 * Covers Story 3.5 acceptance criteria via browser automation:
 *   AC #1 — [P0] "Eliminar" button visible; confirmation dialog appears with
 *            "¿Eliminar este contacto?", "Confirmar", "Cancelar"
 *   AC #2 — [P0] Confirming deletion removes contact, navigates to /contactos,
 *            toast "Contacto eliminado correctamente" shown
 *   AC #3 — [P1] "Cancelar" closes dialog, no DELETE triggered, contact still visible
 *   AC #4 — [P2] onSuccess invalidates both ['contactos'] and ['contactos', id] query keys
 *   AC #5 — [P2] Backend returns 404 → error toast shown, no stack trace exposed (NFR6)
 *
 * Strategy:
 *   - Network-first: route.fulfill intercepts BEFORE page.goto (prevents race conditions)
 *   - Uses data-testid selectors only — no CSS selectors
 *   - Given-When-Then format per test
 *   - Priority tags: [P0], [P1], [P2]
 *
 * Expected RED failures:
 *   - data-testid="contacto-detail-delete-dialog" does not exist yet
 *   - data-testid="contacto-detail-delete-confirm" does not exist yet
 *   - data-testid="contacto-detail-delete-cancel" does not exist yet
 *   - Toast text "Contacto eliminado correctamente" not emitted yet
 *   - Navigation to /contactos after deletion not implemented yet
 *   - useDeleteContacto module does not exist yet
 */

import { test, expect } from '@playwright/test';

const KNOWN_CONTACTO_ID = '00000000-0000-0000-0000-000000000042';

const KNOWN_CONTACTO = {
  id: KNOWN_CONTACTO_ID,
  nombre: 'Ana López',
  cargo: 'Vendedora',
  telefono: '3001234567',
  email: 'ana.lopez@example.com',
  clienteId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupDeleteRoutes(
  page: import('@playwright/test').Page,
  opts?: {
    contactoId?: string;
    deleteStatus?: number;
    deleteBody?: object | null;
    contactoData?: typeof KNOWN_CONTACTO;
  }
) {
  const contactoId = opts?.contactoId ?? KNOWN_CONTACTO_ID;
  const contactoData = opts?.contactoData ?? KNOWN_CONTACTO;
  const deleteStatus = opts?.deleteStatus ?? 204;

  // CRITICAL: Register all route intercepts BEFORE navigation (network-first)

  // GET /api/v1/contactos — list
  await page.route('**/api/v1/contactos', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contactoData]),
      });
    } else {
      route.continue();
    }
  });

  // GET /api/v1/contactos/:id and DELETE /api/v1/contactos/:id
  await page.route(`**/api/v1/contactos/${contactoId}`, (route) => {
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
            detail: 'Contacto no encontrado',
          }),
        });
      }
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactoData),
      });
    }
  });
}

// ---------------------------------------------------------------------------
// AC #1 — "Eliminar" button and confirmation dialog
// ---------------------------------------------------------------------------

test.describe('[AC#1] "Eliminar" button and confirmation dialog', () => {
  test('[P0] should show "Eliminar" button in the detail panel when a contact is loaded', async ({ page }) => {
    // GIVEN: Network routes wired before navigation
    await setupDeleteRoutes(page);

    // WHEN: Navigate to contact detail
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);

    // THEN: "Eliminar" button is visible in the detail panel
    await expect(page.getByTestId('contacto-delete-button')).toBeVisible();
  });

  test('[P0] should open confirmation dialog with "¿Eliminar este contacto?" when "Eliminar" is clicked', async ({ page }) => {
    // GIVEN: Contact loaded in detail panel
    await setupDeleteRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();

    // WHEN: User clicks "Eliminar"
    await page.getByTestId('contacto-delete-button').click();

    // THEN: Confirmation dialog appears with the correct Spanish title
    await expect(page.getByTestId('contacto-detail-delete-dialog')).toBeVisible();
    await expect(page.getByText('¿Eliminar este contacto?')).toBeVisible();
  });

  test('[P0] should show "Esta acción no se puede deshacer." in the dialog description', async ({ page }) => {
    // GIVEN: Contact loaded, "Eliminar" clicked
    await setupDeleteRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();

    // THEN: Irreversibility description is shown
    await expect(page.getByText('Esta acción no se puede deshacer.')).toBeVisible();
  });

  test('[P0] should show "Confirmar" and "Cancelar" buttons inside the confirmation dialog', async ({ page }) => {
    // GIVEN: Contact loaded, "Eliminar" clicked
    await setupDeleteRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();

    // THEN: Both action buttons are visible in the dialog
    await expect(page.getByTestId('contacto-detail-delete-confirm')).toBeVisible();
    await expect(page.getByTestId('contacto-detail-delete-cancel')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC #2 — Confirming deletion: navigates to /contactos, shows toast
// ---------------------------------------------------------------------------

test.describe('[AC#2] Confirming deletion completes the delete flow', () => {
  test('[P0] should call DELETE API with correct contact ID when "Confirmar" is clicked', async ({ page }) => {
    // GIVEN: Network-first intercepts, track if DELETE was called
    let deletedId: string | null = null;

    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([KNOWN_CONTACTO]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/contactos/${KNOWN_CONTACTO_ID}`, (route) => {
      if (route.request().method() === 'DELETE') {
        deletedId = KNOWN_CONTACTO_ID;
        route.fulfill({ status: 204, body: '' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CONTACTO),
        });
      }
    });

    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();
    await expect(page.getByTestId('contacto-detail-delete-confirm')).toBeVisible();

    // WHEN: User clicks "Confirmar"
    await page.getByTestId('contacto-detail-delete-confirm').click();

    // THEN: DELETE was called with the correct contact ID
    await expect(async () => {
      expect(deletedId).toBe(KNOWN_CONTACTO_ID);
    }).toPass({ timeout: 3000 });
  });

  test('[P0] should show toast "Contacto eliminado correctamente" after successful deletion', async ({ page }) => {
    // GIVEN: Network-first routes wired
    await setupDeleteRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();
    await expect(page.getByTestId('contacto-detail-delete-confirm')).toBeVisible();

    // WHEN: User clicks "Confirmar"
    await page.getByTestId('contacto-detail-delete-confirm').click();

    // THEN: Success toast is shown
    await expect(page.getByText('Contacto eliminado correctamente')).toBeVisible();
  });

  test('[P0] should navigate to /contactos after successful deletion', async ({ page }) => {
    // GIVEN: Network routes wired — after delete, list returns empty
    await page.route('**/api/v1/contactos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.route(`**/api/v1/contactos/${KNOWN_CONTACTO_ID}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204, body: '' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CONTACTO),
        });
      }
    });

    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();
    await expect(page.getByTestId('contacto-detail-delete-confirm')).toBeVisible();

    // WHEN: User clicks "Confirmar"
    await page.getByTestId('contacto-detail-delete-confirm').click();

    // THEN: Page navigates to /contactos (detail panel is no longer visible)
    await expect(page.getByTestId('contacto-detail-panel')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC #3 — "Cancelar" preserves contact, no DELETE triggered
// ---------------------------------------------------------------------------

test.describe('[AC#3] "Cancelar" closes dialog without deleting', () => {
  test('[P1] should close the confirmation dialog when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Contact loaded, dialog open
    await setupDeleteRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();
    await expect(page.getByTestId('contacto-detail-delete-dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('contacto-detail-delete-cancel').click();

    // THEN: Dialog is closed
    await expect(page.getByTestId('contacto-detail-delete-dialog')).not.toBeVisible();
  });

  test('[P1] should NOT trigger DELETE when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Network-first — track DELETE calls
    let deleteWasCalled = false;

    await page.route('**/api/v1/contactos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CONTACTO]),
      })
    );

    await page.route(`**/api/v1/contactos/${KNOWN_CONTACTO_ID}`, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteWasCalled = true;
        route.fulfill({ status: 204, body: '' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CONTACTO),
        });
      }
    });

    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();
    await expect(page.getByTestId('contacto-detail-delete-cancel')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('contacto-detail-delete-cancel').click();

    // THEN: DELETE was NOT called
    expect(deleteWasCalled).toBe(false);
  });

  test('[P1] should keep the contact in the detail panel after "Cancelar"', async ({ page }) => {
    // GIVEN: Contact loaded, "Cancelar" clicked in dialog
    await setupDeleteRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();
    await expect(page.getByTestId('contacto-detail-delete-cancel')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('contacto-detail-delete-cancel').click();

    // THEN: Contact detail panel is still visible (record unchanged)
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC #5 — Backend 404 → error toast, no stack trace (NFR6)
// ---------------------------------------------------------------------------

test.describe('[AC#5] Backend 404 on DELETE shows error toast without stack trace', () => {
  test('[P1] should show generic error toast when DELETE returns 404', async ({ page }) => {
    // GIVEN: Routes wired with 404 response for DELETE
    await setupDeleteRoutes(page, { deleteStatus: 404 });
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();
    await expect(page.getByTestId('contacto-detail-delete-confirm')).toBeVisible();

    // WHEN: User confirms — DELETE returns 404
    await page.getByTestId('contacto-detail-delete-confirm').click();

    // THEN: Generic error toast shown (Spanish, no technical details)
    await expect(page.getByText('Error al eliminar el contacto')).toBeVisible();
  });

  test('[P1] should NOT navigate away when DELETE returns 404', async ({ page }) => {
    // GIVEN: Routes wired with 404 response for DELETE
    await setupDeleteRoutes(page, { deleteStatus: 404 });
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();
    await expect(page.getByTestId('contacto-detail-delete-confirm')).toBeVisible();

    // WHEN: User confirms — DELETE returns 404
    await page.getByTestId('contacto-detail-delete-confirm').click();

    // THEN: Error toast shown, contact detail panel still visible (no navigation)
    await expect(page.getByText('Error al eliminar el contacto')).toBeVisible();
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
  });

  test('[P2] should NOT expose raw error details in the UI when DELETE returns 404', async ({ page }) => {
    // GIVEN: Routes wired with 404 response including detail text
    await setupDeleteRoutes(page, {
      deleteStatus: 404,
      deleteBody: {
        status: 404,
        title: 'Not Found',
        detail: 'Contacto no encontrado',
        stackTrace: 'System.NullReferenceException at ...',
      },
    });
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-delete-button').click();
    await expect(page.getByTestId('contacto-detail-delete-confirm')).toBeVisible();

    // WHEN: User confirms — DELETE returns 404 with internal details
    await page.getByTestId('contacto-detail-delete-confirm').click();

    await expect(page.getByText('Error al eliminar el contacto')).toBeVisible();

    // THEN: No stack trace or internal exception details shown (NFR6)
    await expect(page.getByText(/stackTrace/i)).not.toBeVisible();
    await expect(page.getByText(/innerException/i)).not.toBeVisible();
    await expect(page.getByText(/Contacto no encontrado/i)).not.toBeVisible();
  });
});
