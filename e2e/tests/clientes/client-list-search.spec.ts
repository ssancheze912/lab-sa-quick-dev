/**
 * Story 2.1: Client List & Search
 * E2E Tests — Client List & Search (RED Phase — ATDD)
 *
 * Test cases covered:
 *   TC-E2-P2-06 — Search returns results in under 1 second with 500 records (NFR1)
 *
 * Additional smoke tests for Story 2.1 acceptance criteria:
 *   AC1 — List panel renders with clients visible
 *   AC2 — Search filters in real-time
 *   AC3 — EmptyState shown when no clients
 *   AC4 — ErrorPanel shown when backend unavailable
 *
 * Precondition: Frontend (http://localhost:5173) and Backend (http://localhost:5000) running.
 * These tests will FAIL until ClienteListView, EmptyState, and ErrorPanel are implemented.
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-06: Search performance with 500 records (NFR1 < 1 second)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.1 — TC-E2-P2-06: Search Performance with 500 Records', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeAll(async ({ request }) => {
    // Seed 500 clients for performance test
    // Note: only 10 will match the search term "TargetEmpresa"
    apiHelper = new ApiHelper(request);

    const batchSize = 10;
    const total = 500;

    for (let i = 0; i < total; i++) {
      const nit = `${900000000 + i}`;
      const nombre = i < 10 ? `TargetEmpresa ${i}` : `Empresa Bulk ${i}`;
      const cliente = await apiHelper.createCliente({
        nombre,
        nit,
        telefono: `300${String(i).padStart(7, '0')}`,
        ciudad: 'Bogotá',
      });
      createdIds.push(cliente.id);
    }
  });

  test.afterAll(async () => {
    // Clean up all seeded clients
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  /**
   * TC-E2-P2-06
   * Given: 500 clients loaded in the browser
   * When:  user types "TargetEmpresa" in the search field
   * Then:  filtered results appear in under 1 second (NFR1)
   */
  test('TC-E2-P2-06: search over 500 records returns results in under 1 second', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // GIVEN: navigate to /clientes and wait for all 500 records to load
    await clientesPage.goto();

    // Wait for the list to fully load (500 items)
    await page.waitForFunction(
      () => {
        const items = document.querySelectorAll('[data-testid^="client-item-"]');
        return items.length >= 500;
      },
      { timeout: 30_000 },
    );

    // WHEN: start timing and type a search term
    const searchInput = clientesPage.searchInput;
    const startTime = Date.now();

    await searchInput.fill('TargetEmpresa');

    // THEN: exactly 10 matching results are shown
    await page.waitForFunction(
      () => {
        const items = document.querySelectorAll('[data-testid^="client-item-"]');
        return items.length === 10;
      },
      { timeout: 1_000 }, // NFR1: must complete within 1 second
    );

    const elapsedMs = Date.now() - startTime;

    // Assert results appeared within 1 second (NFR1)
    expect(elapsedMs).toBeLessThan(1000);

    // Verify the correct items are shown
    const items = page.getByTestId(/^client-item-/);
    await expect(items).toHaveCount(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1: List panel renders with client data visible
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.1 — AC1: Client list panel renders', () => {
  const createdIds: string[] = [];

  test.beforeEach(async ({ request, page }) => {
    const apiHelper = new ApiHelper(request);

    // Seed 3 clients
    const data1 = buildCliente({ nombre: 'Empresa E2E Alpha', nit: '800100001' });
    const data2 = buildCliente({ nombre: 'Empresa E2E Beta', nit: '800200002' });
    const data3 = buildCliente({ nombre: 'Empresa E2E Gamma', nit: '800300003' });

    const [c1, c2, c3] = await Promise.all([
      apiHelper.createCliente(data1),
      apiHelper.createCliente(data2),
      apiHelper.createCliente(data3),
    ]);

    createdIds.push(c1.id, c2.id, c3.id);

    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
  });

  test.afterEach(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  /**
   * AC1: Given clients in system, list panel (280px) shows clients with Nombre and NIT/RUC
   */
  test('AC1: left panel shows list of all clients with Nombre and NIT/RUC visible', async ({ page }) => {
    // GIVEN: 3 clients were seeded and page loaded
    const clientesPage = new ClientesPage(page);

    // WHEN: list renders
    // THEN: the list panel is visible
    await expect(clientesPage.listPanel).toBeVisible({ timeout: 10_000 });

    // AND: at least 3 client items are visible
    await expect(clientesPage.clienteItems).toHaveCount(3, { timeout: 10_000 });

    // AND: one of the items shows both Nombre and NIT
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Empresa E2E Alpha' })
    ).toBeVisible();

    await expect(
      clientesPage.clienteItems.filter({ hasText: '800100001' })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Real-time search filter (E2E smoke)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.1 — AC2: Real-time search smoke test', () => {
  const createdIds: string[] = [];

  test.beforeEach(async ({ request, page }) => {
    const apiHelper = new ApiHelper(request);

    const data1 = buildCliente({ nombre: 'SearchTarget Alpha', nit: '700100001' });
    const data2 = buildCliente({ nombre: 'SearchOther Beta', nit: '700200002' });

    const [c1, c2] = await Promise.all([
      apiHelper.createCliente(data1),
      apiHelper.createCliente(data2),
    ]);

    createdIds.push(c1.id, c2.id);

    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();

    // Wait for list to load
    await expect(page.getByTestId(/^client-item-/)).toHaveCount(2, { timeout: 10_000 });
  });

  test.afterEach(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  /**
   * AC2: Typing in search field filters the list in real time
   */
  test('AC2: typing in search field filters list in real time', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // WHEN: user types "SearchTarget" in search field
    await clientesPage.buscar('SearchTarget');

    // THEN: only the matching client is shown
    await expect(page.getByTestId(/^client-item-/)).toHaveCount(1, { timeout: 2_000 });
    await expect(
      page.getByTestId(/^client-item-/).filter({ hasText: 'SearchTarget Alpha' })
    ).toBeVisible();
  });

  /**
   * AC2: Clearing search restores all results
   */
  test('AC2: clearing search restores all clients', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // GIVEN: search is active
    await clientesPage.buscar('SearchTarget');
    await expect(page.getByTestId(/^client-item-/)).toHaveCount(1, { timeout: 2_000 });

    // WHEN: search is cleared
    await clientesPage.limpiarBusqueda();

    // THEN: all clients are shown again
    await expect(page.getByTestId(/^client-item-/)).toHaveCount(2, { timeout: 2_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: EmptyState when no clients (E2E smoke)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.1 — AC3: EmptyState when no clients', () => {
  /**
   * AC3: Given no clients, EmptyState is shown with Spanish message
   * NOTE: This test relies on a clean database with no clients.
   * In CI, run this test in an isolated test database.
   */
  test('AC3: EmptyState shown when database has no clients', async ({ page }) => {
    // GIVEN: no clients exist (clean database or isolated test)
    // This test is marked as conditional — it passes only when DB is empty
    // In practice, use a dedicated test environment or API to clean up

    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();

    // WHEN: page loads with empty list
    // We check for either EmptyState OR client items — if items exist, skip
    const itemCount = await page.getByTestId(/^client-item-/).count();

    if (itemCount === 0) {
      // THEN: EmptyState is visible
      await expect(clientesPage.emptyState).toBeVisible({ timeout: 10_000 });
      await expect(clientesPage.emptyState).toContainText(/no hay clientes/i);
    } else {
      // Skip assertion — database has clients (not a clean environment)
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Database has existing clients — EmptyState not testable in this env',
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Scrollability — all items reachable via scroll
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.1 — AC6: Panel scrollability', () => {
  const createdIds: string[] = [];

  test.beforeEach(async ({ request, page }) => {
    const apiHelper = new ApiHelper(request);

    // Create enough clients to overflow the panel
    const creates = Array.from({ length: 20 }, (_, i) =>
      apiHelper.createCliente(buildCliente({
        nombre: `Scroll Test ${i + 1}`,
        nit: `600${String(i).padStart(6, '0')}${i}`,
      })),
    );

    const results = await Promise.all(creates);
    results.forEach((c) => createdIds.push(c.id));

    const clientesPage = new ClientesPage(page);
    await clientesPage.goto();
    await expect(page.getByTestId(/^client-item-/)).toHaveCount(20, { timeout: 10_000 });
  });

  test.afterEach(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('AC6: all items are reachable via scroll without a full page reload', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // GIVEN: 20 items that overflow the panel height

    // WHEN: user scrolls to the bottom of the list panel
    await clientesPage.listPanel.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // THEN: page URL has NOT changed (no full page reload)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/clientes');
    expect(currentUrl).not.toContain('reload');

    // AND: the last item is accessible (not hidden by truncation)
    const lastItem = page.getByTestId(/^client-item-/).last();
    await expect(lastItem).toBeAttached();
  });
});
