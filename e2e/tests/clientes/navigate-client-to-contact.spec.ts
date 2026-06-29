import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * E2E tests — Story 4.3: Navigate from Client Detail to Contact Detail
 *
 * Covers:
 *   AC #1  Clicking a contact item in ContactosSeccion navigates to /contactos/:contactoId
 *   AC #2  Navigation requires no more than 2 clicks from the client record
 *   AC #3  /contactos/:contactoId renders ContactoDetailView with full contact data
 *   AC #4  Browser back from contact detail returns to /clientes/:clienteId
 *   AC #5  Contact items are keyboard-accessible (WCAG 2.1 AA)
 *
 * Stack: Playwright — network-first route interception (intercept BEFORE navigate)
 *
 * Expected RED failures (missing implementation):
 *   - Contact items in ContactosSeccion are not yet rendered as clickable links
 *   - Clicking a contact item does not trigger navigation to /contactos/:contactoId
 *   - "Volver al cliente" back link does not exist in ContactoDetailView
 *   - [data-testid="contacto-item-{id}"] link with href /contactos/{id} does not exist
 */

test.describe('Story 4.3 — Navigate from Client Detail to Contact Detail', () => {
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
  // AC #1 — Clicking a contact item navigates to /contactos/:contactoId
  // ---------------------------------------------------------------------------

  test('AC#1 — clicking a contact item navigates to /contactos/:contactoId', async ({
    page,
  }) => {
    // GIVEN: A client exists with one associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User is on the client detail page
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}**`);

    // THEN: Contact list is visible
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    // WHEN: User clicks on the contact item
    await page.getByTestId(`contacto-item-${contacto.id}`).click();

    // THEN: Router navigates to the contact detail page
    await expect(page).toHaveURL(new RegExp(`/contactos/${contacto.id}`));
  });

  test('AC#1 — URL after clicking contact item matches /contactos/:contactoId exactly', async ({
    page,
  }) => {
    // GIVEN: A client with one contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User navigates to client detail and clicks the contact item
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();
    await page.getByTestId(`contacto-item-${contacto.id}`).click();

    // THEN: URL ends with /contactos/:contactoId
    await page.waitForURL(`**/contactos/${contacto.id}**`);
    await expect(page).toHaveURL(new RegExp(`contactos/${contacto.id}`));
  });

  // ---------------------------------------------------------------------------
  // AC #2 — No more than 2 clicks from client record to contact detail
  // ---------------------------------------------------------------------------

  test('AC#2 — reaching contact detail from client list requires at most 2 clicks', async ({
    page,
  }) => {
    // GIVEN: A client with one contact is in the database
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes**`, (route) => route.continue());

    // WHEN: User starts at the clients list page (click 1 — open client detail)
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await page.getByText(clienteData.nombre).click();
    await page.waitForURL(`**/clientes/${cliente.id}**`);

    // THEN: Client detail is visible after click 1
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    // WHEN: User clicks the contact item (click 2 — navigate to contact detail)
    await page.getByTestId(`contacto-item-${contacto.id}`).click();

    // THEN: Contact detail is reached in 2 clicks total
    await expect(page).toHaveURL(new RegExp(`contactos/${contacto.id}`));
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #3 — ContactoDetailView renders full contact data at /contactos/:contactoId
  // ---------------------------------------------------------------------------

  test('AC#3 — /contactos/:contactoId route renders ContactoDetailView with contact nombre', async ({
    page,
  }) => {
    // GIVEN: A contact exists in the database with a known nombre
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({
      clienteId: cliente.id,
      nombre: 'Juan Pérez Test',
    });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // WHEN: User navigates directly to the contact detail route
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN: ContactoDetailView renders the contact's nombre
    await expect(page.getByText('Juan Pérez Test')).toBeVisible();
  });

  test('AC#3 — ContactoDetailView renders full contact fields (cargo, email) at the route', async ({
    page,
  }) => {
    // GIVEN: A contact with all fields populated
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({
      clienteId: cliente.id,
      cargo: 'Gerente de Ventas',
      email: 'gerente.ventas@test.co',
    });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // WHEN: User navigates to the contact detail page
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: cargo and email fields are rendered
    await expect(page.getByText('Gerente de Ventas')).toBeVisible();
    await expect(page.getByText('gerente.ventas@test.co')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #4 — Back button returns to /clientes/:clienteId after navigation
  // ---------------------------------------------------------------------------

  test('AC#4 — browser back from contact detail returns to /clientes/:clienteId', async ({
    page,
  }) => {
    // GIVEN: A client with one contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User navigates to client detail then to contact detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();
    await page.getByTestId(`contacto-item-${contacto.id}`).click();
    await expect(page).toHaveURL(new RegExp(`contactos/${contacto.id}`));

    // WHEN: User clicks the browser back button
    await page.goBack();

    // THEN: Router returns to /clientes/:clienteId
    await expect(page).toHaveURL(new RegExp(`clientes/${cliente.id}`));
  });

  test('AC#4 — ContactosSeccion re-renders after back navigation (contacts list visible)', async ({
    page,
  }) => {
    // GIVEN: A client with one contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User navigates forward to contact detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();
    await page.getByTestId(`contacto-item-${contacto.id}`).click();
    await expect(page).toHaveURL(new RegExp(`contactos/${contacto.id}`));

    // WHEN: User navigates back
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`clientes/${cliente.id}`));

    // THEN: ContactosSeccion re-renders and shows the contact list
    await expect(page.getByTestId('contactos-lista')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #5 — Contact items are keyboard-accessible (WCAG 2.1 AA)
  // ---------------------------------------------------------------------------

  test('AC#5 — contact item link is focusable via keyboard Tab', async ({
    page,
  }) => {
    // GIVEN: A client with one contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User is on client detail page with contacts loaded
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    // WHEN: User navigates to the contact item via Tab key
    await page.keyboard.press('Tab');

    // THEN: The contact item link is focusable (can receive focus)
    const contactLink = page.getByTestId(`contacto-item-${contacto.id}`);
    await expect(contactLink).toBeFocused();
  });

  test('AC#5 — pressing Enter on a focused contact item navigates to contact detail', async ({
    page,
  }) => {
    // GIVEN: A client with one contact, contact item has focus
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User is on client detail with contacts loaded
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    // WHEN: User focuses the contact item link and presses Enter
    await page.getByTestId(`contacto-item-${contacto.id}`).focus();
    await page.keyboard.press('Enter');

    // THEN: Navigation occurs to contact detail
    await expect(page).toHaveURL(new RegExp(`contactos/${contacto.id}`));
  });
});
