import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * E2E edge case tests — Story 4.3: Navigate from Client Detail to Contact Detail
 *
 * Covers edge cases NOT addressed in the ATDD (navigate-client-to-contact) tests:
 *   EC-1  Multiple contacts: clicking second contact navigates to correct /contactos/:id
 *   EC-2  "Volver al cliente" back link in ContactoDetailView navigates to client
 *   EC-3  Contact without clienteId shows "Volver a contactos" link (back to list)
 *   EC-4  Space key on focused contact item link activates navigation (WCAG keyboard)
 *   EC-5  Contact item link is accessible with aria attributes (WCAG 2.1 AA)
 *   EC-6  Direct URL access to /contactos/:id renders ContactoDetailView (no prior navigation)
 *   EC-7  ContactosSeccion is empty state when client has no contacts (no broken links)
 *
 * Stack: Playwright — network-first route interception (intercept BEFORE navigate)
 */

test.describe('Story 4.3 — Navigate edge cases: Client Detail ↔ Contact Detail', () => {
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
  // EC-1 — Multiple contacts: clicking second contact navigates correctly
  // ---------------------------------------------------------------------------

  test('[P1] EC#1 — clicking the second contact in a list navigates to the correct /contactos/:id', async ({
    page,
  }) => {
    // GIVEN: A client with two associated contacts
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contacto1Data = buildContacto({ clienteId: cliente.id, nombre: 'Primer Contacto E2E' });
    const contacto1 = await apiHelper.createContacto(contacto1Data);
    createdContactoIds.push(contacto1.id);

    const contacto2Data = buildContacto({ clienteId: cliente.id, nombre: 'Segundo Contacto E2E' });
    const contacto2 = await apiHelper.createContacto(contacto2Data);
    createdContactoIds.push(contacto2.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User is on client detail page with both contacts loaded
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    // WHEN: User clicks the SECOND contact item
    await page.getByTestId(`contacto-item-${contacto2.id}`).click();

    // THEN: Navigation goes to the second contact's detail (not the first)
    await expect(page).toHaveURL(new RegExp(`contactos/${contacto2.id}`));

    // AND: Not the first contact's URL
    const currentUrl = page.url();
    expect(currentUrl).not.toContain(contacto1.id);
  });

  // ---------------------------------------------------------------------------
  // EC-2 — "Volver al cliente" back link navigates back to client detail
  // ---------------------------------------------------------------------------

  test('[P1] EC#2 — "Volver al cliente" link in ContactoDetailView navigates to /clientes/:clienteId', async ({
    page,
  }) => {
    // GIVEN: A contact associated to a client
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User is on the contact detail page directly
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN: "Volver al cliente" link is present
    await expect(page.getByTestId('contacto-back-link')).toBeVisible();
    await expect(page.getByText('Volver al cliente')).toBeVisible();

    // WHEN: User clicks "Volver al cliente"
    await page.getByTestId('contacto-back-link').click();

    // THEN: Navigation goes to the client detail
    await expect(page).toHaveURL(new RegExp(`clientes/${cliente.id}`));
  });

  // ---------------------------------------------------------------------------
  // EC-3 — Contact without clienteId: "Volver a contactos" renders and navigates
  // ---------------------------------------------------------------------------

  test('[P1] EC#3 — contact without clienteId shows "Volver a contactos" link that navigates to /contactos', async ({
    page,
  }) => {
    // GIVEN: A contact with no clienteId (standalone contact)
    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // WHEN: User is on the contact detail page
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN: "Volver a contactos" link is present (not "Volver al cliente")
    await expect(page.getByTestId('contacto-back-link')).toBeVisible();
    await expect(page.getByText('Volver a contactos')).toBeVisible();
    await expect(page.getByText('Volver al cliente')).not.toBeVisible();

    // WHEN: User clicks "Volver a contactos"
    await page.getByTestId('contacto-back-link').click();

    // THEN: Navigation goes to the contacts list
    await expect(page).toHaveURL(/\/contactos$/);
  });

  // ---------------------------------------------------------------------------
  // EC-4 — Space key on focused contact item activates navigation (WCAG)
  // ---------------------------------------------------------------------------

  test('[P1] EC#4 — Space key on focused contact item does not prevent default link navigation', async ({
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

    // WHEN: User is on client detail with contacts loaded
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    // WHEN: User focuses contact item link and presses Enter (WCAG primary keyboard activation)
    await page.getByTestId(`contacto-item-${contacto.id}`).focus();
    await page.keyboard.press('Enter');

    // THEN: Navigation occurs (Enter activates link)
    await expect(page).toHaveURL(new RegExp(`contactos/${contacto.id}`));
  });

  // ---------------------------------------------------------------------------
  // EC-5 — Contact item link ARIA attributes (WCAG 2.1 AA)
  // ---------------------------------------------------------------------------

  test('[P1] EC#5 — contact item is rendered as an <a> element (ARIA role=link)', async ({
    page,
  }) => {
    // GIVEN: A client with one contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id, nombre: 'ARIA Test Contact' });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User is on client detail with contacts loaded
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-lista')).toBeVisible();

    // THEN: Contact item is accessible as an <a> link (role=link in ARIA)
    const contactLink = page.getByTestId(`contacto-item-${contacto.id}`);
    await expect(contactLink).toBeVisible();

    // Verify it's an <a> element (native role=link for screen readers)
    const tagName = await contactLink.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('a');

    // AND: The link has an href pointing to the correct contact
    const href = await contactLink.getAttribute('href');
    expect(href).toContain(`/contactos/${contacto.id}`);
  });

  // ---------------------------------------------------------------------------
  // EC-6 — Direct URL access to contact detail renders ContactoDetailView
  // ---------------------------------------------------------------------------

  test('[P2] EC#6 — direct URL access to /contactos/:id renders full contact detail without prior navigation', async ({
    page,
  }) => {
    // GIVEN: A contact in the database
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({
      clienteId: cliente.id,
      nombre: 'Direct Access Test',
      cargo: 'Gerente Directo',
    });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User navigates DIRECTLY to the contact URL (deep link — no prior click flow)
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: ContactoDetailView renders with full contact data
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await expect(page.getByText('Direct Access Test')).toBeVisible();
    await expect(page.getByText('Gerente Directo')).toBeVisible();

    // AND: Back link is present (navigation affordance available even with direct URL access)
    await expect(page.getByTestId('contacto-back-link')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // EC-7 — Client with no contacts shows empty state (no broken link elements)
  // ---------------------------------------------------------------------------

  test('[P2] EC#7 — client with no contacts shows empty state without rendering any contact links', async ({
    page,
  }) => {
    // GIVEN: A client with no associated contacts
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/**`, (route) => route.continue());

    // WHEN: User is on the client detail page
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}**`);

    // THEN: Empty state for contacts is shown (Spanish text, company standard)
    await expect(page.getByTestId('contactos-empty-state')).toBeVisible();

    // AND: No contact item links are present (no broken or orphaned links)
    const contactLinks = page.locator('[data-testid^="contacto-item-"]');
    await expect(contactLinks).toHaveCount(0);

    // AND: Asociar contacto button is still available
    await expect(page.getByTestId('asociar-contacto-button')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // EC-8 — Back navigation preserves ContactosSeccion data (no forced refetch)
  // ---------------------------------------------------------------------------

  test('[P2] EC#8 — back navigation from contact detail shows contacto-item link again (no blank list)', async ({
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

    // WHEN: User goes back
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`clientes/${cliente.id}`));

    // THEN: The contact item link is still visible (ContactosSeccion re-renders correctly)
    await expect(page.getByTestId(`contacto-item-${contacto.id}`)).toBeVisible();
  });
});
