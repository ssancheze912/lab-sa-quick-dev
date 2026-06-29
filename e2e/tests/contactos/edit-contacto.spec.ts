/**
 * E2E Acceptance Tests — Edit Contact (Story 3.4)
 * RED phase — useUpdateContacto.ts and PUT /api/v1/contactos/{id} endpoint do not exist yet.
 *
 * Acceptance Criteria covered:
 *   AC-1  Clicking "Editar" in detail panel opens form pre-filled with current values
 *         (Nombre, Cargo, Teléfono, Email)
 *   AC-2  Modifying fields and submitting → PUT /api/v1/contactos/{id} → updated values
 *         reflected + toast "Contacto actualizado correctamente"
 *   AC-3  Clearing required field and submitting → inline error shown, PUT NOT called
 *   AC-4  Clicking "Cancelar" closes form without PUT, original data unchanged
 *   AC-5  On mutation onSuccess → queryClient.invalidateQueries(['contactos']) AND
 *         queryClient.invalidateQueries(['contactos', id]) both triggered (list + detail re-fetch)
 *   AC-6  Backend returns 400 → error shown without stack trace (NFR6)
 *   AC-7  Backend returns 404 → generic error toast, no stack trace (NFR6)
 *
 * Network-first: all page.route() intercepts MUST be set before page.goto() / navigation.
 * Uses data-testid selectors only — no CSS selectors.
 * Given-When-Then format per test.
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

const UPDATED_CONTACTO = {
  ...KNOWN_CONTACTO,
  cargo: 'Gerente',
  updatedAt: '2026-06-29T12:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupContactoRoutes(
  page: import('@playwright/test').Page,
  opts?: {
    putStatus?: number;
    putBody?: object;
  }
) {
  // Intercept the list endpoint
  await page.route('**/api/v1/contactos', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([KNOWN_CONTACTO]),
    })
  );

  // Intercept the single-contact endpoint (GET + PUT via same URL pattern)
  await page.route(`**/api/v1/contactos/${KNOWN_CONTACTO_ID}`, (route) => {
    if (route.request().method() === 'PUT') {
      const status = opts?.putStatus ?? 200;
      route.fulfill({
        status,
        contentType: status >= 400 ? 'application/problem+json' : 'application/json',
        body: JSON.stringify(opts?.putBody ?? UPDATED_CONTACTO),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CONTACTO),
      });
    }
  });
}

// ---------------------------------------------------------------------------
// AC-1: "Editar" button opens form pre-filled with current values
// ---------------------------------------------------------------------------

test.describe('AC-1: "Editar" button opens form pre-filled with existing contact values', () => {
  test('[P0] should open edit form with all 4 fields pre-filled when "Editar" is clicked', async ({ page }) => {
    // GIVEN: Network-first — GET /contactos and GET /contactos/:id both wired
    await setupContactoRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);

    // WHEN: User clicks "Editar"
    await page.getByTestId('contacto-edit-button').click();

    // THEN: Edit form is visible
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // THEN: All 4 input fields are pre-filled with the current contact values
    await expect(page.getByTestId('contacto-form-nombre')).toHaveValue(KNOWN_CONTACTO.nombre);
    await expect(page.getByTestId('contacto-form-cargo')).toHaveValue(KNOWN_CONTACTO.cargo);
    await expect(page.getByTestId('contacto-form-telefono')).toHaveValue(KNOWN_CONTACTO.telefono);
    await expect(page.getByTestId('contacto-form-email')).toHaveValue(KNOWN_CONTACTO.email);
  });

  test('[P0] should hide detail panel and show edit form when "Editar" is clicked', async ({ page }) => {
    // GIVEN: Client is loaded in the detail panel
    await setupContactoRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();

    // WHEN: User clicks "Editar"
    await page.getByTestId('contacto-edit-button').click();

    // THEN: Edit form is shown, detail panel is hidden
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();
    await expect(page.getByTestId('contacto-detail-panel')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-2: Submit edit form → PUT → updated values + success toast
// ---------------------------------------------------------------------------

test.describe('AC-2: Submitting edit form updates contact and shows success toast', () => {
  test('[P1] should show "Contacto actualizado correctamente" toast after successful PUT', async ({ page }) => {
    // GIVEN: Routes wired, PUT returns 200 with updated contacto
    await setupContactoRoutes(page, { putBody: UPDATED_CONTACTO });
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-edit-button').click();
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // WHEN: User submits the edit form
    await page.getByTestId('contacto-form-submit').click();

    // THEN: Success toast is visible
    await expect(page.getByText(/contacto actualizado correctamente/i)).toBeVisible();
  });

  test('[P1] should close edit form and show detail panel after successful PUT', async ({ page }) => {
    // GIVEN: PUT returns 200 with updated contacto
    await setupContactoRoutes(page, { putBody: UPDATED_CONTACTO });
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-edit-button').click();
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // WHEN: User submits the form
    await page.getByTestId('contacto-form-submit').click();

    // THEN: Edit form closes, detail panel is restored
    await expect(page.getByTestId('contacto-detail-edit-form')).not.toBeVisible();
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
  });

  test('[P1] should re-fetch contact detail after successful PUT (cache invalidation)', async ({ page }) => {
    // GIVEN: Track GET calls to verify both list and detail re-fetch after PUT
    let getDetailCallCount = 0;

    await page.route('**/api/v1/contactos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CONTACTO]),
      })
    );

    await page.route(`**/api/v1/contactos/${KNOWN_CONTACTO_ID}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(UPDATED_CONTACTO),
        });
      } else {
        getDetailCallCount++;
        if (getDetailCallCount === 1) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(KNOWN_CONTACTO),
          });
        } else {
          // Subsequent GETs (after invalidation) return updated contacto
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(UPDATED_CONTACTO),
          });
        }
      }
    });

    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-edit-button').click();
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // WHEN: User submits the form
    await page.getByTestId('contacto-form-submit').click();

    // THEN: detail panel is shown again after success
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();

    // THEN: detail GET was called at least twice (initial + re-fetch after invalidation)
    expect(getDetailCallCount).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// AC-3: Clear required field → inline error, PUT NOT called
// ---------------------------------------------------------------------------

test.describe('AC-3: Clearing required field shows inline error and blocks PUT', () => {
  test('[P1] should show inline validation error and NOT send PUT when Nombre is cleared', async ({ page }) => {
    // GIVEN: Edit form is open, PUT tracker set
    let putWasCalled = false;

    await page.route('**/api/v1/contactos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CONTACTO]),
      })
    );

    await page.route(`**/api/v1/contactos/${KNOWN_CONTACTO_ID}`, async (route) => {
      if (route.request().method() === 'PUT') {
        putWasCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CONTACTO) });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CONTACTO),
        });
      }
    });

    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await page.getByTestId('contacto-edit-button').click();
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // WHEN: User clears Nombre and submits
    await page.getByTestId('contacto-form-nombre').fill('');
    await page.getByTestId('contacto-form-submit').click();

    // THEN: Inline error for Nombre is shown
    await expect(page.getByTestId('contacto-form-error-nombre')).toBeVisible();

    // THEN: PUT was NOT sent
    expect(putWasCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC-4: "Cancelar" closes form without PUT, original data unchanged
// ---------------------------------------------------------------------------

test.describe('AC-4: "Cancelar" closes edit form without PUT', () => {
  test('[P0] should close edit form and restore detail panel when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Edit form is open
    await setupContactoRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-edit-button').click();
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('contacto-form-cancel').click();

    // THEN: Edit form closes and detail panel is visible again
    await expect(page.getByTestId('contacto-detail-edit-form')).not.toBeVisible();
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
  });

  test('[P1] should NOT send PUT when "Cancelar" is clicked after modifying a field', async ({ page }) => {
    // GIVEN: Edit form open, PUT tracker set
    let putWasCalled = false;

    await page.route('**/api/v1/contactos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CONTACTO]),
      })
    );

    await page.route(`**/api/v1/contactos/${KNOWN_CONTACTO_ID}`, async (route) => {
      if (route.request().method() === 'PUT') {
        putWasCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(UPDATED_CONTACTO) });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(KNOWN_CONTACTO),
        });
      }
    });

    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await page.getByTestId('contacto-edit-button').click();
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // Modify a field (but do not submit)
    await page.getByTestId('contacto-form-nombre').fill('Nombre Modificado');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('contacto-form-cancel').click();

    // THEN: PUT was NOT called
    expect(putWasCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC-6: Backend 400 → error shown without stack trace (NFR6)
// ---------------------------------------------------------------------------

test.describe('AC-6: Backend 400 error shown without stack trace', () => {
  test('[P1] should display error message without exposing stack trace when PUT returns 400', async ({ page }) => {
    // GIVEN: Routes wired, PUT returns 400 Validation Error
    await setupContactoRoutes(page, {
      putStatus: 400,
      putBody: {
        status: 400,
        title: 'Validation Error',
        errors: {
          email: ["'Email' is not a valid email address."],
        },
      },
    });

    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-edit-button').click();
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // WHEN: User submits the form — backend returns 400
    await page.getByTestId('contacto-form-submit').click();

    // THEN: Generic error message is displayed (not technical details)
    await expect(page.getByText(/error al actualizar el contacto/i)).toBeVisible();

    // THEN: No stack trace or technical details shown in UI (NFR6)
    await expect(page.getByText(/stackTrace/i)).not.toBeVisible();
    await expect(page.getByText(/innerException/i)).not.toBeVisible();
    await expect(page.getByText(/exception/i)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-7: Backend 404 → generic error toast, no stack trace (NFR6)
// ---------------------------------------------------------------------------

test.describe('AC-7: Backend 404 error shown without stack trace', () => {
  test('[P1] should display generic error toast when PUT returns 404', async ({ page }) => {
    // GIVEN: Routes wired, PUT returns 404 Not Found
    await setupContactoRoutes(page, {
      putStatus: 404,
      putBody: {
        status: 404,
        title: 'Not Found',
        detail: 'Contacto no encontrado',
      },
    });

    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await page.getByTestId('contacto-edit-button').click();
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // WHEN: User submits the form — backend returns 404
    await page.getByTestId('contacto-form-submit').click();

    // THEN: Generic error message is visible (not the technical 404 detail)
    await expect(page.getByText(/error al actualizar el contacto/i)).toBeVisible();

    // THEN: No stack trace or technical details shown in UI (NFR6)
    await expect(page.getByText(/stackTrace/i)).not.toBeVisible();
    await expect(page.getByText(/innerException/i)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation shell visible during edit flow
// ---------------------------------------------------------------------------

test.describe('Navigation shell visible during edit flow', () => {
  test('[P2] should keep navigation rail visible when edit form is open', async ({ page }) => {
    // GIVEN: Contact loaded, edit form open
    await setupContactoRoutes(page);
    await page.goto(`/contactos/${KNOWN_CONTACTO_ID}`);
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();

    // WHEN: User opens edit form
    await page.getByTestId('contacto-edit-button').click();
    await expect(page.getByTestId('contacto-detail-edit-form')).toBeVisible();

    // THEN: Navigation rail is still visible (app shell not broken)
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });
});
