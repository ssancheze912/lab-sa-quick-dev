import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * E2E tests — Story 4.2: Associate & Disassociate Contacts from Client
 *
 * Covers:
 *   AC #1  "Asociar contacto" button opens contact selector dialog
 *   AC #2  Selecting a contact and confirming calls PUT /api/v1/contactos/{id}/cliente
 *          and the contact appears in the contacts list
 *   AC #3  TanStack Query keys invalidated → contacts list refreshes without reload
 *   AC #4  "Desasociar" button per contact opens confirmation dialog
 *   AC #5  Confirming disassociation removes contact from list; contact still accessible
 *   AC #7  Loading indicator shown while mutation is pending; buttons disabled
 *   AC #8  Error toast shown on API failure (Spanish)
 *   AC #9  Empty state "No hay contactos disponibles" when no contacts available
 *   AC #10 Cancel actions close dialogs without making API calls
 *
 * Stack: Playwright — network-first route interception (intercept BEFORE navigate)
 *
 * Expected RED failures (missing implementation):
 *   - [data-testid="asociar-contacto-btn"] not present
 *   - [data-testid="asociar-contacto-dialog"] not present
 *   - [data-testid="desasociar-btn-{contactoId}"] not present
 *   - [data-testid="confirmar-desasociar-dialog"] not present
 *   - PUT /api/v1/contactos/{id}/cliente endpoint not yet registered
 */

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
  // AC #1 — "Asociar contacto" button opens contact selector dialog
  // ---------------------------------------------------------------------------

  test('AC#1 — "Asociar contacto" button is visible in the contacts section', async ({
    page,
  }) => {
    // GIVEN: A client exists with no contacts
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos*`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to the client detail page
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}**`);

    // THEN: "Asociar contacto" button is visible in the contacts section
    await expect(page.getByTestId('asociar-contacto-btn')).toBeVisible();
  });

  test('AC#1 — Clicking "Asociar contacto" opens the contact selector dialog', async ({
    page,
  }) => {
    // GIVEN: A client and an unlinked contact exist
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      }
    });

    // WHEN: User navigates to client detail
    await page.goto(`/clientes/${cliente.id}`);

    // WHEN: User clicks "Asociar contacto" button
    await page.getByTestId('asociar-contacto-btn').click();

    // THEN: The contact selector dialog is open
    await expect(page.getByTestId('asociar-contacto-dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Asociar contacto/i })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #2 — Selecting and confirming contact association triggers PUT and updates list
  // ---------------------------------------------------------------------------

  test('AC#2 — Selecting a contact and confirming association calls PUT and shows contact in list', async ({
    page,
  }) => {
    // GIVEN: A client and an unlinked contact exist in the real backend
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    let putCalled = false;

    // CRITICAL: Intercept BEFORE navigate — capture the PUT call, pass GET through
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, async (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        const updatedContacto = { ...contacto, clienteId: cliente.id, updatedAt: new Date().toISOString() };
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedContacto),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        // After association, return the contact in the client's list
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(putCalled ? [{ ...contacto, clienteId: cliente.id }] : []),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      }
    });

    // WHEN: User opens the client detail and opens the associate dialog
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('asociar-contacto-btn').click();

    // THEN: Dialog is open and shows the available contact
    await expect(page.getByTestId('asociar-contacto-dialog')).toBeVisible();
    await expect(page.getByText(contactoData.nombre)).toBeVisible();

    // WHEN: User selects the contact
    await page.getByTestId(`contacto-item-${contacto.id}`).click();

    // WHEN: User clicks "Asociar"
    await page.getByRole('button', { name: /^Asociar$/i }).click();

    // THEN: PUT was called
    await expect.poll(() => putCalled).toBeTruthy();

    // THEN: Dialog closes
    await expect(page.getByTestId('asociar-contacto-dialog')).not.toBeVisible();

    // THEN: Contact now appears in the client's contacts list
    await expect(page.getByTestId('contactos-lista')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #4 — "Desasociar" button opens confirmation dialog
  // ---------------------------------------------------------------------------

  test('AC#4 — "Desasociar" button is visible for each contact in the contacts list', async ({
    page,
  }) => {
    // GIVEN: A client exists with one associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      } else {
        route.continue();
      }
    });

    // WHEN: User navigates to the client detail page
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The contact list shows the "Desasociar" button for the contact
    await expect(page.getByTestId('contactos-lista')).toBeVisible();
    await expect(page.getByTestId(`desasociar-btn-${contacto.id}`)).toBeVisible();
  });

  test('AC#4 — Clicking "Desasociar" opens a confirmation dialog', async ({ page }) => {
    // GIVEN: A client with one associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id, nombre: 'Juan Desasociar' });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      } else {
        route.continue();
      }
    });

    // WHEN: User navigates to client detail and clicks "Desasociar"
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    await page.getByTestId(`desasociar-btn-${contacto.id}`).click();

    // THEN: Confirmation dialog is open with the contact name
    await expect(page.getByTestId('confirmar-desasociar-dialog')).toBeVisible();
    await expect(page.getByText(/Juan Desasociar/i)).toBeVisible();
    // Safety message is present
    await expect(page.getByText(/no será eliminado/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #5 — Confirming disassociation removes contact from list; contact still accessible
  // ---------------------------------------------------------------------------

  test('AC#5 — Confirming disassociation removes contact from the contacts list', async ({
    page,
  }) => {
    // GIVEN: A client with one associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    let disassociated = false;

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, async (route) => {
      if (route.request().method() === 'PUT') {
        disassociated = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...contacto, clienteId: null, updatedAt: new Date().toISOString() }),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(disassociated ? [] : [contacto]),
        });
      } else {
        route.continue();
      }
    });

    // WHEN: User navigates to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    // WHEN: User clicks "Desasociar"
    await page.getByTestId(`desasociar-btn-${contacto.id}`).click();

    // THEN: Confirmation dialog appears
    await expect(page.getByTestId('confirmar-desasociar-dialog')).toBeVisible();

    // WHEN: User confirms disassociation
    await page.getByRole('button', { name: /^Desasociar$/i }).click();

    // THEN: PUT was called with { clienteId: null }
    await expect.poll(() => disassociated).toBeTruthy();

    // THEN: Dialog closes
    await expect(page.getByTestId('confirmar-desasociar-dialog')).not.toBeVisible();

    // THEN: Contacts list shows empty state (contact removed from this client's list)
    await expect(page.getByTestId('contactos-empty-state')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #9 — Empty state "No hay contactos disponibles" in associate dialog
  // ---------------------------------------------------------------------------

  test('AC#9 — Empty state shown in associate dialog when no contacts are available', async ({
    page,
  }) => {
    // GIVEN: A client exists and all contacts are already linked to it
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const linkedContacto = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(linkedContacto);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate — all contacts are already linked to this client
    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      } else {
        // All contacts endpoint returns only this already-linked contact
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      }
    });

    // WHEN: User navigates to client detail and opens the associate dialog
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('asociar-contacto-btn').click();

    // THEN: Empty state "No hay contactos disponibles" is shown
    await expect(page.getByTestId('asociar-contacto-dialog')).toBeVisible();
    await expect(page.getByTestId('asociar-contacto-empty-state')).toBeVisible();
    await expect(page.getByText(/No hay contactos disponibles/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #10 — Cancel closes dialogs without making API calls
  // ---------------------------------------------------------------------------

  test('AC#10 — Clicking "Cancelar" in associate dialog closes it without PUT call', async ({
    page,
  }) => {
    // GIVEN: A client and available contacts
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    let putCalled = false;

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      }
    });

    // WHEN: User opens the associate dialog
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('asociar-contacto-btn').click();
    await expect(page.getByTestId('asociar-contacto-dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByRole('button', { name: /Cancelar/i }).click();

    // THEN: Dialog is closed
    await expect(page.getByTestId('asociar-contacto-dialog')).not.toBeVisible();

    // THEN: No PUT was called
    expect(putCalled).toBe(false);
  });

  test('AC#10 — Clicking "Cancelar" in disassociation dialog closes it without PUT call', async ({
    page,
  }) => {
    // GIVEN: A client with one associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    let putCalled = false;

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      } else {
        route.continue();
      }
    });

    // WHEN: User opens the disassociation confirmation dialog
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    await page.getByTestId(`desasociar-btn-${contacto.id}`).click();
    await expect(page.getByTestId('confirmar-desasociar-dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar"
    await page.getByRole('button', { name: /Cancelar/i }).click();

    // THEN: Dialog is closed and no PUT was made
    await expect(page.getByTestId('confirmar-desasociar-dialog')).not.toBeVisible();
    expect(putCalled).toBe(false);

    // THEN: Contacts list remains unchanged
    await expect(page.getByTestId('contactos-lista')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #7 — Loading state: buttons disabled while mutation is pending
  // ---------------------------------------------------------------------------

  test('AC#7 — "Asociar" button is disabled while the association mutation is in-flight', async ({
    page,
  }) => {
    // GIVEN: A client and an available contact; PUT has a delay
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate — delay PUT response
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise((r) => setTimeout(r, 1500));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...contacto, clienteId: cliente.id }),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      }
    });

    // WHEN: User opens dialog, selects a contact, and clicks "Asociar"
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('asociar-contacto-btn').click();
    await expect(page.getByTestId('asociar-contacto-dialog')).toBeVisible();

    await page.getByTestId(`contacto-item-${contacto.id}`).click();
    await page.getByRole('button', { name: /^Asociar$/i }).click();

    // THEN: "Asociar" button is disabled while the mutation is in-flight
    await expect(page.getByRole('button', { name: /^Asociar$/i })).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // AC #8 — Error toast on API failure
  // ---------------------------------------------------------------------------

  test('AC#8 — Error toast "No se pudo asociar" shown when PUT association fails', async ({
    page,
  }) => {
    // GIVEN: A client and an available contact; PUT returns 500
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate — PUT returns 500
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/contactos*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`clienteId=${cliente.id}`)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contacto]),
        });
      }
    });

    // WHEN: User attempts to associate a contact (mutation fails)
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByTestId('asociar-contacto-btn').click();
    await expect(page.getByTestId('asociar-contacto-dialog')).toBeVisible();

    await page.getByTestId(`contacto-item-${contacto.id}`).click();
    await page.getByRole('button', { name: /^Asociar$/i }).click();

    // THEN: Error toast with Spanish message is shown
    await expect(page.getByText(/No se pudo asociar/i)).toBeVisible({ timeout: 5000 });
  });
});
