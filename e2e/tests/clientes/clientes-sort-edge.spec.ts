/**
 * Edge Case Tests — Story 2.6: Sort Client List (E2E)
 *
 * Expands coverage beyond the GREEN ATDD suite (E2E-C-28 to E2E-C-33).
 * Targets boundary conditions, error paths, and UI state edge cases for sort.
 *
 * Test IDs: E2E-C-SORT-EDGE-01 … E2E-C-SORT-EDGE-08
 *
 * Risks covered:
 *   - Sort on empty list (EmptyState must persist, no crash)
 *   - Sort on single-item list (no reorder, item stays visible)
 *   - Sort persistence when search filter is cleared after being active
 *   - SortControl is present in DOM and accessible via aria-label
 *   - Sort with search returning 0 results shows EmptyState (not crash)
 *   - Sort does not trigger re-fetch after page reload + immediate sort
 *   - Rapid consecutive sort changes land on final selected option
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.6 — Ordenar lista de clientes — Edge Cases', () => {
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
  // E2E-C-SORT-EDGE-01 (P1)
  // Boundary: selecting any sort option when the list is empty (no clients in DB)
  // must NOT crash the UI; EmptyState must remain visible.
  // ---------------------------------------------------------------------------
  test('E2E-C-SORT-EDGE-01 — [P1] cambiar el orden con lista vacía no produce error y EmptyState sigue visible', async ({ page }) => {
    // GIVEN — no clients in DB (mock empty response)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN — user navigates to /clientes (list is empty)
    await clientesPage.goto();
    await expect(clientesPage.emptyState).toBeVisible();

    // WHEN — user selects a sort option on the empty list
    await clientesPage.seleccionarOrden('nombre-asc');

    // THEN — EmptyState is still visible (no crash, no items appear)
    await expect(clientesPage.emptyState).toBeVisible();
    await expect(clientesPage.clienteItems).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-SORT-EDGE-02 (P1)
  // Boundary: sort with a single client must not crash; the one item must
  // remain visible regardless of which sort option is chosen.
  // ---------------------------------------------------------------------------
  test('E2E-C-SORT-EDGE-02 — [P1] ordenar una lista de un solo cliente mantiene el cliente visible', async ({ page }) => {
    // GIVEN — exactly one client
    const c = await apiHelper.createCliente(buildCliente({ nombre: 'Único Cliente SA' }));
    createdIds.push(c.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user cycles through all sort options
    const options = ['nombre-asc', 'nombre-desc', 'fecha-desc', 'fecha-asc'] as const;
    for (const option of options) {
      await clientesPage.seleccionarOrden(option);
      // THEN — the single client is still visible after each sort
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'Único Cliente SA' })
      ).toBeVisible();
    }
  });

  // ---------------------------------------------------------------------------
  // E2E-C-SORT-EDGE-03 (P1) — Risk R5 extension
  // Boundary: after applying sort + search filter, clearing the search input
  // must restore all clients while preserving the active sort option.
  // ---------------------------------------------------------------------------
  test('E2E-C-SORT-EDGE-03 — [P1] limpiar búsqueda después de ordenar+filtrar restaura todos los clientes manteniendo el orden', async ({ page }) => {
    // GIVEN — three clients
    const cAlfa = await apiHelper.createCliente(buildCliente({ nombre: 'Alfa Empresas SA' }));
    const cBeta = await apiHelper.createCliente(buildCliente({ nombre: 'Beta Empresas SA' }));
    const cOtro = await apiHelper.createCliente(buildCliente({ nombre: 'Sin Prefijo Corp' }));
    createdIds.push(cAlfa.id, cBeta.id, cOtro.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user applies sort then filter
    await clientesPage.seleccionarOrden('nombre-asc');
    await clientesPage.buscar('Empresas');

    // Verify filter works
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Sin Prefijo Corp' })
    ).not.toBeVisible();

    // WHEN — user clears the search input
    await clientesPage.limpiarBusqueda();

    // THEN — all three clients are visible again
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Sin Prefijo Corp' })
    ).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Alfa Empresas SA' })
    ).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Beta Empresas SA' })
    ).toBeVisible();

    // AND — sort is still active (nombre-asc): Alfa before Beta before Sin Prefijo
    const itemTexts = await clientesPage.clienteItems.allTextContents();
    const alfaIdx = itemTexts.findIndex((t) => t.includes('Alfa Empresas SA'));
    const betaIdx = itemTexts.findIndex((t) => t.includes('Beta Empresas SA'));
    const sinIdx = itemTexts.findIndex((t) => t.includes('Sin Prefijo Corp'));
    expect(alfaIdx).toBeLessThan(betaIdx);
    expect(betaIdx).toBeLessThan(sinIdx);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-SORT-EDGE-04 (P1)
  // Boundary: search returning 0 results combined with a sort change must show
  // EmptyState — not crash or show unfiltered data.
  // ---------------------------------------------------------------------------
  test('E2E-C-SORT-EDGE-04 — [P1] cambiar orden con búsqueda sin resultados mantiene EmptyState', async ({ page }) => {
    // GIVEN — one client exists
    const c = await apiHelper.createCliente(buildCliente({ nombre: 'Empresa Real SA' }));
    createdIds.push(c.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user types a search term that matches nothing
    await clientesPage.buscar('XYZNOEXISTE999');
    await expect(clientesPage.emptyState).toBeVisible();

    // WHEN — user changes sort option while 0 results are shown
    await clientesPage.seleccionarOrden('nombre-asc');

    // THEN — EmptyState is still visible; the real client is not leaked in
    await expect(clientesPage.emptyState).toBeVisible();
    await expect(clientesPage.clienteItems).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-SORT-EDGE-05 (P1)
  // Accessibility: SortControl must be locatable via its aria-label
  // "Ordenar clientes" — WCAG 2.1 AA landmark requirement.
  // ---------------------------------------------------------------------------
  test('E2E-C-SORT-EDGE-05 — [P1] SortControl es localizable por su aria-label "Ordenar clientes"', async ({ page }) => {
    // GIVEN — mock empty list to avoid backend dependency
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await clientesPage.goto();

    // THEN — the sort control is findable via its accessible label
    const sortByLabel = page.getByLabel('Ordenar clientes');
    await expect(sortByLabel).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-SORT-EDGE-06 (P0)
  // Boundary: sort does NOT trigger an additional API call after a page
  // reload — only the initial load fires one GET /api/v1/clientes.
  // Tests that sort remains purely client-side even after a full page reload.
  // ---------------------------------------------------------------------------
  test('E2E-C-SORT-EDGE-06 — [P0] recargar la página y luego ordenar no dispara llamadas API adicionales', async ({ page }) => {
    // GIVEN — two clients
    const cZ = await apiHelper.createCliente(buildCliente({ nombre: 'Zeta Servicios SA' }));
    const cA = await apiHelper.createCliente(buildCliente({ nombre: 'Alfa Servicios SA' }));
    createdIds.push(cZ.id, cA.id);

    // Intercept BEFORE navigation
    const apiCalls: string[] = [];
    await page.route('**/api/v1/clientes', (route) => {
      apiCalls.push(`${route.request().method()} ${route.request().url()}`);
      route.continue();
    });

    // WHEN — full page reload
    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();
    const callsAfterLoad = apiCalls.length;

    // WHEN — user selects a sort option
    await clientesPage.seleccionarOrden('nombre-asc');

    // THEN — no additional API call was made
    expect(apiCalls.length).toBe(callsAfterLoad);

    // AND — order is correct (Alfa before Zeta)
    await expect(clientesPage.clienteItems.first()).toContainText('Alfa Servicios SA');
  });

  // ---------------------------------------------------------------------------
  // E2E-C-SORT-EDGE-07 (P2)
  // Boundary: rapidly switching sort options multiple times must land on the
  // last selected option without getting stuck in a stale state.
  // ---------------------------------------------------------------------------
  test('E2E-C-SORT-EDGE-07 — [P2] cambios rápidos y consecutivos de orden terminan en la última opción seleccionada', async ({ page }) => {
    // GIVEN — two clients with distinct names and dates
    const cOld = await apiHelper.createCliente(buildCliente({ nombre: 'Antiguo Corp SA' }));
    const cNew = await apiHelper.createCliente(buildCliente({ nombre: 'Nuevo Ventures SA' }));
    createdIds.push(cOld.id, cNew.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user rapidly switches sort options
    await clientesPage.seleccionarOrden('nombre-asc');
    await clientesPage.seleccionarOrden('fecha-desc');
    await clientesPage.seleccionarOrden('nombre-desc');

    // THEN — the UI reflects the LAST selected option: nombre-desc
    // "Nuevo" (N) comes after "Antiguo" (A) in desc order → Nuevo first
    await expect(clientesPage.sortControl).toContainText('Nombre Z→A');

    const itemTexts = await clientesPage.clienteItems.allTextContents();
    const antiguoIdx = itemTexts.findIndex((t) => t.includes('Antiguo Corp SA'));
    const nuevoIdx = itemTexts.findIndex((t) => t.includes('Nuevo Ventures SA'));
    expect(nuevoIdx).toBeLessThan(antiguoIdx);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-SORT-EDGE-08 (P2)
  // Boundary: SortControl trigger displays the label of the currently active
  // sort option so the user always knows the current sort state.
  // Verifies all four label transitions are reflected in the trigger text.
  // ---------------------------------------------------------------------------
  test('E2E-C-SORT-EDGE-08 — [P2] el trigger de SortControl muestra la etiqueta de la opción activa para cada opción', async ({ page }) => {
    // GIVEN — mock list to avoid backend dependency
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await clientesPage.goto();

    // Initial default: "Más reciente"
    await expect(clientesPage.sortControl).toContainText('Más reciente');

    // Cycle through all options and verify trigger label updates
    await clientesPage.seleccionarOrden('nombre-asc');
    await expect(clientesPage.sortControl).toContainText('Nombre A→Z');

    await clientesPage.seleccionarOrden('nombre-desc');
    await expect(clientesPage.sortControl).toContainText('Nombre Z→A');

    await clientesPage.seleccionarOrden('fecha-asc');
    await expect(clientesPage.sortControl).toContainText('Más antiguo');

    await clientesPage.seleccionarOrden('fecha-desc');
    await expect(clientesPage.sortControl).toContainText('Más reciente');
  });
});
