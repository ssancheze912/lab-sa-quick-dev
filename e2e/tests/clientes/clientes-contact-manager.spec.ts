import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 4.1: View Associated Contacts in Client Detail (RED phase)
 *
 * Tests fail until:
 *   - GET /api/v1/contactos?clienteId=:id endpoint returns filtered contacts
 *   - ContactManager (siesa-ui-kit) is rendered inside ClienteDetailView
 *   - ClienteContactServiceAdapter is wired in ClienteDetailView
 *   - data-testid="contact-manager-section" wrapper is present
 *   - ContactManager shows empty state when no contacts are linked
 *   - ContactManager shows error state with retry when fetch fails (AC #3)
 *
 * Test IDs:
 *   TC-E4-4-1-E2E-1 (P0) — Navigate to /clientes/:id → ContactManager section is rendered
 *   TC-E4-4-1-E2E-2 (P1) — Client with 2 contacts → both appear in ContactManager
 *   TC-E4-4-1-E2E-3 (P1) — Client with no contacts → empty state shown in ContactManager
 *   TC-E4-4-1-E2E-4 (P1) — GET /api/v1/contactos?clienteId fails (500) → error state + retry option
 */

test.describe('Story 4.1 — Contact Manager in Client Detail (E2E)', () => {
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
  // TC-E4-4-1-E2E-1 (P0) — ContactManager section is rendered in client detail (AC #1, FR21)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-1-E2E-1: should render the contact-manager-section wrapper when navigating to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: A client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Contact Manager E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept contactos fetch BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // THEN: The client detail panel is visible
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // AND: The contact manager section wrapper is present (data-testid="contact-manager-section")
    await expect(page.getByTestId('contact-manager-section')).toBeVisible();
  });

  test('should render ContactManager section heading "Contactos asociados" in Spanish (AC #1)', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Heading Contactos' });
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

    // THEN: The "Contactos asociados" heading is visible in the contact manager section
    await expect(
      page.getByTestId('contact-manager-section').getByText(/contactos asociados/i)
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-1-E2E-2 (P1) — Client with 2 contacts → both appear in ContactManager (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-1-E2E-2: should display all contacts linked to the client inside the ContactManager section', async ({ page }) => {
    // GIVEN: A client exists with 2 associated contacts
    const clienteData = buildCliente({ nombre: 'Empresa Con Contactos E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contacto1Data = buildContacto({
      nombre: 'Ana García E2E',
      email: `ana.garcia.e2e.${Date.now()}@empresa.co`,
      clienteId: cliente.id,
    });
    const contacto1 = await apiHelper.createContacto(contacto1Data);
    createdContactoIds.push(contacto1.id);

    const contacto2Data = buildContacto({
      nombre: 'Carlos Pérez E2E',
      email: `carlos.perez.e2e.${Date.now() + 1}@empresa.co`,
      clienteId: cliente.id,
    });
    const contacto2 = await apiHelper.createContacto(contacto2Data);
    createdContactoIds.push(contacto2.id);

    // CRITICAL: Intercept contactos fetch BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: contacto1.id,
            nombre: contacto1Data.nombre,
            cargo: contacto1Data.cargo,
            telefono: contacto1Data.telefono,
            email: contacto1Data.email,
            clienteId: cliente.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: contacto2.id,
            nombre: contacto2Data.nombre,
            cargo: contacto2Data.cargo,
            telefono: contacto2Data.telefono,
            email: contacto2Data.email,
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

    // THEN: The contact manager section is visible
    await expect(page.getByTestId('contact-manager-section')).toBeVisible();

    // AND: First contact name appears in the ContactManager
    await expect(
      page.getByTestId('contact-manager-section').getByText(contacto1Data.nombre!)
    ).toBeVisible();

    // AND: Second contact name appears in the ContactManager
    await expect(
      page.getByTestId('contact-manager-section').getByText(contacto2Data.nombre!)
    ).toBeVisible();
  });

  test('should call GET /api/v1/contactos with clienteId query param (ClienteContactServiceAdapter wiring — AC #1)', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Adapter Wiring Test' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation — spy on whether clienteId is sent
    let capturedUrl: string | null = null;
    await page.route(`**/api/v1/contactos**`, (route) => {
      capturedUrl = route.request().url();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // Wait for ContactManager section to appear (trigger async fetch)
    await expect(page.getByTestId('contact-manager-section')).toBeVisible();

    // THEN: The contactos API was called with the clienteId query param
    expect(capturedUrl).not.toBeNull();
    expect(capturedUrl).toContain(`clienteId=${cliente.id}`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-1-E2E-3 (P1) — Client with no contacts → ContactManager shows empty state (AC #2)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-1-E2E-3: should display empty state in ContactManager when client has no associated contacts', async ({ page }) => {
    // GIVEN: A client exists with NO associated contacts
    const clienteData = buildCliente({ nombre: 'Empresa Sin Contactos E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation — return empty array (AC #2: 200 + [])
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

    // AND: An empty state message indicating no contacts are linked is shown
    // (ContactManager from siesa-ui-kit renders its own empty state — Spanish locale expected)
    await expect(
      page.getByTestId('contact-manager-section').getByText(/no hay contactos|sin contactos|no contacts/i)
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-1-E2E-4 (P1) — GET contactos?clienteId fails → error state + retry (AC #3)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-1-E2E-4: should display error state with retry option in ContactManager when GET /api/v1/contactos?clienteId fails with 500', async ({ page }) => {
    // GIVEN: A client exists but the contactos endpoint returns 500
    const clienteData = buildCliente({ nombre: 'Empresa Error Contactos E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept contactos fetch BEFORE navigation — return 500 (AC #3)
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // THEN: The contact manager section is visible (wrapper always rendered)
    await expect(page.getByTestId('contact-manager-section')).toBeVisible();

    // AND: The ContactManager displays an error state (AC #3)
    // ContactManager from siesa-ui-kit renders its own error state
    await expect(
      page.getByTestId('contact-manager-section').getByText(/error|error al cargar|no se pudo/i)
    ).toBeVisible({ timeout: 5000 });

    // AND: A retry option is visible in the error state (AC #3)
    await expect(
      page.getByTestId('contact-manager-section').getByRole('button', { name: /reintentar|retry|volver a intentar/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('should NOT render ContactManager section when no clienteId is in the URL (root /clientes)', async ({ page }) => {
    // GIVEN: User is at /clientes (no client selected — no clienteId in URL)
    // CRITICAL: Intercept clientes list BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente({ nombre: 'Cliente En Lista' })]),
      })
    );

    // WHEN: User navigates to /clientes (no :clienteId)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: The contact-manager-section is NOT visible (only rendered when client is loaded)
    await expect(page.getByTestId('contact-manager-section')).not.toBeVisible();
  });

  test('should preserve existing client fields (Nombre, NIT, Teléfono, Ciudad) when ContactManager is rendered (regression guard)', async ({ page }) => {
    // GIVEN: A client exists with known field values
    const clienteData = buildCliente({
      nombre: 'Empresa Campos Preservados',
      nit: '900111222-3',
      telefono: '3111112223',
      ciudad: 'Medellín',
    });
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

    // THEN: Existing client detail fields are still visible (Story 2.2 regression)
    await expect(
      page.getByTestId('cliente-detail-panel').getByText('Empresa Campos Preservados')
    ).toBeVisible();

    // AND: The contact manager section is also present (new Story 4.1 addition)
    await expect(page.getByTestId('contact-manager-section')).toBeVisible();
  });
});
