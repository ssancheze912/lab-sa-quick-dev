import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * Edge Case Tests — Story 4.5: Orphan Contacts Filter ("Sin cliente")
 *
 * Expands ATDD baseline (asociacion-filtro-huerfanos.spec.ts) with:
 *   - EDGE-E2E-01 [P1] Filter + active search query combination: only contacts matching BOTH conditions shown
 *   - EDGE-E2E-02 [P1] Orphan count badge reflects TOTAL orphans (full dataset), not the search-filtered subset
 *   - EDGE-E2E-03 [P1] Toggle aria-pressed reflects active/inactive state for WCAG 2.1 AA compliance
 *   - EDGE-E2E-04 [P2] Filter toggle visual: active state has Siesa Blue bg; inactive has slate-100 bg
 *   - EDGE-E2E-05 [P2] Multiple rapid toggle clicks correctly restore filter state (even number = off, odd = on)
 *
 * API Edge Cases (GET ?sinCliente=true boundary conditions):
 *   - API-ORPHAN-EDGE-01 [P1] Full ContactoDto contract (8 fields) present and typed correctly
 *   - API-ORPHAN-EDGE-02 [P1] GET ?sinCliente=false returns all contacts (not orphan-only path)
 *   - API-ORPHAN-EDGE-03 [P1] GET ?sinCliente=true returns 200 empty array when no orphans exist (not 404)
 *   - API-ORPHAN-EDGE-04 [P1] GET ?sinCliente=true&clienteId={id} — sinCliente branch takes priority
 */

test.describe('Story 4.5 — E2E Edge Cases: Orphan Contacts Filter', () => {
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
  // EDGE-E2E-01 [P1]
  // Given sinClienteActive is true AND searchQuery is active
  // When the user types a name that matches only 1 of the 2 orphan contacts
  // Then the list shows ONLY the 1 orphan contact matching both conditions
  // AND orphan count badge still shows the TOTAL count (2), not the filtered count
  // ---------------------------------------------------------------------------
  test('[P1] EDGE-E2E-01 — filtro sin cliente combinado con búsqueda muestra solo contactos que cumplen ambas condiciones', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create a client and 2 contacts with it (not orphans)
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const conCliente1 = await apiHelper.createContacto(
      buildContacto({ nombre: 'Con Cliente EDGE01 A', clienteId: cliente.id })
    );
    createdContactoIds.push(conCliente1.id);

    // AND — Create 2 orphan contacts with DISTINCT names
    const huerfanoAlfa = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano Alfa EDGE01', clienteId: null })
    );
    createdContactoIds.push(huerfanoAlfa.id);

    const huerfanoBeta = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano Beta EDGE01', clienteId: null })
    );
    createdContactoIds.push(huerfanoBeta.id);

    await page.route('**/api/v1/contactos**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // WHEN — Activate the "Sin cliente" filter
    const filtroSinCliente = page.getByTestId('filtro-sin-cliente');
    await expect(filtroSinCliente).toBeVisible();
    await filtroSinCliente.click();

    // AND — Type a search query that matches only one orphan
    const searchInput = page.getByRole('searchbox');
    await searchInput.fill('Alfa');

    // THEN — Only "Huerfano Alfa" is shown (matches search AND is orphan)
    await expect(page.getByTestId('contacto-row')).toHaveCount(1);
    await expect(page.getByTestId('contacto-row').filter({ hasText: huerfanoAlfa.nombre })).toBeVisible();

    // AND — "Huerfano Beta" is NOT shown (orphan but does NOT match search)
    await expect(page.getByTestId('contacto-row').filter({ hasText: huerfanoBeta.nombre })).toHaveCount(0);

    // AND — "Con Cliente" is NOT shown (matches none: has client)
    await expect(page.getByTestId('contacto-row').filter({ hasText: conCliente1.nombre })).toHaveCount(0);

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // EDGE-E2E-02 [P1]
  // Given sinClienteActive is true AND a search query is active that narrows orphans to 1
  // When the orphan count badge is visible
  // Then the badge shows the TOTAL orphan count (from full dataset), NOT the filtered count
  // This validates the anti-pattern guard: orphanCount uses filterOrphanContactos(data) NOT filteredContactos
  // ---------------------------------------------------------------------------
  test('[P1] EDGE-E2E-02 — badge de cantidad refleja total de huerfanos del dataset completo, no el subconjunto filtrado por búsqueda', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create a client
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    // AND — 1 contact WITH a client
    const conCliente = await apiHelper.createContacto(
      buildContacto({ nombre: 'Con Cliente EDGE02', clienteId: cliente.id })
    );
    createdContactoIds.push(conCliente.id);

    // AND — 3 orphan contacts (only 1 has "Unico" in name)
    const huerfanoUnico = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano Unico EDGE02', clienteId: null })
    );
    createdContactoIds.push(huerfanoUnico.id);

    const huerfanoDos = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano Dos EDGE02', clienteId: null })
    );
    createdContactoIds.push(huerfanoDos.id);

    const huerfanoTres = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano Tres EDGE02', clienteId: null })
    );
    createdContactoIds.push(huerfanoTres.id);

    await page.route('**/api/v1/contactos**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // WHEN — Activate filter
    const filtroSinCliente = page.getByTestId('filtro-sin-cliente');
    await expect(filtroSinCliente).toBeVisible();
    await filtroSinCliente.click();

    // AND — Type a search query that narrows displayed orphans to 1
    const searchInput = page.getByRole('searchbox');
    await searchInput.fill('Unico');

    // THEN — Only 1 contact row shown (matches search + is orphan)
    await expect(page.getByTestId('contacto-row')).toHaveCount(1);

    // AND — The orphan count badge still shows 3 (total orphans in full dataset)
    const orphanCountEl = page.getByTestId('orphan-count');
    await expect(orphanCountEl).toBeVisible();
    await expect(orphanCountEl).toHaveText(/3 sin cliente/i);

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // EDGE-E2E-03 [P1]
  // Given the "Sin cliente" toggle button exists on /contactos
  // When the user clicks it to activate
  // Then aria-pressed="true" is set on the button (WCAG 2.1 AA — toggle role)
  // When the user clicks again to deactivate
  // Then aria-pressed="false" is set on the button
  // ---------------------------------------------------------------------------
  test('[P1] EDGE-E2E-03 — aria-pressed refleja el estado activo/inactivo del toggle (WCAG 2.1 AA)', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create a contact so the page is not in empty state
    const contacto = await apiHelper.createContacto(
      buildContacto({ nombre: 'Contacto EDGE03', clienteId: null })
    );
    createdContactoIds.push(contacto.id);

    await page.route('**/api/v1/contactos**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    const filtroSinCliente = page.getByTestId('filtro-sin-cliente');
    await expect(filtroSinCliente).toBeVisible();

    // THEN — Initially aria-pressed is "false" (inactive)
    await expect(filtroSinCliente).toHaveAttribute('aria-pressed', 'false');

    // WHEN — Click to activate
    await filtroSinCliente.click();

    // THEN — aria-pressed is "true"
    await expect(filtroSinCliente).toHaveAttribute('aria-pressed', 'true');

    // WHEN — Click again to deactivate
    await filtroSinCliente.click();

    // THEN — aria-pressed returns to "false"
    await expect(filtroSinCliente).toHaveAttribute('aria-pressed', 'false');

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // EDGE-E2E-04 [P2]
  // Given the "Sin cliente" toggle button exists
  // When it is inactive, it has slate-100 background class
  // When activated, it has bg-[#0e79fd] class (Siesa Blue)
  // This validates the CSS class toggle pattern from the story spec
  // ---------------------------------------------------------------------------
  test('[P2] EDGE-E2E-04 — estilos visuales del toggle cambian al activar/desactivar (Siesa Blue activo, slate-100 inactivo)', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create at least 1 contact to prevent empty state
    const contacto = await apiHelper.createContacto(
      buildContacto({ nombre: 'Contacto EDGE04', clienteId: null })
    );
    createdContactoIds.push(contacto.id);

    await page.route('**/api/v1/contactos**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    const filtroSinCliente = page.getByTestId('filtro-sin-cliente');
    await expect(filtroSinCliente).toBeVisible();

    // THEN — Inactive state: contains slate-100 background class
    const inactiveClass = await filtroSinCliente.getAttribute('class');
    expect(inactiveClass).toContain('bg-slate-100');
    expect(inactiveClass).not.toContain('bg-[#0e79fd]');

    // WHEN — Activate
    await filtroSinCliente.click();
    await expect(filtroSinCliente).toHaveAttribute('aria-pressed', 'true');

    // THEN — Active state: contains Siesa Blue class
    const activeClass = await filtroSinCliente.getAttribute('class');
    expect(activeClass).toContain('bg-[#0e79fd]');
    expect(activeClass).not.toContain('bg-slate-100');

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // EDGE-E2E-05 [P2]
  // Given the "Sin cliente" filter is inactive
  // When the user clicks the toggle an even number of times (4 clicks)
  // Then the filter returns to inactive state and the full list is shown
  // When clicked an odd number of times (3 clicks from off = on)
  // Then the filter is active and shows only orphans
  // This validates toggle idempotency and rapid-click correctness
  // ---------------------------------------------------------------------------
  test('[P2] EDGE-E2E-05 — número par de clics restaura el estado inactivo; número impar activa el filtro', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — 1 contact with client + 1 orphan
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const conCliente = await apiHelper.createContacto(
      buildContacto({ nombre: 'Con Cliente EDGE05', clienteId: cliente.id })
    );
    createdContactoIds.push(conCliente.id);

    const huerfano = await apiHelper.createContacto(
      buildContacto({ nombre: 'Huerfano EDGE05', clienteId: null })
    );
    createdContactoIds.push(huerfano.id);

    await page.route('**/api/v1/contactos**', (route) => route.continue());
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    const filtroSinCliente = page.getByTestId('filtro-sin-cliente');
    await expect(filtroSinCliente).toBeVisible();

    // WHEN — Click 4 times (even = back to inactive)
    await filtroSinCliente.click(); // → active
    await filtroSinCliente.click(); // → inactive
    await filtroSinCliente.click(); // → active
    await filtroSinCliente.click(); // → inactive

    // THEN — Filter is inactive: full list (both contacts visible)
    await expect(filtroSinCliente).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('contacto-row')).toHaveCount(2);

    // WHEN — Click 3 more times (odd = active)
    await filtroSinCliente.click(); // → active
    await filtroSinCliente.click(); // → inactive
    await filtroSinCliente.click(); // → active

    // THEN — Filter is active: only orphan visible
    await expect(filtroSinCliente).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('contacto-row')).toHaveCount(1);
    await expect(page.getByTestId('contacto-row').filter({ hasText: huerfano.nombre })).toBeVisible();

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });
});

// =============================================================================
// API edge cases — GET /api/v1/contactos?sinCliente=true boundary conditions
// =============================================================================

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.5 — API edge cases: GET ?sinCliente=true boundary conditions', () => {
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
  // API-ORPHAN-EDGE-01 (P1) — DTO contract completeness
  // Given an orphan contact exists
  // When GET /api/v1/contactos?sinCliente=true is called
  // Then each returned DTO contains all 8 required fields with correct types
  // ---------------------------------------------------------------------------
  test('API-ORPHAN-EDGE-01 — GET ?sinCliente=true returns complete ContactoDto with all 8 fields typed correctly', async ({ request }) => {
    const orphan = await apiHelper.createContacto(
      buildContacto({ nombre: `DTO Contract Edge ${Date.now()}`, clienteId: null })
    );
    createdContactoIds.push(orphan.id);

    const response = await request.get(`${API_BASE_URL}/api/v1/contactos?sinCliente=true`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    const returnedOrphan = body.find((c: { id: string }) => c.id === orphan.id);
    expect(returnedOrphan).toBeDefined();

    // id: UUID v4 string
    expect(typeof returnedOrphan.id).toBe('string');
    expect(returnedOrphan.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    // nombre: non-empty string
    expect(typeof returnedOrphan.nombre).toBe('string');
    expect(returnedOrphan.nombre.length).toBeGreaterThan(0);
    // cargo: field present (may be empty string)
    expect('cargo' in returnedOrphan).toBe(true);
    // telefono: field present (may be empty string)
    expect('telefono' in returnedOrphan).toBe(true);
    // email: non-empty string with @
    expect(typeof returnedOrphan.email).toBe('string');
    expect(returnedOrphan.email).toContain('@');
    // clienteId: strictly null
    expect(returnedOrphan.clienteId).toBeNull();
    // createdAt: ISO 8601 with timezone
    expect(typeof returnedOrphan.createdAt).toBe('string');
    expect(returnedOrphan.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
    // updatedAt: ISO 8601 with timezone
    expect(typeof returnedOrphan.updatedAt).toBe('string');
    expect(returnedOrphan.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
    // Response must NOT be a wrapper object
    expect((body as Record<string, unknown>).data).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-ORPHAN-EDGE-02 (P1)
  // GET ?sinCliente=false must fall through to GetContactosQueryHandler
  // (returns all contacts, not just orphans)
  // ---------------------------------------------------------------------------
  test('API-ORPHAN-EDGE-02 — GET ?sinCliente=false returns all contacts (not orphan-only path)', async ({ request }) => {
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const conCliente = await apiHelper.createContacto(
      buildContacto({ nombre: `SinClienteFalse Edge A ${Date.now()}`, clienteId: cliente.id })
    );
    createdContactoIds.push(conCliente.id);

    const huerfano = await apiHelper.createContacto(
      buildContacto({ nombre: `SinClienteFalse Edge B ${Date.now()}`, clienteId: null })
    );
    createdContactoIds.push(huerfano.id);

    const response = await request.get(`${API_BASE_URL}/api/v1/contactos?sinCliente=false`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    const returnedIds = body.map((c: { id: string }) => c.id);
    // Both the orphan AND the contact with client must be present
    expect(returnedIds).toContain(conCliente.id);
    expect(returnedIds).toContain(huerfano.id);
  });

  // ---------------------------------------------------------------------------
  // API-ORPHAN-EDGE-03 (P1)
  // GET ?sinCliente=true returns 200 with empty array (NOT 404)
  // when all contacts have a clienteId (AC2 at API level)
  // ---------------------------------------------------------------------------
  test('API-ORPHAN-EDGE-03 — GET ?sinCliente=true returns 200 empty array when no orphans exist (not 404)', async ({ request }) => {
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const c1 = await apiHelper.createContacto(
      buildContacto({ nombre: `All Have Client Edge A ${Date.now()}`, clienteId: cliente.id })
    );
    createdContactoIds.push(c1.id);

    const c2 = await apiHelper.createContacto(
      buildContacto({ nombre: `All Have Client Edge B ${Date.now()}`, clienteId: cliente.id })
    );
    createdContactoIds.push(c2.id);

    const response = await request.get(`${API_BASE_URL}/api/v1/contactos?sinCliente=true`);

    // Must be 200, NOT 404
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    // The two contacts we created (with client) must NOT appear
    const returnedIds = body.map((c: { id: string }) => c.id);
    expect(returnedIds).not.toContain(c1.id);
    expect(returnedIds).not.toContain(c2.id);
  });

  // ---------------------------------------------------------------------------
  // API-ORPHAN-EDGE-04 (P1)
  // GET ?sinCliente=true&clienteId={id} — sinCliente branch takes priority
  // Returns only orphans, ignoring clienteId param (per ContactoEndpoints dispatch order)
  // ---------------------------------------------------------------------------
  test('API-ORPHAN-EDGE-04 — GET ?sinCliente=true&clienteId={id} — sinCliente branch has priority over clienteId', async ({ request }) => {
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const conCliente = await apiHelper.createContacto(
      buildContacto({ nombre: `Priority Test Edge Con Cliente ${Date.now()}`, clienteId: cliente.id })
    );
    createdContactoIds.push(conCliente.id);

    const huerfano = await apiHelper.createContacto(
      buildContacto({ nombre: `Priority Test Edge Huerfano ${Date.now()}`, clienteId: null })
    );
    createdContactoIds.push(huerfano.id);

    // Both sinCliente=true AND clienteId= present — sinCliente branch must win
    const response = await request.get(
      `${API_BASE_URL}/api/v1/contactos?sinCliente=true&clienteId=${cliente.id}`
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    const returnedIds = body.map((c: { id: string }) => c.id);
    // The orphan must be included
    expect(returnedIds).toContain(huerfano.id);
    // The contact with client must NOT appear (sinCliente filters by clienteId == null)
    expect(returnedIds).not.toContain(conCliente.id);
    // All returned items must have clienteId === null
    for (const item of body) {
      expect(item.clienteId).toBeNull();
    }
  });
});
