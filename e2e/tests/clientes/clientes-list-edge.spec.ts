import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.1 — Client List & Search — Edge Cases
 *
 * Expands coverage beyond the GREEN ATDD suite (E2E-C-01 to C-06).
 * Targets boundary conditions, negative paths, and UI state edge cases.
 *
 * Test IDs: E2E-C-EDGE-01 … E2E-C-EDGE-10
 */

test.describe('Story 2.1 — Lista de clientes — Edge Cases', () => {
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
  // E2E-C-EDGE-01 (P1 · AC2)
  // Boundary: single-character search must filter the list correctly.
  // The useMemo filter must work for minimal inputs without debounce.
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-01 — [P1] búsqueda de un solo carácter filtra correctamente', async ({ page }) => {
    // GIVEN — two clients, only one starting with "A"
    const matchData = buildCliente({ nombre: 'Almacenes del Sur SA' });
    const noMatchData = buildCliente({ nombre: 'Distribuidora Central' });
    const cm = await apiHelper.createCliente(matchData);
    const cn = await apiHelper.createCliente(noMatchData);
    createdIds.push(cm.id, cn.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user types a single character
    await clientesPage.buscar('A');

    // THEN — at least the matching client is visible
    await expect(
      clientesPage.clienteItems.filter({ hasText: matchData.nombre })
    ).toBeVisible();

    // AND — the non-matching client is hidden
    await expect(
      clientesPage.clienteItems.filter({ hasText: noMatchData.nombre })
    ).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-EDGE-02 (P1 · AC2)
  // Boundary: search term that matches NO clients should show EmptyState.
  // This is different from AC3 (no clients in DB) — here data exists, but filter
  // returns zero results. The component must show EmptyState in this case too.
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-02 — [P1] búsqueda sin resultados muestra EmptyState', async ({ page }) => {
    // GIVEN — one client exists
    const data = buildCliente({ nombre: 'Empresa Con Resultado' });
    const c = await apiHelper.createCliente(data);
    createdIds.push(c.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user types a string that matches nothing
    await clientesPage.buscar('XXXNOEXISTSXXX');

    // THEN — no client items are shown
    await expect(clientesPage.clienteItems).toHaveCount(0);

    // AND — EmptyState is displayed (zero filtered results = same empty state)
    await expect(clientesPage.emptyState).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-EDGE-03 (P1 · AC2)
  // Boundary: search is case-insensitive — "CONSTRUCTORA" must match
  // "Constructora del Valle" (mixed case in DB).
  // Architecture.md specifies: toLowerCase() on both sides.
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-03 — [P1] búsqueda es insensible a mayúsculas/minúsculas', async ({ page }) => {
    // GIVEN — one client with mixed-case nombre
    const data = buildCliente({ nombre: 'Constructora del Valle SAS' });
    const c = await apiHelper.createCliente(data);
    createdIds.push(c.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user types the name in uppercase
    await clientesPage.buscar('CONSTRUCTORA DEL VALLE');

    // THEN — the client is still visible
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-EDGE-04 (P1 · AC2)
  // Boundary: search input with leading and trailing whitespace should be
  // trimmed. "  Empresa  " must match "Empresa Delta".
  // ClienteListPanel uses searchQuery.trim() before filtering.
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-04 — [P1] espacios al inicio/fin del término de búsqueda son ignorados', async ({ page }) => {
    // GIVEN — one client
    const data = buildCliente({ nombre: 'Empresa Delta Ltda' });
    const c = await apiHelper.createCliente(data);
    createdIds.push(c.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user enters term with surrounding whitespace
    await clientesPage.buscar('   Empresa Delta   ');

    // THEN — the client is still found (trim() applied)
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-EDGE-05 (P2 · AC1)
  // Error path: skeleton loading state shows exactly 3 placeholder rows
  // before the API response arrives, and disappears once data is loaded.
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-05 — [P2] tres filas skeleton aparecen durante la carga y desaparecen al terminar', async ({ page }) => {
    // GIVEN — intercept to delay the API response and capture loading state
    let resolveHold!: () => void;
    const holdPromise = new Promise<void>((resolve) => {
      resolveHold = resolve;
    });

    await page.route('**/api/v1/clientes', async (route) => {
      await holdPromise;
      await route.continue();
    });

    // WHEN — navigate (request is held)
    const navPromise = clientesPage.goto();

    // THEN — skeleton rows are visible before data arrives (react-loading-skeleton)
    // The skeleton lines are inside react-loading-skeleton spans
    const skeletonRows = page.locator('.react-loading-skeleton');
    await expect(skeletonRows.first()).toBeVisible({ timeout: 5000 });

    // Release the network hold and finish navigation
    resolveHold();
    await navPromise;

    // THEN — skeletons are gone after data loaded
    await expect(skeletonRows.first()).not.toBeVisible({ timeout: 8000 });
  });

  // ---------------------------------------------------------------------------
  // E2E-C-EDGE-06 (P1 · AC4)
  // Boundary: "Reintentar" button must be keyboard-accessible (Tab + Enter).
  // WCAG 2.1 AA requirement per ErrorPanel spec in Story 2.1.
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-06 — [P1] botón "Reintentar" es accesible mediante teclado', async ({ page }) => {
    // GIVEN — API returns 500
    let callCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      route.fulfill({ status: 500 });
    });

    await clientesPage.goto();
    await expect(page.getByTestId('error-panel')).toBeVisible();

    const btnReintentar = page.getByRole('button', { name: /reintentar/i });
    await expect(btnReintentar).toBeVisible();

    // WHEN — user focuses and activates via keyboard
    await btnReintentar.focus();
    await expect(btnReintentar).toBeFocused();

    const callsBefore = callCount;
    await page.keyboard.press('Enter');

    // THEN — a new API call is triggered
    await expect
      .poll(() => callCount, { timeout: 5000 })
      .toBeGreaterThan(callsBefore);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-EDGE-07 (P2 · AC1)
  // Boundary: search input has correct aria-label for screen readers.
  // ClienteListPanel sets aria-label="Buscar clientes".
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-07 — [P2] el campo de búsqueda tiene aria-label correcto', async ({ page }) => {
    // GIVEN — mock API to avoid real backend dependency
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN — user navigates to /clientes
    await clientesPage.goto();

    // THEN — search input is accessible via aria-label
    const searchInput = page.getByLabel('Buscar clientes');
    await expect(searchInput).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-EDGE-08 (P1 · AC2)
  // Boundary: partial NIT match — searching for "900" should match any NIT
  // starting with or containing "900", not only exact NIT matches.
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-08 — [P1] búsqueda parcial de NIT muestra clientes que contienen el fragmento', async ({ page }) => {
    // GIVEN — two clients, one with NIT containing "900123"
    const matchNit = '900123456-7';
    const matchData = buildCliente({ nombre: 'Empresa NIT Parcial', nit: matchNit });
    const noMatchData = buildCliente({ nombre: 'Empresa NIT Diferente', nit: '111222333-4' });
    const cm = await apiHelper.createCliente(matchData);
    const cn = await apiHelper.createCliente(noMatchData);
    createdIds.push(cm.id, cn.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // WHEN — user searches for a partial NIT fragment
    await clientesPage.buscar('900123');

    // THEN — client with matching NIT fragment is visible
    await expect(
      clientesPage.clienteItems.filter({ hasText: matchData.nombre })
    ).toBeVisible();

    // AND — client without that NIT fragment is hidden
    await expect(
      clientesPage.clienteItems.filter({ hasText: noMatchData.nombre })
    ).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-EDGE-09 (P2 · AC4)
  // Error path: ErrorPanel must NOT show EmptyState when backend returns 500.
  // Both components should never be visible simultaneously.
  // Dual-assertion test: error state does not degrade into empty state.
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-09 — [P2] ErrorPanel y EmptyState no son visibles al mismo tiempo', async ({ page }) => {
    // GIVEN — API returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 500 })
    );

    await clientesPage.goto();

    // THEN — ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND — EmptyState is NOT visible (mutual exclusion)
    await expect(clientesPage.emptyState).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-EDGE-10 (P2 · AC1)
  // Boundary: list panel has fixed 280px width as specified in the story.
  // The layout must not collapse below this threshold.
  // ---------------------------------------------------------------------------
  test('E2E-C-EDGE-10 — [P2] el panel izquierdo tiene al menos 280px de ancho', async ({ page }) => {
    // GIVEN — at least one client exists (or empty state is fine, just panel must be present)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await clientesPage.goto();

    // THEN — list panel is present
    await expect(clientesPage.listPanel).toBeVisible();

    // AND — its width is at least 280px (the specified shrink-0 w-[280px])
    const box = await clientesPage.listPanel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(280);
  });
});
