/**
 * Story 2.5: Delete Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * Tests define expected behavior and serve as the contract for the DEV team.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking "Eliminar" shows confirmation dialog with "¿Eliminar este cliente?",
 *          "Confirmar" and "Cancelar" options
 *   AC2 — Confirming deletion removes client from list, returns panel to empty state,
 *          shows toast "Cliente eliminado correctamente" (no contacts case)
 *   AC3 — Clicking "Cancelar" closes dialog without deleting client
 *   AC4 — Deleting client with contacts: client removed, contacts become unassigned,
 *          toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Clicking "Eliminar" shows confirmation dialog
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Eliminar button shows confirmation dialog', () => {
  const CLIENTE_ID = '00000000-0000-0000-0000-000000002501';

  const mockCliente = {
    id: CLIENTE_ID,
    nombre: 'Empresa Para Eliminar SA',
    nit: '900251000-1',
    telefono: '3002510001',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  test('should show "Eliminar" button when a client detail is displayed', async ({ page }) => {
    // GIVEN: User is viewing a client's detail
    // Network-first: intercept before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);

    // THEN: "Eliminar" button is visible in the detail panel
    await expect(page.getByTestId('delete-cliente-button')).toBeVisible();
  });

  test('should open confirmation dialog when "Eliminar" button is clicked', async ({ page }) => {
    // GIVEN: User is on the client detail view
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);

    // WHEN: User clicks "Eliminar"
    await page.getByTestId('delete-cliente-button').click();

    // THEN: Confirmation dialog is visible (AlertDialog role=alertdialog)
    await expect(page.getByRole('alertdialog')).toBeVisible();
  });

  test('should show "¿Eliminar este cliente?" title in the confirmation dialog', async ({ page }) => {
    // GIVEN: User clicks "Eliminar"
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // THEN: Dialog title is "¿Eliminar este cliente?" (AC1)
    await expect(page.getByRole('alertdialog')).toContainText('¿Eliminar este cliente?');
  });

  test('should show "Confirmar" button inside the confirmation dialog', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // THEN: "Confirmar" button is present in dialog (AC1)
    await expect(page.getByTestId('delete-confirm-button')).toBeVisible();
  });

  test('should show "Cancelar" button inside the confirmation dialog', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // THEN: "Cancelar" button is present in dialog (AC1)
    await expect(page.getByTestId('delete-cancel-button')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Confirming deletion removes client, resets panel, shows toast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Confirming deletion removes client and shows success toast (no contacts)', () => {
  const CLIENTE_ID = '00000000-0000-0000-0000-000000002502';

  const mockCliente = {
    id: CLIENTE_ID,
    nombre: 'Empresa A Borrar SAS',
    nit: '900252000-1',
    telefono: '3002520001',
    ciudad: 'Medellín',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  test('should call DELETE /api/v1/clientes/{id} when "Confirmar" is clicked', async ({ page }) => {
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
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User clicks "Confirmar"
    await page.getByTestId('delete-confirm-button').click();

    // THEN: DELETE was called
    await expect.poll(() => deleteCalled).toBe(true);
  });

  test('should navigate to /clientes (empty panel) after successful deletion (AC2)', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User confirms deletion
    await page.getByTestId('delete-confirm-button').click();

    // THEN: URL navigates to /clientes (right panel returns to empty/default state — AC2)
    await expect(page).toHaveURL(/\/clientes$/);
  });

  test('should show success toast "Cliente eliminado correctamente" when no contacts (AC2)', async ({ page }) => {
    // GIVEN: Client with no associated contacts
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User confirms deletion (no contacts)
    await page.getByTestId('delete-confirm-button').click();

    // THEN: Toast "Cliente eliminado correctamente" is shown (AC2)
    await expect(page.getByText('Cliente eliminado correctamente')).toBeVisible();
  });

  test('should disable "Confirmar" button while deletion is in flight', async ({ page }) => {
    // GIVEN: DELETE is held in a pending state
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
        await new Promise<void>((resolve) => { resolveDelete = resolve; });
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCliente),
        });
      }
    });
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User clicks "Confirmar" (DELETE in flight)
    await page.getByTestId('delete-confirm-button').click();

    // THEN: "Confirmar" button is disabled while pending (AC3 loading state)
    await expect(page.getByTestId('delete-confirm-button')).toBeDisabled();

    // Release the DELETE
    if (resolveDelete) (resolveDelete as () => void)();
  });

  test('should remove deleted client from the list after successful deletion (FR27)', async ({ page }) => {
    // GIVEN: Client exists in the list
    const apiHelper = new ApiHelper(page.request);
    const clientData = buildCliente();
    const created = await apiHelper.createCliente(clientData);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('delete-cliente-button')).toBeVisible();

    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User confirms deletion
    await page.getByTestId('delete-confirm-button').click();

    // THEN: Deleted client no longer appears in the left list panel (FR27)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: clientData.nombre })
    ).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Clicking "Cancelar" closes dialog without deleting client
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Cancelar closes dialog without deleting client', () => {
  const CLIENTE_ID = '00000000-0000-0000-0000-000000002503';

  const mockCliente = {
    id: CLIENTE_ID,
    nombre: 'Empresa Que No Se Borra SA',
    nit: '900253000-1',
    telefono: '3002530001',
    ciudad: 'Cali',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  test('should close the confirmation dialog when "Cancelar" is clicked', async ({ page }) => {
    // GIVEN: Confirmation dialog is open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('delete-cancel-button').click();

    // THEN: Dialog is closed (AC3)
    await expect(page.getByRole('alertdialog')).not.toBeVisible();
  });

  test('should NOT call DELETE when "Cancelar" is clicked', async ({ page }) => {
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
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('delete-cancel-button').click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // THEN: No DELETE was called — client record is unchanged (AC3)
    expect(deleteCalled).toBe(false);
  });

  test('should keep client record in detail panel after "Cancelar"', async ({ page }) => {
    // GIVEN: Dialog is open for a client
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User cancels
    await page.getByTestId('delete-cancel-button').click();

    // THEN: Client detail panel still shows the client's name (AC3 — unchanged)
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(mockCliente.nombre);
  });

  test('should keep the URL at /clientes/{id} after "Cancelar"', async ({ page }) => {
    // GIVEN: Dialog is open
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );
    await page.route(`**/api/v1/contactos**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto(`/clientes/${CLIENTE_ID}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User cancels
    await page.getByTestId('delete-cancel-button').click();

    // THEN: URL remains at the client detail route (AC3)
    await expect(page).toHaveURL(new RegExp(`/clientes/${CLIENTE_ID}`));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Deleting client with associated contacts
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Deleting client with contacts: contacts become unassigned', () => {
  test('should show toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." when client has contacts', async ({ page }) => {
    // GIVEN: Client has associated contacts
    const apiHelper = new ApiHelper(page.request);
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);

    // Create a contact assigned to this client
    const contactoData = buildContacto({ clienteId: created.id });
    const createdContacto = await apiHelper.createContacto(contactoData);

    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByTestId('delete-cliente-button')).toBeVisible();

    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User confirms deletion (client has contacts)
    await page.getByTestId('delete-confirm-button').click();

    // THEN: Toast shows specific message for clients with contacts (AC4)
    await expect(
      page.getByText('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
    ).toBeVisible();

    // Cleanup contact (client already deleted)
    await apiHelper.deleteContacto(createdContacto.id).catch(() => null);
  });

  test('should leave contacts in system with clienteId = null after client deletion (FR25)', async ({ page }) => {
    // GIVEN: Client with an associated contact
    const apiHelper = new ApiHelper(page.request);
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);

    const contactoData = buildContacto({ clienteId: created.id });
    const createdContacto = await apiHelper.createContacto(contactoData);

    await page.goto(`/clientes/${created.id}`);
    await page.getByTestId('delete-cliente-button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // WHEN: User confirms deletion
    await page.getByTestId('delete-confirm-button').click();
    await expect(page).toHaveURL(/\/clientes$/);

    // THEN: Contact still exists (via API), but clienteId is null (FR25 — DB ON DELETE SET NULL)
    const contacto = await apiHelper.getContactos();
    const found = contacto.find((c: { id: string }) => c.id === createdContacto.id);
    expect(found).toBeTruthy();
    expect(found?.clienteId).toBeNull();

    // Cleanup
    await apiHelper.deleteContacto(createdContacto.id).catch(() => null);
  });
});
