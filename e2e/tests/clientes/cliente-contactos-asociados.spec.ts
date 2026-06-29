import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * E2E tests — Story 4.1: View Associated Contacts in Client Detail
 *
 * Covers:
 *   AC #1  ContactManager renders in right panel when client has contacts
 *   AC #3  Empty-state "Sin contactos asociados" when client has no contacts
 *   AC #4  Error state with "Reintentar" button shown when backend is unavailable
 *   AC #5  Skeleton loading state shown while contacts are being fetched
 *   AC #6  URL does not change on load; deep-link renders ContactManager
 *
 * Stack: Playwright — network-first route interception (intercept BEFORE navigate)
 *
 * Expected RED failures (missing implementation):
 *   - [data-testid="cliente-contactos-seccion"] not present (ContactManager not mounted)
 *   - [data-testid="contactos-lista"] not present
 *   - [data-testid="contactos-empty-state"] not present
 *   - [data-testid="contactos-error-state"] not present
 *   - [data-testid="contactos-skeleton"] not present
 */

const WORKTREE_ROOT = process.env.WORKTREE_ROOT ?? 'http://localhost:5173';

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
  // AC #1 — ContactManager section is visible when client has contacts
  // ---------------------------------------------------------------------------

  test('AC#1 — ContactManager section is rendered in right panel for a client with contacts', async ({
    page,
  }) => {
    // GIVEN: A client exists and has one associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());

    // WHEN: User navigates to the client detail page
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}**`);

    // THEN: The ContactManager section is visible in the right panel
    await expect(page.getByTestId('cliente-contactos-seccion')).toBeVisible();
  });

  test('AC#1 — Contact list shows at least one contact row when client has contacts', async ({
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
    await page.route(`**/api/v1/contactos*`, (route) => route.continue());

    // WHEN: User navigates to the client detail page
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Contact list is rendered and the contact name appears
    await expect(page.getByTestId('contactos-lista')).toBeVisible();
    await expect(page.getByText(contactoData.nombre)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #2 — ContactManager calls GET /api/v1/contactos?clienteId=:id
  // ---------------------------------------------------------------------------

  test('AC#2 — ContactManager fires GET /api/v1/contactos?clienteId=<id> on mount', async ({
    page,
  }) => {
    // GIVEN: A client with no contacts
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    let capturedUrl = '';

    // CRITICAL: Intercept BEFORE navigate — capture the outgoing request URL
    await page.route(`**/api/v1/contactos*`, (route) => {
      capturedUrl = route.request().url();
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // WHEN: User navigates to the client detail page
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForTimeout(500); // explicit wait for the fetch to fire

    // THEN: The request included clienteId as a query param
    expect(capturedUrl).toContain(`clienteId=${cliente.id}`);
  });

  // ---------------------------------------------------------------------------
  // AC #3 — Empty-state message "Sin contactos asociados"
  // ---------------------------------------------------------------------------

  test('AC#3 — Empty-state message "Sin contactos asociados" shown when client has no contacts', async ({
    page,
  }) => {
    // GIVEN: A client exists with NO associated contacts
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigate — return empty array
    await page.route(`**/api/v1/contactos*`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User opens the client detail view
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The empty-state indicator is shown with the required Spanish text
    await expect(page.getByTestId('contactos-empty-state')).toBeVisible();
    await expect(page.getByText(/Sin contactos asociados/i)).toBeVisible();
  });

  test('AC#3 — Empty-state does NOT show the contact list table', async ({
    page,
  }) => {
    // GIVEN: A client with no contacts
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to the client detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-empty-state')).toBeVisible();

    // THEN: No contact rows are rendered
    await expect(page.getByTestId('contactos-lista')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #4 — Error state with "Reintentar" button on backend failure
  // ---------------------------------------------------------------------------

  test('AC#4 — Error state is shown with "Reintentar" button when contacts fetch fails', async ({
    page,
  }) => {
    // GIVEN: The contacts endpoint returns 500
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept contacts request BEFORE navigation to simulate backend failure
    await page.route(`**/api/v1/contactos*`, (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    // WHEN: User opens the client detail view
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Error state is rendered
    await expect(page.getByTestId('contactos-error-state')).toBeVisible();
    await expect(page.getByRole('button', { name: /Reintentar/i })).toBeVisible();
  });

  test('AC#4 — Clicking "Reintentar" triggers a new contacts fetch', async ({
    page,
  }) => {
    // GIVEN: First contacts request fails, second succeeds
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    let callCount = 0;

    // CRITICAL: Intercept BEFORE navigate
    await page.route(`**/api/v1/contactos*`, (route) => {
      callCount += 1;
      if (callCount === 1) {
        route.fulfill({ status: 500, body: 'Error' });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    // WHEN: User opens the client detail view (first fetch fails)
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contactos-error-state')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByRole('button', { name: /Reintentar/i }).click();

    // THEN: A second fetch is triggered (callCount increased)
    await page.waitForTimeout(500);
    expect(callCount).toBeGreaterThan(1);
  });

  // ---------------------------------------------------------------------------
  // AC #5 — Skeleton loading state shown while contacts are loading
  // ---------------------------------------------------------------------------

  test('AC#5 — Skeleton loading state is shown while contacts are in-flight', async ({
    page,
  }) => {
    // GIVEN: A client exists; contacts endpoint is delayed
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigate — delay response by 300ms
    await page.route(`**/api/v1/contactos*`, async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // WHEN: User navigates to client detail — check skeleton before response arrives
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Skeleton loading state is visible immediately
    await expect(page.getByTestId('contactos-skeleton')).toBeVisible();

    // THEN: Skeleton disappears after response arrives
    await expect(page.getByTestId('contactos-skeleton')).not.toBeVisible({ timeout: 3000 });
  });

  test('AC#5 — No spinner is shown (company standard: skeletons only)', async ({
    page,
  }) => {
    // GIVEN: A client with a delayed contacts fetch
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    await page.route(`**/api/v1/contactos*`, async (route) => {
      await new Promise((r) => setTimeout(r, 200));
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // WHEN: User navigates to client detail
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: No spinner role is present (skeleton only)
    const spinner = page.getByRole('progressbar');
    const count = await spinner.count();
    expect(count).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // AC #6 — URL does not change; deep-link renders ContactManager
  // ---------------------------------------------------------------------------

  test('AC#6 — URL does not change when page loads (no redirect)', async ({
    page,
  }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    await page.route(`**/api/v1/contactos*`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates directly to the client detail URL (deep link)
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: URL remains at the deep-link location — no redirect
    await expect(page).toHaveURL(new RegExp(cliente.id));
  });

  test('AC#6 — Deep-link directly to /clientes/:clienteId renders the ContactManager section', async ({
    page,
  }) => {
    // GIVEN: A client with one contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    await page.route(`**/api/v1/contactos*`, (route) => route.continue());

    // WHEN: User navigates directly to the deep-link (no prior navigation)
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: ContactManager section is visible via deep link
    await expect(page.getByTestId('cliente-contactos-seccion')).toBeVisible();
  });
});
