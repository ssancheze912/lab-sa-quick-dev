import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * E2E tests — Story 4.4: View Associated Client from Contact Detail
 *
 * Covers:
 *   AC #1  Contact with clienteId → associated client name displayed in contact detail
 *   AC #2  Clicking client name link → navigates to /clientes/:clienteId
 *   AC #3  Navigation requires no more than 1 click to reach client detail from contact detail
 *   AC #4  Contact with clienteId null → "Sin cliente asignado" shown in client section
 *   AC #7  Client name link is keyboard-accessible (WCAG 2.1 AA)
 *
 * Stack: Playwright — network-first route interception (intercept BEFORE navigate).
 * Selectors: data-testid — no fragile CSS selectors.
 *
 * Expected RED failures (missing implementation):
 *   - [data-testid="cliente-asociado-section"] does not exist in ContactoDetailView
 *   - [data-testid="navigate-to-cliente"] does not exist in ContactoDetailView
 *   - [data-testid="sin-cliente-message"] does not exist in ContactoDetailView
 *   - Client name is never rendered within the contact detail page
 *   - Clicking the client name link does not navigate to /clientes/:clienteId
 */

test.describe('Story 4.4 — View Associated Client from Contact Detail', () => {
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
  // AC #1 — Client name is displayed in the contact detail view
  // ---------------------------------------------------------------------------

  test('AC#1 — contact detail shows associated client nombre when clienteId is set', async ({
    page,
  }) => {
    // GIVEN: A client and a contact associated with that client exist in the backend
    const clienteData = buildCliente({ nombre: 'Siesa Empresas SA' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...contacto }),
      })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...cliente }),
      })
    );

    // WHEN: User navigates to the contact detail page
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: The associated client name is visible
    await expect(page.getByText('Siesa Empresas SA')).toBeVisible();
  });

  test('AC#1 — cliente-asociado-section is rendered when contact has clienteId', async ({
    page,
  }) => {
    // GIVEN: A client and an associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: Navigated to the contact detail
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: The client association section is visible
    await expect(page.getByTestId('cliente-asociado-section')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #2 — Clicking client name link navigates to /clientes/:clienteId
  // ---------------------------------------------------------------------------

  test('AC#2 — clicking navigate-to-cliente link navigates to /clientes/:clienteId', async ({
    page,
  }) => {
    // GIVEN: A client and an associated contact
    const clienteData = buildCliente({ nombre: 'Navegación Corp' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept both API calls BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User is on the contact detail page
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: The client link is visible
    await expect(page.getByTestId('navigate-to-cliente')).toBeVisible();

    // WHEN: User clicks the client name link
    await page.getByTestId('navigate-to-cliente').click();

    // THEN: Router navigates to /clientes/:clienteId
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));
  });

  test('AC#2 — navigate-to-cliente link href contains /clientes/{clienteId}', async ({
    page,
  }) => {
    // GIVEN: A client and an associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: Navigated to contact detail
    await page.goto(`/contactos/${contacto.id}`);

    await expect(page.getByTestId('navigate-to-cliente')).toBeVisible();

    // THEN: The link href resolves to the correct client detail route
    const href = await page.getByTestId('navigate-to-cliente').getAttribute('href');
    expect(href).toContain(`/clientes/${cliente.id}`);
  });

  // ---------------------------------------------------------------------------
  // AC #3 — No more than 1 click required to reach client detail
  // ---------------------------------------------------------------------------

  test('AC#3 — contact detail reaches client detail in exactly 1 click (no intermediate step)', async ({
    page,
  }) => {
    // GIVEN: A client and an associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User is on the contact detail (1 click away from client)
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('navigate-to-cliente')).toBeVisible();

    // WHEN: A single click is performed
    await page.getByTestId('navigate-to-cliente').click();

    // THEN: URL is immediately /clientes/:clienteId — no additional click or confirm step
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));
  });

  // ---------------------------------------------------------------------------
  // AC #4 — "Sin cliente asignado" when contact has no associated client
  // ---------------------------------------------------------------------------

  test('AC#4 — "Sin cliente asignado" text shown when contact clienteId is null', async ({
    page,
  }) => {
    // GIVEN: A contact with no associated client (clienteId: null)
    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept route BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...contacto, clienteId: null }),
      })
    );

    // WHEN: User navigates to the contact detail
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: "Sin cliente asignado" message is visible
    await expect(page.getByText('Sin cliente asignado')).toBeVisible();
  });

  test('AC#4 — navigate-to-cliente link is NOT rendered when contact has no clienteId', async ({
    page,
  }) => {
    // GIVEN: A contact with no clienteId
    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...contacto, clienteId: null }),
      })
    );

    // WHEN: Navigated to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByText('Sin cliente asignado')).toBeVisible();

    // THEN: The navigate-to-cliente link is absent
    await expect(page.getByTestId('navigate-to-cliente')).not.toBeVisible();
  });

  test('AC#4 — sin-cliente-message element is present when contact has no clienteId', async ({
    page,
  }) => {
    // GIVEN: A contact with clienteId: null
    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...contacto, clienteId: null }),
      })
    );

    // WHEN: Navigated to contact detail
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: The sin-cliente-message testid is present
    await expect(page.getByTestId('sin-cliente-message')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #7 — Client name link is keyboard-accessible (WCAG 2.1 AA)
  // ---------------------------------------------------------------------------

  test('AC#7 — navigate-to-cliente is keyboard-focusable (renders as <a> element)', async ({
    page,
  }) => {
    // GIVEN: A contact with an associated client
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: Navigated to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('navigate-to-cliente')).toBeVisible();

    // THEN: The element is an <a> tag (natively keyboard-focusable)
    const tagName = await page.getByTestId('navigate-to-cliente').evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('a');
  });

  test('AC#7 — navigate-to-cliente can be activated via keyboard (Tab + Enter)', async ({
    page,
  }) => {
    // GIVEN: A contact with an associated client
    const clienteData = buildCliente({ nombre: 'Teclado SA' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: Navigated to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('navigate-to-cliente')).toBeVisible();

    // WHEN: User focuses the link via Tab and activates it via Enter
    await page.getByTestId('navigate-to-cliente').focus();
    await page.keyboard.press('Enter');

    // THEN: Navigation occurs to /clientes/:clienteId
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));
  });
});
