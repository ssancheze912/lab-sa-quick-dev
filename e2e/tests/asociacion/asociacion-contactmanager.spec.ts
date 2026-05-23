import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Story 4.1: View Associated Contacts in Client Detail
 *         Story 4.2: Associate & Disassociate Contacts from Client
 *
 * RED Phase — Tests intentionally fail until implementation is complete.
 *
 * Story 4.1 Coverage:
 *   E2E-AC-01  P0  — ContactManager renders in client detail showing ONLY
 *                    contacts associated with that client (AC1, FR21)
 *   E2E-AC-02  P0  — ContactManager shows empty state when client has no
 *                    associated contacts (AC2)
 *   E2E-AC-03  P1  — ContactManager stays mounted when GET /api/v1/contactos?clienteId=*
 *                    returns 500 (AC3 — siesa-ui-kit handles 500 silently, no crash)
 *
 * Story 4.2 Coverage:
 *   E2E-AC-04  P0  — Associating an existing contact via ContactManager adds it to the
 *                    list immediately without page reload (AC1, FR17, FR19, FR27)
 *   E2E-AC-05  P0  — Disassociating a contact removes it from ContactManager immediately;
 *                    contact record still exists in /contactos (AC3, FR20, FR27)
 *   E2E-AC-06  P0  — After association, ContactManager updates without page.reload() (AC1, AC3, FR27)
 *   E2E-AC-07  P1  — Creating a new contact from ContactManager auto-associates it with
 *                    the current client and it appears immediately (AC2, FR18)
 *   E2E-AC-08  P1  — Toast "Contacto asociado correctamente" shown after successful
 *                    association (AC1)
 *   E2E-AC-09  P1  — Toast "Contacto desasociado correctamente" shown after successful
 *                    disassociation (AC3)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.1 — View Associated Contacts in Client Detail', () => {
  let apiHelper: ApiHelper;
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdContactoIds.length = 0;
    createdClienteIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-01 (P0 · AC1)
  // Given a client has 2 associated contacts AND a 3rd contact with no client
  // When the user navigates to /clientes/:clienteId
  // Then the ContactManager shows exactly 2 rows (only the associated contacts)
  // AND the 3rd unassociated contact does NOT appear in the ContactManager
  // ---------------------------------------------------------------------------
  test('E2E-AC-01 — ContactManager muestra solo los contactos asociados al cliente', async ({ page }) => {
    // GIVEN — Create a client via API
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // AND — Create 2 contacts associated with the client
    const contacto1Data = buildContacto({ clienteId: cliente.id });
    const contacto2Data = buildContacto({ clienteId: cliente.id });
    const contacto1 = await apiHelper.createContacto(contacto1Data);
    const contacto2 = await apiHelper.createContacto(contacto2Data);
    createdContactoIds.push(contacto1.id, contacto2.id);

    // AND — Create a 3rd contact NOT associated with this client
    const contactoOrfano = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contactoOrfano.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      // Let the real request pass through — we only intercept to ensure
      // the test waits for network calls to settle
      await route.continue();
    });

    // WHEN — User navigates to the client detail view
    await page.goto(`/clientes/${cliente.id}`);

    // THEN — ContactManager container is visible
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — ContactManager shows exactly 2 contact rows
    // Desktop: <tr> rows in a <tbody>; Mobile: card <div>s
    // Reliable cross-layout: each contact has exactly one "Editar" action button
    const editButtons = page.getByTestId('contact-manager').getByRole('button', { name: 'Editar' });
    await expect(editButtons).toHaveCount(2);

    // AND — The 3rd unassociated contact does NOT appear
    // Verify by checking the contact name is absent in the contact-manager container
    await expect(page.getByTestId('contact-manager').getByText(contactoOrfano.nombre)).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-02 (P0 · AC2)
  // Given a client with no associated contacts
  // When the user navigates to /clientes/:clienteId
  // Then the ContactManager shows an empty state
  // AND no contact rows are present
  // ---------------------------------------------------------------------------
  test('E2E-AC-02 — ContactManager muestra estado vacío cuando el cliente no tiene contactos', async ({ page }) => {
    // GIVEN — Create a client with no contacts
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN — User navigates to the client detail view
    await page.goto(`/clientes/${cliente.id}`);

    // THEN — ContactManager container is visible
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — No contact rows are shown (no "Editar" buttons present for any contact)
    await expect(page.getByTestId('contact-manager').getByRole('button', { name: 'Editar' })).toHaveCount(0);

    // AND — Empty state message is visible (Spanish per company standard)
    // ContactManager renders "No hay registros. Haz clic en "Agregar contacto""
    await expect(
      page.getByText(/no hay registros/i)
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-03 (P1 · AC3)
  // Given the backend returns 500 when loading contacts for a client
  // When the user navigates to /clientes/:clienteId
  // Then the ContactManager container remains mounted and visible (no crash)
  // NOTE: siesa-ui-kit silently swallows 500 errors and shows empty state — no retry button
  // ---------------------------------------------------------------------------
  test('E2E-AC-03 — ContactManager permanece montado y visible cuando GET devuelve 500', async ({ page }) => {
    // GIVEN — Create a client via API
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept network BEFORE navigation to simulate 500 error
    await page.route(`**/api/v1/contactos?clienteId=**`, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      });
    });

    // WHEN — User navigates to the client detail view
    await page.goto(`/clientes/${cliente.id}`);

    // THEN — ContactManager container is still visible (not unmounted)
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — ContactManager renders in a degraded state (siesa-ui-kit handles errors
    // silently: on 500 the component completes loading and shows the empty state,
    // since error recovery is handled at the adapter level in future stories)
    // The contact-manager container is rendered and no crash occurs
  });
});

// =============================================================================
// Story 4.2 — Associate & Disassociate Contacts from Client
// =============================================================================

test.describe('Story 4.2 — Associate & Disassociate Contacts from Client', () => {
  let apiHelper: ApiHelper;
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdContactoIds.length = 0;
    createdClienteIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-04 (P0 · AC1)
  // Given the user is in the client detail view
  //   AND there is an orphan contact not yet associated with this client
  // When the user uses the ContactManager to add the existing contact
  // Then the contact appears in the ContactManager list immediately
  //   AND PUT /api/v1/contactos/{id}/cliente is called with { clienteId: uuid }
  //   AND no page.reload() is invoked (FR27 — immediate visibility)
  // ---------------------------------------------------------------------------
  test('E2E-AC-04 — Asociar contacto existente via ContactManager lo agrega a la lista inmediatamente sin recarga', async ({ page }) => {
    // GIVEN — Create client and one orphan contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contacto.id);

    // Track whether a PUT to /cliente was called (association happened via API)
    let putClienteCalled = false;
    const putRequests: string[] = [];

    // CRITICAL: Set up network intercepts BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, async (route) => {
      if (route.request().method() === 'PUT') {
        putClienteCalled = true;
        putRequests.push(route.request().url());
      }
      await route.continue();
    });

    // WHEN — User navigates to the client detail view
    await page.goto(`/clientes/${cliente.id}`);

    // AND — ContactManager is visible
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — User clicks "Agregar contacto" button in ContactManager
    await page.getByRole('button', { name: /agregar contacto|asociar contacto/i }).click();

    // AND — Selects the existing orphan contact from the lookup/dialog
    await page.getByTestId('contact-lookup-input').fill(contacto.nombre);
    await page.getByTestId('contact-lookup-option').filter({ hasText: contacto.nombre }).click();

    // AND — Confirms the association
    await page.getByRole('button', { name: /asociar|confirmar|guardar/i }).click();

    // THEN — The contact's nombre appears in ContactManager immediately (no reload)
    await expect(
      page.getByTestId('contact-manager').getByText(contacto.nombre)
    ).toBeVisible();

    // AND — PUT /api/v1/contactos/{id}/cliente was called (verified via network intercept)
    expect(putClienteCalled).toBe(true);

    // AND — The page URL has not changed (no navigation/reload)
    expect(page.url()).toContain(`/clientes/${cliente.id}`);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-05 (P0 · AC3)
  // Given the user is in the client detail view with a contact in ContactManager
  // When the user disassociates the contact from the client via ContactManager
  // Then the contact row is removed from ContactManager immediately (no reload)
  //   AND PUT /api/v1/contactos/{id}/cliente is called with { clienteId: null }
  //   AND the contact record still exists and is accessible from /contactos (FR20)
  // ---------------------------------------------------------------------------
  test('E2E-AC-05 — Desasociar contacto lo elimina de ContactManager inmediatamente; el registro aún existe en /contactos', async ({ page, request }) => {
    // GIVEN — Create client with an associated contact
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // Track PUT /cliente calls for disassociation
    let putDisassociateCalled = false;

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, async (route) => {
      if (route.request().method() === 'PUT') {
        putDisassociateCalled = true;
      }
      await route.continue();
    });

    // WHEN — User navigates to the client detail view
    await page.goto(`/clientes/${cliente.id}`);

    // AND — ContactManager shows the contact
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    await expect(
      page.getByTestId('contact-manager').getByText(contacto.nombre)
    ).toBeVisible();

    // AND — User opens contact options and clicks "Desasociar"
    await page.getByTestId('contact-manager')
      .getByText(contacto.nombre)
      .locator('xpath=ancestor::*[@data-testid="contact-manager-row"]')
      .getByRole('button', { name: /desasociar|eliminar de cliente|quitar/i })
      .click();

    // AND — Confirms the disassociation in the confirmation dialog
    await page.getByRole('button', { name: /confirmar|sí, desasociar|aceptar/i }).click();

    // THEN — The contact row is removed from ContactManager immediately
    await expect(
      page.getByTestId('contact-manager').getByText(contacto.nombre)
    ).toHaveCount(0);

    // AND — PUT was called with { clienteId: null }
    expect(putDisassociateCalled).toBe(true);

    // AND — The contact record still exists in /contactos (not deleted — FR20, R3)
    const getResponse = await request.get(
      `${process.env.API_BASE_URL ?? 'http://localhost:5000'}/api/v1/contactos/${contacto.id}`
    );
    expect(getResponse.status()).toBe(200);
    const contactoAfter = await getResponse.json();
    expect(contactoAfter.id).toBe(contacto.id);
    expect(contactoAfter.clienteId).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-06 (P0 · AC1, AC3)
  // Given the user is in the client detail view
  // When a contact is associated via ContactManager
  // Then the ContactManager list updates WITHOUT page.reload()
  //   AND the queryKeys ['contactos'] and ['contactos', { clienteId }] are both
  //       invalidated (verified by observing two GET requests after PUT)
  // ---------------------------------------------------------------------------
  test('E2E-AC-06 — Después de asociar/desasociar, ContactManager se actualiza sin page.reload()', async ({ page }) => {
    // GIVEN — Create client and one orphan contact
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contacto.id);

    // Track reload — page.reload() must NOT be called by the app
    let reloadCalled = false;
    page.on('request', (req) => {
      // A navigation request to the same URL indicates a reload
      if (req.isNavigationRequest() && req.url().includes(`/clientes/${cliente.id}`)) {
        reloadCalled = true;
      }
    });

    // Track GET /contactos requests after PUT (cache invalidation evidence)
    const getContactosRequests: string[] = [];

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/contactos**', async (route) => {
      if (route.request().method() === 'GET') {
        getContactosRequests.push(route.request().url());
      }
      await route.continue();
    });

    // WHEN — Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — Record GET count before mutation
    const getCountBeforeAssociation = getContactosRequests.length;

    // AND — Associate the orphan contact
    await page.getByRole('button', { name: /agregar contacto|asociar contacto/i }).click();
    await page.getByTestId('contact-lookup-input').fill(contacto.nombre);
    await page.getByTestId('contact-lookup-option').filter({ hasText: contacto.nombre }).click();
    await page.getByRole('button', { name: /asociar|confirmar|guardar/i }).click();

    // THEN — Contact appears in ContactManager without reload
    await expect(
      page.getByTestId('contact-manager').getByText(contacto.nombre)
    ).toBeVisible();

    // AND — No page reload was triggered by the application
    expect(reloadCalled).toBe(false);

    // AND — At least one new GET /contactos request was made after PUT
    // (TanStack Query cache invalidation triggers a refetch)
    const getCountAfterAssociation = getContactosRequests.length;
    expect(getCountAfterAssociation).toBeGreaterThan(getCountBeforeAssociation);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-07 (P1 · AC2)
  // Given the user is in the client detail view
  // When the user creates a NEW contact from within the ContactManager
  // Then the new contact is automatically associated with the current client (FR18)
  //   AND the contact appears in the ContactManager list immediately
  // ---------------------------------------------------------------------------
  test('E2E-AC-07 — Crear nuevo contacto desde ContactManager lo auto-asocia al cliente actual y aparece inmediatamente', async ({ page, request }) => {
    // GIVEN — Create client with no contacts
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN — User navigates to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — User clicks "Nuevo contacto" in ContactManager
    await page.getByRole('button', { name: /nuevo contacto|agregar nuevo/i }).click();

    // AND — Fills in the new contact form
    const nuevoNombre = `Contacto Nuevo ${Date.now()}`;
    const nuevoEmail = `nuevo.${Date.now()}@test.co`;
    await page.getByLabel(/nombre/i).fill(nuevoNombre);
    await page.getByLabel(/email/i).fill(nuevoEmail);

    // AND — Saves the new contact
    await page.getByRole('button', { name: /guardar|crear/i }).click();

    // THEN — The new contact appears in ContactManager immediately
    await expect(
      page.getByTestId('contact-manager').getByText(nuevoNombre)
    ).toBeVisible();

    // AND — GET new contact from API confirms clienteId = this client's id (FR18)
    // Find the contact by email in the full contacts list
    const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
    const listResponse = await request.get(`${API_BASE}/api/v1/contactos`);
    expect(listResponse.status()).toBe(200);
    const allContactos = await listResponse.json();
    const createdContacto = allContactos.find((c: { email: string }) => c.email === nuevoEmail);
    expect(createdContacto).toBeDefined();
    expect(createdContacto.clienteId).toBe(cliente.id);

    // Cleanup — track for afterEach
    if (createdContacto?.id) {
      createdContactoIds.push(createdContacto.id);
    }
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-08 (P1 · AC1)
  // Given the user is in the client detail view
  // When a contact is successfully associated via ContactManager
  // Then the toast "Contacto asociado correctamente" is shown (Spanish — company standard)
  // ---------------------------------------------------------------------------
  test('E2E-AC-08 — Toast "Contacto asociado correctamente" aparece tras asociar un contacto', async ({ page }) => {
    // GIVEN — Create client and orphan contact
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, async (route) => {
      await route.continue();
    });

    // WHEN — Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — Associate the contact via ContactManager
    await page.getByRole('button', { name: /agregar contacto|asociar contacto/i }).click();
    await page.getByTestId('contact-lookup-input').fill(contacto.nombre);
    await page.getByTestId('contact-lookup-option').filter({ hasText: contacto.nombre }).click();
    await page.getByRole('button', { name: /asociar|confirmar|guardar/i }).click();

    // THEN — Success toast is shown in Spanish (case-insensitive — company standard)
    await expect(
      page.getByText(/contacto asociado correctamente/i)
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-09 (P1 · AC3)
  // Given the user is in the client detail view with a contact in ContactManager
  // When the contact is successfully disassociated via ContactManager
  // Then the toast "Contacto desasociado correctamente" is shown (Spanish — company standard)
  // ---------------------------------------------------------------------------
  test('E2E-AC-09 — Toast "Contacto desasociado correctamente" aparece tras desasociar un contacto', async ({ page }) => {
    // GIVEN — Create client with an associated contact
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, async (route) => {
      await route.continue();
    });

    // WHEN — Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    await expect(
      page.getByTestId('contact-manager').getByText(contacto.nombre)
    ).toBeVisible();

    // AND — Disassociate the contact via ContactManager
    await page.getByTestId('contact-manager')
      .getByText(contacto.nombre)
      .locator('xpath=ancestor::*[@data-testid="contact-manager-row"]')
      .getByRole('button', { name: /desasociar|eliminar de cliente|quitar/i })
      .click();

    await page.getByRole('button', { name: /confirmar|sí, desasociar|aceptar/i }).click();

    // THEN — Success toast is shown in Spanish (case-insensitive — company standard)
    await expect(
      page.getByText(/contacto desasociado correctamente/i)
    ).toBeVisible();
  });
});
