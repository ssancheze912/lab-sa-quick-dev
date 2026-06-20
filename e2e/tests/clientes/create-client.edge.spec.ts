// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases — Story 2.3: Create Client (E2E)
// Test Level: E2E (Playwright)
// Mode: BMad-Integrated — expands ATDD coverage with edge cases NOT in
//       create-client.spec.ts
//
// Coverage added here (not in ATDD):
//   - [P1] Generic error toast shown when POST returns 500 (not the 409 inline flow)
//   - [P1] Form state clears when dialog is reopened after cancel
//   - [P1] Error messages disappear after fixing the empty field and resubmitting
//   - [P2] POST body contains all 4 required fields with correct values
//   - [P2] Creating two clients with different NITs succeeds for both (no collision)
//   - [P2] Validation errors persist until user corrects the field
//   - [P2] Dialog title "Nuevo cliente" is announced for screen readers (heading level)
//   - [P3] Dialog can be reopened immediately after successful creation
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Generic server error (500) shows error toast, NOT inline NIT error
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] 500 server error shows generic toast, not NIT inline error', () => {
  test('[P1] should show generic error toast on 500 POST response', async ({ page }) => {
    // GIVEN: Intercept POST BEFORE navigation to return 500
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Internal Server Error',
            status: 500,
            detail: 'An unexpected error occurred.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User submits valid form but backend returns 500
    const data = buildCliente();
    await page.getByTestId('cliente-nombre-input').fill(data.nombre);
    await page.getByTestId('cliente-nit-input').fill(data.nit);
    await page.getByTestId('cliente-telefono-input').fill(data.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(data.ciudad);
    await page.getByTestId('guardar-btn').click();

    // THEN: Generic error toast appears (not the 409 inline error)
    await expect(page.getByText('No se pudo guardar. Intenta de nuevo.')).toBeVisible();
  });

  test('[P1] should NOT show "El NIT/RUC ya está registrado" on 500 response', async ({
    page,
  }) => {
    // GIVEN: 500 error intercepted before navigation
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, body: '{}' });
      } else {
        await route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();

    const data = buildCliente();
    await page.getByTestId('cliente-nombre-input').fill(data.nombre);
    await page.getByTestId('cliente-nit-input').fill(data.nit);
    await page.getByTestId('cliente-telefono-input').fill(data.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(data.ciudad);
    await page.getByTestId('guardar-btn').click();

    // THEN: NIT inline error NOT visible (that's only for 409)
    await expect(page.getByText('El NIT/RUC ya está registrado')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Form reset on dialog re-open
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Form resets when dialog is closed and reopened', () => {
  test('[P1] reopening dialog after Cancelar shows empty fields', async ({ page }) => {
    // GIVEN: User opens dialog, fills fields, then cancels
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    await page.getByTestId('cliente-nombre-input').fill('Empresa Temporal');
    await page.getByTestId('cliente-nit-input').fill('900777888-3');

    // WHEN: User cancels
    await page.getByTestId('cancelar-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden();

    // AND: Reopens the dialog
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // THEN: Fields are empty (form was reset)
    await expect(page.getByTestId('cliente-nombre-input')).toHaveValue('');
    await expect(page.getByTestId('cliente-nit-input')).toHaveValue('');
    await expect(page.getByTestId('cliente-telefono-input')).toHaveValue('');
  });

  test('[P1] reopening dialog after Esc shows empty fields', async ({ page }) => {
    // GIVEN: Dialog opened and some text typed
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await page.getByTestId('cliente-nombre-input').fill('Empresa Escape');

    // WHEN: User presses Escape to close
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden();

    // AND: Reopens dialog
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // THEN: Nombre field is empty
    await expect(page.getByTestId('cliente-nombre-input')).toHaveValue('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST request body validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] POST request body contains correct field values', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P2] POST body contains all 4 fields with values matching typed input', async ({
    page,
    request,
  }) => {
    // GIVEN: Capture POST request body before navigation
    const data = buildCliente({
      nombre: 'Validación Cuerpo POST',
      ciudad: 'Cali',
    });

    let capturedBody: Record<string, unknown> | null = null;
    await page.route('**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'POST') {
        try {
          capturedBody = route.request().postDataJSON() as Record<string, unknown>;
        } catch {
          capturedBody = null;
        }
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: User fills and submits form
    await page.getByTestId('cliente-nombre-input').fill(data.nombre);
    await page.getByTestId('cliente-nit-input').fill(data.nit);
    await page.getByTestId('cliente-telefono-input').fill(data.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(data.ciudad);
    await page.getByTestId('guardar-btn').click();

    // Wait for dialog to close (submission succeeded)
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden({ timeout: 5000 });

    // THEN: Captured POST body matches form input
    expect(capturedBody).not.toBeNull();
    expect(capturedBody?.nombre).toBe(data.nombre);
    expect(capturedBody?.nit).toBe(data.nit);
    expect(capturedBody?.telefono).toBe(data.telefono);
    expect(capturedBody?.ciudad).toBe(data.ciudad);

    // Cleanup
    const apiHelper = new ApiHelper(request);
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple sequential creates (no NIT collision)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Multiple sequential client creations', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P2] can create two consecutive clients with different NITs', async ({
    page,
    request,
  }) => {
    // GIVEN: Two unique client datasets
    const client1 = buildCliente();
    const client2 = buildCliente();

    await page.goto('/clientes');

    // Create first client
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();
    await page.getByTestId('cliente-nombre-input').fill(client1.nombre);
    await page.getByTestId('cliente-nit-input').fill(client1.nit);
    await page.getByTestId('cliente-telefono-input').fill(client1.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(client1.ciudad);
    await page.getByTestId('guardar-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden({ timeout: 5000 });

    // Create second client
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();
    await page.getByTestId('cliente-nombre-input').fill(client2.nombre);
    await page.getByTestId('cliente-nit-input').fill(client2.nit);
    await page.getByTestId('cliente-telefono-input').fill(client2.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(client2.ciudad);
    await page.getByTestId('guardar-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden({ timeout: 5000 });

    // THEN: Both clients appear in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: client1.nombre }),
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: client2.nombre }),
    ).toBeVisible();

    // Cleanup
    const apiHelper = new ApiHelper(request);
    const clientes = await apiHelper.getClientes();
    [client1, client2].forEach(({ nombre }) => {
      const found = clientes.find((c: { nombre: string; id: string }) => c.nombre === nombre);
      if (found) createdIds.push(found.id);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation errors persist / clear correctly
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Validation errors persist until field is corrected', () => {
  test('[P2] Nombre error disappears after filling the empty Nombre field', async ({ page }) => {
    // GIVEN: Dialog open, submit without filling Nombre
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // Attempt submit with empty Nombre
    await page.getByTestId('guardar-btn').click();
    await expect(page.getByTestId('cliente-nombre-error')).toBeVisible();

    // WHEN: User fills the Nombre field
    await page.getByTestId('cliente-nombre-input').fill('Empresa Correcta');

    // THEN: Nombre error should clear on re-validation (React Hook Form mode onChange/onBlur)
    // Trigger re-validation by clicking Guardar again with only NIT still missing
    await page.getByTestId('guardar-btn').click();

    // Nombre error should now be gone (Nombre is valid now)
    await expect(page.getByTestId('cliente-nombre-error')).not.toBeVisible();
  });

  test('[P2] All 4 inline errors are shown simultaneously on empty submit', async ({ page }) => {
    // GIVEN: Dialog open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: Submit all empty
    await page.getByTestId('guardar-btn').click();

    // THEN: All 4 field errors are visible simultaneously
    await expect(page.getByTestId('cliente-nombre-error')).toBeVisible();
    await expect(page.getByTestId('cliente-nit-error')).toBeVisible();
    await expect(page.getByTestId('cliente-telefono-error')).toBeVisible();
    await expect(page.getByTestId('cliente-ciudad-error')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dialog re-open after successful creation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P3] Dialog can be reopened after successful creation', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P3] dialog opens cleanly with empty fields after a successful creation', async ({
    page,
    request,
  }) => {
    // GIVEN: First client is created successfully
    const data = buildCliente();

    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await page.getByTestId('cliente-nombre-input').fill(data.nombre);
    await page.getByTestId('cliente-nit-input').fill(data.nit);
    await page.getByTestId('cliente-telefono-input').fill(data.telefono);
    await page.getByTestId('cliente-ciudad-input').fill(data.ciudad);
    await page.getByTestId('guardar-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeHidden({ timeout: 5000 });

    // WHEN: User opens dialog again immediately after
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // THEN: All fields are empty (form was reset on success)
    await expect(page.getByTestId('cliente-nombre-input')).toHaveValue('');
    await expect(page.getByTestId('cliente-nit-input')).toHaveValue('');
    await expect(page.getByTestId('cliente-telefono-input')).toHaveValue('');
    await expect(page.getByTestId('cliente-ciudad-input')).toHaveValue('');

    // Cleanup
    const apiHelper = new ApiHelper(request);
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dialog title heading level
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Dialog title heading semantics', () => {
  test('[P2] "Nuevo cliente" is an h2 heading inside the dialog', async ({ page }) => {
    // GIVEN: Dialog is open
    await page.goto('/clientes');
    await page.getByTestId('nuevo-cliente-btn').click();
    await expect(page.getByTestId('nuevo-cliente-dialog')).toBeVisible();

    // WHEN: Inspect heading inside dialog
    const heading = page.getByRole('heading', { name: 'Nuevo cliente' });

    // THEN: Heading is visible and is an h2 (WCAG structure)
    await expect(heading).toBeVisible();
    const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h2');
  });
});
