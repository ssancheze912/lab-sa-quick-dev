import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * E2E edge case tests — Story 4.4: View Associated Client from Contact Detail
 *
 * Complements view-client-from-contact.spec.ts (ATDD baseline, 10 tests).
 * Covers edge cases NOT in the ATDD suite:
 *
 *   EC-1  Loading skeleton visible during slow client fetch (network-first)
 *   EC-2  Error state visible when client fetch returns 500 (E2E route interception)
 *   EC-3  Retry button in error state triggers refetch and shows client name on success
 *   EC-4  Client with special characters in nombre renders correctly
 *   EC-5  Direct URL access (deep link) to /contactos/:id shows client association section
 *   EC-6  client-asociado-section renders for orphan contact (no clienteId) without <a> link
 *   EC-7  BuildingOfficeIcon is decorative — no duplicate text in link accessible name
 *   EC-8  Back navigation from client detail to contact preserves client section
 *
 * Stack: Playwright — network-first route interception (intercept BEFORE navigate).
 * Selectors: data-testid — no fragile CSS selectors.
 */

test.describe('Story 4.4 — View Associated Client from Contact Detail: Edge Cases', () => {
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
  // EC-1 — Skeleton visible during slow client fetch
  // ---------------------------------------------------------------------------

  test('[P1] EC#1 — loading skeleton is visible while client fetch is delayed', async ({
    page,
  }) => {
    // GIVEN: Contact with a clienteId
    const clienteData = buildCliente({ nombre: 'Carga Lenta Corp' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation — contacto loads fast, client is delayed
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...contacto }),
      })
    );

    let clienteResolveFn: (() => void) | null = null;
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      // Delay client response by 800ms to observe skeleton
      await new Promise<void>((resolve) => {
        clienteResolveFn = resolve;
        setTimeout(resolve, 800);
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...cliente }),
      });
    });

    // WHEN: Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: Skeleton is visible while client is loading
    await expect(page.getByTestId('cliente-loading-skeleton')).toBeVisible();

    // THEN: After client data arrives, skeleton disappears
    await expect(page.getByTestId('cliente-loading-skeleton')).not.toBeVisible({ timeout: 3000 });

    // AND: Client name is visible
    await expect(page.getByText('Carga Lenta Corp')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // EC-2 — Error state visible when client fetch returns 500
  // ---------------------------------------------------------------------------

  test('[P1] EC#2 — error state shown in client section when client fetch returns 500', async ({
    page,
  }) => {
    // GIVEN: Contact with a clienteId but the client API returns 500
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...contacto }),
      })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      })
    );

    // WHEN: Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: Error state shown in the client association section
    await expect(page.getByTestId('cliente-asociado-error')).toBeVisible();

    // AND: Retry button is present
    await expect(page.getByTestId('cliente-asociado-retry')).toBeVisible();
    await expect(page.getByTestId('cliente-asociado-retry')).toContainText(/reintentar/i);

    // AND: Raw HTTP status is NOT shown to user (NFR6)
    await expect(page.getByText(/500/)).not.toBeVisible();
    await expect(page.getByText(/Internal Server Error/i)).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // EC-3 — Retry button triggers refetch and shows client name on success
  // ---------------------------------------------------------------------------

  test('[P1] EC#3 — clicking retry shows client name when second attempt succeeds', async ({
    page,
  }) => {
    // GIVEN: Contact with a clienteId, initially 500, then success on retry
    const clienteData = buildCliente({ nombre: 'Empresa Retry SA' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    let requestCount = 0;

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...contacto }),
      })
    );

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First call: fail
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      }
      // Subsequent calls: success
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...cliente }),
      });
    });

    // WHEN: Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: Error state appears
    await expect(page.getByTestId('cliente-asociado-error')).toBeVisible();

    // WHEN: User clicks Reintentar
    await page.getByTestId('cliente-asociado-retry').click();

    // THEN: Error state disappears and client name appears
    await expect(page.getByTestId('cliente-asociado-error')).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Empresa Retry SA')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // EC-4 — Client with special characters in nombre renders correctly
  // ---------------------------------------------------------------------------

  test('[P1] EC#4 — client nombre with accents and special characters renders correctly', async ({
    page,
  }) => {
    // GIVEN: Client with accented nombre containing ñ, é, and &
    const nombreEspecial = 'García & Señores Ltda';
    const clienteData = buildCliente({ nombre: nombreEspecial });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
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

    // WHEN: Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: Client name with special characters is visible (not encoded/broken)
    await expect(page.getByText('García & Señores Ltda')).toBeVisible();
    await expect(page.getByTestId('navigate-to-cliente')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // EC-5 — Deep link direct access shows client association section
  // ---------------------------------------------------------------------------

  test('[P2] EC#5 — direct URL access to /contactos/:id shows client association section', async ({
    page,
  }) => {
    // GIVEN: A contact associated to a client (no prior navigation — deep link)
    const clienteData = buildCliente({ nombre: 'Acceso Directo SA' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id, nombre: 'Contacto Deep Link' });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
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

    // WHEN: User navigates DIRECTLY to the contact URL (deep link — no prior click)
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: Client association section is visible
    await expect(page.getByTestId('cliente-asociado-section')).toBeVisible();

    // AND: Client name is visible
    await expect(page.getByText('Acceso Directo SA')).toBeVisible();

    // AND: Navigate-to-cliente link is present
    await expect(page.getByTestId('navigate-to-cliente')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // EC-6 — Orphan contact (no clienteId): section renders without <a> link
  // ---------------------------------------------------------------------------

  test('[P1] EC#6 — orphan contact shows section with sin-cliente-message but no <a> link', async ({
    page,
  }) => {
    // GIVEN: A contact with no associated client (clienteId: null)
    const contactoData = buildContacto({ clienteId: null, nombre: 'Contacto Huerfano' });
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

    // WHEN: Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: The section is present
    await expect(page.getByTestId('cliente-asociado-section')).toBeVisible();

    // AND: "Sin cliente asignado" message is visible
    await expect(page.getByTestId('sin-cliente-message')).toBeVisible();

    // AND: No navigate-to-cliente link (no clienteId → no link)
    await expect(page.getByTestId('navigate-to-cliente')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // EC-7 — BuildingOfficeIcon does not add duplicate text to link accessible name
  // ---------------------------------------------------------------------------

  test('[P1] EC#7 — navigate-to-cliente accessible name matches client nombre only (icon is decorative)', async ({
    page,
  }) => {
    // GIVEN: A contact with an associated client
    const clienteData = buildCliente({ nombre: 'Icono Decorativo SA' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
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

    // WHEN: Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);

    await expect(page.getByTestId('navigate-to-cliente')).toBeVisible();

    // THEN: The SVG inside the link has aria-hidden="true" (decorative — not read by screen reader)
    const iconAriaHidden = await page
      .getByTestId('navigate-to-cliente')
      .locator('svg')
      .getAttribute('aria-hidden');
    expect(iconAriaHidden).toBe('true');
  });

  // ---------------------------------------------------------------------------
  // EC-8 — Back navigation from client detail preserves client section state
  // ---------------------------------------------------------------------------

  test('[P2] EC#8 — back navigation from client detail to contact restores client section', async ({
    page,
  }) => {
    // GIVEN: A client and an associated contact
    const clienteData = buildCliente({ nombre: 'Volver Client SA' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
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

    // WHEN: User navigates directly to contact detail and sees client section
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('navigate-to-cliente')).toBeVisible();
    await expect(page.getByText('Volver Client SA')).toBeVisible();

    // WHEN: User clicks navigate-to-cliente to go to client detail
    await page.getByTestId('navigate-to-cliente').click();
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));

    // WHEN: User goes back to contact detail
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/contactos/${contacto.id}`));

    // THEN: The client association section is still rendered correctly
    await expect(page.getByTestId('cliente-asociado-section')).toBeVisible();
    await expect(page.getByText('Volver Client SA')).toBeVisible();
  });
});
