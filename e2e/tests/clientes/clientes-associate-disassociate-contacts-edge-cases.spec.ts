import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * E2E edge-case tests — Story 4.2: Associate & Disassociate Contacts from Client
 *
 * Expands ATDD coverage (clientes-associate-disassociate-contacts.spec.ts) with:
 *   - Cancel disassociation dialog → contact remains in list
 *   - Cancel ContactSearchDialog → dialog closes, list unchanged
 *   - ContactSearchDialog search filter narrows results
 *   - ContactSearchDialog empty state when no orphan contacts exist
 *   - ContactManager loading skeleton visible during data fetch
 *   - ContactManager error state with retry button
 *
 * Test IDs:
 *   TC-E4-4-2-E2E-EDGE-1 (P1) — Cancel disassociation confirmation → contact stays in list
 *   TC-E4-4-2-E2E-EDGE-2 (P1) — Cancel ContactSearchDialog → dialog closes, no association made
 *   TC-E4-4-2-E2E-EDGE-3 (P2) — ContactSearchDialog search input filters orphan contacts by name
 *   TC-E4-4-2-E2E-EDGE-4 (P2) — ContactSearchDialog shows empty state when no orphan contacts available
 *   TC-E4-4-2-E2E-EDGE-5 (P2) — ContactManager shows loading skeleton while fetching contacts
 *   TC-E4-4-2-E2E-EDGE-6 (P2) — ContactManager shows error state with retry button on network failure
 */

test.describe('Story 4.2 — E2E Edge Cases: Associate & Disassociate Contacts', () => {
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
  // TC-E4-4-2-E2E-EDGE-1 (P1) — Cancel disassociation dialog → contact stays
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] TC-E4-4-2-E2E-EDGE-1: should keep contact in ContactManager list when user opens disassociation confirmation but clicks Cancel', async ({ page }) => {
    // GIVEN: A client with 1 associated contact
    const clienteData = buildCliente({ nombre: 'Empresa Cancelar Desasociar E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({
      nombre: 'Contacto No Desasociar E2E',
      email: `no.desasociar.${Date.now()}@empresa.co`,
      clienteId: cliente.id,
    });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept routes BEFORE navigation
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

    // WHEN: Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // AND: Contact is visible in the list
    await expect(
      page.getByTestId('contact-manager-section').getByText(contactoData.nombre!)
    ).toBeVisible();

    // AND: User clicks the disassociate button
    await page.getByTestId(`disassociate-contact-button-${contacto.id}`).click();

    // AND: Confirmation dialog opens
    await expect(page.getByTestId('btn-confirmar-desasociar')).toBeVisible();

    // AND: User clicks "Cancelar" (NOT the confirm button)
    await page.getByRole('button', { name: /cancelar/i }).last().click();

    // THEN: Confirmation dialog closes
    await expect(page.getByTestId('btn-confirmar-desasociar')).not.toBeVisible();

    // AND: The contact is STILL visible in the ContactManager list (not removed)
    await expect(
      page.getByTestId('contact-manager-section').getByText(contactoData.nombre!)
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-EDGE-2 (P1) — Cancel ContactSearchDialog → dialog closes, no association
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] TC-E4-4-2-E2E-EDGE-2: should close ContactSearchDialog and make no association when user clicks Cancel inside the search dialog', async ({ page }) => {
    // GIVEN: A client with no contacts and one orphan contact
    const clienteData = buildCliente({ nombre: 'Empresa Cancelar Busqueda E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const orphanData = buildContacto({
      nombre: 'Contacto Huerfano Cancelar Dialog',
      email: `cancel.dialog.${Date.now()}@empresa.co`,
      clienteId: null,
    });

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.route(`**/api/v1/contactos`, (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('clienteId')) return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'orphan-cancel-001',
            nombre: orphanData.nombre,
            cargo: orphanData.cargo,
            telefono: orphanData.telefono,
            email: orphanData.email,
            clienteId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // Ensure PUT is NOT called (if it is, the test should fail)
    let putCalled = false;
    await page.route(`**/api/v1/contactos/**/cliente`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // WHEN: Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // AND: Open the ContactSearchDialog
    await page.getByTestId('associate-contact-button').click();
    await expect(page.getByTestId('contact-search-dialog')).toBeVisible();

    // AND: Orphan contact is visible in the dialog
    await expect(page.getByTestId('contact-search-dialog').getByText(orphanData.nombre!)).toBeVisible();

    // AND: User clicks Cancelar
    await page.getByTestId('contact-search-dialog').getByRole('button', { name: /cancelar/i }).click();

    // THEN: Dialog closes
    await expect(page.getByTestId('contact-search-dialog')).not.toBeVisible();

    // AND: No PUT was called (no association made)
    expect(putCalled).toBe(false);

    // AND: ContactManager list is still empty (no contact associated)
    await expect(page.getByTestId('contact-manager-empty')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-EDGE-3 (P2) — ContactSearchDialog search input filters results
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] TC-E4-4-2-E2E-EDGE-3: ContactSearchDialog should filter orphan contacts by name when user types in the search input', async ({ page }) => {
    // GIVEN: A client and two orphan contacts with different names
    const clienteData = buildCliente({ nombre: 'Empresa Filtrar Busqueda E2E' });
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

    await page.route(`**/api/v1/contactos`, (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('clienteId')) return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'filter-orphan-001',
            nombre: 'Laura Gómez Filtrar',
            cargo: 'Gerente',
            telefono: '3001234567',
            email: 'laura.filtrar@empresa.co',
            clienteId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'filter-orphan-002',
            nombre: 'Pedro Ramírez Filtrar',
            cargo: 'Analista',
            telefono: '3101234567',
            email: 'pedro.filtrar@empresa.co',
            clienteId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // WHEN: Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // AND: Open the ContactSearchDialog
    await page.getByTestId('associate-contact-button').click();
    await expect(page.getByTestId('contact-search-dialog')).toBeVisible();

    // AND: Both contacts are visible initially
    await expect(page.getByTestId('contact-search-dialog').getByText('Laura Gómez Filtrar')).toBeVisible();
    await expect(page.getByTestId('contact-search-dialog').getByText('Pedro Ramírez Filtrar')).toBeVisible();

    // AND: User types "laura" in the search input
    await page.getByTestId('contact-search-input').fill('laura');

    // THEN: Only "Laura" contact is visible
    await expect(page.getByTestId('contact-search-dialog').getByText('Laura Gómez Filtrar')).toBeVisible();

    // AND: "Pedro" contact is NOT visible (filtered out)
    await expect(page.getByTestId('contact-search-dialog').getByText('Pedro Ramírez Filtrar')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-EDGE-4 (P2) — ContactSearchDialog empty state when no orphan contacts
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] TC-E4-4-2-E2E-EDGE-4: ContactSearchDialog should show empty state message when no orphan contacts exist', async ({ page }) => {
    // GIVEN: A client exists, and NO orphan contacts exist (all contacts have clienteId)
    const clienteData = buildCliente({ nombre: 'Empresa Sin Huerfanos E2E' });
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

    // All contacts endpoint returns only already-linked contacts (no orphans)
    await page.route(`**/api/v1/contactos`, (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('clienteId')) return route.continue();
      // Return empty list — no orphan contacts available
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // AND: Open the ContactSearchDialog
    await page.getByTestId('associate-contact-button').click();
    await expect(page.getByTestId('contact-search-dialog')).toBeVisible();

    // THEN: Empty state message is shown
    await expect(
      page.getByTestId('contact-search-dialog').getByText(/no hay contactos disponibles/i)
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-EDGE-5 (P2) — ContactManager shows loading skeleton
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] TC-E4-4-2-E2E-EDGE-5: ContactManager should show loading skeleton while contacts are being fetched', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Loading Skeleton E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation — delay the response to capture loading state
    let resolveContactos: (() => void) | undefined;
    const contactosDelay = new Promise<void>((r) => { resolveContactos = r; });

    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await contactosDelay;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Also intercept client detail
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );

    // WHEN: Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Loading skeleton is visible before contacts load
    await expect(page.getByTestId('contact-manager-loading')).toBeVisible();

    // AND: Resolve the delayed contacts response
    resolveContactos!();

    // AND: After loading, the loading skeleton disappears
    await expect(page.getByTestId('contact-manager-loading')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-E2E-EDGE-6 (P2) — ContactManager error state with retry button
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] TC-E4-4-2-E2E-EDGE-6: ContactManager should show error state with retry button when contacts network request fails', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Error State E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation — simulate network failure for contacts
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    );

    // WHEN: Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // THEN: ContactManager shows error state
    await expect(page.getByTestId('contact-manager-error')).toBeVisible();

    // AND: Retry button is visible
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });
});
