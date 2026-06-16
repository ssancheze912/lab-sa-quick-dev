import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Edge Case E2E Tests — Story 2.1: Client List & Search
 *
 * Complements the ATDD tests in 2-1-client-list-search.spec.ts with:
 *   - Whitespace-only search shows full list (boundary: empty vs non-empty query)
 *   - Partial NIT search returns matching client
 *   - Panel header shows title "Clientes"
 *   - Error panel message is generic (does not expose raw error)
 *   - Loading skeleton disappears after data loads
 *   - Multiple clients: all visible before search
 *
 * Network-first intercepts are set BEFORE navigation per ATDD patterns.
 */

const API_PATTERN = '**/api/v1/clientes';

let edgeCounter = 0;

function mockCliente(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const ts = new Date().toISOString();
  return {
    id: `uuid-edge-${String(++edgeCounter).padStart(4, '0')}`,
    nombre: 'Empresa Mock',
    nit: '900000001',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

test.describe('Story 2.1 — Client List & Search Edge Cases (E2E)', () => {
  let clientesPage: ClientesPage;

  test.beforeEach(async ({ page }) => {
    clientesPage = new ClientesPage(page);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Panel title
  // ─────────────────────────────────────────────────────────────────────────

  test('panel header displays the title "Clientes"', async ({ page }) => {
    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente()]),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // The panel header must contain "Clientes" as the section title
    await expect(
      page.getByTestId('clientes-list-panel').getByRole('heading', { name: 'Clientes' })
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Whitespace-only search boundary
  // ─────────────────────────────────────────────────────────────────────────

  test('whitespace-only search shows full client list (treated as empty query)', async ({ page }) => {
    const clientes = [
      mockCliente({ id: 'uuid-e1', nombre: 'Empresa Uno', nit: '900001001' }),
      mockCliente({ id: 'uuid-e2', nombre: 'Empresa Dos', nit: '900001002' }),
    ];

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // Type whitespace into search
    await page.getByTestId('search-clientes').fill('   ');

    // Full list must still appear — whitespace is trimmed to ''
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
    await expect(page.getByTestId('no-results-message')).not.toBeVisible();
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Partial NIT search
  // ─────────────────────────────────────────────────────────────────────────

  test('partial NIT substring search filters correctly', async ({ page }) => {
    const clientes = [
      mockCliente({ id: 'uuid-nit1', nombre: 'Empresa NIT Alpha', nit: '900111222' }),
      mockCliente({ id: 'uuid-nit2', nombre: 'Empresa NIT Beta', nit: '800333444' }),
    ];

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // Search for partial NIT (middle digits only)
    await page.getByTestId('search-clientes').fill('333444');

    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item')).toContainText('Empresa NIT Beta');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error panel: generic message, no raw error details
  // ─────────────────────────────────────────────────────────────────────────

  test('ErrorPanel displays generic message and does not expose raw error details (NFR6)', async ({ page }) => {
    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          title: 'Internal Server Error',
          status: 500,
          detail: 'Unhandled exception: NullReferenceException in GetClientesQueryHandler at line 42',
        }),
      })
    );

    await page.goto('/clientes');

    await expect(page.getByTestId('error-panel')).toBeVisible();

    // Raw error details must NOT be visible
    await expect(page.getByText(/NullReferenceException/)).not.toBeVisible();
    await expect(page.getByText(/line 42/)).not.toBeVisible();
    await expect(page.getByText(/GetClientesQueryHandler/)).not.toBeVisible();

    // Generic user-facing message must be visible
    await expect(page.getByText(/No se pudo cargar la lista de clientes/)).toBeVisible();

    // EmptyState must NOT appear alongside ErrorPanel
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Multiple clients visible before any search
  // ─────────────────────────────────────────────────────────────────────────

  test('all clients are visible in the list before any search is entered', async ({ page }) => {
    const clientes = Array.from({ length: 5 }, (_, i) =>
      mockCliente({
        id: `uuid-multi-${i}`,
        nombre: `Empresa Múltiple ${i + 1}`,
        nit: `90000${i + 1}001`,
      })
    );

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    await expect(page.getByTestId('cliente-list-item')).toHaveCount(5);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EmptyState and no-results mutual exclusion
  // ─────────────────────────────────────────────────────────────────────────

  test('EmptyState is reserved for zero records — not shown when search returns no matches', async ({ page }) => {
    const clientes = [
      mockCliente({ id: 'uuid-me1', nombre: 'Empresa Existente', nit: '900001001' }),
    ];

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // Search for something that won't match
    await page.getByTestId('search-clientes').fill('zz-nada-aqui');

    // No-results inline state appears
    await expect(page.getByTestId('no-results-message')).toBeVisible();

    // EmptyState must NOT appear (it's for zero records in the system)
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Search ARIA label
  // ─────────────────────────────────────────────────────────────────────────

  test('search input has aria-label "Buscar clientes"', async ({ page }) => {
    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente()]),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // The search input must be accessible by its aria-label
    const searchInput = page.getByRole('searchbox', { name: 'Buscar clientes' });
    await expect(searchInput).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC6 — no-results message includes query text
  // ─────────────────────────────────────────────────────────────────────────

  test('AC6 — no-results inline message contains the typed search query', async ({ page }) => {
    const clientes = [
      mockCliente({ id: 'uuid-q1', nombre: 'Empresa Queried', nit: '900002001' }),
    ];

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    const searchQuery = 'xyz-busqueda-inexistente';
    await page.getByTestId('search-clientes').fill(searchQuery);

    const noResultsMsg = page.getByTestId('no-results-message');
    await expect(noResultsMsg).toBeVisible();
    await expect(noResultsMsg).toContainText(searchQuery);
  });
});
