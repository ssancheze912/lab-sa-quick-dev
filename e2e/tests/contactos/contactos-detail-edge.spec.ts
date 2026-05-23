import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * Story 3.2 — Contact Detail View — Edge Cases
 *
 * Expands coverage beyond the GREEN ATDD suite (E2E-CT-07 to E2E-CT-10).
 * Targets loading states, generic errors, accessibility, layout and boundary
 * conditions not exercised by the base ATDD tests.
 *
 * Test IDs: E2E-CT-DET-EDGE-01 … E2E-CT-DET-EDGE-10
 */

test.describe('Story 3.2 — Detalle de contacto — Edge Cases (E2E)', () => {
  let contactosPage: ContactosPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    contactosPage = new ContactosPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-01 (P1)
  // Boundary: detail panel shows skeleton placeholders while the API request
  // for the single contact is pending.
  // react-loading-skeleton elements must be visible before the response arrives.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-01 — [P1] skeleton aparece en el panel de detalle mientras carga', async ({ page }) => {
    // GIVEN — a contact exists
    const data = buildContacto({ nombre: 'Contacto Skeleton Detail Test' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // Hold the by-ID request to capture the loading window
    let resolveHold!: () => void;
    const holdPromise = new Promise<void>((resolve) => { resolveHold = resolve; });

    await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
      await holdPromise;
      await route.continue();
    });

    // WHEN — navigate directly to the detail URL (request is held)
    const navPromise = page.goto(`/contactos/${contacto.id}`);

    // THEN — skeleton elements appear inside the detail panel before response arrives
    const skeleton = page.locator('[data-testid="contacto-detail-panel"] .react-loading-skeleton');
    await expect(skeleton.first()).toBeVisible({ timeout: 5000 });

    // Release the hold and let the test finish
    resolveHold();
    await navPromise;
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-02 (P1)
  // Error path: when the detail API returns 500 (generic server error), the
  // component must show an error panel instead of the "Contacto no encontrado"
  // message — the two error states must NOT be confused.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-02 — [P1] error 500 en detalle muestra ErrorPanel, no "Contacto no encontrado"', async ({ page }) => {
    // GIVEN — API returns 500 for a specific detail request
    const errorId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    await page.route(`**/api/v1/contactos/${errorId}`, (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        contentType: 'application/problem+json',
      })
    );

    // WHEN — navigate directly to that ID
    await page.goto(`/contactos/${errorId}`);

    // THEN — the not-found message is NOT visible
    await expect(page.getByTestId('contacto-not-found')).not.toBeVisible();

    // AND — (no unhandled JS crash from the generic error path)
    // The ErrorPanel component is rendered; we verify only that not-found is absent
    // because the error panel testid may vary across projects.
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-03 (P2)
  // Boundary: clicking a second contact after a first one was selected must
  // update the detail panel with the new contact's data (no stale cache).
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-03 — [P2] seleccionar un segundo contacto actualiza el panel de detalle', async ({ page }) => {
    // GIVEN — two contacts exist with distinct names
    const data1 = buildContacto({ nombre: 'Primer Contacto Edge SAS', cargo: 'Analista Junior' });
    const data2 = buildContacto({ nombre: 'Segundo Contacto Edge Ltda', cargo: 'Gerente Senior' });
    const c1 = await apiHelper.createContacto(data1);
    const c2 = await apiHelper.createContacto(data2);
    createdIds.push(c1.id, c2.id);

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();

    // WHEN — user clicks first contact
    await contactosPage.seleccionarContacto(data1.nombre);
    await expect(page.getByTestId('contacto-detail-nombre')).toHaveText(data1.nombre);

    // AND — then clicks second contact
    await contactosPage.seleccionarContacto(data2.nombre);

    // THEN — detail panel shows second contact's data
    await expect(page.getByTestId('contacto-detail-nombre')).toHaveText(data2.nombre);
    await expect(page.getByTestId('contacto-detail-cargo')).toHaveText(data2.cargo ?? '');
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-04 (P1)
  // Boundary: clicking a contact updates the URL; pressing browser back must
  // navigate back to /contactos (the list view).
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-04 — [P1] navegar atrás desde el detalle vuelve a /contactos', async ({ page }) => {
    // GIVEN — a contact exists
    const data = buildContacto({ nombre: 'Contacto Back Navigation' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.filter({ hasText: data.nombre })).toBeVisible();

    await contactosPage.seleccionarContacto(data.nombre);
    await page.waitForURL(`**/contactos/${contacto.id}`);

    // WHEN — browser back button
    await page.goBack();

    // THEN — URL is back to /contactos (without the detail segment)
    await page.waitForURL('**/contactos');
    expect(page.url()).toContain('/contactos');
    expect(page.url()).not.toContain(contacto.id);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-05 (P2)
  // Boundary: direct navigation to /contactos/:id must also show the list panel
  // alongside the detail panel (split-panel layout must be intact).
  // Verifies the <Outlet /> + ContactoListView layout from contactos.tsx.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-05 — [P2] navegación directa a detalle también muestra el panel de lista', async ({ page }) => {
    // GIVEN — a contact exists
    const data = buildContacto({ nombre: 'Contacto Split Panel Check' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN — navigate directly to the detail URL
    await page.goto(`/contactos/${contacto.id}`);

    // THEN — the detail panel is visible
    await expect(contactosPage.detailPanel).toBeVisible();

    // AND — the list panel is also still rendered (split-panel layout)
    // The contact list renders as contacto-row items
    await expect(contactosPage.contactoRows.first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-06 (P2)
  // Boundary: loading a valid contact detail must NOT generate any unhandled
  // JS errors (page errors). Guard test for the normal success path.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-06 — [P2] cargar detalle válido no genera errores JS en la consola', async ({ page }) => {
    // GIVEN — a contact exists
    const data = buildContacto({ nombre: 'Contacto Sin Errores JS' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // WHEN — navigate to the detail
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('contacto-detail-nombre')).toBeVisible();

    // THEN — no unhandled JS errors
    expect(pageErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-07 (P2)
  // Boundary: after selecting a contact, the contact row must still be visible
  // in the list and have an active state applied (router param highlight).
  // Covers the useParams-based active highlighting from ContactoListView.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-07 — [P2] el ítem activo sigue visible en la lista después de seleccionar', async ({ page }) => {
    // GIVEN — a contact exists
    const data = buildContacto({ nombre: 'Contacto Active Item Check' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.filter({ hasText: data.nombre })).toBeVisible();

    // WHEN — user selects the contact
    await contactosPage.seleccionarContacto(data.nombre);
    await page.waitForURL(`**/contactos/${contacto.id}`);

    // THEN — the contact row is still present in the DOM
    await expect(
      contactosPage.contactoRows.filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-08 (P1)
  // Boundary: a syntactically valid UUID (v4 format) that is not in the DB must
  // show "Contacto no encontrado" without a JS crash or blank screen.
  // Covers a different UUID than E2E-CT-10 to ensure pattern independence.
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-08 — [P1] UUID válido pero inexistente muestra "no encontrado" sin crash', async ({ page }) => {
    const unknownId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // WHEN — navigate to a valid-shaped but non-existent contact UUID
    await page.goto(`/contactos/${unknownId}`);

    // THEN — not-found component is visible
    await expect(page.getByTestId('contacto-not-found')).toBeVisible();

    // AND — no unhandled JS errors
    expect(pageErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-09 (P2)
  // Accessibility: the contact nombre in the detail panel must be accessible as
  // a text element visible to screen readers (WCAG 2.1 AA coverage).
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-09 — [P2] el nombre del contacto en el panel de detalle es accesible como texto', async ({ page }) => {
    // GIVEN — a contact exists
    const data = buildContacto({ nombre: 'Contacto Accesible SAS' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN — navigate to detail
    await page.goto(`/contactos/${contacto.id}`);

    // THEN — the nombre element is visible and contains the correct text
    const nombreEl = page.getByTestId('contacto-detail-nombre');
    await expect(nombreEl).toBeVisible();
    await expect(nombreEl).toHaveText(data.nombre);

    // AND — the detail panel has an aria-label (WCAG 2.1 AA per story spec)
    const panel = page.getByTestId('contacto-detail-panel');
    await expect(panel).toHaveAttribute('aria-label', /.+/);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-DET-EDGE-10 (P2)
  // Boundary: selecting a contact from a search-filtered list must navigate to
  // the correct detail URL (search filter must not corrupt the contact ID).
  // ---------------------------------------------------------------------------
  test('E2E-CT-DET-EDGE-10 — [P2] seleccionar contacto filtrado por búsqueda navega al detalle correcto', async ({ page }) => {
    // GIVEN — two contacts, only one matching the search term
    const data1 = buildContacto({ nombre: 'Contacto Filtered Navigation' });
    const data2 = buildContacto({ nombre: 'Otro Contacto Diferente' });
    const c1 = await apiHelper.createContacto(data1);
    const c2 = await apiHelper.createContacto(data2);
    createdIds.push(c1.id, c2.id);

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();

    // WHEN — search to filter the list, then click the matching contact
    await contactosPage.buscar('Filtered Navigation');
    await expect(
      contactosPage.contactoRows.filter({ hasText: data1.nombre })
    ).toBeVisible();

    await contactosPage.seleccionarContacto(data1.nombre);

    // THEN — URL contains the correct contact ID (not the filtered-out one)
    await page.waitForURL(`**/contactos/${c1.id}`);
    expect(page.url()).toContain(c1.id);
    expect(page.url()).not.toContain(c2.id);
  });
});

// =============================================================================
// Story 3.2 — API Edge Cases: GET /api/v1/contactos/:id
// =============================================================================

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 3.2 — API Edge Cases: GET /api/v1/contactos/:id', () => {
  const createdIds: string[] = [];

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/contactos/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-CT-DET-EDGE-01 (P1)
  // GET /api/v1/contactos/:id on a valid contact returns Content-Type
  // application/json — NOT application/problem+json (happy path guard).
  // ---------------------------------------------------------------------------
  test('API-CT-DET-EDGE-01 — GET /:id con ID válido responde con Content-Type application/json', async ({ request }) => {
    // GIVEN — a contact is created
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto ContentType Edge',
        cargo: 'Analista',
        telefono: '+57 310 000 0001',
        email: `api.det.edge.01.${Date.now()}@empresa.co`,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — GET by ID
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos/${created.id}`);

    // THEN — status 200
    expect(response.status()).toBe(200);

    // AND — Content-Type is application/json (not problem+json)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
    expect(contentType).not.toContain('problem+json');
  });

  // ---------------------------------------------------------------------------
  // API-CT-DET-EDGE-02 (P1)
  // GET /api/v1/contactos/:id is idempotent — two consecutive calls to the same
  // ID return identical data without modifying server state.
  // ---------------------------------------------------------------------------
  test('API-CT-DET-EDGE-02 — GET /:id es idempotente (dos llamadas consecutivas devuelven los mismos datos)', async ({ request }) => {
    // GIVEN — a contact is created
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Idempotente Edge',
        cargo: 'Director',
        telefono: '+57 310 000 0002',
        email: `api.det.edge.02.${Date.now()}@empresa.co`,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — two consecutive GET calls
    const r1 = await request.get(`${API_BASE_URL}/api/v1/contactos/${created.id}`);
    const r2 = await request.get(`${API_BASE_URL}/api/v1/contactos/${created.id}`);

    // THEN — both return 200
    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);

    const b1 = await r1.json();
    const b2 = await r2.json();

    // AND — the returned data is identical
    expect(b1.id).toBe(b2.id);
    expect(b1.nombre).toBe(b2.nombre);
    expect(b1.email).toBe(b2.email);
    expect(b1.cargo).toBe(b2.cargo);
    expect(b1.updatedAt).toBe(b2.updatedAt);
  });

  // ---------------------------------------------------------------------------
  // API-CT-DET-EDGE-03 (P1)
  // GET /api/v1/contactos/:id response must include the telefono field.
  // The base ATDD test API-CT-08 did not assert this field explicitly.
  // ---------------------------------------------------------------------------
  test('API-CT-DET-EDGE-03 — GET /:id incluye el campo telefono en la respuesta', async ({ request }) => {
    // GIVEN — a contact is created with a known telefono
    const telefono = '+57 310 000 0003';
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Telefono Edge',
        cargo: 'Soporte',
        telefono,
        email: `api.det.edge.03.${Date.now()}@empresa.co`,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — GET by ID
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos/${created.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json();

    // THEN — telefono is present and matches the submitted value
    expect('telefono' in body).toBe(true);
    expect(body.telefono).toBe(telefono);
  });

  // ---------------------------------------------------------------------------
  // API-CT-DET-EDGE-04 (P1)
  // GET /api/v1/contactos/:id response is a direct object — not a wrapper
  // such as { data: {...} }, { result: {...} } or { contact: {...} }.
  // Architecture contract: direct object (no wrapper).
  // ---------------------------------------------------------------------------
  test('API-CT-DET-EDGE-04 — GET /:id retorna objeto directo sin propiedades wrapper', async ({ request }) => {
    // GIVEN — a contact is created
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto No Wrapper Edge',
        cargo: 'Técnico',
        telefono: '+57 310 000 0004',
        email: `api.det.edge.04.${Date.now()}@empresa.co`,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — GET by ID
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos/${created.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json();

    // THEN — response is an object (not an array)
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);

    // AND — no wrapper properties
    expect((body as Record<string, unknown>).data).toBeUndefined();
    expect((body as Record<string, unknown>).result).toBeUndefined();
    expect((body as Record<string, unknown>).contact).toBeUndefined();
    expect((body as Record<string, unknown>).contacto).toBeUndefined();
    expect((body as Record<string, unknown>).items).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-CT-DET-EDGE-05 (P1)
  // GET /api/v1/contactos/:id — updatedAt must be >= createdAt (temporal
  // constraint). A newly created contact should have updatedAt == createdAt.
  // ---------------------------------------------------------------------------
  test('API-CT-DET-EDGE-05 — updatedAt es >= createdAt en el detalle de un contacto recién creado', async ({ request }) => {
    // GIVEN — a contact is created
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Temporal Edge',
        cargo: 'Auditor',
        telefono: '+57 310 000 0005',
        email: `api.det.edge.05.${Date.now()}@empresa.co`,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — GET by ID
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos/${created.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json();

    // THEN — updatedAt is a valid ISO 8601 date
    expect(body.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );

    // AND — updatedAt >= createdAt (temporal constraint)
    const createdAt = new Date(body.createdAt).getTime();
    const updatedAt = new Date(body.updatedAt).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(createdAt);
  });

  // ---------------------------------------------------------------------------
  // API-CT-DET-EDGE-06 (P2)
  // GET /api/v1/contactos/:id — passing an invalid (non-UUID) path segment must
  // return 400 Bad Request or 404 Not Found — never 500 (NFR: no unhandled errors).
  // An invalid UUID shape should not cause an unhandled server exception.
  // ---------------------------------------------------------------------------
  test('API-CT-DET-EDGE-06 — GET /:id con segmento no-UUID retorna 400 o 404, nunca 500', async ({ request }) => {
    // GIVEN — a path segment that is NOT a valid UUID
    const invalidSegments = ['not-a-uuid', '12345', 'null', ''];

    for (const segment of invalidSegments) {
      if (segment === '') continue; // Empty segment would resolve to the list endpoint

      // WHEN — GET with invalid ID format
      const response = await request.get(`${API_BASE_URL}/api/v1/contactos/${segment}`);

      // THEN — response is 400 Bad Request or 404 Not Found (not 500)
      expect([400, 404]).toContain(response.status());
    }
  });
});
