/**
 * ATDD — Story 2.6: Sort Client List
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing:
 *   frontend/src/shared/components/SortControl.tsx
 *   frontend/src/modules/crm/clientes/application/sortClientes.ts
 *   Integrate SortControl + sortClientes into ClienteListPanel.tsx
 *
 * Coverage:
 *   E2E-C-28 (P0) — Selecting "Nombre A→Z" reorders list alphabetically ascending without new API call
 *   E2E-C-29 (P0) — Selecting "Nombre Z→A" reorders list alphabetically descending without new API call
 *   E2E-C-30 (P1) — Selecting "Más reciente" orders by createdAt descending (newest first)
 *   E2E-C-31 (P1) — Selecting "Más antiguo" orders by createdAt ascending (oldest first)
 *   E2E-C-32 (P0) — Changing sort with active search filter preserves search input value and applies sort to filtered set
 *   E2E-C-33 (P2) — Default sort on initial page load is "Más reciente" (newest client appears first)
 *
 * Risks mitigated:
 *   R5 — Sort combined with search filter clears searchInput or triggers re-fetch
 *   R10 — SortControl default order is not "Más reciente" on initial load
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.6 — Ordenar lista de clientes', () => {
  let clientesPage: ClientesPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // E2E-C-28 (P0 · AC1, AC-E2.6)
  // Given the client list is loaded with clients having known names
  // When the user selects "Nombre A→Z" from the SortControl
  // Then the client list reorders alphabetically ascending by nombre
  // AND no additional GET /api/v1/clientes call is fired
  // ---------------------------------------------------------------------------
  test('E2E-C-28 — seleccionar "Nombre A→Z" reordena la lista ascendente sin nueva llamada a la API', async ({ page }) => {
    // GIVEN — three clients with known distinct names in non-alphabetical order
    const cZebra = await apiHelper.createCliente(buildCliente({ nombre: 'Zebra Corp SA' }));
    const cAlfa = await apiHelper.createCliente(buildCliente({ nombre: 'Alfa Ingeniería SAS' }));
    const cMedio = await apiHelper.createCliente(buildCliente({ nombre: 'Medio Distribuciones Ltda' }));
    createdIds.push(cZebra.id, cAlfa.id, cMedio.id);

    // Intercept BEFORE navigation (network-first pattern)
    const apiCalls: string[] = [];
    await page.route('**/api/v1/clientes', (route) => {
      apiCalls.push(`${route.request().method()} ${route.request().url()}`);
      route.continue();
    });

    // WHEN — user navigates to /clientes and the list loads
    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();
    const callsAfterLoad = apiCalls.length;

    // WHEN — user selects "Nombre A→Z" from SortControl
    await clientesPage.seleccionarOrden('nombre-asc');

    // THEN — first visible item is "Alfa Ingeniería SAS"
    await expect(clientesPage.clienteItems.first()).toContainText('Alfa Ingeniería SAS');

    // AND — "Zebra Corp SA" appears after "Medio Distribuciones Ltda"
    const itemTexts = await clientesPage.clienteItems.allTextContents();
    const alfaIdx = itemTexts.findIndex((t) => t.includes('Alfa Ingeniería SAS'));
    const medioIdx = itemTexts.findIndex((t) => t.includes('Medio Distribuciones Ltda'));
    const zebraIdx = itemTexts.findIndex((t) => t.includes('Zebra Corp SA'));
    expect(alfaIdx).toBeLessThan(medioIdx);
    expect(medioIdx).toBeLessThan(zebraIdx);

    // AND — no additional GET /api/v1/clientes call was made after sort selection
    expect(apiCalls.length).toBe(callsAfterLoad);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-29 (P0 · AC2, AC-E2.6)
  // Given the client list is loaded with clients having known names
  // When the user selects "Nombre Z→A" from the SortControl
  // Then the client list reorders alphabetically descending by nombre
  // AND no additional GET /api/v1/clientes call is fired
  // ---------------------------------------------------------------------------
  test('E2E-C-29 — seleccionar "Nombre Z→A" reordena la lista descendente sin nueva llamada a la API', async ({ page }) => {
    // GIVEN — three clients with known distinct names
    const cZebra = await apiHelper.createCliente(buildCliente({ nombre: 'Zebra Corp SA' }));
    const cAlfa = await apiHelper.createCliente(buildCliente({ nombre: 'Alfa Ingeniería SAS' }));
    const cMedio = await apiHelper.createCliente(buildCliente({ nombre: 'Medio Distribuciones Ltda' }));
    createdIds.push(cZebra.id, cAlfa.id, cMedio.id);

    // Intercept BEFORE navigation
    const apiCalls: string[] = [];
    await page.route('**/api/v1/clientes', (route) => {
      apiCalls.push(`${route.request().method()} ${route.request().url()}`);
      route.continue();
    });

    // WHEN — user navigates to /clientes and list loads
    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();
    const callsAfterLoad = apiCalls.length;

    // WHEN — user selects "Nombre Z→A" from SortControl
    await clientesPage.seleccionarOrden('nombre-desc');

    // THEN — first visible item is "Zebra Corp SA" (Z first)
    await expect(clientesPage.clienteItems.first()).toContainText('Zebra Corp SA');

    // AND — items are in Z→A order
    const itemTexts = await clientesPage.clienteItems.allTextContents();
    const alfaIdx = itemTexts.findIndex((t) => t.includes('Alfa Ingeniería SAS'));
    const medioIdx = itemTexts.findIndex((t) => t.includes('Medio Distribuciones Ltda'));
    const zebraIdx = itemTexts.findIndex((t) => t.includes('Zebra Corp SA'));
    expect(zebraIdx).toBeLessThan(medioIdx);
    expect(medioIdx).toBeLessThan(alfaIdx);

    // AND — no additional GET /api/v1/clientes call was made
    expect(apiCalls.length).toBe(callsAfterLoad);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-30 (P1 · AC3, AC-E2.6)
  // Given the client list is loaded with clients created at different times
  // When the user selects "Más reciente" from the SortControl
  // Then the client list orders by createdAt descending (newest client appears first)
  // ---------------------------------------------------------------------------
  test('E2E-C-30 — seleccionar "Más reciente" ordena por fecha de creación descendente (más nuevo primero)', async ({ page }) => {
    // GIVEN — three clients created sequentially (API preserves insertion order for createdAt)
    // The last created will have the latest createdAt
    const cPrimero = await apiHelper.createCliente(buildCliente({ nombre: 'Cliente Primero' }));
    const cSegundo = await apiHelper.createCliente(buildCliente({ nombre: 'Cliente Segundo' }));
    const cTercero = await apiHelper.createCliente(buildCliente({ nombre: 'Cliente Tercero' }));
    createdIds.push(cPrimero.id, cSegundo.id, cTercero.id);

    // WHEN — user navigates to /clientes and list loads
    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user selects "Más reciente" from SortControl
    await clientesPage.seleccionarOrden('fecha-desc');

    // THEN — the most recently created client ("Cliente Tercero") appears first
    const itemTexts = await clientesPage.clienteItems.allTextContents();
    const primeroIdx = itemTexts.findIndex((t) => t.includes('Cliente Primero'));
    const segundoIdx = itemTexts.findIndex((t) => t.includes('Cliente Segundo'));
    const terceroIdx = itemTexts.findIndex((t) => t.includes('Cliente Tercero'));

    // Newest (Tercero) before Segundo before Primero
    expect(terceroIdx).toBeLessThan(segundoIdx);
    expect(segundoIdx).toBeLessThan(primeroIdx);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-31 (P1 · AC4, AC-E2.6)
  // Given the client list is loaded with clients created at different times
  // When the user selects "Más antiguo" from the SortControl
  // Then the client list orders by createdAt ascending (oldest client appears first)
  // ---------------------------------------------------------------------------
  test('E2E-C-31 — seleccionar "Más antiguo" ordena por fecha de creación ascendente (más antiguo primero)', async ({ page }) => {
    // GIVEN — three clients created sequentially
    const cPrimero = await apiHelper.createCliente(buildCliente({ nombre: 'Cliente Antiguo Primero' }));
    const cSegundo = await apiHelper.createCliente(buildCliente({ nombre: 'Cliente Antiguo Segundo' }));
    const cTercero = await apiHelper.createCliente(buildCliente({ nombre: 'Cliente Antiguo Tercero' }));
    createdIds.push(cPrimero.id, cSegundo.id, cTercero.id);

    // WHEN — user navigates to /clientes and list loads
    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user selects "Más antiguo" from SortControl
    await clientesPage.seleccionarOrden('fecha-asc');

    // THEN — the oldest created client ("Cliente Antiguo Primero") appears first
    const itemTexts = await clientesPage.clienteItems.allTextContents();
    const primeroIdx = itemTexts.findIndex((t) => t.includes('Cliente Antiguo Primero'));
    const segundoIdx = itemTexts.findIndex((t) => t.includes('Cliente Antiguo Segundo'));
    const terceroIdx = itemTexts.findIndex((t) => t.includes('Cliente Antiguo Tercero'));

    // Oldest (Primero) before Segundo before Tercero
    expect(primeroIdx).toBeLessThan(segundoIdx);
    expect(segundoIdx).toBeLessThan(terceroIdx);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-32 (P0 · AC5, AC-E2.6) — Risk R5
  // Given an active search filter is applied (matching 2 of 3 clients)
  // When the user changes the sort order via SortControl
  // Then the sort applies ONLY to the filtered result set
  // AND the search input value is preserved (not cleared)
  // AND no new API call is triggered
  // ---------------------------------------------------------------------------
  test('E2E-C-32 — cambiar el orden con filtro de búsqueda activo preserva el input de búsqueda y aplica el orden solo al conjunto filtrado', async ({ page }) => {
    // GIVEN — three clients: two match a search term, one does not
    const cAlfaBuscar = await apiHelper.createCliente(buildCliente({ nombre: 'Filtro Alfa Empresa' }));
    const cBetaBuscar = await apiHelper.createCliente(buildCliente({ nombre: 'Filtro Beta Empresa' }));
    const cOtro = await apiHelper.createCliente(buildCliente({ nombre: 'Otro Sin Filtro SAS' }));
    createdIds.push(cAlfaBuscar.id, cBetaBuscar.id, cOtro.id);

    // Track API calls (intercept BEFORE navigation)
    const apiCalls: string[] = [];
    await page.route('**/api/v1/clientes', (route) => {
      apiCalls.push(`${route.request().method()} ${route.request().url()}`);
      route.continue();
    });

    // WHEN — user navigates to /clientes and list loads
    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // AND — user types a search term that matches 2 of 3 clients
    const searchTerm = 'Filtro';
    await clientesPage.buscar(searchTerm);

    // Verify filter is working: only 2 items visible, "Otro Sin Filtro" not visible
    await expect(clientesPage.clienteItems.filter({ hasText: 'Filtro Alfa Empresa' })).toBeVisible();
    await expect(clientesPage.clienteItems.filter({ hasText: 'Filtro Beta Empresa' })).toBeVisible();
    await expect(clientesPage.clienteItems.filter({ hasText: 'Otro Sin Filtro SAS' })).not.toBeVisible();

    const callsAfterFilter = apiCalls.length;

    // WHEN — user changes sort order via SortControl
    await clientesPage.seleccionarOrden('nombre-desc');

    // THEN — search input still contains the original search term (not cleared)
    await expect(clientesPage.searchInput).toHaveValue(searchTerm);

    // AND — "Otro Sin Filtro SAS" is still NOT visible (filter was preserved)
    await expect(clientesPage.clienteItems.filter({ hasText: 'Otro Sin Filtro SAS' })).not.toBeVisible();

    // AND — the 2 filtered clients are still visible
    await expect(clientesPage.clienteItems.filter({ hasText: 'Filtro Alfa Empresa' })).toBeVisible();
    await expect(clientesPage.clienteItems.filter({ hasText: 'Filtro Beta Empresa' })).toBeVisible();

    // AND — with Z→A, "Filtro Beta Empresa" should appear before "Filtro Alfa Empresa"
    const itemTexts = await clientesPage.clienteItems.allTextContents();
    const alfaIdx = itemTexts.findIndex((t) => t.includes('Filtro Alfa Empresa'));
    const betaIdx = itemTexts.findIndex((t) => t.includes('Filtro Beta Empresa'));
    expect(betaIdx).toBeLessThan(alfaIdx);

    // AND — no additional GET /api/v1/clientes calls were made after sort change
    expect(apiCalls.length).toBe(callsAfterFilter);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-33 (P2 · AC6) — Risk R10
  // Given the SortControl renders on initial page load
  // When no sort preference has been set by the user
  // Then the default sort order is "Más reciente" (fecha-desc)
  // AND the newest created client appears first in the list
  // ---------------------------------------------------------------------------
  test('E2E-C-33 — el orden predeterminado al cargar la página es "Más reciente" (cliente más nuevo primero)', async ({ page }) => {
    // GIVEN — two clients created sequentially; second has a later createdAt
    const cAntiguo = await apiHelper.createCliente(buildCliente({ nombre: 'Cliente Antiguo Default' }));
    const cNuevo = await apiHelper.createCliente(buildCliente({ nombre: 'Cliente Nuevo Default' }));
    createdIds.push(cAntiguo.id, cNuevo.id);

    // WHEN — user navigates to /clientes (no sort interaction — testing default)
    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // THEN — the SortControl shows "Más reciente" as the selected option
    await expect(clientesPage.sortControl).toContainText('Más reciente');

    // AND — the most recently created client appears first in the list
    const itemTexts = await clientesPage.clienteItems.allTextContents();
    const antiguoIdx = itemTexts.findIndex((t) => t.includes('Cliente Antiguo Default'));
    const nuevoIdx = itemTexts.findIndex((t) => t.includes('Cliente Nuevo Default'));

    // Newest must appear before oldest when default sort is fecha-desc
    expect(nuevoIdx).toBeLessThan(antiguoIdx);
  });
});
