import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 4.2: Associate & Disassociate Contacts from Client (RED phase)
 *
 * Tests fail until:
 *   - PUT /api/v1/contactos/{id}/cliente endpoint is implemented (AssignContactoClienteCommand)
 *   - useAssignContactoCliente hook is created and wired in ClienteDetailView
 *   - useCreateContactoForCliente hook is created and wired in ClienteDetailView
 *   - ContactManager extended with onAddContact, onRemoveContact, onCreateContact props
 *   - ContactSearchDialog component is created (shows orphan contacts)
 *   - data-testid="associate-contact-button" rendered when onAddContact prop is provided
 *   - data-testid="disassociate-contact-button-{contactoId}" rendered per contact row
 *   - data-testid="contact-search-dialog" rendered when association dialog is open
 *   - data-testid="create-contact-button" rendered when onCreateContact prop is provided
 *   - Both ['contactos'] and ['contactos', { clienteId }] query keys are invalidated after mutations
 *
 * Test IDs:
 *   TC-E4-4-2-E2E-1 (P0) — Associate existing contact → appears in ContactManager list immediately
 *   TC-E4-4-2-E2E-2 (P1) — Associate button is visible in ContactManager when client is loaded
 *   TC-E4-4-2-E2E-3 (P1) — Disassociate contact → removed from ContactManager list immediately
 *   TC-E4-4-2-E2E-4 (P1) — ContactSearchDialog only shows orphan contacts (clienteId: null)
 *   TC-E4-4-2-E2E-5 (P1) — Create new contact from ContactManager → contact pre-linked to client
 */

test.describe('Story 4.2 — Associate & Disassociate Contacts from Client (E2E)', () => {
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

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-1 (P0) — Associate existing contact → appears in ContactManager list immediately (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-E2E-1: should add contact to ContactManager list immediately after user associates an existing orphan contact via the search dialog', async ({ page }) => {
    // GIVEN: A client and an orphan contact both exist
    const clienteData = buildCliente({ nombre: 'Empresa Asociar Contacto E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({
      nombre: 'Ana García Asociar E2E',
      email: `ana.garcia.asociar.${Date.now()}@empresa.co`,
      clienteId: null,
    });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    // Initial load: client has no contacts yet
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // Intercept the orphan contacts search (ContactSearchDialog)
    await page.route(`**/api/v1/contactos`, (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('clienteId')) {
        return route.continue();
      }
      // Return the orphan contact for the search dialog
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: contacto.id,
            nombre: contactoData.nombre,
            cargo: contactoData.cargo,
            telefono: contactoData.telefono,
            email: contactoData.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // Intercept the PUT association call
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, async (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: contacto.id,
            nombre: contactoData.nombre,
            cargo: contactoData.cargo,
            telefono: contactoData.telefono,
            email: contactoData.email,
            clienteId: cliente.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });

    // After association, the refetch returns the now-linked contact
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: contacto.id,
            nombre: contactoData.nombre,
            cargo: contactoData.cargo,
            telefono: contactoData.telefono,
            email: contactoData.email,
            clienteId: cliente.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      })
    );

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // AND: Contact manager section is visible
    await expect(page.getByTestId('contact-manager-section')).toBeVisible();

    // AND: User clicks the "Asociar contacto existente" button
    await page.getByTestId('associate-contact-button').click();

    // AND: The ContactSearchDialog opens
    await expect(page.getByTestId('contact-search-dialog')).toBeVisible();

    // AND: The orphan contact appears in the dialog list
    await expect(page.getByTestId('contact-search-dialog').getByText(contactoData.nombre!)).toBeVisible();

    // AND: User selects the contact
    await page.getByTestId('contact-search-dialog').getByText(contactoData.nombre!).click();

    // THEN: The contact appears in the ContactManager list immediately
    await expect(
      page.getByTestId('contact-manager-section').getByText(contactoData.nombre!)
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-2 (P1) — Associate button is visible in ContactManager when client is loaded (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-E2E-2: should render "Asociar contacto existente" button inside contact-manager-section when client detail view is loaded', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Boton Asociar E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // THEN: The contact manager section is visible
    await expect(page.getByTestId('contact-manager-section')).toBeVisible();

    // AND: The "Asociar contacto existente" action button is visible (data-testid="associate-contact-button")
    await expect(page.getByTestId('associate-contact-button')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-3 (P1) — Disassociate contact → removed from ContactManager immediately (AC #3)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-E2E-3: should remove contact from ContactManager list immediately after user confirms disassociation', async ({ page }) => {
    // GIVEN: A client with 1 associated contact
    const clienteData = buildCliente({ nombre: 'Empresa Desasociar Contacto E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({
      nombre: 'Carlos Pérez Desasociar E2E',
      email: `carlos.perez.desasociar.${Date.now()}@empresa.co`,
      clienteId: cliente.id,
    });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation — initially returns the linked contact
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: contacto.id,
            nombre: contactoData.nombre,
            cargo: contactoData.cargo,
            telefono: contactoData.telefono,
            email: contactoData.email,
            clienteId: cliente.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      })
    );

    // Intercept the PUT disassociation call
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, async (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: contacto.id,
            nombre: contactoData.nombre,
            cargo: contactoData.cargo,
            telefono: contactoData.telefono,
            email: contactoData.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });

    // After disassociation, the refetch returns empty list for this client
    let disassociated = false;
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) => {
      if (disassociated) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: contacto.id,
              nombre: contactoData.nombre,
              cargo: contactoData.cargo,
              telefono: contactoData.telefono,
              email: contactoData.email,
              clienteId: cliente.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        });
      }
    });

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // AND: The contact appears in the list
    await expect(
      page.getByTestId('contact-manager-section').getByText(contactoData.nombre!)
    ).toBeVisible();

    // AND: User clicks the disassociate button for the contact
    await page.getByTestId(`disassociate-contact-button-${contacto.id}`).click();

    // AND: User confirms the disassociation in the confirmation dialog
    await page.getByRole('button', { name: /confirmar|desasociar|aceptar/i }).click();

    disassociated = true;

    // THEN: The contact is removed from the ContactManager list immediately
    await expect(
      page.getByTestId('contact-manager-section').getByText(contactoData.nombre!)
    ).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-4 (P1) — ContactSearchDialog only shows orphan contacts (clienteId: null) (AC #1, scope boundary)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-E2E-4: should only show contacts with clienteId: null in the ContactSearchDialog (orphan contacts only)', async ({ page }) => {
    // GIVEN: A client exists with 1 already-linked contact and 1 orphan contact
    const clienteData = buildCliente({ nombre: 'Empresa Dialog Huerfanos E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const orphanContactoData = buildContacto({
      nombre: 'Contacto Huerfano En Dialog',
      email: `huerfano.dialog.${Date.now()}@empresa.co`,
      clienteId: null,
    });

    const linkedContactoData = buildContacto({
      nombre: 'Contacto Ya Vinculado',
      email: `vinculado.dialog.${Date.now() + 1}@empresa.co`,
      clienteId: cliente.id,
    });

    // CRITICAL: Intercept BEFORE navigation
    // Initial client contactos — returns the linked contact
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'linked-id-001',
            nombre: linkedContactoData.nombre,
            cargo: linkedContactoData.cargo,
            telefono: linkedContactoData.telefono,
            email: linkedContactoData.email,
            clienteId: cliente.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      })
    );

    // All contacts endpoint — returns both orphan and linked
    await page.route(`**/api/v1/contactos`, (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('clienteId')) {
        return route.continue();
      }
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'orphan-id-001',
            nombre: orphanContactoData.nombre,
            cargo: orphanContactoData.cargo,
            telefono: orphanContactoData.telefono,
            email: orphanContactoData.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'linked-id-001',
            nombre: linkedContactoData.nombre,
            cargo: linkedContactoData.cargo,
            telefono: linkedContactoData.telefono,
            email: linkedContactoData.email,
            clienteId: cliente.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    await expect(page.getByTestId('contact-manager-section')).toBeVisible();

    // AND: User opens the ContactSearchDialog
    await page.getByTestId('associate-contact-button').click();
    await expect(page.getByTestId('contact-search-dialog')).toBeVisible();

    // THEN: The orphan contact appears in the dialog
    await expect(page.getByTestId('contact-search-dialog').getByText(orphanContactoData.nombre!)).toBeVisible();

    // AND: The already-linked contact does NOT appear in the dialog (scope boundary: Story 4.6)
    await expect(page.getByTestId('contact-search-dialog').getByText(linkedContactoData.nombre!)).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-5 (P1) — Create new contact from ContactManager → contact pre-linked to client (AC #2)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-E2E-5: should create a new contact pre-linked to the current client when user clicks "Crear nuevo contacto" and submits the form', async ({ page }) => {
    // GIVEN: A client exists with no contacts
    const clienteData = buildCliente({ nombre: 'Empresa Crear Contacto E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    const newContactoNombre = `Nuevo Contacto Creado E2E ${Date.now()}`;

    // Intercept the POST /api/v1/contactos call (create new contact with clienteId)
    await page.route(`**/api/v1/contactos`, async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as { clienteId?: string };
        // Ensure the new contact carries the clienteId in the request body
        expect(body.clienteId).toBe(cliente.id);
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-contacto-id-001',
            nombre: newContactoNombre,
            cargo: 'Analista',
            telefono: '3001234567',
            email: `nuevo.${Date.now()}@empresa.co`,
            clienteId: cliente.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });

    // After creation, the refetch returns the new contact
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'new-contacto-id-001',
            nombre: newContactoNombre,
            cargo: 'Analista',
            telefono: '3001234567',
            email: `nuevo.${Date.now()}@empresa.co`,
            clienteId: cliente.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      })
    );

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    await expect(page.getByTestId('contact-manager-section')).toBeVisible();

    // AND: User clicks "Crear nuevo contacto" button
    await page.getByTestId('create-contact-button').click();

    // AND: User fills the contact creation form
    await page.getByTestId('contacto-nombre-input').fill(newContactoNombre);
    await page.getByTestId('contacto-cargo-input').fill('Analista');
    await page.getByTestId('contacto-telefono-input').fill('3001234567');
    await page.getByTestId('contacto-email-input').fill(`nuevo.${Date.now()}@empresa.co`);

    // AND: User submits the form
    await page.getByTestId('contacto-submit-button').click();

    // THEN: The new contact appears in the ContactManager list immediately (pre-linked to the client)
    await expect(
      page.getByTestId('contact-manager-section').getByText(newContactoNombre)
    ).toBeVisible();
  });
});
